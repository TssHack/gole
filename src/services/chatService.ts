import axios from 'axios';
import toast from 'react-hot-toast';
import { getToken } from './authService';

const API_URL = 'https://myaiapp-chi.vercel.app/chat';

export interface ChatModel {
  id: string;
  baseModel: string | null;
  limit: number;
  title: string;
  avatar: string;
  about: string;
  usage: string;
  botType?: string;
  systemPrompt?: string;
}

// Get chat models and limits
export const getChatModels = async (): Promise<ChatModel[]> => {
  const token = getToken();
  if (!token) {
    return []; // Return empty array if not authenticated
  }

  try {
    const response = await axios.get(`${API_URL}/limits`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 0,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      toast.error('Authentication token expired or invalid');
    } else {
      toast.error('Failed to fetch chat models');
    }
    return [];
  }
};

const chatService = {
  getChatModels
};

export default chatService; 