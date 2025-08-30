import { useState, useEffect } from 'react';
import { 
  getIssues, 
  getCampaigns, 
  subscribeToIssues, 
  subscribeToCampaigns 
} from '@/services/firebase';

export function useIssues(communityId?: string, realTime = false) {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (realTime) {
      const unsubscribe = subscribeToIssues((data) => {
        setIssues(data);
        setLoading(false);
      }, communityId);

      return unsubscribe;
    } else {
      const fetchIssues = async () => {
        try {
          setLoading(true);
          const data = await getIssues(communityId);
          setIssues(data);
        } catch (err) {
          setError('Failed to fetch issues');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchIssues();
    }
  }, [communityId, realTime]);

  return { issues, loading, error };
}

export function useCampaigns(communityId?: string, realTime = false) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (realTime) {
      const unsubscribe = subscribeToCampaigns((data) => {
        setCampaigns(data);
        setLoading(false);
      }, communityId);

      return unsubscribe;
    } else {
      const fetchCampaigns = async () => {
        try {
          setLoading(true);
          const data = await getCampaigns(communityId);
          setCampaigns(data);
        } catch (err) {
          setError('Failed to fetch campaigns');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchCampaigns();
    }
  }, [communityId, realTime]);

  return { campaigns, loading, error };
}
