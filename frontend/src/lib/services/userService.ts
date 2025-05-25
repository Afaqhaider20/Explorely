import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export interface UpdateProfileData {
  username?: string;
  bio?: string;
  avatar?: File;
}

export const getUserProfile = async (token: string): Promise<UserProfile> => {
  try {
    if (!token) {
      throw new Error('No authentication token found');
    }
    const response = await axios.get(`${API_URL}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Response received:', response.status);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      if (error.response?.status === 401) {
        throw new Error('Please login to view your profile');
      }
    }
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (token: string, data: UpdateProfileData): Promise<UserProfile> => {
  try {
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Preparing form data for profile update');
    const formData = new FormData();
    if (data.username) formData.append('username', data.username);
    if (data.bio) formData.append('bio', data.bio);
    if (data.avatar) formData.append('avatar', data.avatar);

    console.log('Making API request to update profile');
    const response = await axios.put(`${API_URL}/api/users/profile`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });
    
    console.log('Profile update API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      if (error.response?.status === 401) {
        throw new Error('Please login to update your profile');
      }
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
    throw error;
  }
};

export const getUserProfileById = async (token: string, userId: string): Promise<UserProfile> => {
  try {
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Validate userId format before making the request
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid user ID format');
    }

    const response = await axios.get(`${API_URL}/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error('Axios error details:', {
        status,
        data,
        message: error.message,
        url: error.config?.url
      });

      switch (status) {
        case 400:
          throw new Error('Invalid user ID format');
        case 401:
          throw new Error('Please login to view profiles');
        case 404:
          throw new Error('User not found');
        default:
          throw new Error(data?.message || 'Failed to fetch user profile');
      }
    }
    
    // If it's our own error (like invalid ID format)
    if (error instanceof Error) {
      throw error;
    }
    
    // For any other unexpected errors
    throw new Error('An unexpected error occurred');
  }
};
