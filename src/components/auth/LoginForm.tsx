import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { Shield, Mail, User, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface SignupData {
  email: string;
  name: string;
  role: UserRole;
}

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    name: '',
    role: 'PROVIDER',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const navigate = useNavigate();

  /** ----------------- LOGIN WITH MAGIC LINK ------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSuccessMsg('Check your email for the magic link!');
        toast({
          title: 'Magic Link Sent',
          description: 'Check your email for the sign-in link',
        });
        setEmail('');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** ----------------- SIGN UP WITH MAGIC LINK ------------------ */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: signupData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name: signupData.name,
            role: signupData.role,
          },
        },
      });

      if (error) {
        toast({
          title: 'Signup Failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setSuccessMsg('Check your email for the magic link!');
      toast({
        title: 'Magic Link Sent',
        description: 'Check your email to complete signup',
      });

      setSignupData({ email: '', name: '', role: 'PROVIDER' });
    } catch (error: any) {
      toast({
        title: 'Signup Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  /** ----------------- DEMO ------------------ */
  const demoCredentials = [
    { role: 'Provider', email: 'provider@cyptrix.com' },
    { role: 'Employee', email: 'employee@cyptrix.com' },
    { role: 'Auditor', email: 'auditor@cyptrix.com' },
    { role: 'Admin', email: 'admin@cyptrix.com' },
  ];

  const handleDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: demoEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Magic Link Sent',
          description: `Check ${demoEmail} for the sign-in link`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send magic link',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** ----------------- UI ------------------ */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-teal/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-primary rounded-full">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Cyptrix RCM Workspace</h1>
          <p className="text-sm text-muted-foreground">
            powered by <span className="font-semibold text-teal">Encrylox</span>
          </p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* -------- Sign In -------- */}
              <TabsContent value="signin">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@cyptrix.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-sm text-destructive text-center">{errorMsg}</p>
                  )}

                  {successMsg && (
                    <p className="text-sm text-primary text-center">{successMsg}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending Magic Link...' : 'Send Magic Link'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    We'll send you a magic link to sign in without a password
                  </p>
                </form>
              </TabsContent>

              {/* -------- Sign Up -------- */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10"
                        value={signupData.name}
                        onChange={(e) =>
                          setSignupData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@cyptrix.com"
                        className="pl-10"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select
                      value={signupData.role}
                      onValueChange={(value: UserRole) =>
                        setSignupData((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROVIDER">Provider</SelectItem>
                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        <SelectItem value="AUDITOR">Auditor</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {errorMsg && (
                    <p className="text-sm text-destructive text-center">{errorMsg}</p>
                  )}

                  {successMsg && (
                    <p className="text-sm text-primary text-center">{successMsg}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isSigningUp}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isSigningUp ? 'Sending Magic Link...' : 'Create Account'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    We'll send you a magic link to complete signup
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo Accounts</CardTitle>
            <CardDescription>
              Send magic links to demo email addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {demoCredentials.map((demo) => (
                <Button
                  key={demo.role}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin(demo.email)}
                  disabled={isLoading}
                  className="justify-start text-xs"
                >
                  <Mail className="h-3 w-3 mr-2" />
                  <span className="font-medium">{demo.role}:</span>
                  <span className="ml-2 text-muted-foreground truncate">
                    {demo.email}
                  </span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click to send a magic link to the demo email address
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};