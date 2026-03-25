export interface AppUser {
  user_id: string;
  role: string;
  name?: string;
  job_title?: string;
  department?: string;
  tags?: string[];
  email?: string;
  is_active?: boolean;
}
