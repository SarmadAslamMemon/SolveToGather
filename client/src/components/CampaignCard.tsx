import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDonate = () => {
    onDonate?.(campaign.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="hover-lift"
    >
      <Card className="bg-card border-border hover:shadow-lg transition-shadow duration-300" data-testid={`card-campaign-${campaign.id}`}>
        <CardContent className="p-6">
          {campaign.image && (
            <div className="mb-4">
              <img
                src={campaign.image}
                alt={campaign.title}
                className="w-full h-32 rounded-lg object-cover border border-border"
                data-testid={`img-campaign-${campaign.id}`}
              />
            </div>
          )}

          <h3 className="font-semibold text-card-foreground mb-2 text-lg" data-testid={`text-title-${campaign.id}`}>
            {campaign.title}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid={`text-description-${campaign.id}`}>
            {campaign.description}
          </p>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Raised</span>
              <span className="font-medium text-card-foreground">
                <span data-testid={`text-raised-${campaign.id}`}>{formatCurrency(campaign.raised)}</span> of{' '}
                <span data-testid={`text-goal-${campaign.id}`}>{formatCurrency(campaign.goal)}</span>
              </span>
            </div>

            <div className="relative">
              <Progress 
                value={progressClamped} 
                className="h-3 bg-muted"
                data-testid={`progress-${campaign.id}`}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-500"
                style={{ width: `${progressClamped}%` }}
              />
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
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
          </div>

          <Button
            onClick={handleDonate}
            className="w-full mt-4 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            data-testid={`button-donate-${campaign.id}`}
          >
            <Heart className="w-4 h-4 mr-2" />
            Donate Now
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
