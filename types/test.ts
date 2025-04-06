export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Test {
  id: number;
  name: string;
  questions: Question[];
  created_at: string;
  user_id: string;
  university_id: number;
  class_id: number;
  tags: string;
  description?: string;
  universities: {
    name: string;
  };
  classes: {
    name: string;
  };
  reviews: Review[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}
