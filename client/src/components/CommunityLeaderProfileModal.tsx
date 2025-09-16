import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Mail, Phone, Calendar, Users, MessageCircle, Heart, X } from 'lucide-react';
import { getUserActivityCounts } from '@/services/firebase';

interface CommunityLeaderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  leader: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profileImage?: string;
    role: string;
    communityId: string;
    address: string;
    createdAt: any;
    issuesPosted?: string[];
    campaignsPosted?: string[];
  } | null;
}

export default function CommunityLeaderProfileModal({ isOpen, onClose, leader }: CommunityLeaderProfileModalProps) {
  const [activityCounts, setActivityCounts] = useState({ issuesCount: 0, campaignsCount: 0 });
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    if (leader?.id && isOpen) {
      setLoadingCounts(true);
      getUserActivityCounts(leader.id)
        .then((counts) => {
          setActivityCounts(counts);
        })
        .catch((error) => {
          console.error('Error fetching activity counts:', error);
          setActivityCounts({ issuesCount: 0, campaignsCount: 0 });
        })
        .finally(() => {
          setLoadingCounts(false);
        });
    }
  }, [leader?.id, isOpen]);

  if (!leader) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_user':
        return 'Super Admin';
      case 'community_leader':
        return 'Community Leader';
      default:
        return 'Community Member';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_user':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'community_leader':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-[90vh]">
          {/* Left Half - Profile Image */}
          <div className="w-1/2 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 flex items-center justify-center p-8">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-6 ring-4 ring-white dark:ring-slate-800 shadow-lg">
                <AvatarImage src={leader.profileImage} />
                <AvatarFallback className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-orange-500 text-white">
                  {leader.firstName?.charAt(0) || 'L'}
                </AvatarFallback>
              </Avatar>
              <Badge className={`text-sm font-medium px-3 py-1 ${getRoleColor(leader.role)}`}>
                {getRoleDisplay(leader.role)}
              </Badge>
            </div>
          </div>

          {/* Right Half - Details */}
          <div className="w-1/2 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Leader Profile
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {leader.firstName} {leader.lastName}
                          </p>
                          <p className="text-sm text-slate-500">Full Name</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {leader.email}
                          </p>
                          <p className="text-sm text-slate-500">Email Address</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {leader.phoneNumber}
                          </p>
                          <p className="text-sm text-slate-500">Phone Number</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {leader.address}
                          </p>
                          <p className="text-sm text-slate-500">Address</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {formatDate(leader.createdAt)}
                          </p>
                          <p className="text-sm text-slate-500">Joined Date</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Community Activity */}
                <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                      Community Activity
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                          {loadingCounts ? (
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          ) : (
                            activityCounts.issuesCount
                          )}
                        </p>
                        <p className="text-sm text-slate-500">Issues Posted</p>
                      </div>
                      
                      <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Heart className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                          {loadingCounts ? (
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          ) : (
                            activityCounts.campaignsCount
                          )}
                        </p>
                        <p className="text-sm text-slate-500">Campaigns Created</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Leadership Role */}
                <Card className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                      Leadership Role
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      As a {getRoleDisplay(leader.role).toLowerCase()}, this community leader is responsible for 
                      managing community issues, creating fundraising campaigns, and ensuring the well-being 
                      of community members. They play a vital role in maintaining community engagement and 
                      facilitating positive change.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
