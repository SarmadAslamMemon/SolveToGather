import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile, updateUserProfileImage, getCommunities } from '@/services/firebase';
import { useToast } from '@/hooks/use-toast';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  HandHeart, 
  Home, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Bell, 
  LogOut,
  Camera,
  Shield,
  Plus,
  BarChart3,
  Settings,
  Crown,
  Heart,
  Megaphone,
  Newspaper,
  Flag,
  TrendingUp,
  CreditCard,
  Clock,
  MapPin
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  notificationCount?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Component instance counter for tracking mounts
let sidebarInstanceId = 0;

const DEBUG = import.meta.env.DEV;

function Sidebar({ currentView, onViewChange, isOpen, onOpenChange }: SidebarProps) {
  // Track component instance
  const [instanceId] = useState(() => {
    sidebarInstanceId++;
    return sidebarInstanceId;
  });

  const { currentUser, logout, selectedRole, setSelectedRole } = useAuth();
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [communityName, setCommunityName] = useState<string | null>(null);
  const { unreadCount: notificationCount } = useNotificationContext();
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const renderTypeRef = useRef<'mobile' | 'desktop' | null>(null);
  
  // Track when we've determined the render type to prevent switching
  const hasDeterminedRenderType = useRef(false);

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setIsClient(true);
  }, [instanceId]);

  // Calculate render type early for use in effects
  // Lock in the render type once determined (prevents switching between mobile/desktop)
  if (isClient && !hasDeterminedRenderType.current) {
    hasDeterminedRenderType.current = true;
    renderTypeRef.current = isMobile ? 'mobile' : 'desktop';
  }
  
  // If render type is locked, use the locked type instead of current detection
  const finalRenderType = hasDeterminedRenderType.current && renderTypeRef.current 
    ? renderTypeRef.current 
    : (isMobile ? 'mobile' : 'desktop');

  // DOM check: Verify only one sidebar exists in the DOM
  useEffect(() => {
    if (isClient && finalRenderType === 'desktop') {
      const desktopSidebars = document.querySelectorAll('[data-sidebar-type="desktop"]');
      const mobileSidebars = document.querySelectorAll('[data-sidebar-type="mobile"]');
      
      if (desktopSidebars.length > 1) {
        console.error(`[Sidebar #${instanceId}] ⚠️⚠️⚠️ MULTIPLE DESKTOP SIDEBARS DETECTED IN DOM: ${desktopSidebars.length}`);
        // Remove duplicates, keep only the first one
        for (let i = 1; i < desktopSidebars.length; i++) {
          console.error(`[Sidebar #${instanceId}] Removing duplicate desktop sidebar #${i}`);
          desktopSidebars[i].remove();
        }
      }
      
      if (mobileSidebars.length > 0 && desktopSidebars.length > 0) {
        console.error(`[Sidebar #${instanceId}] ⚠️⚠️⚠️ BOTH MOBILE AND DESKTOP SIDEBARS DETECTED IN DOM!`);
        // Remove mobile sidebars if desktop is active
        mobileSidebars.forEach((sidebar, index) => {
          console.error(`[Sidebar #${instanceId}] Removing mobile sidebar #${index} (desktop is active)`);
          sidebar.remove();
        });
      }
    }
    
    if (isClient && finalRenderType === 'mobile') {
      const desktopSidebars = document.querySelectorAll('[data-sidebar-type="desktop"]');
      const mobileSidebars = document.querySelectorAll('[data-sidebar-type="mobile"]');
      
      if (mobileSidebars.length > 1) {
        console.error(`[Sidebar #${instanceId}] ⚠️⚠️⚠️ MULTIPLE MOBILE SIDEBARS DETECTED IN DOM: ${mobileSidebars.length}`);
        // Remove duplicates, keep only the first one
        for (let i = 1; i < mobileSidebars.length; i++) {
          console.error(`[Sidebar #${instanceId}] Removing duplicate mobile sidebar #${i}`);
          mobileSidebars[i].remove();
        }
      }
      
      if (desktopSidebars.length > 0 && mobileSidebars.length > 0) {
        console.error(`[Sidebar #${instanceId}] ⚠️⚠️⚠️ BOTH MOBILE AND DESKTOP SIDEBARS DETECTED IN DOM!`);
        // Remove desktop sidebars if mobile is active
        desktopSidebars.forEach((sidebar, index) => {
          console.error(`[Sidebar #${instanceId}] Removing desktop sidebar #${index} (mobile is active)`);
          sidebar.remove();
        });
      }
    }
  }, [isClient, finalRenderType, instanceId]);

  // Fetch community name - only update if it actually changed
  useEffect(() => {
    const fetchCommunityName = async () => {
      if (!currentUser?.communityId) {
        setCommunityName(prev => prev !== null ? null : prev);
        return;
      }

      try {
        const communities = await getCommunities();
        const community = communities.find((c: any) => c.id === currentUser.communityId);
        const newName = community?.name || null;
        setCommunityName(prev => prev !== newName ? newName : prev);
      } catch (error) {
        console.error('Error fetching community name:', error);
      }
    };

    fetchCommunityName();
  }, [currentUser?.communityId]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingImage(true);
    try {
      const imagePath = `profile-images/${currentUser.id}/${Date.now()}-${file.name}`;
      const imageUrl = await uploadFile(file, imagePath);

      await updateUserProfileImage(currentUser.id, imageUrl);
      
      toast({
        title: "Profile updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  }, [currentUser, toast]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  }, [logout, toast]);

  // Role-based variables
  const isSuperUser = currentUser?.role === 'super_user';
  const isCommunityLeader = currentUser?.role === 'community_leader';
  const isAdmin = currentUser?.role === 'super_user' || (isCommunityLeader && selectedRole === 'leader');

  // Unified menu structure - items change based on role but structure stays the same
  const getMenuItems = () => {
    if (isSuperUser) {
      return [
        { id: 'communities', label: 'All Communities', icon: Users },
        { id: 'campaigns', label: 'All Campaigns', icon: DollarSign },
        { id: 'issues', label: 'All Issues', icon: AlertTriangle },
        { id: 'users', label: 'Manage Users', icon: Crown }
      ];
    }

    if (isAdmin) {
      return [
        { id: 'admin-dashboard', label: 'Statistics', icon: BarChart3 },
        { id: 'admin-activity', label: 'Activity & Insights', icon: TrendingUp },
        { id: 'admin-issues', label: 'All Issues', icon: AlertTriangle },
        { id: 'admin-campaigns', label: 'All Campaigns', icon: DollarSign },
        { id: 'admin-payment-methods', label: 'Payment Methods', icon: CreditCard },
        { id: 'admin-transactions', label: 'Transactions', icon: Clock },
        { id: 'admin-reports', label: 'Reports', icon: Flag },
        { id: 'create-issue', label: 'Add Issue', icon: Plus },
        { id: 'create-campaign', label: 'Raise Campaign', icon: Megaphone },
      ];
    }

    const baseItems = [
      { id: 'feed', label: 'Community Feed', icon: Newspaper },
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'issues', label: 'Issues', icon: AlertTriangle },
      { id: 'campaigns', label: 'Campaigns', icon: DollarSign },
    ];

    // Restore quick actions for community leaders in member mode
    if (isCommunityLeader && selectedRole !== 'leader') {
      baseItems.push({ id: 'create-issue', label: 'Add Issue', icon: Plus });
      baseItems.push({ id: 'create-campaign', label: 'Raise Campaign', icon: Megaphone });
    }

    return baseItems;
  };

  const items = getMenuItems();

  // Handler for navigation that also closes mobile sidebar
  // Memoized to prevent re-renders
  const handleNavigation = useCallback((view: string) => {
    onViewChange(view);
    if (isMobile && onOpenChange) {
      onOpenChange(false);
    }
  }, [onViewChange, isMobile, onOpenChange]);

  // Sidebar content component (reusable for both mobile and desktop)
  // Memoized to prevent re-renders when parent re-renders but dependencies haven't changed
  const SidebarContent = useMemo(() => (
    <div className="flex h-full flex-col">
      <div className="p-3 md:p-4 lg:p-6 flex-1 overflow-y-auto no-scrollbar">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center mb-4 md:mb-6 lg:mb-8"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 savetogather-gradient rounded-lg flex items-center justify-center mr-2 md:mr-3 shadow-lg flex-shrink-0">
            {isSuperUser ? (
              <Crown className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            ) : isAdmin ? (
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            ) : (
              <HandHeart className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-lg lg:text-xl font-bold font-serif text-gradient truncate">SolveToGather</h2>
            {isSuperUser && (
              <p className="text-xs text-muted-foreground">Super Admin</p>
            )}
            {isAdmin && !isSuperUser && (
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            )}
            {isCommunityLeader && selectedRole === 'member' && (
              <p className="text-xs text-muted-foreground">Member View</p>
            )}
          </div>
        </motion.div>

        {/* User Profile Section */}
        <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
            <div className="relative flex-shrink-0">
              <Avatar className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14">
                <AvatarImage src={currentUser?.profileImage} />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm md:text-base lg:text-lg font-medium">
                  {currentUser?.firstName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 md:p-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Camera className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-500" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                  data-testid="input-profile-image"
                />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs md:text-sm lg:text-base truncate" data-testid="text-username">
                {currentUser?.firstName && currentUser?.lastName 
                  ? `${currentUser.firstName} ${currentUser.lastName}` 
                  : currentUser?.firstName || 'User'}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate" data-testid="text-role">
                {currentUser?.role === 'super_user' ? 'Super Admin' :
                 currentUser?.role === 'community_leader' ? 
                   (selectedRole === 'leader' ? 'Community Leader' : 'Community Member') : 
                 'Community Member'}
              </p>
              {communityName && !isSuperUser && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 flex items-center gap-1" data-testid="text-community">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{communityName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Role Switcher for Community Leaders */}
        {isCommunityLeader && (
          <div className="mb-4 md:mb-6 p-2.5 md:p-3 lg:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h4 className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">
                Switch Mode
              </h4>
              <Badge variant={selectedRole === 'leader' ? 'default' : 'secondary'} className="text-xs">
                {selectedRole === 'leader' ? 'Leader' : 'Member'}
              </Badge>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Button
                variant={selectedRole === 'leader' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs"
                onClick={() => setSelectedRole('leader')}
              >
                <Shield className="w-3 h-3 mr-1" />
                Leader Mode
              </Button>
              <Button
                variant={selectedRole === 'member' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs"
                onClick={() => setSelectedRole('member')}
              >
                <Heart className="w-3 h-3 mr-1" />
                Member Mode
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="mb-1"
              >
                <button
                  onClick={() => {
                    // For community leaders in member mode, open modals instead of navigating
                    if (isCommunityLeader && selectedRole !== 'leader') {
                      if (item.id === 'create-issue') {
                        window.dispatchEvent(new CustomEvent('open-create-issue'));
                        if (isMobile && onOpenChange) onOpenChange(false);
                        return;
                      }
                      if (item.id === 'create-campaign') {
                        window.dispatchEvent(new CustomEvent('open-create-campaign'));
                        if (isMobile && onOpenChange) onOpenChange(false);
                        return;
                      }
                    }
                    handleNavigation(item.id);
                  }}
                  className={`w-full flex items-center space-x-2 md:space-x-3 px-2.5 md:px-3 lg:px-4 py-2 md:py-2.5 lg:py-3 rounded-md transition-colors text-xs md:text-sm lg:text-base ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  data-testid={`button-nav-${item.id}`}
                >
                  <Icon className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="truncate flex-1 min-w-0">{item.label}</span>
                  {item.id === 'notifications' && notificationCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground px-2 py-1 text-xs rounded-full flex-shrink-0">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
          
          {/* Notifications - hidden for super admin */}
          {!isSuperUser && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="mb-1"
            >
              <button
                onClick={() => {
                  handleNavigation('notifications');
                }}
                className={`w-full flex items-center space-x-2 md:space-x-3 px-2.5 md:px-3 lg:px-4 py-2 md:py-2.5 lg:py-3 rounded-md transition-colors text-xs md:text-sm lg:text-base ${
                  currentView === 'notifications'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                data-testid="button-nav-notifications"
              >
                <Bell className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="truncate flex-1 min-w-0">Notifications</span>
                {notificationCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground px-2 py-1 text-xs rounded-full flex-shrink-0" data-testid="text-notification-count">
                    {notificationCount}
                  </span>
                )}
              </button>
            </motion.div>
          )}
        </nav>
      </div>
      {/* Bottom Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-3 md:p-4 lg:p-6 pt-3 md:pt-4 border-t border-border"
      >
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full text-xs md:text-sm lg:text-base"
          data-testid="button-logout"
        >
          <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </div>
  ), [
    currentUser,
    uploadingImage,
    communityName,
    isSuperUser,
    isAdmin,
    isCommunityLeader,
    selectedRole,
    items,
    currentView,
    notificationCount,
    handleNavigation,
    handleImageUpload,
    handleLogout,
    setSelectedRole,
    isMobile,
    onOpenChange
  ]);

  // LOG 4: Render decision
  // CRITICAL: Only render when isClient is true
  // Once we've determined the render type, stick with it to prevent switching
  const shouldRenderMobile = isClient && isMobile;
  const shouldRenderDesktop = isClient && !isMobile;
  
  // Determine render type using locked type if available
  const renderType: 'mobile' | 'desktop' | null = isClient ? finalRenderType : null;

  // CRITICAL: Don't render anything until we know for sure which version to show
  // This prevents double rendering (both mobile and desktop) during hydration
  if (!isClient) {
    return null;
  }

  // CRITICAL: Use locked render type to prevent switching
  // Mobile: Use Sheet (drawer) - ONLY render mobile version
  if (finalRenderType === 'mobile') {
    return (
      <Sheet key={`sidebar-mobile-${instanceId}`} open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="left" 
          className="w-[280px] sm:w-[320px] p-0"
          data-sidebar-instance={instanceId}
          data-sidebar-type="mobile"
        >
          {SidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar - ONLY render desktop version
  // This should only execute when finalRenderType is 'desktop'
  if (finalRenderType === 'desktop') {
    return (
      <motion.aside
        key={`sidebar-desktop-${instanceId}`}
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex fixed left-0 top-0 h-full w-56 lg:w-64 bg-card border-r border-border z-30 overflow-hidden"
        data-sidebar-instance={instanceId}
        data-sidebar-type="desktop"
      >
        {SidebarContent}
      </motion.aside>
    );
  }

  // Fallback: Should never reach here, but return null to be safe
  return null;
}

// Memoize the entire component to prevent unnecessary re-renders when props haven't changed
const MemoizedSidebar = React.memo(Sidebar, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)
  const propsEqual = (
    prevProps.currentView === nextProps.currentView &&
    prevProps.isOpen === nextProps.isOpen
  );
  
  return propsEqual;
});

export default MemoizedSidebar;
