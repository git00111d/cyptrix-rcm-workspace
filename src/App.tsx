import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginForm } from "@/components/auth/LoginForm";
import { Layout } from "@/components/layout/Layout";
import { ProviderDashboard } from "@/pages/dashboards/ProviderDashboard";
import { EmployeeDashboard } from "@/pages/dashboards/EmployeeDashboard";
import { AuditorDashboard } from "@/pages/dashboards/AuditorDashboard";
import { AdminDashboard } from "@/pages/dashboards/AdminDashboard";
import { DocumentUpload } from "@/components/provider/DocumentUpload";
import { DocumentsList } from "@/components/employee/DocumentsList";
import { CodingWorkspace } from "@/pages/CodingWorkspace";
import { AuditQueue } from "@/pages/AuditQueue";
import { Claims } from "@/pages/Claims";
import { Productivity } from "@/pages/Productivity";
import { Notifications } from "@/pages/Notifications";
import { UserManagement } from "@/pages/UserManagement";
import { Settings } from "@/pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/upload" element={
                <ProtectedRoute allowedRoles={['PROVIDER']}>
                  <DocumentUpload />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'AUDITOR']}>
                  <DocumentsList />
                </ProtectedRoute>
              } />
              <Route path="/coding" element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'AUDITOR']}>
                  <CodingWorkspace />
                </ProtectedRoute>
              } />
              <Route path="/audit" element={
                <ProtectedRoute allowedRoles={['AUDITOR']}>
                  <AuditQueue />
                </ProtectedRoute>
              } />
              <Route path="/claims" element={<Claims />} />
              <Route path="/productivity" element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'AUDITOR', 'ADMIN']}>
                  <Productivity />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={<Settings />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Dashboard router based on user role
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  switch (user.role) {
    case 'PROVIDER':
      return <Navigate to="/upload" replace />;
    case 'EMPLOYEE':
      return <Navigate to="/documents" replace />;
    case 'AUDITOR':
      return <AuditorDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

export default App;
