import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuditSubmissionsPanel } from '@/components/auditor/AuditSubmissionsPanel';

export const AuditorDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Auditor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Review employee submissions and approve or reject ICD coding work.
          </p>
        </div>

        {/* Audit Submissions Panel */}
        <AuditSubmissionsPanel />
      </div>
    </div>
  );
};