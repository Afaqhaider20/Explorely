import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface UserCommunity {
  _id: string;
  name: string;
  description: string;
  avatar: string;
  members: Array<{
    _id: string;
    username: string;
    avatar: string;
  }>;
  memberCount: number;
}

export interface UserPost {
  _id: string;
  title: string;
  content: string;
  community: {
    _id: string;
    name: string;
  };
  media: string | null;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface UserProfile {
  _id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  karma: {
    total: number;
    postKarma: number;
    commentKarma: number;
    lastCalculated: string;
  };
  joinedCommunities: UserCommunity[];
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  posts: UserPost[];
}

export const getUserProfile = async (token: string): Promise<UserProfile> => {
  try {
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error('Please login to view your profile');
    }
    console.error('Error fetching user profile:', error);
    throw error;
  }
};
