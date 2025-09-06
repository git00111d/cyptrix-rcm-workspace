import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, FileText, Clock, AlertCircle } from 'lucide-react';

export const CodingWorkspace: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Coding Workspace
        </h1>
        <p className="text-muted-foreground">
          Medical coding interface with PDF viewer and code assignment tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Coding Interface - Coming Soon
          </CardTitle>
          <CardDescription>
            Advanced PDF viewer with side-by-side coding panel, ICD-10/CPT search, and productivity tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Code className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Full Coding Workspace</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Complete medical coding interface with PDF viewer, code lookup, productivity tracking, 
              and query management system.
            </p>
            <Button>View Demo Interface</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};