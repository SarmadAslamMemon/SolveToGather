import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Dashboard from './Dashboard';
import IssuesList from '@/components/views/IssuesList';
import CampaignsList from '@/components/views/CampaignsList';
import IssuesPage from '@/pages/IssuesPage';
import AdminPanel from './AdminPanel';
import SuperUserPanel from './SuperUserPanel';
import UserRoleConfirmationModal from './UserRoleConfirmationModal';
import Notifications from './Notifications';

interface MainContentProps {
  currentView: string;
}

export default function MainContent({ currentView }: MainContentProps) {
  const { currentUser, selectedRole } = useAuth();
  const { toast } = useToast();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const refreshUsersRef = useRef<(() => void) | null>(null);

  if (!currentUser) {
    return null;
  }

  const isSuperUser = currentUser.role === 'super_user';
  const isCommunityLeader = currentUser.role === 'community_leader';
  
  // Determine the effective role based on selectedRole for community leaders
  const effectiveRole = isCommunityLeader ? selectedRole : currentUser.role;

  const handleUserRoleChange = (user: any, community: any) => {
    setSelectedUser(user);
    setSelectedCommunity(community);
    setIsRoleModalOpen(true);
  };

  const handleRoleChangeConfirm = async () => {
    if (!selectedUser || !selectedCommunity) return;

    const isCurrentlyLeader = selectedUser.role === 'community_leader';
    
    try {
      if (isCurrentlyLeader) {
        // Demote to normal user - call API to remove leader
        const response = await fetch(`/api/communities/${selectedCommunity.id}/remove-leader`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to remove leader');

        // Update user role
        const userResponse = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'normal_user' }),
        });
        if (!userResponse.ok) throw new Error('Failed to update user role');
      } else {
        // Promote to community leader - call API to assign leader
        const response = await fetch(`/api/communities/${selectedCommunity.id}/assign-leader`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leaderId: selectedUser.id }),
        });
        
        if (!response.ok) {
          if (response.status === 409) {
            // Community already has a leader
            const errorData = await response.json();
            throw new Error(`Community already has a leader: ${errorData.currentLeader.name}. Please remove the current leader first.`);
          }
          throw new Error('Failed to assign leader');
        }

        // Update user role
        const userResponse = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'community_leader' }),
        });
        if (!userResponse.ok) throw new Error('Failed to update user role');
      }
      
      // Close modal and reset state
      setIsRoleModalOpen(false);
      setSelectedUser(null);
      setSelectedCommunity(null);
      
      // Refresh the users list to show updated roles
      if (refreshUsersRef.current) {
        refreshUsersRef.current();
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        toast({
          title: "Role Change Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while changing user role.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRoleModalClose = () => {
    setIsRoleModalOpen(false);
    setSelectedUser(null);
    setSelectedCommunity(null);
  };

  // Super User gets special interface
  if (isSuperUser) {
    return (
      <>
        <SuperUserPanel currentView={currentView} onUserRoleChange={handleUserRoleChange} onRefreshUsers={refreshUsersRef} />
        <UserRoleConfirmationModal
          isOpen={isRoleModalOpen}
          onClose={handleRoleModalClose}
          onConfirm={handleRoleChangeConfirm}
          user={selectedUser}
          community={selectedCommunity}
        />
      </>
    );
  }

  // Community Leader in leader mode gets admin panel for admin views
  if (isCommunityLeader && effectiveRole === 'leader' && (
    currentView === 'admin-dashboard' ||
    currentView === 'admin-issues' ||
    currentView === 'admin-campaigns' ||
    currentView === 'create-issue' ||
    currentView === 'create-campaign' ||
    currentView === 'manage-communities' ||
    currentView === 'analytics' ||
    currentView === 'settings'
  )) {
    return <AdminPanel currentView={currentView} />;
  }

  // Notifications view is available for all roles
  if (currentView === 'notifications') {
    return <Notifications />;
  }

  // Normal user/member views
  if (currentView === 'issues') {
    return <IssuesPage />;
  }
  if (currentView === 'campaigns') {
    return <CampaignsList />;
  }

  // Default dashboard for all other cases (including community leaders in member mode)
  return <Dashboard />;
}
