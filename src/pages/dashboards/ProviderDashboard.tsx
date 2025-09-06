import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockDocuments, mockClaims } from '@/data/mockData';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const userDocuments = mockDocuments.filter(doc => doc.ownerId === user?.userId);
  const userClaims = mockClaims.filter(claim => 
    userDocuments.some(doc => doc.docId === claim.docId)
  );

  const stats = {
    totalDocuments: userDocuments.length,
    pendingCoding: userDocuments.filter(d => d.status === 'UPLOADED' || d.status === 'ASSIGNED').length,
    underAudit: userDocuments.filter(d => d.status === 'UNDER_AUDIT').length,
    totalClaims: userClaims.length,
    claimsApproved: userClaims.filter(c => c.status === 'APPROVED').length,
    totalRevenue: userClaims.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + (c.amount || 0), 0)
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'UPLOADED': 'bg-warning/10 text-warning border-warning/20',
      'ASSIGNED': 'bg-primary/10 text-primary border-primary/20',
      'CODING_IN_PROGRESS': 'bg-teal/10 text-teal border-teal/20',
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
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Here's your practice overview and recent document activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Documents uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Coding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingCoding}</div>
            <p className="text-xs text-muted-foreground">Awaiting code assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal">{stats.totalClaims}</div>
            <p className="text-xs text-muted-foreground">{stats.claimsApproved} approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">From approved claims</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your documents and claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Documents
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View Claims
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Productivity Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>
            Your latest uploaded documents and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userDocuments.slice(0, 5).map((doc) => (
              <div key={doc.docId} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{doc.fileName}</h4>
                  <p className="text-sm text-muted-foreground">
                    Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(doc.status)}>
                    {doc.status.replace('_', ' ')}
                  </Badge>
                  {doc.assignedTo && (
                    <span className="text-xs text-muted-foreground">
                      Assigned
                    </span>
                  )}
                </div>
              </div>
            ))}
            {userDocuments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents uploaded yet</p>
                <Button className="mt-2">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};