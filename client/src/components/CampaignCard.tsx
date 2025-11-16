import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { deleteCampaign } from '@/services/firebase';
import { Heart, Users, Calendar, Trash2, Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CampaignCardProps {
  campaign: {
    id: string;
    title: string;
    description: string;
    goal: number;
    raised: number;
    image?: string;
    daysLeft: number;
    donorCount?: number;
    communityId?: string;
    authorId?: string;
    authorName?: string;
    authorImage?: string;
    createdAt?: any;
  };
  onDonate?: (campaignId: string) => void;
  onDelete?: (campaignId: string) => void;
  showDelete?: boolean;
}

export default function CampaignCard({ campaign, onDonate, onDelete, showDelete = false }: CampaignCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = currentUser?.role === 'community_leader' || currentUser?.role === 'super_user';
  const canDelete = showDelete && isAdmin && currentUser?.communityId === campaign.communityId;

  const progress = (campaign.raised / campaign.goal) * 100;
  const progressClamped = Math.min(progress, 100);
  const isGoalReached = Number(campaign.raised || 0) >= Number(campaign.goal || 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const handleDonate = () => {
    if (!isGoalReached) {
      onDonate?.(campaign.id);
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentUser || !currentUser.communityId) {
      toast({
        title: "Error",
        description: "Unable to delete campaign. Missing user or community information.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCampaign(campaign.id, currentUser.id, currentUser.communityId);
      toast({
        title: "Success",
        description: "Campaign deleted successfully.",
      });
      onDelete?.(campaign.id);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="hover-lift"
    >
      <Card className="bg-card border-border hover:shadow-lg transition-shadow duration-300 overflow-hidden" data-testid={`card-campaign-${campaign.id}`}>
        {/* Large Image */}
        {campaign.image && (
          <div className="relative">
            <img
              src={campaign.image}
              alt={campaign.title}
              className="w-full h-48 sm:h-56 object-cover"
              data-testid={`img-campaign-${campaign.id}`}
            />
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
              <span className="bg-black/60 text-white px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                {campaign.daysLeft}d left
              </span>
            </div>
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
              <div className="bg-black/60 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0 text-xs sm:text-sm mb-1">
                  <span>Raised</span>
                  <span className="font-semibold text-xs sm:text-sm">
                    {formatCurrency(campaign.raised)} / {formatCurrency(campaign.goal)}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1 sm:h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-orange-500 h-1 sm:h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressClamped}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-4 sm:p-5">
          {/* Author info */}
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
            <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
              <AvatarImage src={campaign.authorImage} />
              <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                {campaign.authorName?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base text-card-foreground font-medium truncate" data-testid={`text-author-${campaign.id}`}>
                {campaign.authorName || 'Community Leader'}
              </p>
              {campaign.createdAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(campaign.createdAt)}
                </p>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-card-foreground mb-2 text-lg sm:text-xl line-clamp-2" data-testid={`text-title-${campaign.id}`}>
            {campaign.title}
          </h3>
          
          {/* Description */}
          <p className="text-sm sm:text-base text-muted-foreground mb-3 line-clamp-3" data-testid={`text-description-${campaign.id}`}>
            {campaign.description}
          </p>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4 text-sm sm:text-base text-muted-foreground">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span data-testid={`text-donors-${campaign.id}`}>
                {campaign.donorCount || 0} donors
              </span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span data-testid={`text-days-left-${campaign.id}`}>
                {campaign.daysLeft} days left
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isGoalReached ? (
              <Button
                onClick={handleDonate}
                className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white text-sm sm:text-base py-4 sm:py-5"
                data-testid={`button-donate-${campaign.id}`}
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                Donate Now
              </Button>
            ) : (
              <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                <p className="text-sm sm:text-base font-medium text-green-600 dark:text-green-400">
                  ✓ Goal Achieved!
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  This campaign has reached its fundraising goal
                </p>
              </div>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-600 border-red-500 hover:border-red-600"
                data-testid={`button-delete-${campaign.id}`}
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{campaign.title}"? This action cannot be undone and will also delete all donations, comments, and likes associated with this campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
