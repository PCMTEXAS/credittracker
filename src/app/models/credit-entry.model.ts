export interface CreditEntry {
  id?: string;
  user_id: string;
  credit_type_id: string;
  amount: number;
  course_name: string;
  earned_date: string;
  source: 'manual' | 'course' | 'external';
  notes?: string;
  created_at?: string;
  credit_type?: { name: string; color?: string };
}
