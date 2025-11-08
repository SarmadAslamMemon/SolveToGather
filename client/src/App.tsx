import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Login from "@/components/Login";
import MainContent from "@/components/MainContent";
import Sidebar from "@/components/Sidebar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import RoleSelection from "@/components/RoleSelection";
import NotificationToast from "@/components/NotificationToast";
import NotFound from "@/pages/not-found";
import PaymentCallback from "@/pages/PaymentCallback";

function AppContent() {
  const { currentUser, loading, selectedRole, setSelectedRole } = useAuth();
  const [currentView, setCurrentView] = useState('feed');

  // Determine admin mode early and keep hooks above early returns
  const isSuperUser = currentUser?.role === 'super_user';
  const isCommunityLeader = currentUser?.role === 'community_leader';
  const isAdminMode = !!(isSuperUser || (isCommunityLeader && selectedRole === 'leader'));

  // Ensure admins land on Statistics by default
  useEffect(() => {
    if (isAdminMode && currentView === 'feed') {
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
    console.group('=== NAVIGATION START ===');
    console.log('[App] handleViewChange called with view:', view);
    console.log('[App] Current view before change:', currentView);
    console.log('[App] isAdmin:', currentUser?.role === 'super_user' || (currentUser?.role === 'community_leader' && selectedRole === 'leader'));
    console.log('[App] Current user role:', currentUser?.role);
    console.log('[App] Selected role:', selectedRole);
    
    // Log the component stack
    console.group('Component Stack:');
    console.trace('Navigation initiated from:');
    console.groupEnd();
    
    setCurrentView(prevView => {
      console.log('[App] setCurrentView called. Previous view:', prevView, 'New view:', view);
      return view;
    });
    
    // Log after state update is scheduled
    console.log('[App] State update scheduled for view:', view);
    console.groupEnd();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange}
      />
      
      <AnimatePresence mode="wait" key={currentView}>
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%' }}
        >
          <MainContent currentView={currentView} />
        </motion.div>
      </AnimatePresence>

      {/* Notification Toast - appears bottom-right when new notification arrives */}
      <NotificationToast onNavigateToNotifications={() => setCurrentView('notifications')} />
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
            <NotificationProvider>
              <Toaster />
              <Router />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
