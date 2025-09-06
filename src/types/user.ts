export type UserRole = "PROVIDER" | "EMPLOYEE" | "AUDITOR" | "ADMIN";

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthUser extends User {
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Productivity {
  userId: string;
  date: string;
  loginAt?: string;
  logoutAt?: string;
  breaks: Break[];
  activeMinutes: number;
  documentsProcessed: number;
}

export interface Break {
  startAt: string;
  endAt?: string;
  reason?: string;
}