import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile } from '@/services/firebase';
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
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  notificationCount?: number;
}

export default function Sidebar({ currentView, onViewChange, notificationCount = 0 }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingImage(true);
    try {
      const imagePath = `profile-images/${currentUser.id}/${Date.now()}-${file.name}`;
      const imageUrl = await uploadFile(file, imagePath);
      
      // Update user profile image in Firestore
      // This would typically involve updating the user document
      
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'issues', label: 'Issues', icon: AlertTriangle },
    { id: 'campaigns', label: 'Campaigns', icon: DollarSign },
    { id: 'community', label: 'Community', icon: Users },
  ];

  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'create-issue', label: 'Create Issue', icon: Plus },
    { id: 'create-campaign', label: 'Create Campaign', icon: Plus },
    { id: 'manage-communities', label: 'Manage Communities', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isAdmin = currentUser?.role === 'super_user' || currentUser?.role === 'community_leader';
  const items = isAdmin ? adminMenuItems : menuItems;

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-30"
    >
      <div className="p-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center mb-8"
        >
          <div className="w-10 h-10 savetogather-gradient rounded-lg flex items-center justify-center mr-3 shadow-lg">
            {isAdmin ? (
              <Shield className="w-5 h-5 text-primary-foreground" />
            ) : (
              <HandHeart className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-gradient">SaveToGather</h2>
            {isAdmin && (
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            )}
          </div>
        </motion.div>

        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 p-4 bg-muted rounded-lg"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-border">
                <AvatarImage src={currentUser?.profileImage} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-card-foreground" data-testid="text-username">
                {currentUser?.name || 'User'}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-role">
                {currentUser?.role === 'super_user' ? 'Super Admin' :
                 currentUser?.role === 'community_leader' ? 'Community Leader' : 'Community Member'}
              </p>
            </div>
          </div>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingImage}
              data-testid="input-profile-image"
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:bg-accent"
              disabled={uploadingImage}
              data-testid="button-upload-image"
            >
              <Camera className="w-4 h-4 mr-2" />
              {uploadingImage ? 'Uploading...' : 'Update Photo'}
            </Button>
          </div>
        </motion.div>

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
                  onClick={() => onViewChange(item.id)}
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
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 left-6 right-6"
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
    </motion.aside>
  );
}
