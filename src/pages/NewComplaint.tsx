import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Ward, Department, Complaint } from '../types';
import { apiRequest } from '../api/client';
import {
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle,
  Clock,
  Compass,
  Copy,
  Info,
  Layers,
  MapPin,
  Send,
  Sparkles
} from 'lucide-react';

export const NewComplaint: React.FC = () => {
  const { user, citizen } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [wards, setWards] = useState<Ward[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [selectedWard, setSelectedWard] = useState<number>(citizen?.ward || 1);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preset categories for quick selection
  const presets = [
    { label: 'Water Leakage', kw: 'Water main pipeline leak' },
    { label: 'Garbage Dump', kw: 'Garbage dump uncleaned bins' },
    { label: 'Road Pothole', kw: 'Dangerous pothole on street road' },
    { label: 'Street Light', kw: 'Street light pole spark blackout' },
    { label: 'Sewage Overflow', kw: 'Sewage drain gutter overflow' },
    { label: 'Property Tax', kw: 'Property tax bill assessment issue' },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [wList, cList] = await Promise.all([
          apiRequest<Ward[]>('/wards'),
          apiRequest<Complaint[]>('/complaints'),
        ]);
        setWards(wList);
        setAllComplaints(cList);
        if (citizen?.ward) {
          setSelectedWard(citizen.ward);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [citizen]);

  // LIVE KEYWORD ROUTER (Frontend explanation mirroring backend logic)
  const calculateDetectedDept = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.match(/water|leak|pipeline|tap|supply|meter|contamination|tanker|jal/)) {
      return { dept: 'Water', matched: 'Detected keywords related to water supply & pipeline maintenance.' };
    }
    if (lower.match(/garbage|drain|sewage|trash|waste|cleaning|dump|gutter|kachra/)) {
      return { dept: 'Sanitation', matched: 'Detected keywords related to waste management & drains.' };
    }
    if (lower.match(/road|pothole|asphalt|footpath|divider|pavement|street|crater|rasta/)) {
      return { dept: 'Roads', matched: 'Detected keywords related to road repairs & pavements.' };
    }
    if (lower.match(/light|pole|power|shock|electricity|transformer|spark|blackout|wire|bijli/)) {
      return { dept: 'Electricity', matched: 'Detected keywords related to street lighting & electrical grid.' };
    }
    if (lower.match(/tax|assessment|property|bill|receipt|challan|valuation/)) {
      return { dept: 'Property Tax', matched: 'Detected keywords related to municipal revenue & property tax.' };
    }
    return { dept: 'Sanitation', matched: 'Default municipal department fallback (no specific keyword match).' };
  };

  const combinedText = `${category} ${description}`;
  const routing = calculateDetectedDept(combinedText);

  // LIVE DUPLICATE DETECTION (7-day rule for same category + same ward)
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const isDuplicateDetected = category.trim().length > 3 && allComplaints.some(c => {
    const matchWard = c.ward === selectedWard || c.ward_id === selectedWard;
    const matchCat = c.category.toLowerCase().trim() === category.toLowerCase().trim();
    const isRecent = new Date(c.created_at).getTime() >= sevenDaysAgo;
    return matchWard && matchCat && isRecent;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !description.trim() || !locationText.trim()) {
      setError('Please fill in category, description, and location.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await apiRequest('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          category,
          description,
          location_text: locationText,
          ward: selectedWard,
        }),
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Title & Guidance */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider mb-2">
          <Compass className="w-3.5 h-3.5 text-amber-500" />
          Intake & Auto-Routing
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          File a Municipal Grievance
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Complaints are automatically routed to the right MBMC department using transparent keyword rules and bound to a strict 72-hour SLA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick preset chips */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Quick Category Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setCategory(p.label);
                      if (!description) setDescription(p.kw);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
                      category === p.label
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Grievance Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Water Leakage, Pothole on main road, Choked drain"
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            {/* Ward Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Ward / Location Area <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                required
              >
                {wards.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Pop: {w.population.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Exact Street / Landmark Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g. Near Shanti Park Signal, opposite Bank of Baroda"
                  className="w-full text-sm rounded-lg border border-gray-300 pl-9 p-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Detailed Problem Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, how long it has persisted, and any hazards..."
                rows={4}
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Registering Grievance...' : 'Submit Grievance to MBMC'}
              </button>
            </div>
          </form>
        </div>

        {/* Informational Sidebar: Keyword Routing & Duplicate Alert */}
        <div className="space-y-5">
          {/* Keyword Routing Preview Box */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Compass className="w-4 h-4" />
              Automated Keyword Routing
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 mb-1">
              <span>Target Dept:</span>
              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-mono">
                {routing.dept}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {routing.matched}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Rule-based routing without complex AI/ML keeps the system transparent and explainable.</span>
            </div>
          </div>

          {/* Duplicate Detection Alert Box */}
          {isDuplicateDetected && (
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-300 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide mb-1">
                <Copy className="w-4 h-4 text-amber-600" />
                Duplicate Detection Warning
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                A similar complaint in category <strong>"{category}"</strong> was registered in this ward within the last 7 days.
              </p>
              <div className="mt-2 text-[11px] text-amber-700 bg-amber-100/80 p-2 rounded border border-amber-200">
                Your ticket will be flagged as <em>"Possible Duplicate"</em> to help field officers consolidate dispatch.
              </div>
            </div>
          )}

          {/* SLA Standard Target Box */}
          <div className="bg-blue-50/80 rounded-xl p-5 border border-blue-200 text-blue-900 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-blue-950 mb-1">
              <Clock className="w-4 h-4 text-blue-700" />
              72-Hour MBMC SLA Guarantee
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Every complaint is stamped with a 72-hour Service Level Agreement timer. If the issue is not resolved within 72 hours, it gets tagged with an SLA Breach warning visible to senior commissioners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
