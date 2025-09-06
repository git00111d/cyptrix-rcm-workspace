import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  TrendingUp, 
  Coffee, 
  Play, 
  Pause, 
  FileText,
  Target,
  BarChart3 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProductivity } from '@/data/mockData';

export const Productivity: React.FC = () => {
  const { user } = useAuth();
  const [isOnBreak, setIsOnBreak] = React.useState(false);
  
  const todayData = mockProductivity[user?.userId || ''] || {
    userId: user?.userId || '',
    date: new Date().toISOString().split('T')[0],
    loginAt: '08:00:00Z',
    breaks: [],
    activeMinutes: 0,
    documentsProcessed: 0
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const stats = {
    hoursWorked: Math.floor(todayData.activeMinutes / 60),
    minutesWorked: todayData.activeMinutes % 60,
    documentsProcessed: todayData.documentsProcessed,
    breakTime: todayData.breaks.reduce((total, b) => {
      if (b.endAt) {
        const start = new Date(`2024-01-01T${b.startAt}`);
        const end = new Date(`2024-01-01T${b.endAt}`);
        return total + (end.getTime() - start.getTime()) / (1000 * 60);
      }
      return total;
    }, 0),
    efficiency: todayData.activeMinutes > 0 ? Math.round((todayData.documentsProcessed / (todayData.activeMinutes / 60)) * 100) / 100 : 0
  };

  const toggleBreak = () => {
    setIsOnBreak(!isOnBreak);
    // In a real app, this would make an API call
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Productivity Dashboard
        </h1>
        <p className="text-muted-foreground">
          Track your work performance and manage break times.
        </p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.hoursWorked}h {stats.minutesWorked}m
            </div>
            <p className="text-xs text-muted-foreground">Today's active time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Coded</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.documentsProcessed}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Break Time</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatTime(stats.breakTime)}</div>
            <p className="text-xs text-muted-foreground">Total breaks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal">{stats.efficiency}</div>
            <p className="text-xs text-muted-foreground">Docs per hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Break Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Break Management</CardTitle>
          <CardDescription>
            Manage your break time and track productivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={toggleBreak}
              variant={isOnBreak ? "destructive" : "default"}
              className="gap-2"
            >
              {isOnBreak ? (
                <>
                  <Play className="h-4 w-4" />
                  End Break
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Take Break
                </>
              )}
            </Button>
            
            {isOnBreak && (
              <Badge className="bg-warning/10 text-warning border-warning/20">
                <Coffee className="h-3 w-3 mr-1" />
                On Break
              </Badge>
            )}
            
            <div className="flex-1 text-sm text-muted-foreground">
              Current status: {isOnBreak ? 'Taking a break' : 'Active coding'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Goals</CardTitle>
          <CardDescription>
            Track progress towards your daily productivity targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Documents Coded</span>
              <span>{stats.documentsProcessed}/8</span>
            </div>
            <Progress value={(stats.documentsProcessed / 8) * 100} />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Active Hours</span>
              <span>{stats.hoursWorked}/8</span>
            </div>
            <Progress value={(stats.hoursWorked / 8) * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Break History */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Break History</CardTitle>
          <CardDescription>
            All breaks taken during your current session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayData.breaks.map((breakItem, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {breakItem.reason || 'Break'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Started at {breakItem.startAt}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {breakItem.endAt ? (
                      formatTime(
                        (new Date(`2024-01-01T${breakItem.endAt}`).getTime() - 
                         new Date(`2024-01-01T${breakItem.startAt}`).getTime()) / (1000 * 60)
                      )
                    ) : 'In Progress'}
                  </Badge>
                </div>
              </div>
            ))}
            
            {todayData.breaks.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Coffee className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No breaks taken today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>
            Your productivity trend over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Weekly analytics coming soon</p>
            <p className="text-sm">Detailed productivity charts and insights</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};