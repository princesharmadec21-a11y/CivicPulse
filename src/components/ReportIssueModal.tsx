import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  X,
  Upload,
  Sparkles,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Camera,
  Layers,
  ShieldAlert,
  ThumbsUp,
  FileText,
  Award,
} from 'lucide-react';
import {
  CivicCategory,
  CivicPriority,
  CivicIssue,
  CivicUser,
  AIAnalysisResult,
} from '../types/civic';
import { SAMPLE_ISSUE_PHOTOS, DEPARTMENTS } from '../data/seedData';
import { findPotentialDuplicates } from '../utils/civic-rules';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CivicUser;
  existingComplaints: CivicIssue[];
  onComplaintSubmitted: (newComplaint: CivicIssue, pointsEarned: number) => void;
  onSupportExisting: (existingId: string) => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  existingComplaints,
  onComplaintSubmitted,
  onSupportExisting,
}) => {
  // Wizard steps: 1 = Image & AI, 2 = Location & Details, 3 = Duplicate Check, 4 = Review
  const [step, setStep] = useState<number>(1);

  // Form states
  const [imagePreview, setImagePreview] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<CivicCategory>('Road Damage');
  const [priority, setPriority] = useState<CivicPriority>('High');
  const [department, setDepartment] = useState<string>('Roads & Public Works (PWD)');

  // Location states (default: Gomti Nagar, Lucknow)
  const [lat, setLat] = useState<number>(26.8524);
  const [lng, setLng] = useState<number>(80.9782);
  const [address, setAddress] = useState<string>('Near Lohia Path, Gomti Nagar');
  const [ward, setWard] = useState<string>('Ward 42 - Gomti Nagar Central');
  const [city] = useState<string>('Lucknow');

  // AI Classification states
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // Duplicate detection state
  const [nearbyDuplicates, setNearbyDuplicates] = useState<{ complaint: CivicIssue; distance: number }[]>([]);
  const [bypassedDuplicate, setBypassedDuplicate] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mini-map ref for location step
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Reset or preset first sample on open
  useEffect(() => {
    if (isOpen && !imagePreview) {
      // Pick first sample as a delightful zero-friction starting point
      const sample = SAMPLE_ISSUE_PHOTOS[0];
      handleSelectSample(sample);
    }
  }, [isOpen]);

  // Mini map initialization when arriving at Step 2
  useEffect(() => {
    if (step === 2 && miniMapContainerRef.current && !miniMapRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      marker.on('dragend', (e) => {
        const newPos = (e.target as L.Marker).getLatLng();
        setLat(Number(newPos.lat.toFixed(5)));
        setLng(Number(newPos.lng.toFixed(5)));
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setLat(Number(e.latlng.lat.toFixed(5)));
        setLng(Number(e.latlng.lng.toFixed(5)));
      });

      miniMapRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (step !== 2 && miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [step]);

  // Update marker position if coordinates change
  useEffect(() => {
    if (markerRef.current && miniMapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      miniMapRef.current.setView([lat, lng]);
    }
  }, [lat, lng]);

  if (!isOpen) return null;

  // Handle Image File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      triggerAiClassification(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Handle Quick Sample Photo Selection
  const handleSelectSample = (sample: (typeof SAMPLE_ISSUE_PHOTOS)[0]) => {
    setImagePreview(sample.url);
    setTitle(sample.title);
    setDescription(sample.defaultDescription);
    triggerAiClassification(sample.url, sample.title);
  };

  // Trigger AI Classification via backend server route
  const triggerAiClassification = async (imageSrc: string, contextHint: string = '') => {
    setIsClassifying(true);
    setAiResult(null);

    try {
      const isBase64 = imageSrc.startsWith('data:');
      const bodyPayload = isBase64
        ? { imageBase64: imageSrc, userDescription: contextHint }
        : { imageUrl: imageSrc, userDescription: contextHint };

      const res = await fetch('/api/ai/classify-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        const analysis: AIAnalysisResult = data.analysis;
        setAiResult(analysis);

        // Auto-fill form values from AI
        if (analysis.predictedCategory) setCategory(analysis.predictedCategory);
        if (analysis.priority) setPriority(analysis.priority);
        if (analysis.suggestedDepartment) setDepartment(analysis.suggestedDepartment);
        if (analysis.detectedIssue && !title) setTitle(analysis.detectedIssue);
      }
    } catch (err) {
      console.error('AI Classification request error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  // HTML5 Geolocation Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(5));
        const newLng = Number(pos.coords.longitude.toFixed(5));
        setLat(newLat);
        setLng(newLng);
        setAddress('Detected GPS Location (Lucknow Sector)');
      },
      (err) => {
        alert('Could not retrieve GPS location. You can select coordinates directly on the map.');
      },
      { timeout: 8000 }
    );
  };

  // Check for duplicates before moving from step 2 to review
  const handleProceedFromLocation = () => {
    const duplicates = findPotentialDuplicates({ lat, lng }, category, existingComplaints, 250);
    setNearbyDuplicates(duplicates);

    if (duplicates.length > 0 && !bypassedDuplicate) {
      setStep(3); // Go to duplicate resolution step
    } else {
      setStep(4); // Go straight to review
    }
  };

  // Submit Complaint to Backend
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: title || `${category} reported at ${address}`,
        description: description || 'Civic issue reported via CivicPulse.',
        category,
        priority,
        image: imagePreview,
        location: {
          lat,
          lng,
          address,
          ward,
          city,
        },
        department,
        reportedBy: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          badge: currentUser.badges[0] || 'Community Helper',
          avatar: currentUser.avatar,
        },
        aiAnalysis: aiResult,
      };

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.complaint) {
        onComplaintSubmitted(data.complaint, data.pointsEarned || 50);
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      alert('Network error while filing complaint. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Report Civic Issue</h3>
              <p className="text-[11px] text-blue-100 font-medium">
                AI automated categorization & GPS location capture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center space-x-1.5 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              1
            </span>
            <span>Photo & AI</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <div className={`flex items-center space-x-1.5 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              2
            </span>
            <span>Location & GPS</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <div className={`flex items-center space-x-1.5 ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              3
            </span>
            <span>Duplicate Check</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <div className={`flex items-center space-x-1.5 ${step >= 4 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              4
            </span>
            <span>Review</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* STEP 1: Image & AI Classification */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Upload Issue Photo or Select Real-world Sample
                </label>

                {/* Upload Box */}
                <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden max-h-56 bg-slate-900 group">
                      <img
                        src={imagePreview}
                        alt="Issue Preview"
                        className="w-full h-56 object-cover"
                      />
                      {/* Scanning animation overlay while AI is running */}
                      {isClassifying && (
                        <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full border-4 border-blue-400 border-t-transparent animate-spin mb-3"></div>
                          <p className="text-white font-bold text-sm flex items-center space-x-1.5">
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                            <span>Gemini Vision AI Analyzing Infrastructure...</span>
                          </p>
                          <p className="text-blue-200 text-xs mt-1">
                            Detecting category, safety hazards & urgency
                          </p>
                        </div>
                      )}
                      <label
                        htmlFor="file-upload"
                        className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg cursor-pointer flex items-center space-x-1 transition-transform active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                      </label>
                    </div>
                  ) : (
                    <div className="py-8">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">
                        Click to upload photo or drag & drop here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PNG, JPG, JPEG up to 20MB
                      </p>
                    </div>
                  )}

                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto"
                  />
                </div>
              </div>

              {/* Instant Test Samples Carousel */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  ⚡ Or Test Instantly With Real City Problem Samples:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SAMPLE_ISSUE_PHOTOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className={`text-left p-2 rounded-xl border transition-all text-xs flex items-center space-x-2 ${
                        imagePreview === sample.url
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <img
                        src={sample.url}
                        alt={sample.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 truncate">{sample.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{sample.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Classification Results Card */}
              {aiResult && !isClassifying && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-blue-50 to-emerald-50/50 border border-blue-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>AI Classification Engine Result</span>
                    </div>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {aiResult.confidence}% Confidence
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Predicted Category:</span>
                      <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {aiResult.predictedCategory}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Assessed Priority:</span>
                      <span
                        className={`font-extrabold px-2 py-0.5 rounded-md text-white ${
                          aiResult.priority === 'Critical'
                            ? 'bg-rose-600'
                            : aiResult.priority === 'High'
                            ? 'bg-amber-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {aiResult.priority}
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-slate-500">Routing Department:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {aiResult.suggestedDepartment}
                      </span>
                    </div>

                    {aiResult.safetyHazard && (
                      <div className="mt-2 p-2 rounded-xl bg-rose-100/80 border border-rose-300 text-rose-900 flex items-center space-x-2 text-[11px] font-semibold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Public safety hazard identified. Escalated for priority handling.</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-600 italic pt-1 border-t border-blue-100">
                      &quot;{aiResult.priorityReason}&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Location & GPS Geocoding */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    GPS Coordinates & Location
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Detect My GPS</span>
                  </button>
                </div>

                {/* Leaflet Mini Picker Map */}
                <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative">
                  <div ref={miniMapContainerRef} className="w-full h-full" />
                  <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-semibold text-slate-700 shadow-xs">
                    Drag pin or click map to adjust exact spot
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-700">Latitude:</span> {lat}
                  </div>
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-700">Longitude:</span> {lng}
                  </div>
                </div>
              </div>

              {/* Address / Landmark */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Street Address / Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Gomti Nagar Flyover, Lohia Path"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>

              {/* Ward / Zone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Municipal Ward / Zone
                  </label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="e.g. Ward 42 - Gomti Nagar"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    disabled
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-medium text-slate-600"
                  />
                </div>
              </div>

              {/* Category & Priority review */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirmed Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CivicCategory)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Road Damage">Road Damage</option>
                    <option value="Waste Issue">Waste Issue</option>
                    <option value="Water Supply & Leakage">Water Supply & Leakage</option>
                    <option value="Electrical & Street Light">Electrical & Street Light</option>
                    <option value="Sanitation & Drainage">Sanitation & Drainage</option>
                    <option value="Public Property">Public Property</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as CivicPriority)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Duplicate Complaint Detection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300">
                <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm mb-1">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Potential Duplicate Complaint Detected Nearby!</span>
                </div>
                <p className="text-xs text-amber-800">
                  Our GPS proximity filter detected a similar{' '}
                  <span className="font-bold">{category}</span> complaint reported nearby.
                  Supporting the existing ticket speeds up municipal crew dispatch and avoids redundant work orders.
                </p>
              </div>

              {nearbyDuplicates.map(({ complaint: dup, distance }) => (
                <div
                  key={dup.id}
                  className="p-4 rounded-2xl bg-white border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row gap-4 items-start"
                >
                  <img
                    src={dup.image}
                    alt={dup.title}
                    className="w-full sm:w-28 h-24 rounded-xl object-cover"
                  />
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        #{dup.ticketNumber}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {distance}m away from your location
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{dup.title}</h4>
                    <p className="text-slate-600 text-[11px]">{dup.location.address}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-1">
                      <span>Status: <strong className="text-blue-600">{dup.status}</strong></span>
                      <span>•</span>
                      <span>{dup.votes} Citizens Affected</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex flex-col justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        onSupportExisting(dup.id);
                        onClose();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Support This (+25 pts)</span>
                    </button>
                  </div>
                </div>
              ))}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBypassedDuplicate(true);
                    setStep(4);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  No, this is a completely different issue. Continue with new report →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Final Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex gap-4">
                  <img
                    src={imagePreview}
                    alt="Issue"
                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                        {category}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] text-white ${
                          priority === 'Critical'
                            ? 'bg-rose-600'
                            : priority === 'High'
                            ? 'bg-amber-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {priority} Priority
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{title || 'Civic Infrastructure Complaint'}</h4>
                    <p className="text-slate-600 text-[11px] line-clamp-2">
                      {description || 'Reported by citizen.'}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1">
                      <MapPin className="w-3 h-3 text-red-500 inline shrink-0" />
                      <span>{address}, {ward}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Department</span>
                    <span className="font-semibold text-slate-800">{department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Reporter</span>
                    <span className="font-semibold text-slate-800">{currentUser.name}</span>
                  </div>
                </div>
              </div>

              {/* Reward Callout */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-emerald-900">
                  <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Citizen Contribution Reward</p>
                    <p className="text-[11px] text-emerald-700">You will earn +50 Civic Points upon submission.</p>
                  </div>
                </div>
                <span className="font-extrabold text-emerald-700 text-sm">+50 pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              disabled={!imagePreview || isClassifying}
              onClick={() => setStep(2)}
              className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>Next: Set Location</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleProceedFromLocation}
              className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>Check for Duplicates</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={() => {
                setBypassedDuplicate(true);
                setStep(4);
              }}
              className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>Continue with New Report</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Complaint (+50 pts)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
