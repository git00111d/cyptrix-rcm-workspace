import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { mockClaims } from '@/data/mockData';

export const Claims: React.FC = () => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'SUBMITTED': 'bg-primary/10 text-primary border-primary/20',
      'APPROVED': 'bg-success/10 text-success border-success/20',
      'DENIED': 'bg-error/10 text-error border-error/20',
      'PENDING': 'bg-warning/10 text-warning border-warning/20',
    };
    return colors[status] || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'DENIED':
        return <XCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const stats = {
    total: mockClaims.length,
    approved: mockClaims.filter(c => c.status === 'APPROVED').length,
    denied: mockClaims.filter(c => c.status === 'DENIED').length,
    pending: mockClaims.filter(c => c.status === 'PENDING' || c.status === 'SUBMITTED').length,
    totalRevenue: mockClaims.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + (c.amount || 0), 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Claims Management
        </h1>
        <p className="text-muted-foreground">
          Track and manage insurance claims submission and approval status.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-error" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">{stats.denied}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Overview</CardTitle>
          <CardDescription>
            Current status of all submitted insurance claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockClaims.map((claim) => (
              <div key={claim.claimId} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">Claim #{claim.claimId}</h4>
                    <Badge variant="outline" className="text-xs">
                      Doc: {claim.docId}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Submitted: {new Date(claim.submittedAt).toLocaleDateString()}</p>
                    {claim.decidedAt && (
                      <p>Decided: {new Date(claim.decidedAt).toLocaleDateString()}</p>
                    )}
                    {claim.payerId && (
                      <p>Payer: {claim.payerId}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {claim.amount && (
                    <div className="text-right">
                      <p className="font-medium text-foreground">${claim.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Claim amount</p>
                    </div>
                  )}
                  
                  <Badge className={getStatusColor(claim.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(claim.status)}
                      {claim.status}
                    </span>
                  </Badge>
                  
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common claims management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Create New Claim
            </Button>
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue Report
            </Button>
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Pending Claims
            </Button>
            <Button variant="outline">
              <XCircle className="h-4 w-4 mr-2" />
              Denied Claims Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};