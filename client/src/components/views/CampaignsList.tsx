import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCampaigns } from '@/hooks/useFirestore';
import CampaignCard from '@/components/CampaignCard';
import DonationModal from '@/components/DonationModal';
import { useState } from 'react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface CampaignsListProps {
  superAdminMode?: boolean;
}

export default function CampaignsList({ superAdminMode = false }: CampaignsListProps) {
  const { currentUser, selectedRole } = useAuth();
  // For super admin, pass undefined to fetch all campaigns regardless of community
  const { campaigns, loading } = useCampaigns(superAdminMode ? undefined : currentUser?.communityId, true);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  const isAdmin = currentUser?.role === 'community_leader' || currentUser?.role === 'super_user';
  const showDelete = isAdmin && (superAdminMode || (currentUser?.role === 'community_leader' && selectedRole === 'leader'));

  if (loading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  return (
    <div className={superAdminMode ? 'p-0' : 'p-4 sm:p-6'}>
      {!superAdminMode && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 sm:mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Campaigns</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Active fundraising campaigns</p>
        </motion.header>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {campaigns.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 sm:p-8 text-center">
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-card-foreground mb-2">No Active Campaigns</h3>
              <p className="text-sm sm:text-base text-muted-foreground">There are no fundraising campaigns at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign}
              showDelete={showDelete}
              onDonate={(id) => {
                const c = campaigns.find(c => c.id === id);
                if (c) {
                  setSelectedCampaign(c);
                  setIsDonationOpen(true);
                }
              }}
              onDelete={(id) => {
                // Campaign will be removed from list automatically via real-time updates
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


