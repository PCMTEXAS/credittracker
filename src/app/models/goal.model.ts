export interface UserGoal {
  id: string;
  user_id: string;
  credit_type_id: string;
  credit_type_name?: string;
  target_amount: number;
  year: number;
  created_at?: string;
}

export interface GoalRule {
  id: string;
  user_field: 'job_title' | 'department' | 'role' | 'tag';
  field_value: string;
  credit_type_id: string;
  credit_type_name?: string;
  target_amount: number;
  year: number;
  created_at?: string;
}

export interface GoalWithProgress extends UserGoal {
  earned: number;
  percent: number;
  status: 'complete' | 'on-track' | 'at-risk' | 'behind';
}
