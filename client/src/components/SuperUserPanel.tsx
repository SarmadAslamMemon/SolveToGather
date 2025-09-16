import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CreateCommunityModal from './CreateCommunityModal';
import api from '@/lib/api';
import { 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Crown, 
  UserPlus, 
  UserMinus,
  BarChart3,
  MapPin,
  Calendar,
  Target
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  leaderId?: string;
  leaderName?: string;
  memberCount: number;
  location: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  communityId: string;
  communityName: string;
  daysLeft: number;
  isActive: boolean;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  communityId: string;
  communityName: string;
  status: 'pending' | 'resolved' | 'in-progress';
  createdAt: Date;
}

interface SuperUserPanelProps {
  currentView: string;
  onUserRoleChange?: (user: any, community: any) => void;
  onRefreshUsers?: React.MutableRefObject<(() => void) | null>;
}

export default function SuperUserPanel({ currentView, onUserRoleChange, onRefreshUsers }: SuperUserPanelProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'communities' | 'campaigns' | 'issues' | 'users'>('communities');

  // Set active tab based on currentView
  useEffect(() => {
    switch (currentView) {
      case 'communities':
        setActiveTab('communities');
        break;
      case 'campaigns':
        setActiveTab('campaigns');
        break;
      case 'issues':
        setActiveTab('issues');
        break;
      case 'users':
        setActiveTab('users');
        break;
      default:
        setActiveTab('communities');
    }
  }, [currentView]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Firebase
  const fetchCommunities = async () => {
    try {
      const response = await fetch(api.communities.getAll());
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(api.users.getAll());
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCommunities(),
        fetchUsers(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Expose refresh function to parent component
  useEffect(() => {
    if (onRefreshUsers) {
      onRefreshUsers.current = fetchUsers;
    }
  }, [onRefreshUsers]);

  const handleCommunityCreated = () => {
    fetchCommunities(); // Refresh the communities list
  };

  const handleAssignLeader = async (communityId: string, userId: string) => {
    try {
      // First, assign the leader to the community
      const response = await fetch(api.communities.assignLeader(communityId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaderId: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign leader');
      }

      // Then, update the user's role to community_leader (keep their existing communityId)
      const userResponse = await fetch(api.users.update(userId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: 'community_leader',
          // Note: We don't change communityId since the user should already belong to this community
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update user role');
      }

      toast({
        title: "Leader assigned successfully",
        description: "Community leader has been assigned and their role updated",
      });

      // Refresh both communities and users to show updated data
      fetchCommunities();
      fetchUsers();
    } catch (error) {
      toast({
        title: "Failed to assign leader",
        description: "There was an error assigning the leader",
        variant: "destructive",
      });
    }
  };

  const handleRemoveLeader = async (communityId: string) => {
    try {
      // Find the community to get the current leader ID
      const community = communities.find(c => c.id === communityId);
      if (!community || !community.leaderId) {
        throw new Error('No leader found for this community');
      }

      const leaderId = community.leaderId;

      // First, remove the leader from the community
      const response = await fetch(api.communities.removeLeader(communityId), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove leader');
      }

      // Then, reset the user's role to normal_user (keep their communityId)
      const userResponse = await fetch(api.users.update(leaderId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: 'normal_user',
          // Note: We don't change communityId since the user should still belong to this community
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update user role');
      }

      toast({
        title: "Leader removed successfully",
        description: "Community leader has been removed and their role reset",
      });

      // Refresh both communities and users to show updated data
      fetchCommunities();
      fetchUsers();
    } catch (error) {
      toast({
        title: "Failed to remove leader",
        description: "There was an error removing the leader",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="ml-64 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-6">
      {/* Super User Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage all communities, campaigns, and users across the platform.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">Super Admin</span>
          </div>
        </div>
      </motion.header>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-card-foreground">{communities.length}</span>
            </div>
            <h3 className="font-medium text-card-foreground">Total Communities</h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-2xl font-bold text-card-foreground">{campaigns.length}</span>
            </div>
            <h3 className="font-medium text-card-foreground">Active Campaigns</h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-2xl font-bold text-card-foreground">{issues.length}</span>
            </div>
            <h3 className="font-medium text-card-foreground">Pending Issues</h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-2xl font-bold text-card-foreground">{users.filter(u => u.role === 'community_leader').length}</span>
            </div>
            <h3 className="font-medium text-card-foreground">Community Leaders</h3>
          </CardContent>
        </Card>
      </motion.div>



      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
                 {activeTab === 'communities' && (
           <div className="space-y-6">
             <Card>
               <CardHeader>
                 <div className="flex justify-between items-center">
                   <CardTitle>All Communities</CardTitle>
                   <CreateCommunityModal onCommunityCreated={handleCommunityCreated} />
                 </div>
               </CardHeader>
               <CardContent>
                <div className="space-y-4">
                  {communities.map((community) => (
                    <div key={community.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-card-foreground">{community.name}</h3>
                          <p className="text-sm text-muted-foreground">{community.location}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-muted-foreground">{community.memberCount} members</span>
                            {community.leaderName && (
                              <Badge variant="secondary">Leader: {community.leaderName}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {community.leaderId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveLeader(community.id)}
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Remove Leader
                          </Button>
                        ) : (
                          <Select onValueChange={(userId) => {
                            console.log('Select value changed:', userId); // Debug log
                            console.log('All users:', users); // Debug log
                            const user = users.find(u => u.id === userId);
                            console.log('Found user:', user); // Debug log
                            console.log('onUserRoleChange callback:', onUserRoleChange); // Debug log
                            if (user && onUserRoleChange) {
                              console.log('Calling onUserRoleChange with:', user, community); // Debug log
                              onUserRoleChange(user, community);
                            } else {
                              console.log('Either user not found or callback not available'); // Debug log
                            }
                          }}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Assign Leader" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const communityUsers = users.filter(u => 
                                  (u.role === 'community_leader' || u.role === 'normal_user') && 
                                  u.communityId === community.id
                                );
                                
                                return communityUsers.length > 0 ? (
                                  communityUsers.map((user, index) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.firstName} {user.lastName} ({user.role === 'community_leader' ? 'Leader' : 'Member'})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-sm text-muted-foreground text-center">
                                    No users available in this community
                                  </div>
                                );
                              })()}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Fundraising Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-card-foreground">{campaign.title}</h3>
                        <Badge variant={campaign.isActive ? "default" : "secondary"}>
                          {campaign.isActive ? 'Active' : 'Completed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{campaign.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Community:</span>
                          <p className="font-medium">{campaign.communityName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Goal:</span>
                          <p className="font-medium">₨{campaign.goal.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Raised:</span>
                          <p className="font-medium">₨{campaign.raised.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Days Left:</span>
                          <p className="font-medium">{campaign.daysLeft}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(campaign.raised / campaign.goal) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div key={issue.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-card-foreground">{issue.title}</h3>
                        <Badge variant={
                          issue.status === 'resolved' ? 'default' :
                          issue.status === 'in-progress' ? 'secondary' : 'destructive'
                        }>
                          {issue.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Community: {issue.communityName}</span>
                        <span className="text-muted-foreground">
                          {issue.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Leaders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.filter(u => u.role === 'community_leader').map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Crown className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-card-foreground">{user.firstName} {user.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <Badge variant="secondary" className="mt-1">
                            {user.communityId ? `Leader of ${communities.find(c => c.id === user.communityId)?.name}` : 'Unassigned'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
