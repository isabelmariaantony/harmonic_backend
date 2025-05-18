export interface User {
  id: number;
  email: string;
  password?: string;
  name?: string;
  role?: 'volunteer' | 'student' | 'admin';
  skills?: string[];
  availability?: {
    [key: string]: {
      start: string;
      end: string;
    };
  };
  bio?: string;
  created_at?: Date;
  updated_at?: Date;
} 