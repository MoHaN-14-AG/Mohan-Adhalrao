import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AdminStats } from '../types';
import { apiRequest } from '../api/client';
import {
  BarChart3,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  RotateCw,
  FolderX,
  Play,
  Layers,
  Database,
  ShieldCheck,
  Building
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<AdminStats>('/admin/stats');
      setStats(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleComputeScores = async () => {
    try {
      setActionMessage('Recomputing Ward Accountability Scores...');
      await apiRequest('/ward-scores/compute', { method: 'POST' });
      setActionMessage('Ward Scores successfully recalculated with latest grievance and financial data!');
      fetchStats();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  const handleMarkAbandoned = async () => {
    try {
      setActionMessage('Scanning for draft service requests older than 3 days...');
      const res = await apiRequest<{ marked_abandoned: number }>('/service-requests/mark-abandoned', { method: 'POST' });
      setActionMessage(`Silent Friction check completed: ${res.marked_abandoned} dormant draft application(s) marked as Abandoned.`);
      fetchStats();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset demo database to fresh initial seed state?')) return;
    try {
      setActionMessage('Resetting demo database to default MBMC seed dataset...');
      await apiRequest('/seed-reset', { method: 'POST' });
      setActionMessage('Demo database reset successfully.');
      fetchStats();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  // Category Doughnut Chart
  const categoryData = {
    labels: stats?.category_counts.map(c => c.category) || [],
    datasets: [
      {
        data: stats?.category_counts.map(c => c.count) || [],
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
          '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Department Bar Chart
  const deptData = {
    labels: stats?.department_counts.map(d => d.department__name) || [],
    datasets: [
      {
        label: 'Grievance Volume',
        data: stats?.department_counts.map(d => d.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                MBMC Central Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
              Executive CiRM Command Dashboard
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Logged in as <strong className="text-amber-400">Municipal Commissioner</strong> ({user?.username})
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleComputeScores}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Runs compute_ward_scores management command"
            >
              <Play className="w-3.5 h-3.5" />
              Compute Ward Scores
            </button>

            <button
              onClick={handleMarkAbandoned}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Runs mark_abandoned_requests command (silent friction SOP)"
            >
              <FolderX className="w-3.5 h-3.5" />
              Run Silent Friction Check
            </button>

            <button
              onClick={handleResetDatabase}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-600"
              title="Re-seeds demo data"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Reset Demo Data
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 rounded-lg bg-slate-800 text-amber-300 text-xs border border-slate-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {loading || !stats ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aggregating municipal analytics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Complaints
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                {stats.total_complaints}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                {stats.resolved_complaints} resolved ({Math.round((stats.resolved_complaints / (stats.total_complaints || 1)) * 100)}%)
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Active in Field
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {stats.active_complaints}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Submitted, routed & in progress
              </div>
            </div>

            <div className={`p-5 rounded-xl border shadow-xs ${
              stats.sla_breaches > 0
                ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                : 'bg-white border-gray-200'
            }`}>
              <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                SLA Breaches
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
                {stats.sla_breaches}
              </div>
              <div className="text-[11px] text-rose-600/80 mt-1">
                Exceeded 72-hr resolution SLA
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Avg Resolution Time
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                {stats.avg_resolution_hours} <span className="text-sm font-normal text-gray-500">hrs</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Benchmark: 72 hrs max
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <FolderX className="w-3.5 h-3.5 text-orange-500" />
                Silent Friction
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-orange-600 mt-1">
                {stats.abandoned_requests_count}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Draft applications left &gt; 3 days
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Category Breakdown (Doughnut) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Complaints by Category
                </h3>
                <span className="text-xs text-gray-400">Grievance Distribution</span>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                        labels: { boxWidth: 12, font: { size: 11 } },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Department Breakdown (Bar) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Complaints by Municipal Department
                </h3>
                <span className="text-xs text-gray-400">Auto-routed volume</span>
              </div>
              <div className="h-64">
                <Bar
                  data={deptData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(200, 200, 200, 0.2)' } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
