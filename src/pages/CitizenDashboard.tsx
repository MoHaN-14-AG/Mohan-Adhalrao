import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Complaint, ServiceRequest, Feedback } from '../types';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Star,
  Clock,
  MapPin,
  Building,
  PlusCircle,
  HelpCircle,
  User,
  Phone,
  ShieldAlert,
  Send
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user, citizen } = useAuth();
  const { t } = useLanguage();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'complaints' | 'services'>('all');

  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cmpRes, srRes, fbRes] = await Promise.all([
        apiRequest<Complaint[]>('/complaints'),
        apiRequest<ServiceRequest[]>('/service-requests'),
        apiRequest<Feedback[]>('/feedback'),
      ]);
      setComplaints(cmpRes);
      setServiceRequests(srRes);
      setFeedbacks(fbRes);
    } catch (err) {
      console.error('Error fetching citizen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Citizen-Verified Closure: Confirm Resolution
  const handleConfirmResolution = async (complaint: Complaint) => {
    try {
      await apiRequest(`/complaints/${complaint.id}/update-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'citizen_confirmed' }),
      });
      // Open feedback modal right after confirmation
      setSelectedComplaint(complaint);
      setRating(5);
      setComment('');
      setFeedbackModalOpen(true);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm resolution');
    }
  };

  // Citizen Reopen: Not Fixed
  const handleReopen = async (complaintId: number) => {
    const reason = window.prompt('Please briefly describe what remains unfixed (optional):');
    if (reason === null) return; // User cancelled

    try {
      await apiRequest(`/complaints/${complaintId}/reopen`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      alert('Your ticket has been reopened and returned to "In Progress". The department has been notified.');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen complaint');
    }
  };

  // Submit Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setSubmittingFeedback(true);
      await apiRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          complaint: selectedComplaint.id,
          rating,
          comment,
        }),
      });
      setFeedbackModalOpen(false);
      setSelectedComplaint(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Combine complaints and service requests into one unified relationship timeline
  const combinedTimeline = [
    ...complaints.map(c => ({
      ...c,
      timelineType: 'complaint' as const,
      timestamp: new Date(c.created_at).getTime(),
    })),
    ...serviceRequests.map(s => ({
      ...s,
      timelineType: 'service' as const,
      timestamp: new Date(s.created_at).getTime(),
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const filteredTimeline = combinedTimeline.filter(item => {
    if (filterType === 'complaints') return item.timelineType === 'complaint';
    if (filterType === 'services') return item.timelineType === 'service';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Citizen Anchor Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold tracking-wide border border-amber-500/30">
              <User className="w-3.5 h-3.5" />
              ANCHOR CITIZEN RECORD
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              {t('my_record_desc')}
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <strong>Ward:</strong> {citizen?.ward_name || 'Ward 1 - Mira Road East'}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <strong>Phone:</strong> {citizen?.phone || '9820011221'}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <strong>Total Grievances:</strong> {complaints.length}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <strong>Service Requests:</strong> {serviceRequests.length}
              </span>
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <Link
              to="/new-complaint"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-sm hover:bg-amber-400 transition shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              {t('new_complaint')}
            </Link>
            <Link
              to="/new-service"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg text-sm transition border border-slate-600"
            >
              <FileText className="w-4 h-4" />
              {t('new_service')}
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Entries ({combinedTimeline.length})
          </button>
          <button
            onClick={() => setFilterType('complaints')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              filterType === 'complaints'
                ? 'bg-slate-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Complaints ({complaints.length})
          </button>
          <button
            onClick={() => setFilterType('services')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              filterType === 'services'
                ? 'bg-slate-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Service Requests ({serviceRequests.length})
          </button>
        </div>

        <button
          onClick={fetchData}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your citizen relationship record...</p>
        </div>
      ) : filteredTimeline.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No records found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            You have not registered any grievances or service requests yet.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/new-complaint"
              className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg text-sm font-semibold hover:bg-amber-400"
            >
              {t('new_complaint')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTimeline.map((item: any) => {
            const isComplaint = item.timelineType === 'complaint';

            return (
              <div
                key={`${item.timelineType}-${item.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-xs hover:border-gray-300 transition overflow-hidden"
              >
                <div className="p-5 sm:p-6">
                  {/* Top line: Header, Department, Status */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                          isComplaint
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isComplaint ? `CMP-${String(item.id).padStart(4, '0')}` : `SR-${String(item.id).padStart(4, '0')}`}
                      </span>

                      <h3 className="text-base font-bold text-gray-900">
                        {isComplaint ? item.category : item.title}
                      </h3>
                    </div>

                    <StatusBadge
                      status={item.status}
                      isBreached={item.is_sla_breached}
                      isDuplicate={item.is_duplicate}
                      reopenCount={item.reopen_count}
                    />
                  </div>

                  {/* Description / Details */}
                  <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">
                    {isComplaint ? item.description : item.details}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Lodge Date: {new Date(item.created_at).toLocaleDateString()}
                    </span>

                    {isComplaint && (
                      <>
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          Dept: <strong>{item.department_name}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          Location: {item.location_text}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          SLA Target: 72 hrs ({new Date(item.sla_due_at).toLocaleDateString()})
                        </span>
                      </>
                    )}

                    {!isComplaint && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        Type: <span className="capitalize font-medium">{item.type}</span>
                      </span>
                    )}
                  </div>

                  {/* Citizen-Verified Closure Actions */}
                  {isComplaint && item.status === 'resolved' && (
                    <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Department marked this problem as RESOLVED.
                        </div>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          In SetuSeva, tickets are only permanently closed with CITIZEN VERIFICATION. Has the issue been fixed to your satisfaction?
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleConfirmResolution(item)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t('btn_confirm_resolution')}
                        </button>
                        <button
                          onClick={() => handleReopen(item.id)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold transition shadow-xs flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {t('btn_not_fixed')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback display if citizen already rated */}
                  {isComplaint && item.feedback && (
                    <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-start gap-3">
                      <div className="flex items-center gap-0.5 text-amber-500 pt-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= item.feedback.rating
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold text-gray-900">Your Feedback: </span>
                        "{item.feedback.comment || 'Verified and completed'}"
                      </div>
                    </div>
                  )}

                  {/* Feedback button if confirmed but feedback not yet attached */}
                  {isComplaint && item.status === 'citizen_confirmed' && !item.feedback && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedComplaint(item);
                          setRating(5);
                          setComment('');
                          setFeedbackModalOpen(true);
                        }}
                        className="text-xs text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1 rounded font-medium flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5" />
                        {t('btn_give_feedback')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {feedbackModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Rate Resolution Quality
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              CMP-{String(selectedComplaint.id).padStart(4, '0')}: {selectedComplaint.category} ({selectedComplaint.department_name})
            </p>

            <form onSubmit={handleSubmitFeedback}>
              {/* Star Rating Selector */}
              <div className="mb-4 text-center">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Satisfaction Rating (1 - 5 Stars)
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setRating(val)}
                      className="p-1 hover:scale-110 transition focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          val <= rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {rating === 5 && '🌟 Excellent resolution'}
                  {rating === 4 && '👍 Good and satisfactory'}
                  {rating === 3 && '😐 Average'}
                  {rating === 2 && '👎 Below expectations'}
                  {rating === 1 && '⚠️ Poor response'}
                </p>
              </div>

              {/* Comment text */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Citizen Comments
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the work done by municipal staff..."
                  rows={3}
                  className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
