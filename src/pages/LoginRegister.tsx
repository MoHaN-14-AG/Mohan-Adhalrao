import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Ward } from '../types';
import { apiRequest } from '../api/client';
import {
  Building2,
  User,
  ShieldCheck,
  Lock,
  Phone,
  Mail,
  ArrowRight,
  Globe,
  Sparkles,
  Info
} from 'lucide-react';

export const LoginRegister: React.FC = () => {
  const { login, register, switchDemoUser, role } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('citizen123');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedWard, setSelectedWard] = useState<number>(1);
  const [prefLang, setPrefLang] = useState<'en' | 'hi' | 'mr'>('en');

  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<Ward[]>('/wards')
      .then(setWards)
      .catch(console.error);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await register({
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        ward: selectedWard,
        preferred_language: prefLang,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoUsername: string) => {
    setError(null);
    try {
      setLoading(true);
      await switchDemoUser(demoUsername);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md text-slate-950 mb-3">
            <Building2 className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            SetuSeva CiRM Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Mira-Bhayandar Municipal Corporation (MBMC)
          </p>
        </div>

        {/* Demo Fast-Login Strip for Project Evaluators */}
        <div className="bg-slate-900 text-white rounded-xl p-5 mb-6 shadow-md border border-slate-800">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            Quick Demo Login (1-Click for Students & Evaluators)
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Click any profile below to immediately test role-based access:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('citizen_rahul')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition"
            >
              <div className="font-bold text-amber-400">Rahul Sharma (Citizen)</div>
              <div className="text-[11px] text-slate-400">Ward 1 • Hindi • 9820011221</div>
            </button>

            <button
              onClick={() => handleQuickDemo('citizen_priya')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition"
            >
              <div className="font-bold text-amber-400">Priya Patil (Citizen)</div>
              <div className="text-[11px] text-slate-400">Ward 2 • Marathi • 9820011222</div>
            </button>

            <button
              onClick={() => handleQuickDemo('officer_water')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition"
            >
              <div className="font-bold text-sky-400">Sanjay Kadam (Officer)</div>
              <div className="text-[11px] text-slate-400">Water Department</div>
            </button>

            <button
              onClick={() => handleQuickDemo('officer_sanitation')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition"
            >
              <div className="font-bold text-emerald-400">Meena Sawant (Officer)</div>
              <div className="text-[11px] text-slate-400">Sanitation Department</div>
            </button>

            <button
              onClick={() => handleQuickDemo('admin')}
              className="sm:col-span-2 p-2.5 rounded-lg bg-purple-950/70 hover:bg-purple-900/80 text-left border border-purple-700/50 transition"
            >
              <div className="font-bold text-purple-300">Municipal Commissioner (Admin)</div>
              <div className="text-[11px] text-slate-300">Full visibility: all complaints, SLAs, CityFinance ward scores</div>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          {/* Tab selector */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`pb-3 text-sm font-bold flex-1 text-center border-b-2 transition ${
                !isRegister
                  ? 'border-amber-500 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Standard Login
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`pb-3 text-sm font-bold flex-1 text-center border-b-2 transition ${
                isRegister
                  ? 'border-amber-500 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Register New Citizen
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4">
              {error}
            </div>
          )}

          {!isRegister ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. citizen_rahul, officer_water, admin"
                    className="w-full text-sm rounded-lg border border-gray-300 pl-9 p-2.5 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm rounded-lg border border-gray-300 pl-9 p-2.5 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-xs text-sm mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to SetuSeva'}
              </button>
            </form>
          ) : (
            /* Register Form (ANCHOR Citizen record creation) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Rahul"
                    className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Sharma"
                    className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="rahul_mbmc"
                  className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number (Citizen Anchor)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9820011221"
                    className="w-full text-sm rounded-lg border border-gray-300 pl-9 p-2 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  MBMC Ward
                </label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-gray-300 p-2 bg-white focus:border-amber-500 focus:outline-none"
                  required
                >
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Preferred Language
                </label>
                <select
                  value={prefLang}
                  onChange={(e) => setPrefLang(e.target.value as any)}
                  className="w-full text-sm rounded-lg border border-gray-300 p-2 bg-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-xs text-sm mt-3"
              >
                {loading ? 'Creating Citizen Profile...' : 'Complete Citizen Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
