import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Login from "@/components/Login";
import MainContent from "@/components/MainContent";
import Sidebar from "@/components/Sidebar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import RoleSelection from "@/components/RoleSelection";
import NotFound from "@/pages/not-found";
import PaymentCallback from "@/pages/PaymentCallback";

function AppContent() {
  const { currentUser, loading, selectedRole, setSelectedRole } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Determine admin mode early and keep hooks above early returns
  const isSuperUser = currentUser?.role === 'super_user';
  const isCommunityLeader = currentUser?.role === 'community_leader';
  const isAdminMode = !!(isSuperUser || (isCommunityLeader && selectedRole === 'leader'));

  // Ensure admins land on Statistics by default
  useEffect(() => {
    if (isAdminMode && currentView === 'dashboard') {
      setCurrentView('admin-dashboard');
    }
  }, [isAdminMode, currentView]);

  // Allow components to request navigation without prop drilling
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ view: string }>;
      if (custom.detail?.view) {
        setCurrentView(custom.detail.view);
      }
    };
    window.addEventListener('navigate-view', handler as EventListener);
    return () => window.removeEventListener('navigate-view', handler as EventListener);
  }, []);

  // Show loading skeleton while auth is initializing
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!currentUser) {
    return <Login />;
  }

  // Show role selection for community leaders who haven't selected a role
  if (currentUser.role === 'community_leader' && !selectedRole) {
    return <RoleSelection onRoleSelected={setSelectedRole} />;
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        notificationCount={3}
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <MainContent currentView={currentView} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AppContent} />
      <Route path="/payment/callback" component={PaymentCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
