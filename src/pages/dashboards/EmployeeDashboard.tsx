import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentsList } from '@/components/employee/DocumentsList';
import { SubmissionStatusPanel } from '@/components/employee/SubmissionStatusPanel';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. View available documents and track your coding submissions.
          </p>
        </div>

        {/* Submission Status */}
        <SubmissionStatusPanel />

        {/* Documents List */}
        <DocumentsList />
      </div>
    </div>
  );
};