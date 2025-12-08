import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

import Login from "@/components/Login";
import MainContent from "@/components/MainContent";
import Sidebar from "@/components/Sidebar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import RoleSelection from "@/components/RoleSelection";
import NotificationToast from "@/components/NotificationToast";
import NotFound from "@/pages/not-found";
import PaymentCallback from "@/pages/PaymentCallback";

const DEBUG = import.meta.env.DEV;

function AppContent() {
  const { currentUser, loading, selectedRole, setSelectedRole } = useAuth();
  const [currentView, setCurrentView] = useState('feed');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

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

  // Memoize handleViewChange to prevent Sidebar re-renders
  // MUST be called before any early returns to follow Rules of Hooks
  const handleViewChange = useCallback((view: string) => {
    setCurrentView(prevView => view);
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
      
      {/* Mobile menu toggle button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
      
      <AnimatePresence mode="wait" key={currentView}>
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`min-h-screen transition-all duration-300 ${
            isMobile ? 'pt-16' : 'md:ml-60 lg:ml-64'
          }`}
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
