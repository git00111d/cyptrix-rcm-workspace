import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  level: 'error' | 'warn' | 'info';
  message: string;
  details?: any;
  userId?: string;
  timestamp: string;
}

export const logForAdmin = async (entry: Omit<LogEntry, 'timestamp'>) => {
  try {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    // Log to console for immediate debugging
    console.log('[ADMIN LOG]', logEntry);

    // Store in database for admin review
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        level: entry.level,
        message: entry.message,
        details: entry.details ? JSON.stringify(entry.details) : null,
        user_id: entry.userId,
        created_at: logEntry.timestamp
      });

    if (error) {
      console.warn('Failed to store admin log:', error);
    }
  } catch (error) {
    console.warn('Admin logging failed:', error);
  }
};

export const logPDFError = async (error: Error, filePath: string, userId?: string) => {
  await logForAdmin({
    level: 'error',
    message: `PDF loading failed for file: ${filePath}`,
    details: {
      error: error.message,
      stack: error.stack,
      filePath,
      userAgent: navigator.userAgent
    },
    userId
  });
};