/**
 * SetuSeva Full-Stack Express Server with Vite Middleware.
 * Provides the REST API identical to Django REST Framework (cirm app)
 * and serves the React frontend seamlessly on port 3000.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(express.json());

// In-Memory store mirroring Django SQLite database tables
interface Ward {
  id: number;
  name: string;
  population: number;
}

interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'citizen' | 'officer' | 'admin';
  department_name?: string;
  phone?: string;
  ward_id?: number;
  preferred_language?: string;
}

interface Complaint {
  id: number;
  citizen_id: number;
  citizen_name: string;
  citizen_phone: string;
  ward_id: number;
  ward_name: string;
  department_id: number;
  department_name: string;
  category: string;
  description: string;
  location_text: string;
  status: 'submitted' | 'routed' | 'in_progress' | 'resolved' | 'citizen_confirmed';
  created_at: string;
  sla_due_at: string;
  resolved_at: string | null;
  is_duplicate: boolean;
  reopen_count: number;
}

interface ServiceRequest {
  id: number;
  citizen_id: number;
  citizen_name: string;
  type: 'certificate' | 'permit' | 'tax';
  title: string;
  details: string;
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

interface Feedback {
  id: number;
  complaint_id: number;
  citizen_id: number;
  citizen_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface WardScore {
  id: number;
  ward_id: number;
  ward_name: string;
  population: number;
  month: string;
  resolution_rate: number;
  avg_response_hours: number;
  reopened_ratio: number;
  fund_utilisation_pct: number;
  final_score: number;
  calculated_at: string;
}

// Initial Data Setup
let wards: Ward[] = [
  { id: 1, name: 'Ward 1 - Mira Road East', population: 185000 },
  { id: 2, name: 'Ward 2 - Mira Road West', population: 160000 },
  { id: 3, name: 'Ward 3 - Bhayandar East', population: 210000 },
  { id: 4, name: 'Ward 4 - Bhayandar West', population: 195000 },
  { id: 5, name: 'Ward 5 - Uttan & Coastal', population: 95000 },
  { id: 6, name: 'Ward 6 - Kashimira & Highway', population: 145000 },
];

let departments: Department[] = [
  { id: 1, name: 'Water' },
  { id: 2, name: 'Sanitation' },
  { id: 3, name: 'Roads' },
  { id: 4, name: 'Electricity' },
  { id: 5, name: 'Property Tax' },
];

let users: User[] = [
  { id: 1, username: 'admin', email: 'commissioner@mbmc.gov.in', first_name: 'Municipal', last_name: 'Commissioner', role: 'admin' },
  { id: 2, username: 'officer_water', email: 'water.officer@mbmc.gov.in', first_name: 'Sanjay', last_name: 'Kadam', role: 'officer', department_name: 'Water' },
  { id: 3, username: 'officer_sanitation', email: 'sanitation.officer@mbmc.gov.in', first_name: 'Meena', last_name: 'Sawant', role: 'officer', department_name: 'Sanitation' },
  { id: 101, username: 'citizen_rahul', email: 'rahul.sharma@example.com', first_name: 'Rahul', last_name: 'Sharma', role: 'citizen', phone: '9820011221', ward_id: 1, preferred_language: 'hi' },
  { id: 102, username: 'citizen_priya', email: 'priya.patil@example.com', first_name: 'Priya', last_name: 'Patil', role: 'citizen', phone: '9820011222', ward_id: 2, preferred_language: 'mr' },
  { id: 103, username: 'citizen_amit', email: 'amit.verma@example.com', first_name: 'Amit', last_name: 'Verma', role: 'citizen', phone: '9820011223', ward_id: 3, preferred_language: 'en' },
  { id: 104, username: 'citizen_sneha', email: 'sneha.deshmukh@example.com', first_name: 'Sneha', last_name: 'Deshmukh', role: 'citizen', phone: '9820011224', ward_id: 4, preferred_language: 'mr' },
  { id: 105, username: 'citizen_vikram', email: 'vikram.yadav@example.com', first_name: 'Vikram', last_name: 'Yadav', role: 'citizen', phone: '9820011225', ward_id: 5, preferred_language: 'hi' },
  { id: 106, username: 'citizen_ananya', email: 'ananya.nair@example.com', first_name: 'Ananya', last_name: 'Nair', role: 'citizen', phone: '9820011226', ward_id: 6, preferred_language: 'en' },
  { id: 107, username: 'citizen_rohit', email: 'rohit.jadhav@example.com', first_name: 'Rohit', last_name: 'Jadhav', role: 'citizen', phone: '9820011227', ward_id: 1, preferred_language: 'mr' },
  { id: 108, username: 'citizen_pooja', email: 'pooja.gupta@example.com', first_name: 'Pooja', last_name: 'Gupta', role: 'citizen', phone: '9820011228', ward_id: 2, preferred_language: 'hi' },
  { id: 109, username: 'citizen_suresh', email: 'suresh.chavan@example.com', first_name: 'Suresh', last_name: 'Chavan', role: 'citizen', phone: '9820011229', ward_id: 3, preferred_language: 'mr' },
  { id: 110, username: 'citizen_kavita', email: 'kavita.shah@example.com', first_name: 'Kavita', last_name: 'Shah', role: 'citizen', phone: '9820011230', ward_id: 4, preferred_language: 'en' },
];

let complaints: Complaint[] = [];
let serviceRequests: ServiceRequest[] = [];
let feedbacks: Feedback[] = [];
let wardScores: WardScore[] = [];

// Fund Utilisation from CityFinance stand-in
const wardFundsMap: Record<number, number> = {
  1: 84.0,
  2: 90.0,
  3: 75.0,
  4: 86.0,
  5: 68.0,
  6: 81.0,
};

// Keyword routing rules identical to Django backend
const KEYWORD_RULES: Record<string, string[]> = {
  Water: ['water', 'leak', 'pipeline', 'tap', 'supply', 'meter', 'contamination', 'tanker', 'jal'],
  Sanitation: ['garbage', 'drain', 'sewage', 'trash', 'waste', 'cleaning', 'dump', 'gutter', 'kachra'],
  Roads: ['road', 'pothole', 'asphalt', 'footpath', 'divider', 'pavement', 'street', 'crater', 'rasta'],
  Electricity: ['light', 'pole', 'power', 'shock', 'electricity', 'transformer', 'spark', 'blackout', 'wire', 'bijli'],
  'Property Tax': ['tax', 'assessment', 'property', 'bill', 'receipt', 'challan', 'valuation'],
};

function routeDepartment(text: string): string {
  const lower = text.toLowerCase();
  for (const [dept, keywords] of Object.entries(KEYWORD_RULES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return dept;
      }
    }
  }
  return 'Sanitation'; // Default fallback
}

// Calculate ward score function identical to Django score_calculator.py
function calculateWardScoreFormula(
  resolutionRate: number,
  avgResponseHours: number,
  reopenedRatio: number,
  fundUtilisation: number
): number {
  const resComp = Math.max(0, Math.min(100, resolutionRate));
  const speedComp = avgResponseHours <= 0 ? 100 : Math.max(0, Math.min(100, 100 - (avgResponseHours / 144) * 100));
  const firstTimeFixComp = Math.max(0, Math.min(100, 100 - reopenedRatio));
  const fundComp = Math.max(0, Math.min(100, fundUtilisation));

  const finalScore = 0.40 * resComp + 0.25 * speedComp + 0.15 * firstTimeFixComp + 0.20 * fundComp;
  return Math.round(finalScore * 10) / 10;
}

// Recalculate Ward Scores
function recomputeAllWardScores() {
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  wardScores = wards.map((ward) => {
    const wardComplaints = complaints.filter(c => c.ward_id === ward.id);
    const total = wardComplaints.length;

    let resRate = 100;
    let avgHours = 28;
    let reopenedRatio = 0;

    if (total > 0) {
      const resolved = wardComplaints.filter(c => c.status === 'resolved' || c.status === 'citizen_confirmed');
      resRate = (resolved.length / total) * 100;

      const resolvedDurations = resolved
        .filter(c => c.resolved_at)
        .map(c => (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / (1000 * 3600));
      
      avgHours = resolvedDurations.length > 0 
        ? resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length 
        : 36;

      const reopenedCount = wardComplaints.filter(c => c.reopen_count > 0).length;
      reopenedRatio = resolved.length > 0 ? (reopenedCount / resolved.length) * 100 : 0;
    }

    const fundUtil = wardFundsMap[ward.id] || 80.0;
    const finalScore = calculateWardScoreFormula(resRate, avgHours, reopenedRatio, fundUtil);

    return {
      id: ward.id,
      ward_id: ward.id,
      ward_name: ward.name,
      population: ward.population,
      month: monthName,
      resolution_rate: Math.round(resRate * 10) / 10,
      avg_response_hours: Math.round(avgHours * 10) / 10,
      reopened_ratio: Math.round(reopenedRatio * 10) / 10,
      fund_utilisation_pct: fundUtil,
      final_score: finalScore,
      calculated_at: new Date().toISOString(),
    };
  }).sort((a, b) => b.final_score - a.final_score);
}

// Seed Initial Dataset
function seedDatabase() {
  complaints = [];
  serviceRequests = [];
  feedbacks = [];

  const now = Date.now();
  const sampleComplaints = [
    { cat: 'Water Leakage', desc: 'Main pipeline burst near Shanti Park signal, clean water leaking continuously.', loc: 'Shanti Park, Station Road' },
    { cat: 'Garbage Dump', desc: 'Heavy garbage accumulation near vegetable market, foul smell and overflowing bins.', loc: 'Near APMC Market, Bhayandar West' },
    { cat: 'Road Pothole', desc: 'Dangerous pothole cluster on Western Express highway junction causing bike accidents.', loc: 'Kashimira Flyover Service Road' },
    { cat: 'Street Light Failure', desc: 'Street light pole #24 dark for 4 days, pitch dark alley near school.', loc: 'Sheetal Nagar, Near St. Xavier\'s' },
    { cat: 'Sewage Overflow', desc: 'Open drain choked with plastic waste, black drainage spilling onto footpath.', loc: 'Silver Park, Kanakia Road' },
    { cat: 'Low Water Pressure', desc: 'Low water pressure in municipal supply line during morning 6 AM hours.', loc: 'Geeta Nagar, Phase 3' },
    { cat: 'Broken Footpath', desc: 'Broken concrete slabs on pavement with exposed iron rebars.', loc: 'Maxus Mall Junction' },
    { cat: 'Property Tax Assessment Query', desc: 'Property tax assessment invoice shows duplicate penalty despite prior payment receipt.', loc: 'Bhayandar East Ward Office area' },
    { cat: 'Street Light Sparking', desc: 'Overhead electrical wire sparking against tree branch in strong wind.', loc: 'Uttan Beach Road near church' },
    { cat: 'Contaminated Water', desc: 'Muddy tap water with foul smell received today morning.', loc: 'Navghar Road, Cabin Crossroad' },
  ];

  const statuses: Array<'submitted' | 'routed' | 'in_progress' | 'resolved' | 'citizen_confirmed'> = [
    'submitted', 'routed', 'in_progress', 'resolved', 'citizen_confirmed'
  ];

  const citizens = users.filter(u => u.role === 'citizen');

  // Create ~60 Complaints
  for (let i = 1; i <= 60; i++) {
    const template = sampleComplaints[i % sampleComplaints.length];
    const citizen = citizens[i % citizens.length];
    const ward = wards.find(w => w.id === citizen.ward_id) || wards[0];
    const deptName = routeDepartment(`${template.cat} ${template.desc}`);
    const dept = departments.find(d => d.name === deptName) || departments[0];

    const daysAgo = (i * 0.22) % 13;
    const createdTime = new Date(now - daysAgo * 24 * 3600 * 1000);
    const slaDue = new Date(createdTime.getTime() + 72 * 3600 * 1000);

    const status = statuses[i % statuses.length];
    let resolvedAt: string | null = null;
    if (status === 'resolved' || status === 'citizen_confirmed') {
      const resolveHours = 14 + (i % 60);
      const resTime = new Date(createdTime.getTime() + resolveHours * 3600 * 1000);
      resolvedAt = resTime.toISOString();
    }

    const isDuplicate = (i % 7 === 0);
    const reopenCount = (status !== 'submitted' && i % 8 === 0) ? (i % 2 + 1) : 0;

    complaints.push({
      id: i,
      citizen_id: citizen.id,
      citizen_name: `${citizen.first_name} ${citizen.last_name}`,
      citizen_phone: citizen.phone || '9820000000',
      ward_id: ward.id,
      ward_name: ward.name,
      department_id: dept.id,
      department_name: dept.name,
      category: template.cat,
      description: template.desc,
      location_text: template.loc,
      status: status,
      created_at: createdTime.toISOString(),
      sla_due_at: slaDue.toISOString(),
      resolved_at: resolvedAt,
      is_duplicate: isDuplicate,
      reopen_count: reopenCount,
    });
  }

  // Seed Feedback for confirmed complaints
  const confirmed = complaints.filter(c => c.status === 'citizen_confirmed');
  const sampleComments = [
    { rating: 5, comment: 'Very fast resolution! Water supply was restored in 14 hours. Thank you MBMC.' },
    { rating: 4, comment: 'Sanitation truck cleared the heap completely. Good work by ward supervisor.' },
    { rating: 5, comment: 'Pothole filled with cold mix bitumen promptly. Safe to drive now.' },
    { rating: 3, comment: 'Fixed but took 3 days. Workmanship could be improved.' },
    { rating: 4, comment: 'Streetlight is functional again. Grateful for quick inspection.' },
    { rating: 2, comment: 'Water pressure improved slightly but still intermittent.' },
  ];

  confirmed.forEach((c, idx) => {
    const feedbackTpl = sampleComments[idx % sampleComments.length];
    feedbacks.push({
      id: idx + 1,
      complaint_id: c.id,
      citizen_id: c.citizen_id,
      citizen_name: c.citizen_name,
      rating: feedbackTpl.rating,
      comment: feedbackTpl.comment,
      created_at: c.resolved_at || new Date().toISOString(),
    });
  });

  // Seed Service Requests (~22)
  const srTemplates = [
    { type: 'certificate' as const, title: 'Birth Certificate Copy Request', details: 'Application for duplicate birth certificate issued in 2018.' },
    { type: 'certificate' as const, title: 'Zone Verification Certificate', details: 'Residential zoning status verification for property sale.' },
    { type: 'permit' as const, title: 'Trade License Renewal', details: 'Annual renewal application for grocery shop in Sector 4.' },
    { type: 'permit' as const, title: 'Tree Trimming Safety Permit', details: 'Permission to trim overgrown banyan branch leaning on residential balcony.' },
    { type: 'tax' as const, title: 'Property Tax Self Assessment', details: 'Re-assessment of newly constructed additional room.' },
    { type: 'tax' as const, title: 'Water Meter Commercial Conversion', details: 'Application to install metered industrial water line.' }
  ];

  for (let i = 1; i <= 22; i++) {
    const tpl = srTemplates[i % srTemplates.length];
    const citizen = citizens[i % citizens.length];
    const daysAgo = (i * 0.45) % 9;
    const createdTime = new Date(now - daysAgo * 24 * 3600 * 1000);

    let srStatus: 'draft' | 'submitted' | 'processing' | 'completed' | 'abandoned' = 'submitted';
    // Silent friction SOP: draft older than 3 days -> abandoned
    if (i % 4 === 0 && daysAgo > 3) {
      srStatus = 'abandoned';
    } else if (i % 5 === 0) {
      srStatus = 'draft';
    } else if (i % 3 === 0) {
      srStatus = 'processing';
    } else if (i % 2 === 0) {
      srStatus = 'completed';
    }

    serviceRequests.push({
      id: i,
      citizen_id: citizen.id,
      citizen_name: `${citizen.first_name} ${citizen.last_name}`,
      type: tpl.type,
      title: `${tpl.title} #${i + 100}`,
      details: tpl.details,
      status: srStatus,
      created_at: createdTime.toISOString(),
      updated_at: new Date(createdTime.getTime() + 12 * 3600 * 1000).toISOString(),
    });
  }

  // Calculate scores
  recomputeAllWardScores();
}

// Initial seed
seedDatabase();

// ==============================================================================
// REST API ROUTES
// ==============================================================================

// Helper for extracting current user (supports demo mock or token)
function getRequestUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  const usernameHeader = req.headers['x-demo-user'] as string;

  if (usernameHeader) {
    const found = users.find(u => u.username === usernameHeader);
    if (found) return found;
  }

  if (authHeader && authHeader.startsWith('Token ')) {
    const tokenVal = authHeader.replace('Token ', '').trim();
    // Default token parsing: username token e.g. "token-citizen_rahul"
    const username = tokenVal.replace('token-', '');
    return users.find(u => u.username === username) || users[0];
  }

  return null;
}

// Wards & Departments
app.get('/api/wards', (req: Request, res: Response) => {
  res.json(wards);
});

app.get('/api/departments', (req: Request, res: Response) => {
  res.json(departments);
});

// Auth
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const ward = wards.find(w => w.id === user.ward_id);

  res.json({
    token: `token-${user.username}`,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile: {
        role: user.role,
        department: user.department_name ? { name: user.department_name } : null,
      }
    },
    role: user.role,
    department: user.department_name || null,
    citizen: user.role === 'citizen' ? {
      id: user.id,
      phone: user.phone || '9820011221',
      ward: user.ward_id,
      ward_name: ward?.name || 'Ward 1 - Mira Road East',
      preferred_language: user.preferred_language || 'en',
    } : null,
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password, first_name, last_name, email, phone, ward, preferred_language } = req.body;

  if (!username || !phone || !ward) {
    return res.status(400).json({ error: 'Username, phone, and ward are required.' });
  }

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already taken.' });
  }

  const wardObj = wards.find(w => w.id === Number(ward)) || wards[0];
  const newUser: User = {
    id: users.length + 100,
    username,
    email: email || `${username}@example.com`,
    first_name: first_name || username,
    last_name: last_name || '',
    role: 'citizen',
    phone,
    ward_id: wardObj.id,
    preferred_language: preferred_language || 'en',
  };

  users.push(newUser);

  res.status(201).json({
    token: `token-${newUser.username}`,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      profile: { role: 'citizen' }
    },
    role: 'citizen',
    citizen: {
      id: newUser.id,
      phone: newUser.phone,
      ward: wardObj.id,
      ward_name: wardObj.name,
      preferred_language: newUser.preferred_language,
    }
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const ward = wards.find(w => w.id === user.ward_id);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile: {
        role: user.role,
        department: user.department_name ? { name: user.department_name } : null,
      }
    },
    role: user.role,
    department: user.department_name || null,
    citizen: user.role === 'citizen' ? {
      id: user.id,
      phone: user.phone || '9820011221',
      ward: user.ward_id,
      ward_name: ward?.name || 'Ward 1 - Mira Road East',
      preferred_language: user.preferred_language || 'en',
    } : null,
  });
});

// Complaints API
app.get('/api/complaints', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  let list = [...complaints];

  if (user) {
    if (user.role === 'citizen') {
      list = list.filter(c => c.citizen_id === user.id);
    } else if (user.role === 'officer' && user.department_name) {
      list = list.filter(c => c.department_name.toLowerCase() === user.department_name!.toLowerCase());
    }
    // Admin sees all
  }

  // Filters
  const { status, ward, department } = req.query;
  if (status) {
    list = list.filter(c => c.status === status);
  }
  if (ward) {
    list = list.filter(c => c.ward_id === Number(ward));
  }
  if (department) {
    list = list.filter(c => c.department_id === Number(department) || c.department_name === department);
  }

  // Attach feedback
  const result = list.map(c => {
    const fb = feedbacks.find(f => f.complaint_id === c.id);
    const isBreached = (c.status !== 'resolved' && c.status !== 'citizen_confirmed') && (new Date() > new Date(c.sla_due_at));
    return {
      ...c,
      is_sla_breached: isBreached,
      feedback: fb || null,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json(result);
});

// Complaint Intake with Keyword Routing + Duplicate Check + SLA
app.post('/api/complaints', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user || user.role !== 'citizen') {
    return res.status(403).json({ error: 'Only registered citizens can lodge complaints.' });
  }

  const { category, description, location_text, ward } = req.body;
  if (!category || !description || !location_text) {
    return res.status(400).json({ error: 'Category, description, and location are required.' });
  }

  const wardObj = wards.find(w => w.id === Number(ward || user.ward_id)) || wards[0];

  // 1. Keyword Routing
  const deptName = routeDepartment(`${category} ${description}`);
  const deptObj = departments.find(d => d.name === deptName) || departments[0];

  // 2. Duplicate Detection (same category + same ward in last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const isDuplicate = complaints.some(c => 
    c.ward_id === wardObj.id &&
    c.category.toLowerCase().trim() === category.toLowerCase().trim() &&
    new Date(c.created_at).getTime() >= sevenDaysAgo
  );

  // 3. Automatic 72-hour SLA
  const now = new Date();
  const slaDue = new Date(now.getTime() + 72 * 3600 * 1000);

  const newComplaint: Complaint = {
    id: complaints.length + 1,
    citizen_id: user.id,
    citizen_name: `${user.first_name} ${user.last_name}`,
    citizen_phone: user.phone || '9820011221',
    ward_id: wardObj.id,
    ward_name: wardObj.name,
    department_id: deptObj.id,
    department_name: deptObj.name,
    category,
    description,
    location_text,
    status: 'submitted',
    created_at: now.toISOString(),
    sla_due_at: slaDue.toISOString(),
    resolved_at: null,
    is_duplicate: isDuplicate,
    reopen_count: 0,
  };

  complaints.unshift(newComplaint);
  recomputeAllWardScores();

  res.status(201).json({
    ...newComplaint,
    is_sla_breached: false,
    feedback: null,
  });
});

// Update Complaint Status (Lifecycle state machine)
app.patch('/api/complaints/:id/update-status', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const { status: newStatus } = req.body;
  const user = getRequestUser(req);

  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    submitted: ['routed', 'in_progress'],
    routed: ['in_progress'],
    in_progress: ['resolved'],
    resolved: ['citizen_confirmed', 'in_progress'],
    citizen_confirmed: [],
  };

  if (!ALLOWED_TRANSITIONS[complaint.status]?.includes(newStatus)) {
    return res.status(400).json({
      error: `Invalid status transition from '${complaint.status}' to '${newStatus}'.`,
    });
  }

  // Citizen-verified closure: only citizen can confirm
  if (newStatus === 'citizen_confirmed') {
    if (user && user.role === 'citizen' && user.id !== complaint.citizen_id) {
      return res.status(403).json({ error: 'Only the citizen who lodged this ticket can confirm resolution.' });
    }
  }

  complaint.status = newStatus;
  if (newStatus === 'resolved' || newStatus === 'citizen_confirmed') {
    if (!complaint.resolved_at) {
      complaint.resolved_at = new Date().toISOString();
    }
  }

  recomputeAllWardScores();
  res.json(complaint);
});

// Reopen Complaint ("Not Fixed" button by Citizen)
app.post('/api/complaints/:id/reopen', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  if (complaint.status !== 'resolved') {
    return res.status(400).json({ error: 'Only resolved complaints awaiting confirmation can be reopened.' });
  }

  complaint.status = 'in_progress';
  complaint.reopen_count += 1;
  complaint.resolved_at = null;

  recomputeAllWardScores();

  res.json({
    message: 'Complaint reopened and returned to In Progress.',
    complaint,
  });
});

// Service Requests
app.get('/api/service-requests', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  let list = [...serviceRequests];

  if (user && user.role === 'citizen') {
    list = list.filter(sr => sr.citizen_id === user.id);
  }

  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(list);
});

app.post('/api/service-requests', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user || user.role !== 'citizen') {
    return res.status(403).json({ error: 'Only citizens can initiate service requests.' });
  }

  const { type, title, details, status: reqStatus } = req.body;
  if (!type || !title) {
    return res.status(400).json({ error: 'Type and title are required.' });
  }

  const now = new Date().toISOString();
  const newReq: ServiceRequest = {
    id: serviceRequests.length + 1,
    citizen_id: user.id,
    citizen_name: `${user.first_name} ${user.last_name}`,
    type,
    title,
    details: details || '',
    status: reqStatus || 'submitted',
    created_at: now,
    updated_at: now,
  };

  serviceRequests.unshift(newReq);
  res.status(201).json(newReq);
});

app.patch('/api/service-requests/:id/update-status', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const sr = serviceRequests.find(s => s.id === id);
  if (!sr) {
    return res.status(404).json({ error: 'Service request not found.' });
  }

  const { status: newStatus } = req.body;
  sr.status = newStatus;
  sr.updated_at = new Date().toISOString();
  res.json(sr);
});

// Silent friction check command endpoint
app.post('/api/service-requests/mark-abandoned', (req: Request, res: Response) => {
  const cutoff = Date.now() - 3 * 24 * 3600 * 1000;
  let markedCount = 0;

  serviceRequests.forEach(sr => {
    if (sr.status === 'draft' && new Date(sr.created_at).getTime() <= cutoff) {
      sr.status = 'abandoned';
      sr.updated_at = new Date().toISOString();
      markedCount++;
    }
  });

  res.json({ marked_abandoned: markedCount });
});

// Feedback
app.get('/api/feedback', (req: Request, res: Response) => {
  res.json(feedbacks);
});

app.post('/api/feedback', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const { complaint: complaintId, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  const complaint = complaints.find(c => c.id === Number(complaintId));
  if (!complaint) {
    return res.status(404).json({ error: 'Associated complaint not found.' });
  }

  if (complaint.status !== 'citizen_confirmed' && complaint.status !== 'resolved') {
    return res.status(400).json({ error: 'Feedback can only be provided after verified complaint resolution.' });
  }

  const existing = feedbacks.find(f => f.complaint_id === complaint.id);
  if (existing) {
    existing.rating = rating;
    existing.comment = comment || '';
    return res.json(existing);
  }

  const newFeedback: Feedback = {
    id: feedbacks.length + 1,
    complaint_id: complaint.id,
    citizen_id: user ? user.id : complaint.citizen_id,
    citizen_name: user ? `${user.first_name} ${user.last_name}` : complaint.citizen_name,
    rating,
    comment: comment || '',
    created_at: new Date().toISOString(),
  };

  feedbacks.push(newFeedback);
  res.status(201).json(newFeedback);
});

// Public Ward Scores
app.get('/api/ward-scores', (req: Request, res: Response) => {
  res.json(wardScores);
});

app.post('/api/ward-scores/compute', (req: Request, res: Response) => {
  recomputeAllWardScores();
  res.json({ message: 'Ward scores recomputed successfully.', scores: wardScores });
});

// Admin KPIs
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const now = new Date();
  const totalComplaints = complaints.length;
  const activeComplaints = complaints.filter(c => c.status !== 'resolved' && c.status !== 'citizen_confirmed').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved' || c.status === 'citizen_confirmed').length;

  const slaBreaches = complaints.filter(c => 
    (c.status !== 'resolved' && c.status !== 'citizen_confirmed') && (now > new Date(c.sla_due_at))
  ).length;

  const resolvedWithTime = complaints.filter(c => c.resolved_at);
  let avgResolutionHours = 0;
  if (resolvedWithTime.length > 0) {
    const totalHours = resolvedWithTime.reduce((sum, c) => {
      return sum + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / (1000 * 3600);
    }, 0);
    avgResolutionHours = Math.round((totalHours / resolvedWithTime.length) * 10) / 10;
  }

  // Category counts
  const categoryMap: Record<string, number> = {};
  complaints.forEach(c => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const categoryCounts = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Department counts
  const deptMap: Record<string, number> = {};
  complaints.forEach(c => {
    deptMap[c.department_name] = (deptMap[c.department_name] || 0) + 1;
  });
  const departmentCounts = Object.entries(deptMap)
    .map(([dept, count]) => ({ department__name: dept, count }))
    .sort((a, b) => b.count - a.count);

  const abandonedRequestsCount = serviceRequests.filter(s => s.status === 'abandoned').length;
  const totalServiceRequests = serviceRequests.length;

  res.json({
    total_complaints: totalComplaints,
    active_complaints: activeComplaints,
    resolved_complaints: resolvedComplaints,
    sla_breaches: slaBreaches,
    avg_resolution_hours: avgResolutionHours,
    abandoned_requests_count: abandonedRequestsCount,
    total_service_requests: totalServiceRequests,
    category_counts: categoryCounts,
    department_counts: departmentCounts,
  });
});

// Reset seed data endpoint for demo convenience
app.post('/api/seed-reset', (req: Request, res: Response) => {
  seedDatabase();
  res.json({ message: 'Demo database reset to initial fresh seed state.' });
});

// Vite Middleware for Frontend Serving
async function startServer() {
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, () => {
    console.log(`[SetuSeva] Server running on http://0.0.0.0:${port}`);
    console.log(`[SetuSeva] Django REST-compatible API active on /api/*`);
  });
}

startServer();
