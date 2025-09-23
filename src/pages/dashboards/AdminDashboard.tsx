import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Settings,
  UserPlus,
  Shield,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers, mockDocuments, mockClaims } from '@/data/mockData';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const stats = {
    totalUsers: mockUsers.length,
    activeUsers: mockUsers.filter(u => u.active).length,
    totalDocuments: mockDocuments.length,
    pendingDocuments: mockDocuments.filter(d => 
      d.status === 'UPLOADED' || d.status === 'ASSIGNED' || d.status === 'CODING_IN_PROGRESS'
    ).length,
    totalClaims: mockClaims.length,
    approvedClaims: mockClaims.filter(c => c.status === 'APPROVED').length,
    totalRevenue: mockClaims.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + (c.amount || 0), 0),
    systemUptime: 99.8
  };

  const usersByRole = {
    PROVIDER: mockUsers.filter(u => u.role === 'PROVIDER').length,
    EMPLOYEE: mockUsers.filter(u => u.role === 'EMPLOYEE').length, 
    AUDITOR: mockUsers.filter(u => u.role === 'AUDITOR').length,
    ADMIN: mockUsers.filter(u => u.role === 'ADMIN').length,
  };

  const documentPipeline = [
    { stage: 'Uploaded', count: mockDocuments.filter(d => d.status === 'UPLOADED').length },
    { stage: 'Coding', count: mockDocuments.filter(d => d.status === 'CODING_IN_PROGRESS').length },
    { stage: 'Audit', count: mockDocuments.filter(d => d.status === 'UNDER_AUDIT').length },
    { stage: 'Approved', count: mockDocuments.filter(d => d.status === 'APPROVED').length },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          System Administration, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Monitor system performance and manage users across the RCM workspace.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingDocuments} in pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.approvedClaims}/{stats.totalClaims} approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.systemUptime}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/admin/documents', '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Manage Documents
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
            <CardDescription>
              Breakdown of users by their system role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(usersByRole).map(([role, count]) => (
              <div key={role} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{role.toLowerCase()}</span>
                  <span className="font-medium">{count} users</span>
                </div>
                <Progress 
                  value={(count / stats.totalUsers) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Document Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Document Processing Pipeline</CardTitle>
            <CardDescription>
              Current status of documents in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentPipeline.map((stage, index) => (
                <div key={stage.stage} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-warning' :
                      index === 1 ? 'bg-teal' :
                      index === 2 ? 'bg-primary' : 'bg-success'
                    }`} />
                    <span className="font-medium">{stage.stage}</span>
                  </div>
                  <Badge variant="outline">{stage.count} docs</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>
            Latest actions across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { user: 'Dr. Sarah Johnson', action: 'uploaded new document', time: '5 minutes ago', icon: FileText },
              { user: 'Mike Chen', action: 'completed coding for 3 documents', time: '12 minutes ago', icon: CheckCircle },
              { user: 'Lisa Rodriguez', action: 'approved audit review', time: '25 minutes ago', icon: CheckCircle },
              { user: 'System', action: 'automated backup completed', time: '1 hour ago', icon: Shield },
              { user: 'New user', action: 'Jennifer Smith joined as Employee', time: '2 hours ago', icon: UserPlus },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <activity.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};