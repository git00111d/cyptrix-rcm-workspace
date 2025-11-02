import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProviderDashboard } from "@/pages/dashboards/ProviderDashboard";
import { EmployeeDashboard } from "@/pages/dashboards/EmployeeDashboard";
import { AuditorDashboard } from "@/pages/dashboards/AuditorDashboard";
import { AdminDashboard } from "@/pages/dashboards/AdminDashboard";
import { DocumentUpload } from "@/components/provider/DocumentUpload";
import { DocumentsList } from "@/components/employee/DocumentsList";
import { CodingWorkspace } from "@/pages/CodingWorkspace";
import { PDFCodingWorkspace } from "@/pages/PDFCodingWorkspace";
import { AuditQueue } from "@/pages/AuditQueue";
import { Claims } from "@/pages/Claims";
import { Productivity } from "@/pages/Productivity";
import { Notifications } from "@/pages/Notifications";
import { UserManagement } from "@/pages/UserManagement";
import { Settings } from "@/pages/Settings";
import { DocumentManagement } from "@/components/admin/DocumentManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<ProviderDashboard />} />
            <Route path="/upload" element={<DocumentUpload />} />
            <Route path="/documents" element={<DocumentsList />} />
            <Route path="/coding" element={<CodingWorkspace />} />
            <Route path="/pdf-coding/:documentId" element={<PDFCodingWorkspace />} />
            <Route path="/audit" element={<AuditQueue />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/productivity" element={<Productivity />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/documents" element={<DocumentManagement />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
