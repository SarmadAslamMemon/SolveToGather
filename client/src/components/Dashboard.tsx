import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import IssueCard from './IssueCard';
import CampaignCard from './CampaignCard';
import DonationModal from './DonationModal';
import LoadingSkeleton from './LoadingSkeleton';
import { useIssues, useCampaigns } from '@/hooks/useFirestore';
import { Bell, Plus, AlertTriangle, DollarSign, Users } from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [notificationCount] = useState(3);

  const { issues, loading: issuesLoading } = useIssues(undefined, true);
  const { campaigns, loading: campaignsLoading } = useCampaigns(undefined, true);

  // Mock stats data - in production, this would come from Firebase
  const stats = {
    activeIssues: issues.length,
    totalRaised: campaigns.reduce((sum, campaign) => sum + (campaign.raised || 0), 0),
    communityMembers: 1247,
  };

  const handleDonate = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setSelectedCampaign(campaign);
      setIsDonationModalOpen(true);
    }
  };

  const handleCloseDonationModal = () => {
    setIsDonationModalOpen(false);
    setSelectedCampaign(null);
  };

  if (issuesLoading || campaignsLoading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  return (
    <div className="ml-64 p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2" data-testid="text-welcome">
              Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening in your community today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Button className="btn-primary" data-testid="button-new-post">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <Card className="bg-card border-border card-hover" data-testid="card-stats-issues">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-1/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-chart-1" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-active-issues">
                {stats.activeIssues}
              </span>
            </div>
            <h3 className="font-medium text-card-foreground mb-1">Active Issues</h3>
            <p className="text-sm text-muted-foreground">Community challenges</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border card-hover" data-testid="card-stats-raised">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-2/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-chart-2" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-total-raised">
                ₨{(stats.totalRaised / 1000000).toFixed(1)}M
              </span>
            </div>
            <h3 className="font-medium text-card-foreground mb-1">Total Raised</h3>
            <p className="text-sm text-muted-foreground">Funds collected</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border card-hover" data-testid="card-stats-members">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-3/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-chart-3" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-community-members">
                {stats.communityMembers.toLocaleString()}
              </span>
            </div>
            <h3 className="font-medium text-card-foreground mb-1">Community Members</h3>
            <p className="text-sm text-muted-foreground">Active participants</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Grid */}
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
            <Button variant="ghost" className="text-primary hover:underline" data-testid="button-view-all-issues">
              View all
            </Button>
          </div>

          <div className="space-y-6">
            {issues.length === 0 ? (
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
              issues.slice(0, 5).map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onLike={(issueId) => console.log('Liked issue:', issueId)}
                  onComment={(issueId) => console.log('Comment on issue:', issueId)}
                  onShare={(issueId) => console.log('Share issue:', issueId)}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* Fundraising Campaigns */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gradient">Active Campaigns</h2>
            <Button variant="ghost" size="sm" className="text-primary hover:underline" data-testid="button-view-all-campaigns">
              View all
            </Button>
          </div>

          <div className="space-y-6">
            {campaigns.length === 0 ? (
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
              campaigns.slice(0, 3).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onDonate={handleDonate}
                />
              ))
            )}
          </div>

          {/* Quick Actions */}
          <Card className="mt-8 bg-card border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-card-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  data-testid="button-report-issue"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  data-testid="button-join-community"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Join Community
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  data-testid="button-volunteer"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Volunteer
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Donation Modal */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={handleCloseDonationModal}
        campaign={selectedCampaign}
      />
    </div>
  );
}
