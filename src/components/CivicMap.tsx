import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Flame,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ThumbsUp,
  Crosshair,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { CivicIssue, CivicCategory, CivicStatus } from '../types/civic';

interface CivicMapProps {
  complaints: CivicIssue[];
  selectedComplaintId?: string | null;
  onSelectComplaint: (complaint: CivicIssue) => void;
  onOpenReportModal: () => void;
}

const CATEGORY_COLORS: Record<CivicCategory, { bg: string; border: string; label: string; icon: string }> = {
  'Road Damage': { bg: '#ef4444', border: '#b91c1c', label: 'Road / Pothole', icon: '🚧' },
  'Waste Issue': { bg: '#10b981', border: '#047857', label: 'Waste / Garbage', icon: '🗑️' },
  'Water Supply & Leakage': { bg: '#0ea5e9', border: '#0369a1', label: 'Water Leakage', icon: '💧' },
  'Electrical & Street Light': { bg: '#f59e0b', border: '#b45309', label: 'Streetlight / Wire', icon: '⚡' },
  'Sanitation & Drainage': { bg: '#8b5cf6', border: '#6d28d9', label: 'Drainage / Sewage', icon: '🌊' },
  'Public Property': { bg: '#ec4899', border: '#be185d', label: 'Public Property', icon: '🏛️' },
  'Other': { bg: '#64748b', border: '#334155', label: 'Other Civic Issue', icon: '📍' },
};

export const CivicMap: React.FC<CivicMapProps> = ({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  onOpenReportModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Default center: Lucknow, India (26.8467, 80.9462)
  const defaultCenter: [number, number] = [26.8524, 80.9582];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap tile layer with attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const heatmapLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;
    heatmapLayerRef.current = heatmapLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.ticketNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.location.address && c.location.address.toLowerCase().includes(q)) ||
        (c.location.ward && c.location.ward.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Render Markers and Heatmap Rings
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const heatmapLayer = heatmapLayerRef.current;
    if (!map || !markersLayer || !heatmapLayer) return;

    markersLayer.clearLayers();
    heatmapLayer.clearLayers();

    filteredComplaints.forEach((complaint) => {
      const { lat, lng } = complaint.location;
      const config = CATEGORY_COLORS[complaint.category] || CATEGORY_COLORS['Other'];
      const isCritical = complaint.priority === 'Critical';
      const isResolved = complaint.status === 'Resolved';

      // Custom HTML Pin icon
      const pinHtml = `
        <div style="position: relative; width: 36px; height: 36px;">
          ${
            isCritical
              ? `<div style="position: absolute; inset: -6px; border-radius: 9999px; background-color: ${config.bg}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : ''
          }
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: ${isResolved ? '#059669' : config.bg};
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${isResolved ? '✅' : config.icon}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-civic-pin',
        html: pinHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Build Rich Interactive Popup
      const popupHtml = `
        <div style="width: 270px; font-family: inherit; font-size: 13px;">
          <div style="position: relative; height: 110px; overflow: hidden; background: #e2e8f0;">
            <img src="${complaint.image}" alt="${complaint.title}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; top: 8px; left: 8px; background: rgba(15,23,42,0.85); color: white; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: bold; letter-spacing: 0.5px; font-family: monospace;">
              #${complaint.ticketNumber}
            </div>
            <div style="position: absolute; top: 8px; right: 8px; background: ${
              complaint.priority === 'Critical' ? '#ef4444' : complaint.priority === 'High' ? '#f97316' : '#3b82f6'
            }; color: white; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: bold;">
              ${complaint.priority}
            </div>
          </div>
          <div style="padding: 12px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${
                complaint.status === 'Resolved' ? '#10b981' : '#3b82f6'
              };"></span>
              <span style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">
                ${complaint.status}
              </span>
              <span style="font-size: 11px; color: #94a3b8;">•</span>
              <span style="font-size: 11px; color: #64748b;">${complaint.category}</span>
            </div>
            <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3;">
              ${complaint.title}
            </h4>
            <p style="margin: 0 0 10px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
              📍 ${complaint.location.address || complaint.location.ward || 'Lucknow City'}
            </p>
            <div style="display: flex; items-center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #f1f5f9;">
              <span style="font-size: 11px; font-weight: 600; color: #3b82f6;">
                👍 ${complaint.votes} Affected
              </span>
              <button
                id="btn-track-${complaint.id}"
                style="background: #2563eb; color: white; border: none; padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;"
              >
                Track Ticket →
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-track-${complaint.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectComplaint(complaint);
          };
        }
      });

      marker.addTo(markersLayer);

      // Render Heatmap density halos if toggled
      if (showHeatmap && !isResolved) {
        const radius = isCritical ? 350 : 220;
        const circle = L.circle([lat, lng], {
          radius,
          color: config.bg,
          fillColor: config.bg,
          fillOpacity: isCritical ? 0.35 : 0.2,
          weight: 1,
        });
        circle.addTo(heatmapLayer);
      }
    });
  }, [filteredComplaints, showHeatmap]);

  // Recenter on user's GPS
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1.2 });
        }
      },
      () => {
        // Fallback to Lucknow city center
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(defaultCenter, 14, { duration: 1 });
        }
      }
    );
  };

  const handleRecenterCity = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(defaultCenter, 13, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] max-w-5xl mx-auto flex flex-col md:flex-row gap-2 pointer-events-none">
        {/* Search & Category Filter */}
        <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200/80 flex flex-wrap items-center gap-2 pointer-events-auto flex-1">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket #, ward, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Road Damage">🚧 Road Damage</option>
            <option value="Waste Issue">🗑️ Waste Issue</option>
            <option value="Water Supply & Leakage">💧 Water Supply & Leak</option>
            <option value="Electrical & Street Light">⚡ Streetlight & Wire</option>
            <option value="Sanitation & Drainage">🌊 Drainage Overflow</option>
            <option value="Public Property">🏛️ Public Property</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Verified">Verified</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showHeatmap
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
        </div>

        {/* Quick GPS Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={handleLocateUser}
            title="Locate My GPS"
            className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center space-x-1 text-xs font-bold"
          >
            <Crosshair className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">My GPS</span>
          </button>

          <button
            onClick={handleRecenterCity}
            title="Reset to City Center"
            className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-slate-200 text-slate-700 hover:text-blue-600 transition-colors text-xs font-bold"
          >
            Lucknow
          </button>
        </div>
      </div>

      {/* Bottom Floating Legend & Summary Pill */}
      <div className="absolute bottom-6 left-4 z-[400] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 hidden md:block max-w-sm pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Civic Issue Markers</span>
          </span>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {filteredComplaints.length} On Map
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-xs"></span>
            <span>Road / Pothole</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
            <span>Waste / Garbage</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block shadow-xs"></span>
            <span>Water Pipeline</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-xs"></span>
            <span>Streetlight / Wire</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block shadow-xs"></span>
            <span>Drainage Overflow</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 ring-1 ring-emerald-300 inline-block text-white text-[8px] text-center font-bold">
              ✓
            </span>
            <span>Resolved</span>
          </div>
        </div>
      </div>

      {/* Floating Call to Action on Map */}
      <div className="absolute bottom-6 right-16 z-[400] pointer-events-auto hidden sm:block">
        <button
          onClick={onOpenReportModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white hover:bg-slate-900 backdrop-blur-md shadow-2xl border border-white/20 text-xs font-bold active:scale-95 transition-all"
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Spot an Issue Here? Report Now</span>
        </button>
      </div>

      {/* Leaflet Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
