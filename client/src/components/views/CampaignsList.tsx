import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCampaigns } from '@/hooks/useFirestore';
import CampaignCard from '@/components/CampaignCard';
import DonationModal from '@/components/DonationModal';
import { useState } from 'react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function CampaignsList() {
  const { currentUser } = useAuth();
  const { campaigns, loading } = useCampaigns(currentUser?.communityId, true);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  if (loading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  return (
    <div className="ml-64 p-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gradient">Campaigns</h1>
        <p className="text-muted-foreground">Active fundraising campaigns</p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No Active Campaigns</h3>
              <p className="text-muted-foreground">There are no fundraising campaigns at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign} 
              onDonate={(id) => {
                const c = campaigns.find(c => c.id === id);
                if (c) {
                  setSelectedCampaign(c);
                  setIsDonationOpen(true);
                }
              }} 
            />
          ))
        )}
      </div>

      <DonationModal 
        isOpen={isDonationOpen} 
        onClose={() => setIsDonationOpen(false)} 
        campaign={selectedCampaign} 
      />
    </div>
  );
}


