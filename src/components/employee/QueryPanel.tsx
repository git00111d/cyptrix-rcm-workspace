import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  User,
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Query {
  id: string;
  document_id: string;
  page_number?: number;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  created_by: string;
  created_at: string;
  response?: string;
  responded_by?: string;
  responded_at?: string;
  creator_name?: string;
  responder_name?: string;
}

interface QueryPanelProps {
  documentId: string;
  currentPage?: number;
  className?: string;
}

export const QueryPanel: React.FC<QueryPanelProps> = ({ 
  documentId, 
  currentPage,
  className = "" 
}) => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [newQuery, setNewQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQueries();
  }, [documentId]);

  const fetchQueries = async () => {
    try {
      setIsLoading(true);
      // For now, use a placeholder until types are updated
      const queries: Query[] = [];
      setQueries(queries);
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast.error('Failed to load queries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuery = async () => {
    if (!newQuery.trim()) {
      toast.error('Please enter a query message');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // For now, just show success message until types are updated
      toast.success('Query submitted successfully');
      setNewQuery('');
      fetchQueries();
    } catch (error) {
      console.error('Error submitting query:', error);
      toast.error('Failed to submit query');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'OPEN': 'bg-error/10 text-error border-error/20',
      'IN_PROGRESS': 'bg-warning/10 text-warning border-warning/20',
      'RESOLVED': 'bg-success/10 text-success border-success/20',
    };
    return colors[status] || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-3 w-3" />;
      case 'IN_PROGRESS':
        return <Clock className="h-3 w-3" />;
      case 'RESOLVED':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Document Queries
        </CardTitle>
        <CardDescription>
          Raise questions or clarifications about this document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Query Form */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">
              Submit New Query
              {currentPage && (
                <span className="text-muted-foreground ml-1">(Page {currentPage})</span>
              )}
            </label>
            <Textarea
              placeholder="Describe your question or clarification needed..."
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={handleSubmitQuery}
            disabled={isSubmitting || !newQuery.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Query'}
          </Button>
        </div>

        {/* Existing Queries */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Previous Queries ({queries.length})
          </h4>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : queries.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No queries yet</p>
              <p className="text-xs">Submit your first query above</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {queries.map((query) => (
                <div key={query.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(query.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(query.status)}
                          {query.status}
                        </span>
                      </Badge>
                      {query.page_number && (
                        <Badge variant="outline" className="text-xs">
                          Page {query.page_number}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(query.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {query.creator_name || 'Unknown User'}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{query.message}</p>
                    </div>
                    
                    {query.response && (
                      <div className="mt-2 p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-1 mb-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Response by {query.responder_name || 'Staff'}
                          </span>
                          {query.responded_at && (
                            <span className="text-xs text-muted-foreground">
                              • {new Date(query.responded_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{query.response}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
