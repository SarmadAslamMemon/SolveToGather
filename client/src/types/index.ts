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
  firstName: string;
  lastName: string;
  address: string;
  nic: string;
  phoneNumber: string;
  role: string;
  communityId?: string;
  profileImage?: string;
  firebaseUid?: string; // Firebase Auth UID for reference
  emailVerified?: boolean; // Email verification status
  createdAt?: Date;
  issuesPosted?: string[];
  campaignsPosted?: string[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'jazzcash' | 'easypaisa' | 'bank' | 'raast';
}

export interface DonationSummary {
  amount: number;
  fee: number;
  total: number;
}

export interface Payment {
  id: string;
  campaignId: string;
  communityId: string;
  userId: string;
  amount: number;
  fee: number;
  total: number;
  paymentMethod: 'jazzcash' | 'easypaisa' | 'bank' | 'raast';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  userTransactionId?: string;
  jazzcashTransactionId?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface JazzCashCredentials {
  merchantId: string;
  password: string;
  hashKey: string;
  environment: 'sandbox' | 'live';
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'donation' | 'issue' | 'campaign' | 'user';
  timestamp: Date;
  read: boolean;
}
