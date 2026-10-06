import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../api/client';
import {
  FileText,
  Save,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileCheck2,
  Scroll,
  HelpCircle
} from 'lucide-react';

export const NewServiceRequest: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [type, setType] = useState<'certificate' | 'permit' | 'tax'>('certificate');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templates = [
    { type: 'certificate' as const, title: 'Birth Certificate Duplicate Copy', hint: 'Provide registered child name and birth year' },
    { type: 'certificate' as const, title: 'Town Planning Zone Verification Certificate', hint: 'Provide survey number and CTS ward number' },
    { type: 'permit' as const, title: 'Commercial Trade License Renewal', hint: 'Provide existing license registration number' },
    { type: 'permit' as const, title: 'Building Repair & Scaffolding Permit', hint: 'Specify residential society name and duration' },
    { type: 'tax' as const, title: 'Property Tax Assessment Assessment / Re-evaluation', hint: 'Provide property tax folio number' },
  ];

  const handleSubmit = async (targetStatus: 'draft' | 'submitted') => {
    if (!title.trim()) {
      setError('Please provide a title for the service request.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await apiRequest('/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          type,
          title,
          details,
          status: targetStatus,
        }),
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to submit service request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider mb-2">
          <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
          Municipal Service Applications
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Apply for Municipal Service / Permit
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Apply for civic certificates, trade and repair permits, or property tax evaluations linked to your citizen profile.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Service Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Select Service Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setType('certificate')}
              className={`p-3.5 rounded-lg border text-left transition ${
                type === 'certificate'
                  ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              <Scroll className="w-5 h-5 text-blue-600 mb-1" />
              <div className="text-sm">Certificate</div>
              <div className="text-xs text-gray-500 font-normal">Birth, Death, Zoning</div>
            </button>

            <button
              type="button"
              onClick={() => setType('permit')}
              className={`p-3.5 rounded-lg border text-left transition ${
                type === 'permit'
                  ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              <FileCheck2 className="w-5 h-5 text-indigo-600 mb-1" />
              <div className="text-sm">Permit / License</div>
              <div className="text-xs text-gray-500 font-normal">Trade, Repair, Hawker</div>
            </button>

            <button
              type="button"
              onClick={() => setType('tax')}
              className={`p-3.5 rounded-lg border text-left transition ${
                type === 'tax'
                  ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              <FileText className="w-5 h-5 text-emerald-600 mb-1" />
              <div className="text-sm">Tax & Assessment</div>
              <div className="text-xs text-gray-500 font-normal">Property Tax, Water Meter</div>
            </button>
          </div>
        </div>

        {/* Preset Templates */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Suggested Application Templates
          </label>
          <div className="flex flex-wrap gap-2">
            {templates
              .filter(t => t.type === type)
              .map(t => (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => {
                    setTitle(t.title);
                    if (!details) setDetails(t.hint);
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700"
                >
                  {t.title}
                </button>
              ))}
          </div>
        </div>

        {/* Application Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Application Title / Purpose <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Duplicate Birth Certificate for School Admission"
            className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            required
          />
        </div>

        {/* Details & Documents Note */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Details / Identification Numbers
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide relevant application details, property numbers, or notes for MBMC clerks..."
            rows={4}
            className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Silent Friction Explanation Box */}
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
          <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
            <Clock className="w-4 h-4 text-amber-600" />
            "Silent Friction" Tracking SOP:
          </div>
          You can save this application as a <strong>Draft</strong> and complete it later. However, if a draft remains unattended for more than <strong>3 days</strong>, the system flags it as <strong>"Abandoned"</strong>. This helps MBMC leadership identify complicated civic paperwork and streamline citizen processes.
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('submitted')}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            Submit Application Now
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('draft')}
            className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition border border-slate-300 flex items-center justify-center gap-2 text-sm"
          >
            <Save className="w-4 h-4 text-slate-600" />
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
};
