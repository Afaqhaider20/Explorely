export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  joinedCommunities: JoinedCommunity[];
}

export interface JoinedCommunity {
  _id: string;
  name: string;
  avatar: string;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  name: string;
  email: string;
  password: string;
}

export interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
  };
  community: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityRule {
  id: string;
  content: string;
}

export interface Community {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  members: string[];
  messages: Message[];
  rules: CommunityRule[];
  createdAt: string;
  updatedAt: string;
}
