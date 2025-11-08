import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, Calendar } from 'lucide-react';

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
  };
  onDonate?: (campaignId: string) => void;
}

export default function CampaignCard({ campaign, onDonate }: CampaignCardProps) {
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

  const handleDonate = () => {
    if (!isGoalReached) {
      onDonate?.(campaign.id);
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
              className="w-full h-48 object-cover"
              data-testid={`img-campaign-${campaign.id}`}
            />
            <div className="absolute top-3 right-3">
              <span className="bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
                {campaign.daysLeft}d left
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-black/60 text-white px-3 py-2 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span>Raised</span>
                  <span className="font-semibold">
                    {formatCurrency(campaign.raised)} / {formatCurrency(campaign.goal)}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-orange-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressClamped}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-card-foreground mb-2 text-lg line-clamp-2" data-testid={`text-title-${campaign.id}`}>
            {campaign.title}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-description-${campaign.id}`}>
            {campaign.description}
          </p>

          {/* Stats */}
          <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span data-testid={`text-donors-${campaign.id}`}>
                {campaign.donorCount || 0} donors
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span data-testid={`text-days-left-${campaign.id}`}>
                {campaign.daysLeft} days left
              </span>
            </div>
          </div>

          {/* Donate Button - Only show if goal not reached */}
          {!isGoalReached ? (
            <Button
              onClick={handleDonate}
              className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
              data-testid={`button-donate-${campaign.id}`}
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate Now
            </Button>
          ) : (
            <div className="w-full bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-center">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                ✓ Goal Achieved!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This campaign has reached its fundraising goal
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
