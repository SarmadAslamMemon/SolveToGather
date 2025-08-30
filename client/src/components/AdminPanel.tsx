import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createIssue, createCampaign, uploadFile } from '@/services/firebase';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Upload, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  BarChart3,
  Calendar,
  UserPlus,
  Megaphone,
  Flag
} from 'lucide-react';

interface NewIssueData {
  title: string;
  description: string;
  communityId: string;
  image?: File;
}

interface NewCampaignData {
  title: string;
  description: string;
  goal: string;
  duration: string;
  communityId: string;
  image?: File;
}

export default function AdminPanel() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [newIssue, setNewIssue] = useState<NewIssueData>({
    title: '',
    description: '',
    communityId: '',
  });

  const [newCampaign, setNewCampaign] = useState<NewCampaignData>({
    title: '',
    description: '',
    goal: '',
    duration: '',
    communityId: '',
  });

  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  // Mock admin stats - in production, this would come from Firebase
  const adminStats = {
    totalUsers: 1247,
    activeCampaigns: 18,
    totalDonations: 4200000,
    pendingIssues: 7,
  };

  // Mock recent activity - in production, this would come from Firebase
  const recentActivity = [
    {
      id: '1',
      message: 'New user "Ahmad Khan" joined Gulshan-e-Iqbal community',
      timestamp: '2 minutes ago',
      icon: UserPlus,
      color: 'text-chart-1',
    },
    {
      id: '2',
      message: '₨5,000 donated to "Emergency Relief Fund" campaign',
      timestamp: '15 minutes ago',
      icon: DollarSign,
      color: 'text-chart-2',
    },
    {
      id: '3',
      message: 'New issue "Street Light Repairs" reported in Korangi',
      timestamp: '1 hour ago',
      icon: Flag,
      color: 'text-chart-3',
    },
  ];

  const communities = [
    { id: 'gulshan', name: 'Gulshan-e-Iqbal' },
    { id: 'korangi', name: 'Korangi' },
    { id: 'orangi', name: 'Orangi Town' },
  ];

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsCreatingIssue(true);
    try {
      let imageUrl = '';
      
      if (newIssue.image) {
        const imagePath = `issues/${Date.now()}-${newIssue.image.name}`;
        imageUrl = await uploadFile(newIssue.image, imagePath);
      }

      await createIssue({
        title: newIssue.title,
        description: newIssue.description,
        communityId: newIssue.communityId,
        authorId: currentUser.id,
        image: imageUrl,
      });

      toast({
        title: "Issue created successfully",
        description: "The issue has been reported and is now visible to the community",
      });

      setNewIssue({ title: '', description: '', communityId: '' });
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
      let imageUrl = '';
      
      if (newCampaign.image) {
        const imagePath = `campaigns/${Date.now()}-${newCampaign.image.name}`;
        imageUrl = await uploadFile(newCampaign.image, imagePath);
      }

      await createCampaign({
        title: newCampaign.title,
        description: newCampaign.description,
        goal: parseFloat(newCampaign.goal),
        daysLeft: parseInt(newCampaign.duration),
        communityId: newCampaign.communityId,
        authorId: currentUser.id,
        image: imageUrl,
      });

      toast({
        title: "Campaign launched successfully",
        description: "Your fundraising campaign is now active and accepting donations",
      });

      setNewCampaign({ title: '', description: '', goal: '', duration: '', communityId: '' });
    } catch (error) {
      toast({
        title: "Failed to create campaign",
        description: "There was an error launching the campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleImageUpload = (file: File, type: 'issue' | 'campaign') => {
    if (type === 'issue') {
      setNewIssue(prev => ({ ...prev, image: file }));
    } else {
      setNewCampaign(prev => ({ ...prev, image: file }));
    }
  };

  return (
    <div className="ml-64 p-6">
      {/* Admin Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your community platform and oversee all activities.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-chart-2 text-white" data-testid="button-create-campaign">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
            <Button variant="destructive" data-testid="button-report-issue">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Admin Stats */}
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

      {/* Content Creation and Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create New Issue Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
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

                <div>
                  <Label htmlFor="issue-community" className="text-card-foreground">Community</Label>
                  <Select
                    value={newIssue.communityId}
                    onValueChange={(value) => setNewIssue(prev => ({ ...prev, communityId: value }))}
                    required
                  >
                    <SelectTrigger className="bg-input border-border" data-testid="select-issue-community">
                      <SelectValue placeholder="Select Community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-card-foreground">Upload Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground mb-2">Click to upload or drag and drop</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'issue');
                      }}
                      className="hidden"
                      id="issue-image-upload"
                      data-testid="input-issue-image"
                    />
                    <label htmlFor="issue-image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm">
                        Choose File
                      </Button>
                    </label>
                    {newIssue.image && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {newIssue.image.name}
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

        {/* Create New Campaign Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
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

                <div>
                  <Label htmlFor="campaign-community" className="text-card-foreground">Community</Label>
                  <Select
                    value={newCampaign.communityId}
                    onValueChange={(value) => setNewCampaign(prev => ({ ...prev, communityId: value }))}
                    required
                  >
                    <SelectTrigger className="bg-input border-border" data-testid="select-campaign-community">
                      <SelectValue placeholder="Select Community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-card-foreground">Campaign Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground mb-2">Upload campaign image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'campaign');
                      }}
                      className="hidden"
                      id="campaign-image-upload"
                      data-testid="input-campaign-image"
                    />
                    <label htmlFor="campaign-image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm">
                        Choose File
                      </Button>
                    </label>
                    {newCampaign.image && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {newCampaign.image.name}
                      </p>
                    )}
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
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8"
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-4 p-4 hover:bg-muted rounded-lg transition-colors"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-card-foreground" data-testid={`activity-message-${activity.id}`}>
                        {activity.message}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`activity-timestamp-${activity.id}`}>
                        {activity.timestamp}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
