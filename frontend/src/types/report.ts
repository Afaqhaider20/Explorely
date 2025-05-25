export interface Report {
  _id: string;
  reporter: {
    _id: string;
    username: string;
    avatar?: string;
  };
  reportedType: 'community' | 'user' | 'post' | 'review';
  reportedPost?: {
    _id: string;
    title?: string;
    content?: string;
  };
  reportedReview?: {
    _id: string;
    title?: string;
    content?: string;
  };
  reportedCommunity?: {
    _id: string;
    name?: string;
    description?: string;
  };
  reportedUser?: {
    _id: string;
    username?: string;
    bio?: string;
  };
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
  __v?: number;
} 