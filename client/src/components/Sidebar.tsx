import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile, updateUserProfileImage } from '@/services/firebase';
import { useToast } from '@/hooks/use-toast';
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
  Newspaper
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  notificationCount?: number;
}

export default function Sidebar({ currentView, onViewChange, notificationCount = 0 }: SidebarProps) {
  const { currentUser, logout, selectedRole, setSelectedRole } = useAuth();
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleLogout = async () => {
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
  };

  // Role-based variables
  const isSuperUser = currentUser?.role === 'super_user';
  const isCommunityLeader = currentUser?.role === 'community_leader';
  const isAdmin = currentUser?.role === 'super_user' || (isCommunityLeader && selectedRole === 'leader');

  // Unified menu structure - items change based on role but structure stays the same
  const getMenuItems = () => {
    if (isSuperUser) {
      return [
        { id: 'super-dashboard', label: 'Super Dashboard', icon: Crown },
        { id: 'communities', label: 'All Communities', icon: Users },
        { id: 'campaigns', label: 'All Campaigns', icon: DollarSign },
        { id: 'issues', label: 'All Issues', icon: AlertTriangle },
        { id: 'users', label: 'Manage Users', icon: Crown },
        { id: 'create-issue', label: 'Add Issue', icon: Plus },
        { id: 'create-campaign', label: 'Raise Campaign', icon: Megaphone },
      ];
    }

    if (isAdmin) {
      return [
        { id: 'admin-dashboard', label: 'Statistics', icon: BarChart3 },
        { id: 'admin-issues', label: 'All Issues', icon: AlertTriangle },
        { id: 'admin-campaigns', label: 'All Campaigns', icon: DollarSign },
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

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-30 overflow-hidden"
    >
      <div className="flex h-full flex-col">
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center mb-8"
        >
          <div className="w-10 h-10 savetogather-gradient rounded-lg flex items-center justify-center mr-3 shadow-lg">
            {isSuperUser ? (
              <Crown className="w-5 h-5 text-primary-foreground" />
            ) : isAdmin ? (
              <Shield className="w-5 h-5 text-primary-foreground" />
            ) : (
              <HandHeart className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-gradient">SolveToGather</h2>
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
        <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <Avatar className="w-14 h-14">
                <AvatarImage src={currentUser?.profileImage} />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-lg font-medium">
                  {currentUser?.firstName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Camera className="w-3 h-3 text-slate-500" />
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
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base" data-testid="text-username">
                {currentUser?.firstName && currentUser?.lastName 
                  ? `${currentUser.firstName} ${currentUser.lastName}` 
                  : currentUser?.firstName || 'User'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="text-role">
                {currentUser?.role === 'super_user' ? 'Super Admin' :
                 currentUser?.role === 'community_leader' ? 
                   (selectedRole === 'leader' ? 'Community Leader' : 'Community Member') : 
                 'Community Member'}
              </p>
            </div>
          </div>
        </div>

        {/* Role Switcher for Community Leaders */}
        {isCommunityLeader && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Switch Mode
              </h4>
              <Badge variant={selectedRole === 'leader' ? 'default' : 'secondary'} className="text-xs">
                {selectedRole === 'leader' ? 'Leader' : 'Member'}
              </Badge>
            </div>
            <div className="space-y-2">
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
        <nav className="space-y-2">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <button
                  onClick={() => {
                    // For community leaders in member mode, open modals instead of navigating
                    if (isCommunityLeader && selectedRole !== 'leader') {
                      if (item.id === 'create-issue') {
                        window.dispatchEvent(new CustomEvent('open-create-issue'));
                        return;
                      }
                      if (item.id === 'create-campaign') {
                        window.dispatchEvent(new CustomEvent('open-create-campaign'));
                        return;
                      }
                    }
                    onViewChange(item.id);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  data-testid={`button-nav-${item.id}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.id === 'notifications' && notificationCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground px-2 py-1 text-xs rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
          
          {/* Notifications - always shown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + items.length * 0.1 }}
          >
            <button
              onClick={() => onViewChange('notifications')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                currentView === 'notifications'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              data-testid="button-nav-notifications"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {notificationCount > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground px-2 py-1 text-xs rounded-full" data-testid="text-notification-count">
                  {notificationCount}
                </span>
              )}
            </button>
          </motion.div>
        </nav>
        </div>
        {/* Bottom Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="p-6 pt-4 border-t border-border"
        >
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </motion.aside>
  );
}
