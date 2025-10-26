import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { createIssue, createIssueWithNotification, createCampaign, createCampaignWithNotification, uploadFile } from '@/services/firebase';
import { useToast } from '@/hooks/use-toast';
import IssueCard from './IssueCard';
import CampaignCard from './CampaignCard';
import DonationModal from './DonationModal';
import CommunityLeaderProfileModal from './CommunityLeaderProfileModal';
import LoadingSkeleton from './LoadingSkeleton';
import IssuesList from '@/components/views/IssuesList';
import ReportsList from '@/components/views/ReportsList';
import CampaignsList from '@/components/views/CampaignsList';
import AdminActivityDashboard from './AdminActivityDashboard';
import PaymentMethods from './PaymentMethods';
import { useIssues, useCampaigns } from '@/hooks/useFirestore';
import { useComments, useAddComment, useDeleteComment, usePostLikes } from '@/hooks/useComments';
import { getDoc, doc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Plus, 
  Upload, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Megaphone,
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  X
} from 'lucide-react';

interface NewIssueData {
  title: string;
  description: string;
  communityId: string;
  images?: File[];
}

interface NewCampaignData {
  title: string;
  description: string;
  goal: string;
  duration: string;
  communityId: string;
  images?: File[];
  paymentMethods: string[];
}

interface AdminPanelProps {
  currentView: string;
}

export default function AdminPanel({ currentView }: AdminPanelProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [openPost, setOpenPost] = useState<any | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [selectedLeader, setSelectedLeader] = useState<any | null>(null);
  const [isLeaderProfileOpen, setIsLeaderProfileOpen] = useState(false);

  const { issues, loading: issuesLoading } = useIssues(currentUser?.communityId, true);
  const { campaigns, loading: campaignsLoading } = useCampaigns(currentUser?.communityId, true);

  // Hooks for post modal
  const { comments, loading: commentsLoading } = useComments(openPost?.id || '', 10);
  const { addComment, loading: addingComment } = useAddComment();
  const { deleteComment, loading: deletingComment } = useDeleteComment();
  const { isLiked: isPostLiked, toggleLike: togglePostLike, loading: postLikeLoading } = usePostLikes(openPost?.id || '');

  const [newIssue, setNewIssue] = useState<NewIssueData>({
    title: '',
    description: '',
    communityId: '',
    images: [],
  });

  const [newCampaign, setNewCampaign] = useState<NewCampaignData>({
    title: '',
    description: '',
    goal: '',
    duration: '',
    communityId: '',
    images: [],
    paymentMethods: [],
  });

  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const issueFileInputRef = useRef<HTMLInputElement | null>(null);
  const campaignFileInputRef = useRef<HTMLInputElement | null>(null);

  // Real admin stats calculated from database
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeCampaigns: 0,
    totalDonations: 0,
    pendingIssues: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Calculate real statistics from database
  useEffect(() => {
    const calculateStats = async () => {
      if (!currentUser?.communityId) return;
      
      try {
        setStatsLoading(true);
        
        // Get total users in community
        const usersQuery = query(collection(db, 'users'), where('communityId', '==', currentUser.communityId));
        const usersSnapshot = await getDocs(usersQuery);
        const totalUsers = usersSnapshot.size;
        
        // Get active campaigns in community
        const campaignsQuery = query(
          collection(db, 'campaigns'), 
          where('communityId', '==', currentUser.communityId),
          where('isActive', '==', true)
        );
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const activeCampaigns = campaignsSnapshot.size;
        
        // Calculate total donations from all campaigns in community
        let totalDonations = 0;
        campaignsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          totalDonations += data.raised || 0;
        });
        
        // Get pending issues in community
        const issuesQuery = query(
          collection(db, 'issues'), 
          where('communityId', '==', currentUser.communityId),
          where('status', '==', 'pending')
        );
        const issuesSnapshot = await getDocs(issuesQuery);
        const pendingIssues = issuesSnapshot.size;
        
        setAdminStats({
          totalUsers,
          activeCampaigns,
          totalDonations,
          pendingIssues,
        });
      } catch (error) {
        console.error('Error calculating admin stats:', error);
        toast({
          title: "Error",
          description: "Failed to load statistics. Please try again.",
          variant: "destructive",
        });
      } finally {
        setStatsLoading(false);
      }
    };

    calculateStats();
  }, [currentUser?.communityId, toast]);


  useEffect(() => {
    if (currentUser?.communityId) {
      setNewIssue(prev => ({ ...prev, communityId: currentUser.communityId! }));
      setNewCampaign(prev => ({ ...prev, communityId: currentUser.communityId! }));
    }
  }, [currentUser?.communityId]);

  const handleDonate = (campaignId: string) => {
    const campaign = (campaigns || []).find((c: any) => c.id === campaignId);
    if (campaign) {
      setSelectedCampaign(campaign);
      setIsDonationModalOpen(true);
    }
  };

  const handleCloseDonationModal = () => {
    setIsDonationModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleOpenPost = (post: any) => {
    setOpenPost(post);
    setImageIndex(0);
    setNewComment('');
  };

  const handleClosePost = () => {
    setOpenPost(null);
    setImageIndex(0);
    setNewComment('');
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !openPost || !currentUser) return;

    try {
      await addComment(openPost.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleAuthorClick = async (authorId: string) => {
    try {
      const authorDoc = await getDoc(doc(db, 'users', authorId));
      if (authorDoc.exists()) {
        const authorData = authorDoc.data();
        setSelectedLeader({
          ...authorData,
          id: authorId,
        });
        setIsLeaderProfileOpen(true);
      } else {
        toast({
          title: "Profile not found",
          description: "The leader's profile could not be found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching leader profile:', error);
      toast({
        title: "Error",
        description: "Failed to load leader profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsCreatingIssue(true);
    try {
      const uploadedUrls: string[] = [];
      if (newIssue.images && newIssue.images.length > 0) {
        const uploads = newIssue.images.map((file) => {
          const imagePath = `issues/${Date.now()}-${file.name}`;
          return uploadFile(file, imagePath);
        });
        const settled = await Promise.allSettled(uploads);
        for (const r of settled) {
          if (r.status === 'fulfilled') uploadedUrls.push(r.value);
        }
        if (uploads.length > 0 && uploadedUrls.length === 0) {
          throw new Error('All image uploads failed');
        }
      }

      await createIssueWithNotification({
        title: newIssue.title,
        description: newIssue.description,
        communityId: newIssue.communityId,
        authorId: currentUser.id,
        image: uploadedUrls[0] || '',
        images: uploadedUrls,
      });

      toast({
        title: "Issue created successfully",
        description: "The issue has been reported and is now visible to the community",
      });

      setNewIssue({ title: '', description: '', communityId: currentUser.communityId || '', images: [] });
    } catch (error) {
      toast({
        title: "Failed to create issue",
        description: "There was an error creating the issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingIssue(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsCreatingCampaign(true);
    try {
      const uploadedUrls: string[] = [];
      if (newCampaign.images && newCampaign.images.length > 0) {
        const uploads = newCampaign.images.map((file) => {
          const imagePath = `campaigns/${Date.now()}-${file.name}`;
          return uploadFile(file, imagePath);
        });
        const settled = await Promise.allSettled(uploads);
        for (const r of settled) {
          if (r.status === 'fulfilled') uploadedUrls.push(r.value);
        }
        if (uploads.length > 0 && uploadedUrls.length === 0) {
          throw new Error('All image uploads failed');
        }
      }

      await createCampaignWithNotification({
        title: newCampaign.title,
        description: newCampaign.description,
        goal: parseFloat(newCampaign.goal),
        daysLeft: parseInt(newCampaign.duration),
        communityId: newCampaign.communityId,
        authorId: currentUser.id,
        image: uploadedUrls[0] || '',
        images: uploadedUrls,
        paymentMethods: newCampaign.paymentMethods,
      });

      toast({
        title: "Campaign launched successfully",
        description: "Your fundraising campaign is now active and accepting donations",
      });

      setNewCampaign({ title: '', description: '', goal: '', duration: '', communityId: currentUser.communityId || '', images: [], paymentMethods: [] });
    } catch (error) {
      console.error('Create campaign error:', error);
      toast({
        title: "Failed to create campaign",
        description: error instanceof Error ? error.message : "There was an error launching the campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleIssueFilesChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setNewIssue(prev => ({ ...prev, images: newFiles }));
  };

  const handleCampaignFilesChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setNewCampaign(prev => ({ ...prev, images: newFiles }));
  };

  const renderStatistics = () => (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Statistics</h1>
        <p className="text-muted-foreground">Overview of your community activity.</p>
      </motion.header>

      {(issuesLoading || campaignsLoading || statsLoading) && (
        <LoadingSkeleton type="dashboard" />
      )}

      {!statsLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
        <Card className="bg-card border-border" data-testid="card-admin-stats-users">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-1/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-chart-1" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-total-users">
                {adminStats.totalUsers.toLocaleString()}
              </span>
            </div>
            <h3 className="font-medium text-card-foreground">Total Users</h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border" data-testid="card-admin-stats-campaigns">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-2/20 rounded-lg flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-chart-2" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-active-campaigns">
                {adminStats.activeCampaigns}
              </span>
            </div>
            <h3 className="font-medium text-card-foreground">Active Campaigns</h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border" data-testid="card-admin-stats-donations">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-3/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-chart-3" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-total-donations">
                ₨{(adminStats.totalDonations / 1000000).toFixed(1)}M
              </span>
            </div>
            <h3 className="font-medium text-card-foreground">Total Donations</h3>
          </CardContent>
        </Card>

        <Card className="bg-card border-border" data-testid="card-admin-stats-issues">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-4/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-chart-4" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-pending-issues">
                {adminStats.pendingIssues}
              </span>
            </div>
            <h3 className="font-medium text-card-foreground">Pending Issues</h3>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {/* Content Grid merged from Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trending Issues */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gradient">Trending Issues</h2>
            <Button 
              variant="ghost" 
              className="text-primary hover:underline" 
              data-testid="button-view-all-issues"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-view', { detail: { view: 'admin-issues' } }))}
            >
              View all
            </Button>
          </div>

          <div className="space-y-4">
            {(!issues || issues.length === 0) ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">No Issues Yet</h3>
                  <p className="text-muted-foreground">
                    There are no issues reported in your community yet. Be the first to report a community issue.
                  </p>
                </CardContent>
              </Card>
            ) : (
              (issues as any[]).slice(0, 5).map((issue: any) => (
                <Card 
                  key={issue.id}
                  className="bg-card border-border hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleOpenPost(issue)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-card-foreground text-sm truncate">{issue.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{issue.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {issue.likesCount || 0} likes • {issue.commentsCount || 0} comments
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {issue.createdAt?.toDate ? 
                              new Date(issue.createdAt.toDate()).toLocaleDateString() : 
                              'Recently'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>

        {/* Active Campaigns */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gradient">Active Campaigns</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:underline" 
              data-testid="button-view-all-campaigns"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-view', { detail: { view: 'admin-campaigns' } }))}
            >
              View all
            </Button>
          </div>

          <div className="space-y-4">
            {(!campaigns || campaigns.length === 0) ? (
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-card-foreground mb-2">No Active Campaigns</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no fundraising campaigns at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              (campaigns as any[]).slice(0, 3).map((campaign: any) => (
                <Card 
                  key={campaign.id} 
                  className="bg-card border-border hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleDonate(campaign.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-card-foreground text-sm truncate">{campaign.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            ₨{(campaign.raised || 0).toLocaleString()} raised
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {campaign.createdAt?.toDate ? 
                              new Date(campaign.createdAt.toDate()).toLocaleDateString() : 
                              'Recently'
                            }
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${Math.min(((campaign.raised || 0) / (campaign.goal || 1)) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>
      </div>


      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={handleCloseDonationModal}
        campaign={selectedCampaign}
      />
    </>
  );

  const renderCreateIssue = () => (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Add Issue</h1>
        <p className="text-muted-foreground">Report a new community issue.</p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Create New Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <Label htmlFor="issue-title" className="text-card-foreground">Issue Title</Label>
                <Input
                  id="issue-title"
                  type="text"
                  placeholder="Enter issue title"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="bg-input border-border text-card-foreground"
                  data-testid="input-issue-title"
                />
              </div>

              <div>
                <Label htmlFor="issue-description" className="text-card-foreground">Description</Label>
                <Textarea
                  id="issue-description"
                  placeholder="Describe the issue in detail..."
                  value={newIssue.description}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="bg-input border-border text-card-foreground resize-none"
                  rows={4}
                  data-testid="textarea-issue-description"
                />
              </div>

              {/* Community is auto-selected from leader's profile; no dropdown needed */}

              <div>
                <Label className="text-card-foreground">Upload Images</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-2">Click to upload or drag and drop</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={issueFileInputRef}
                    onChange={(e) => handleIssueFilesChange(e.target.files)}
                    className="hidden"
                    id="issue-image-upload"
                    data-testid="input-issue-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => issueFileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                  {newIssue.images && newIssue.images.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {newIssue.images.map(f => f.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isCreatingIssue}
                className="w-full bg-primary text-primary-foreground"
                data-testid="button-create-issue"
              >
                {isCreatingIssue ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Issue
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );

  const renderCreateCampaign = () => (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Raise Campaign</h1>
        <p className="text-muted-foreground">Launch a fundraising campaign.</p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Create New Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <Label htmlFor="campaign-title" className="text-card-foreground">Campaign Title</Label>
                <Input
                  id="campaign-title"
                  type="text"
                  placeholder="Enter campaign title"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="bg-input border-border text-card-foreground"
                  data-testid="input-campaign-title"
                />
              </div>

              <div>
                <Label htmlFor="campaign-description" className="text-card-foreground">Description</Label>
                <Textarea
                  id="campaign-description"
                  placeholder="Describe the fundraising goals..."
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="bg-input border-border text-card-foreground resize-none"
                  rows={3}
                  data-testid="textarea-campaign-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign-goal" className="text-card-foreground">Goal Amount (₨)</Label>
                  <Input
                    id="campaign-goal"
                    type="number"
                    placeholder="500000"
                    value={newCampaign.goal}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, goal: e.target.value }))}
                    required
                    min="1000"
                    className="bg-input border-border text-card-foreground"
                    data-testid="input-campaign-goal"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-duration" className="text-card-foreground">Duration (Days)</Label>
                  <Input
                    id="campaign-duration"
                    type="number"
                    placeholder="30"
                    value={newCampaign.duration}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, duration: e.target.value }))}
                    required
                    min="1"
                    max="365"
                    className="bg-input border-border text-card-foreground"
                    data-testid="input-campaign-duration"
                  />
                </div>
              </div>

              {/* Community is auto-selected from leader's profile; no dropdown needed */}

              <div>
                <Label className="text-card-foreground">Campaign Images</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-2">Upload campaign images (you can select multiple)</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={campaignFileInputRef}
                    onChange={(e) => handleCampaignFilesChange(e.target.files)}
                    className="hidden"
                    id="campaign-image-upload"
                    data-testid="input-campaign-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => campaignFileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                  {newCampaign.images && newCampaign.images.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {newCampaign.images.map(f => f.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-card-foreground">Payment Methods</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={newCampaign.paymentMethods.includes('jazzcash')}
                      onCheckedChange={(checked) => {
                        setNewCampaign(prev => ({
                          ...prev,
                          paymentMethods: checked
                            ? Array.from(new Set([...(prev.paymentMethods || []), 'jazzcash']))
                            : (prev.paymentMethods || []).filter(m => m !== 'jazzcash')
                        }));
                      }}
                    />
                    <span>JazzCash</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={newCampaign.paymentMethods.includes('easypaisa')}
                      onCheckedChange={(checked) => {
                        setNewCampaign(prev => ({
                          ...prev,
                          paymentMethods: checked
                            ? Array.from(new Set([...(prev.paymentMethods || []), 'easypaisa']))
                            : (prev.paymentMethods || []).filter(m => m !== 'easypaisa')
                        }));
                      }}
                    />
                    <span>EasyPaisa</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={newCampaign.paymentMethods.includes('raast')}
                      onCheckedChange={(checked) => {
                        setNewCampaign(prev => ({
                          ...prev,
                          paymentMethods: checked
                            ? Array.from(new Set([...(prev.paymentMethods || []), 'raast']))
                            : (prev.paymentMethods || []).filter(m => m !== 'raast')
                        }));
                      }}
                    />
                    <span>RAAST</span>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isCreatingCampaign}
                className="w-full bg-chart-2 text-white"
                data-testid="button-create-campaign"
              >
                {isCreatingCampaign ? (
                  <>Launching...</>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4 mr-2" />
                    Launch Campaign
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );

  return (
    <div className="ml-64 p-6">
      {currentView === 'admin-dashboard' && renderStatistics()}
      {currentView === 'admin-activity' && <AdminActivityDashboard />}
      {currentView === 'admin-issues' && <IssuesList />}
      {currentView === 'admin-campaigns' && <CampaignsList />}
      {currentView === 'admin-payment-methods' && <PaymentMethods />}
      {currentView === 'admin-reports' && <ReportsList mode="leader" />}
      {currentView === 'create-issue' && renderCreateIssue()}
      {currentView === 'create-campaign' && renderCreateCampaign()}

      {/* Donation Modal */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={handleCloseDonationModal}
        campaign={selectedCampaign}
      />

      {/* Post Modal */}
      <Dialog open={!!openPost} onOpenChange={handleClosePost}>
        <DialogContent className="sm:max-w-4xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden p-0">
          {openPost && (
            <div className="flex flex-col h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div 
                  className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => handleAuthorClick(openPost.authorId)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={openPost.authorImage || openPost.image} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                      {openPost.authorName?.charAt(0) || openPost.title?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {openPost.authorName || openPost.title || 'Community Leader'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatTimeAgo(openPost.createdAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClosePost}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Post Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    {openPost.title}
                  </h2>

                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    {openPost.description}
                  </p>

                  {/* Campaign-specific content */}
                  {openPost.goal && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fundraising Progress</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(openPost.raised || 0)} / {formatCurrency(openPost.goal)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(((openPost.raised || 0) / openPost.goal) * 100, 100)}
                        className="h-3 mb-2"
                      />
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{Math.round(((openPost.raised || 0) / openPost.goal) * 100)}% funded</span>
                        <span>{openPost.daysLeft || 0} days left</span>
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {((openPost.images && openPost.images.length > 0) || openPost.image) && (
                    <div className="mb-6">
                      <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                        <img
                          src={(openPost.images && openPost.images[imageIndex]) || openPost.image}
                          alt={openPost.title}
                          className="w-full h-64 object-cover"
                        />

                        {/* Image Navigation */}
                        {openPost.images && openPost.images.length > 1 && (
                          <>
                            <button
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                              onClick={() => setImageIndex((prev) => (prev - 1 + openPost.images.length) % openPost.images.length)}
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                              onClick={() => setImageIndex((prev) => (prev + 1) % openPost.images.length)}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                              {openPost.images.map((_: any, idx: number) => (
                                <span key={idx} className={`w-2 h-2 rounded-full ${idx === imageIndex ? 'bg-white' : 'bg-white/60'}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center space-x-6 mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePostLike}
                      disabled={postLikeLoading}
                      className={`flex items-center space-x-2 transition-colors ${
                        isPostLiked
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-slate-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isPostLiked ? 'fill-current' : ''}`} />
                      <span>{openPost.likesCount || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{openPost.commentsCount || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-slate-500 hover:text-orange-500 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </Button>

                    {/* Donate Button for Campaigns */}
                    {openPost.goal && (
                      <Button
                        onClick={() => {
                          handleClosePost();
                          handleDonate(openPost.id);
                        }}
                        className="ml-auto bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Donate Now
                      </Button>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="space-y-4 mb-6">
                    {commentsLoading ? (
                      <div className="text-center text-slate-500">Loading comments...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-center text-slate-500">No comments yet. Be the first to comment!</div>
                    ) : (
                      comments.map((comment: any) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.authorImage} />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                              {comment.authorName?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                  {comment.authorName || 'Anonymous'}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatTimeAgo(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="flex space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentUser?.profileImage} />
                      <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                        {currentUser?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addingComment}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Community Leader Profile Modal */}
      <CommunityLeaderProfileModal
        isOpen={isLeaderProfileOpen}
        onClose={() => {
          setIsLeaderProfileOpen(false);
          setSelectedLeader(null);
        }}
        leader={selectedLeader}
      />
    </div>
  );
}
