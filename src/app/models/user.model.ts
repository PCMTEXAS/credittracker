export interface AppUser {
  user_id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'reporter';
  job_title?: string;
  department?: string;
  tags?: string[];
  is_active: boolean;
}

export interface AuthState {
  user: AppUser | null;
  isLoggedIn: boolean;
}
