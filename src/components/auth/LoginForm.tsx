import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials, UserRole } from '@/types/user';
import { Shield, Lock, Mail, User, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface SignupData extends LoginCredentials {
  name: string;
  role: UserRole;
  confirmPassword: string;
}

export const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'PROVIDER',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>(''); // NEW: show errors under button
  const { login } = useAuth();
  const navigate = useNavigate();

  /** ----------------- LOGIN ------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const success = await login(credentials);

      if (success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        // Small delay to ensure auth state is updated
        setTimeout(() => {
          navigate('/dashboard');
        }, 150);
      } else {
        setErrorMsg('Invalid email or password');
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMsg(error.message || 'An unexpected error occurred');
      toast({
        title: 'Login Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** ----------------- SIGN UP ------------------ */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    setIsSigningUp(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
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

      if (data.user) {
        toast({
          title: 'Account Created!',
          description:
            'Please check your email to confirm your account, then try signing in.',
        });

        // Switch to login tab and prefill email
        setCredentials({ email: signupData.email, password: '' });
      }
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
    { role: 'Provider', email: 'provider@cyptrix.com', password: 'Provider$123' },
    { role: 'Employee', email: 'employee@cyptrix.com', password: 'Employee$123' },
    { role: 'Auditor', email: 'auditor@cyptrix.com', password: 'Auditor$123' },
    { role: 'Admin', email: 'admin@cyptrix.com', password: 'Admin$123' },
  ];

  const handleDemoLogin = (email: string, password: string) => {
    setCredentials({ email, password });
  };

  const handleCreateDemoAccount = async (demo: typeof demoCredentials[0]) => {
    setIsSigningUp(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: demo.email,
        password: demo.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: demo.role,
            role: demo.role.toUpperCase(),
          },
        },
      });

      if (error) {
        toast({
          title: 'Demo Account Creation Failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Demo Account Created!',
        description: `${demo.role} account created successfully. You can now sign in.`,
      });

      setCredentials({ email: demo.email, password: demo.password });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create demo account',
        variant: 'destructive',
      });
    } finally {
      setIsSigningUp(false);
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
                        value={credentials.email}
                        onChange={(e) =>
                          setCredentials((prev) => ({ ...prev, email: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={credentials.password}
                        onChange={(e) =>
                          setCredentials((prev) => ({ ...prev, password: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-red-500 text-sm text-center">{errorMsg}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
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

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={signupData.password}
                        onChange={(e) =>
                          setSignupData((prev) => ({ ...prev, password: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={signupData.confirmPassword}
                        onChange={(e) =>
                          setSignupData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSigningUp}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isSigningUp ? 'Creating Account...' : 'Create Account'}
                  </Button>
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
              Create demo accounts or auto-fill login credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {demoCredentials.map((demo) => (
                <div key={demo.role} className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin(demo.email, demo.password)}
                    className="flex-1 justify-start text-xs"
                  >
                    <span className="font-medium">{demo.role}:</span>
                    <span className="ml-2 text-muted-foreground truncate">
                      {demo.email}
                    </span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCreateDemoAccount(demo)}
                    disabled={isSigningUp}
                    className="px-3"
                  >
                    <UserPlus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click the + button to create a demo account, then use the credentials to
              sign in
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};