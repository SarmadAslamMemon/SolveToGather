export interface UserRole {
  SUPER_USER: 'super_user';
  COMMUNITY_LEADER: 'community_leader';
  NORMAL_USER: 'normal_user';
}

export const USER_ROLES: UserRole = {
  SUPER_USER: 'super_user',
  COMMUNITY_LEADER: 'community_leader',
  NORMAL_USER: 'normal_user',
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  communityId?: string;
  profileImage?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'jazzcash' | 'easypaisa' | 'bank';
}

export interface DonationSummary {
  amount: number;
  fee: number;
  total: number;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'donation' | 'issue' | 'campaign' | 'user';
  timestamp: Date;
  read: boolean;
}
