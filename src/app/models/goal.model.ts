export interface UserGoal {
  id?: string;
  user_id: string;
  credit_type_id: string;
  target_amount: number;
  year: number;
}

export interface GoalRule {
  id?: string;
  user_field: 'job_title' | 'department' | 'role' | 'tag';
  field_value: string;
  credit_type_id: string;
  target_amount: number;
  year: number;
}

export interface GoalProgress {
  credit_type_id: string;
  credit_type_name: string;
  color?: string;
  target: number;
  earned: number;
  percent: number;
  remaining: number;
}
