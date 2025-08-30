import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";
import AdminPanel from "@/components/AdminPanel";
import Sidebar from "@/components/Sidebar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!currentUser) {
    return <Login />;
  }

  const isAdmin = currentUser.role === 'super_user' || currentUser.role === 'community_leader';

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
      case 'issues':
      case 'campaigns':
      case 'community':
      case 'notifications':
        return <Dashboard />;
      case 'admin-dashboard':
      case 'create-issue':
      case 'create-campaign':
      case 'manage-communities':
      case 'analytics':
      case 'settings':
        return isAdmin ? <AdminPanel /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
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
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AppContent} />
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
