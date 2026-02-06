// Types for API responses
export interface TaskData {
  id: string;
  type: 'feedback';
  data: {
    id: string;
    type: 'post' | 'account';
    name: string;
    username: string;
    profilePictureUrl: string;
    content?: string;
    tweetlink?: string;
    timestamp?: string;
    replies?: number;
    reposts?: number;
    likes?: number;
    views?: number;
    bio?: string;
    accountlink?: string;
    joinedDate?: string;
    followers?: number;
    following?: number;
    tweets?: number;
  };
}

export interface FeedbackResponse {
  success: boolean;
  feedbackId: string;
  rewardGranted: boolean;
  rewardAmount: number;
}

export interface ClaimResponse {
  success: boolean;
  amount: number;
}

export interface AdminReportRequest {
  reporterId: string;
  reportedUserId: string;
  reportedTwitterId: string;
  reason: string;
  description: string;
  postIds: string[];
  originalPostLink?: string;
}

export interface AdminReportResponse {
  success: boolean;
  reportId: string;
  message: string;
}

export interface SpaceTrackingRequest {
  twitterSpaceId: string;
  userId: string;
  hostName: string;
  joinedAt: string;
  leftAt: string;
  duration: number;
}

export interface SpaceTrackingResponse {
  success: boolean;
  spaceTrackingId: string;
  eligibleForGrant: boolean;
  rewardGranted: boolean;
}

export interface ProfileMetrics {
  overallScore: number;
  averageSignal: number;
  noiseRatio: number;
  leaderboardRank: number;
  participationBadges: string[];
}

export interface ProfileMetricsResponse {
  success: boolean;
  metrics: ProfileMetrics | null;
  message?: string;
}

export interface UserRewardsResponse {
  userId: string;
  totalAccumulated: number;
  dailyEarned: number;
  dailyCap: number;
  remainingCap: number;
  currentStreak: number;
  lastRewardDate: string | null;
}

export interface SubmitRewardResponse {
  success: boolean;
  rewardId: string;
  amount: number;
  reason: string;
}

export interface ReportData {
  reason: string;
  reporterId: string;
  reportedUserId?: string;
  reportedTwitterId?: string;
  description: string;
  postIds?: string[];
  screenshot?: string;
  url? : string;
  reportId: string;
  timestamp?: string;
}

// User Profile stored in localStorage
export interface UserProfile {
  id: string;
  twitterId: string;
  handle: string;
  name?: string;
  avatar?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  tweetCount?: number;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

