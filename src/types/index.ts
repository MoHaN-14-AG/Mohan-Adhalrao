export interface Ward {
  id: number;
  name: string;
  population: number;
}

export interface Department {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: {
    role: 'citizen' | 'officer' | 'admin';
    department?: {
      name: string;
    } | null;
  };
}

export interface Citizen {
  id: number;
  phone: string;
  ward: number;
  ward_name: string;
  preferred_language: 'en' | 'hi' | 'mr';
  created_at?: string;
}

export interface Feedback {
  id: number;
  complaint: number;
  complaint_id?: number;
  citizen: number;
  citizen_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  citizen?: number;
  citizen_id?: number;
  citizen_name: string;
  citizen_phone: string;
  ward: number;
  ward_id?: number;
  ward_name: string;
  department: number;
  department_id?: number;
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
  is_sla_breached: boolean;
  feedback?: Feedback | null;
}

export interface ServiceRequest {
  id: number;
  citizen?: number;
  citizen_id?: number;
  citizen_name: string;
  type: 'certificate' | 'permit' | 'tax';
  title: string;
  details: string;
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface WardScore {
  id: number;
  ward: number;
  ward_id?: number;
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

export interface AdminStats {
  total_complaints: number;
  active_complaints: number;
  resolved_complaints: number;
  sla_breaches: number;
  avg_resolution_hours: number;
  abandoned_requests_count: number;
  total_service_requests: number;
  category_counts: { category: string; count: number }[];
  department_counts: { department__name: string; count: number }[];
}
