export interface CreditEntry {
  id: string;
  user_id: string;
  credit_type_id: string;
  credit_type_name?: string;
  amount: number;
  course_name: string;
  earned_date: string;
  source: 'manual' | 'course' | 'external';
  notes?: string;
  created_at?: string;
}
