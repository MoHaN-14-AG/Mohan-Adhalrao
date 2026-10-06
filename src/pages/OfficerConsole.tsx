import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Complaint, Ward, Department } from '../types';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  Play,
  RotateCw,
  Building,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export const OfficerConsole: React.FC = () => {
  const { user, role, department, switchDemoUser } = useAuth();
  const { t } = useLanguage();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConsoleData = async () => {
    try {
      setLoading(true);
      const [cmpRes, wardRes] = await Promise.all([
        apiRequest<Complaint[]>('/complaints'),
        apiRequest<Ward[]>('/wards'),
      ]);
      setComplaints(cmpRes);
      setWards(wardRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsoleData();
  }, [user, department]);

  const handleUpdateStatus = async (complaintId: number, nextStatus: string) => {
    try {
      await apiRequest(`/complaints/${complaintId}/update-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchConsoleData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Filter complaints
  const filtered = complaints.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (wardFilter !== 'all' && String(c.ward || c.ward_id) !== wardFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = c.category.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchCitizen = c.citizen_name.toLowerCase().includes(q);
      const matchLoc = c.location_text.toLowerCase().includes(q);
      if (!matchCat && !matchDesc && !matchCitizen && !matchLoc) return false;
    }
    return true;
  });

  const slaBreachedCount = complaints.filter(c => c.is_sla_breached).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Console Top Header */}
      <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 sm:p-7 mb-8 border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                Departmental Officer Console
              </span>
              <span className="text-slate-400 text-xs">• MBMC Field Dispatch</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              {role === 'admin' ? 'All Municipal Departments' : `${department || 'Municipal'} Department`}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Active Officer: <strong className="text-amber-400">{user?.first_name} {user?.last_name}</strong> ({user?.username})
            </p>
          </div>

          {/* Quick Officer Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Switch Officer:</span>
            <button
              onClick={() => switchDemoUser('officer_water')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                user?.username === 'officer_water'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              Water Officer
            </button>
            <button
              onClick={() => switchDemoUser('officer_sanitation')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                user?.username === 'officer_sanitation'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              Sanitation Officer
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400">Department Complaints</div>
            <div className="text-xl font-bold text-white mt-0.5">{complaints.length}</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400">Action Required</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">
              {complaints.filter(c => c.status === 'submitted' || c.status === 'routed').length}
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400">In Progress Work</div>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">
              {complaints.filter(c => c.status === 'in_progress').length}
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${
            slaBreachedCount > 0 ? 'bg-rose-950/60 border-rose-700/80 text-rose-300' : 'bg-slate-800/60 border-slate-700 text-slate-400'
          }`}>
            <div className="font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              SLA Breached
            </div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{slaBreachedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search category, citizen, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 pl-9 p-2 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 bg-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="routed">Routed</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="citizen_confirmed">Citizen Confirmed</option>
            </select>

            {/* Ward Filter */}
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 bg-white focus:outline-none"
            >
              <option value="all">All Wards</option>
              {wards.map(w => (
                <option key={w.id} value={String(w.id)}>{w.name}</option>
              ))}
            </select>

            <button
              onClick={fetchConsoleData}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading complaints for dispatch console...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No grievances matching filters</h3>
          <p className="text-xs text-gray-500 mt-1">All complaints have been cleared or no tickets match the current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">ID & Date</th>
                  <th className="px-4 py-3">Category & Details</th>
                  <th className="px-4 py-3">Citizen & Ward</th>
                  <th className="px-4 py-3">Status & SLA</th>
                  <th className="px-4 py-3 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.map(c => {
                  const createdDate = new Date(c.created_at);
                  const slaDue = new Date(c.sla_due_at);
                  const now = new Date();
                  const hoursLeft = Math.round((slaDue.getTime() - now.getTime()) / (1000 * 3600));

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50/80 transition ${
                        c.is_sla_breached ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* ID & Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-gray-900">
                          CMP-{String(c.id).padStart(4, '0')}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {createdDate.toLocaleDateString()}
                        </div>
                      </td>

                      {/* Category & Details */}
                      <td className="px-4 py-3.5 max-w-sm">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{c.category}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-normal">
                            {c.department_name}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[11px] mt-0.5 line-clamp-2">
                          {c.description}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{c.location_text}</span>
                        </div>
                      </td>

                      {/* Citizen & Ward */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {c.citizen_name}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {c.citizen_phone}
                        </div>
                        <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                          {c.ward_name}
                        </div>
                      </td>

                      {/* Status & SLA */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge
                          status={c.status}
                          isBreached={c.is_sla_breached}
                          isDuplicate={c.is_duplicate}
                          reopenCount={c.reopen_count}
                        />

                        {/* SLA timer indicator */}
                        <div className="mt-1 text-[11px]">
                          {c.status === 'resolved' || c.status === 'citizen_confirmed' ? (
                            <span className="text-emerald-700 font-medium">Work Done</span>
                          ) : c.is_sla_breached ? (
                            <span className="text-rose-600 font-bold">
                              Breached by {Math.abs(hoursLeft)} hrs
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              {hoursLeft} hrs remaining
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lifecycle Action Buttons */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        {c.status === 'submitted' && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'routed')}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition"
                          >
                            Route Ticket
                          </button>
                        )}

                        {c.status === 'routed' && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'in_progress')}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition flex items-center gap-1 ml-auto"
                          >
                            <Play className="w-3 h-3" />
                            Start Work
                          </button>
                        )}

                        {c.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'resolved')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition flex items-center gap-1 ml-auto"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Mark Resolved
                          </button>
                        )}

                        {c.status === 'resolved' && (
                          <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block text-left">
                            <span className="font-semibold">Awaiting Citizen Confirmation</span>
                            <div className="text-[10px] text-gray-500">Officer cannot unilaterally close ticket.</div>
                          </div>
                        )}

                        {c.status === 'citizen_confirmed' && (
                          <span className="text-xs text-teal-700 font-semibold flex items-center gap-1 justify-end">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Closed by Citizen
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
