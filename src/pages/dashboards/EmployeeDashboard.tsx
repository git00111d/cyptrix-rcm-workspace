import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Clock, CheckCircle, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockDocuments, mockProductivity } from '@/data/mockData';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const assignedDocuments = mockDocuments.filter(doc => doc.assignedTo === user?.userId);
  const todayProductivity = mockProductivity[user?.userId || ''];

  const stats = {
    totalAssigned: assignedDocuments.length,
    inProgress: assignedDocuments.filter(d => d.status === 'CODING_IN_PROGRESS').length,
    completed: assignedDocuments.filter(d => d.status === 'CODING_COMPLETE').length,
    underAudit: assignedDocuments.filter(d => d.status === 'UNDER_AUDIT').length,
    activeTime: todayProductivity?.activeMinutes || 0,
    documentsProcessed: todayProductivity?.documentsProcessed || 0
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ASSIGNED': 'bg-primary/10 text-primary border-primary/20',
      'CODING_IN_PROGRESS': 'bg-teal/10 text-teal border-teal/20',
      'CODING_COMPLETE': 'bg-success/10 text-success border-success/20',
      'UNDER_AUDIT': 'bg-warning/10 text-warning border-warning/20',
      'APPROVED': 'bg-success/10 text-success border-success/20',
      'REJECTED': 'bg-error/10 text-error border-error/20',
    };
    return colors[status] || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Good morning, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Ready to start coding? Here's your workload for today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">Total workload</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently coding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Time Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatTime(stats.activeTime)}</div>
            <p className="text-xs text-muted-foreground">Productive time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.documentsProcessed}</div>
            <p className="text-xs text-muted-foreground">Documents coded</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump into your coding workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2">
              <Code className="h-4 w-4" />
              Start Coding
            </Button>
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Take Break
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Productivity
            </Button>
            <Button variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Raise Query
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Your Work Queue</CardTitle>
          <CardDescription>
            Documents assigned to you for medical coding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignedDocuments.map((doc) => (
              <div key={doc.docId} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{doc.fileName}</h4>
                  <p className="text-sm text-muted-foreground">
                    Assigned {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  {doc.codingData && (
                    <div className="flex gap-2 mt-2">
                      {doc.codingData.icd10.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          ICD-10: {doc.codingData.icd10.length}
                        </Badge>
                      )}
                      {doc.codingData.cpt.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          CPT: {doc.codingData.cpt.length}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(doc.status)}>
                    {doc.status.replace('_', ' ')}
                  </Badge>
                  <Button size="sm" variant="outline">
                    {doc.status === 'ASSIGNED' ? 'Start Coding' : 'Continue'}
                  </Button>
                </div>
              </div>
            ))}
            {assignedDocuments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents assigned yet</p>
                <p className="text-sm">Check back later or contact your supervisor</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};