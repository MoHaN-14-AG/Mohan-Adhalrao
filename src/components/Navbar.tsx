import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Building2,
  UserCheck,
  ShieldCheck,
  BarChart3,
  FileText,
  PlusCircle,
  Globe,
  LogOut,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, citizen, department, logout, switchDemoUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-50">
      {/* Top Civic Strip */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800 text-slate-400 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-400 uppercase tracking-wider">MBMC CiRM</span>
          <span>•</span>
          <span>Mira-Bhayandar Municipal Corporation</span>
          <span>•</span>
          <span className="text-slate-400">Government of Maharashtra</span>
        </div>

        {/* Quick Demo Switcher Strip for Student Evaluations */}
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <span className="text-slate-400 hidden md:inline">Demo Persona:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => switchDemoUser('citizen_rahul')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                user?.username === 'citizen_rahul'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Rahul Sharma (Ward 1, Hindi)"
            >
              Rahul (Citizen)
            </button>
            <button
              onClick={() => switchDemoUser('officer_water')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                user?.username === 'officer_water'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Sanjay Kadam (Water Dept Officer)"
            >
              Officer (Water)
            </button>
            <button
              onClick={() => switchDemoUser('officer_sanitation')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                user?.username === 'officer_sanitation'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Meena Sawant (Sanitation Dept Officer)"
            >
              Officer (Sanitation)
            </button>
            <button
              onClick={() => switchDemoUser('admin')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                user?.username === 'admin'
                  ? 'bg-purple-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Municipal Commissioner (Admin)"
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md text-slate-950">
              <Building2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition">
                  {t('app_title')}
                </span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-mono uppercase">
                  CiRM
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t('app_subtitle')}
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {role === 'citizen' && (
              <>
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    isActive('/') ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {t('my_record')}
                </Link>
                <Link
                  to="/new-complaint"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition ${
                    isActive('/new-complaint') ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  {t('new_complaint')}
                </Link>
                <Link
                  to="/new-service"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    isActive('/new-service') ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {t('new_service')}
                </Link>
              </>
            )}

            {(role === 'officer' || role === 'admin') && (
              <Link
                to="/officer"
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                  isActive('/officer') ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {t('nav_officer')}
              </Link>
            )}

            {role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                  isActive('/admin') ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                {t('nav_admin')}
              </Link>
            )}

            {/* Public Ward Scorecard is open to everyone */}
            <Link
              to="/scorecard"
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                isActive('/scorecard') ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">{t('nav_scorecard')}</span>
              <span className="sm:hidden">Scorecard</span>
            </Link>

            {/* Language Selector */}
            <div className="flex items-center ml-2 border-l border-slate-700 pl-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
                title="Select UI Language"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>

            {/* User Profile / Status */}
            {user ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-semibold text-white">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    {role === 'citizen' && citizen ? citizen.ward_name : (department || role?.toUpperCase())}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                  title={t('nav_logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-2 px-3 py-1.5 bg-amber-500 text-slate-950 font-medium rounded-md text-sm hover:bg-amber-400 transition"
              >
                {t('nav_login')}
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
