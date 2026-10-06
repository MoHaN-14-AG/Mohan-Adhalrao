import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { WardScore } from '../types';
import { apiRequest } from '../api/client';
import {
  BarChart3,
  Award,
  TrendingUp,
  Percent,
  Clock,
  RotateCcw,
  Building2,
  Users,
  ShieldCheck,
  Info,
  CheckCircle2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const PublicScorecard: React.FC = () => {
  const { t } = useLanguage();
  const [scores, setScores] = useState<WardScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<WardScore[]>('/ward-scores');
      setScores(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  // Prepare Chart.js dataset
  const chartLabels = scores.map(s => s.ward_name.replace(' - ', '\n'));
  const chartDataValues = scores.map(s => s.final_score);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Accountability Score (/100)',
        data: chartDataValues,
        backgroundColor: chartDataValues.map(val => {
          if (val >= 85) return 'rgba(16, 185, 129, 0.85)'; // Emerald
          if (val >= 75) return 'rgba(59, 130, 246, 0.85)';  // Blue
          if (val >= 65) return 'rgba(245, 158, 11, 0.85)';  // Amber
          return 'rgba(239, 68, 68, 0.85)';                  // Red
        }),
        borderColor: chartDataValues.map(val => {
          if (val >= 85) return 'rgb(5, 150, 105)';
          if (val >= 75) return 'rgb(37, 99, 235)';
          if (val >= 65) return 'rgb(217, 119, 6)';
          return 'rgb(220, 38, 38)';
        }),
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Accountability Score: ${context.raw}/100`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner with Mandatory Disclaimer Note */}
      <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 mb-6 text-amber-950 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm text-amber-900 uppercase tracking-wide">
            Public Civic Transparency Notice
          </h4>
          <p className="text-xs text-amber-900/90 mt-0.5 font-medium">
            <strong>Notice:</strong> {t('disclaimer_text')}
          </p>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Live Ward Accountability Scorecard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
              Mira-Bhayandar Ward Performance Index
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              An open governance dashboard calculating ward ratings from real citizen grievances, SLA resolution velocity, first-time fix ratios, and municipal fund utilization.
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Reporting Cycle</div>
            <div className="text-base font-bold text-amber-400">
              {scores[0]?.month || 'October 2026'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Refreshed automatically via <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">compute_ward_scores</code>
            </div>
          </div>
        </div>
      </div>

      {/* Chart.js Visualization Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-bold text-gray-900">
              Comparative Ward Accountability Ranking
            </h2>
          </div>
          <span className="text-xs text-gray-400">Target Benchmark: 80+ Points</span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="h-72 w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Detailed Scorecard Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden mb-8">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Factor Breakdown per Ward
          </h2>
          <span className="text-xs text-gray-500">6 MBMC Administrative Wards</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Rank & Ward</th>
                <th className="px-4 py-3">Population</th>
                <th className="px-4 py-3 text-center">Resolution Rate (40%)</th>
                <th className="px-4 py-3 text-center">Avg Response (25%)</th>
                <th className="px-4 py-3 text-center">First-Time Fix (15%)</th>
                <th className="px-4 py-3 text-center">Fund Utilisation (20%)</th>
                <th className="px-4 py-3 text-right">Composite Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {scores.map((s, index) => {
                const firstTimeFixPct = Math.max(0, Math.round((100 - s.reopened_ratio) * 10) / 10);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          index === 0 ? 'bg-amber-400 text-slate-950' :
                          index === 1 ? 'bg-slate-300 text-slate-800' :
                          index === 2 ? 'bg-amber-700/20 text-amber-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="font-bold text-gray-900">{s.ward_name}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-500">
                      {s.population ? s.population.toLocaleString() : '150,000'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span className="font-bold text-gray-900">{s.resolution_rate}%</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span className="font-medium text-gray-700">{s.avg_response_hours} hrs</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span className="font-medium text-gray-700">{firstTimeFixPct}%</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span className="font-bold text-blue-700">{s.fund_utilisation_pct}%</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                        s.final_score >= 85 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        s.final_score >= 75 ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        s.final_score >= 65 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {s.final_score} / 100
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Explainer Card for Engineering Students and Citizens */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-600" />
          The SetuSeva Accountability Algorithm
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          To remove political bias and ensure objective municipal evaluation, SetuSeva calculates the composite score using a single, deterministic mathematical formula implemented in <code>backend/cirm/score_calculator.py</code>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="font-bold text-slate-900 text-sm">40% Resolution Rate</div>
            <p className="text-slate-500 text-[11px] mt-1">
              Percentage of registered grievances successfully resolved and verified by citizens.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="font-bold text-slate-900 text-sm">25% Speed Score</div>
            <p className="text-slate-500 text-[11px] mt-1">
              SLA responsiveness: faster resolution relative to the 72-hour benchmark yields higher points.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="font-bold text-slate-900 text-sm">15% First-Time Fix</div>
            <p className="text-slate-500 text-[11px] mt-1">
              Calculated as <code>(1 - reopened_ratio)</code>. Tickets reopened by citizens via "Not Fixed" penalize poor workmanship.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="font-bold text-slate-900 text-sm">20% Fund Utilisation</div>
            <p className="text-slate-500 text-[11px] mt-1">
              Budget expenditure efficiency ingested from MBMC financial data (CityFinance.in stand-in CSV).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
