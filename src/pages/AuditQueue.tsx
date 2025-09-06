import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck } from 'lucide-react';

export const AuditQueue: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Audit Queue
        </h1>
        <p className="text-muted-foreground">
          Review and approve medical coding assignments with quality assurance tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Audit Interface - Coming Soon
          </CardTitle>
          <CardDescription>
            Comprehensive audit workflow with document assignment, approval/rejection tools, and quality reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Full Audit System</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Complete audit workflow with document review, code validation, 
              employee assignment, and quality assurance reporting.
            </p>
            <Button>View Demo Interface</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};