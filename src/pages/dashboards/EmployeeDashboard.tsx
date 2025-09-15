import React from 'react';
import { DocumentsList } from '@/components/employee/DocumentsList';

export const EmployeeDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <DocumentsList />
    </div>
  );
};