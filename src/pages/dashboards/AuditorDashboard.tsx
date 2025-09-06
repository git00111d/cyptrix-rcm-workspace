import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, FileSearch, CheckCircle, XCircle, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockDocuments, mockUsers } from '@/data/mockData';

export const AuditorDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const pendingAudits = mockDocuments.filter(d => d.status === 'UNDER_AUDIT');
  const completedAudits = mockDocuments.filter(d => d.status === 'APPROVED' || d.status === 'REJECTED');
  const employees = mockUsers.filter(u => u.role === 'EMPLOYEE');

  const stats = {
    pendingAudits: pendingAudits.length,
    completedToday: completedAudits.filter(d => 
      d.auditData && new Date(d.auditData.auditedAt).toDateString() === new Date().toDateString()
    ).length,
    approvalRate: completedAudits.length > 0 ? 
      Math.round((completedAudits.filter(d => d.status === 'APPROVED').length / completedAudits.length) * 100) : 0,
    activeEmployees: employees.filter(e => e.active).length
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
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
          Audit Dashboard, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Review coded documents and ensure quality standards are met.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Audits</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingAudits}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Reviews finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">Quality standard</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Online now</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage audits and employee assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Review Audits
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Assign Documents
            </Button>
            <Button variant="outline">
              <FileSearch className="h-4 w-4 mr-2" />
              Quality Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Audits */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Audit Reviews</CardTitle>
          <CardDescription>
            Documents waiting for quality assurance review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingAudits.map((doc) => (
              <div key={doc.docId} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{doc.fileName}</h4>
                  <p className="text-sm text-muted-foreground">
                    Coded by {doc.codingData?.codedBy} • {new Date(doc.codingData?.codedAt || '').toLocaleDateString()}
                  </p>
                  {doc.codingData && (
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        ICD-10: {doc.codingData.icd10.join(', ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        CPT: {doc.codingData.cpt.join(', ')}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(doc.status)}>
                    Under Review
                  </Badge>
                  <Button size="sm">
                    Start Review
                  </Button>
                </div>
              </div>
            ))}
            {pendingAudits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending audits</p>
                <p className="text-sm">All documents have been reviewed!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Activity</CardTitle>
          <CardDescription>
            Your latest audit decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedAudits.slice(0, 5).map((doc) => (
              <div key={doc.docId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground">{doc.fileName}</h4>
                  <p className="text-xs text-muted-foreground">
                    {doc.auditData?.auditedAt ? new Date(doc.auditData.auditedAt).toLocaleDateString() : 'Today'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(doc.status)}>
                    {doc.status === 'APPROVED' ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Approved</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" />Rejected</>
                    )}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};