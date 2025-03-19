import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'https://myaiapp-chi.vercel.app/auth';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
  type: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
}

// Save user to localStorage
const saveUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Get user from localStorage
export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Get auth token
export const getToken = (): string | null => {
  const user = getUser();
  return user ? user.token : null;
};

// Register user
export const register = async (data: RegisterData): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/register`, data, {
      timeout: 0,
    });
    const user = response.data;
    saveUser(user);
    toast.success('حساب کاربری با موفقیت ایجاد شد');
    return user;
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 409) {
        const errorMsg = 'این ایمیل قبلاً ثبت شده است';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      } else if (error.response.status === 400) {
        const errorMsg = 'اطلاعات وارد شده نامعتبر است';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    }
    const errorMsg = 'خطا در ثبت نام';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

// Login user
export const login = async (data: LoginData): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/login`, data, {
      timeout: 0,
    });
    const user = response.data;
    saveUser(user);
    toast.success('با موفقیت وارد شدید');
    return user;
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      const errorMsg = 'ایمیل یا رمز عبور اشتباه است';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
    const errorMsg = 'خطا در ورود';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const token = getToken();
  if (!token) {
    const errorMsg = 'توکن احراز هویت یافت نشد';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const response = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 0,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      const errorMsg = 'توکن احراز هویت منقضی شده است';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
    const errorMsg = 'خطا در دریافت اطلاعات کاربر';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

// Update user
export const updateUser = async (data: UpdateUserData): Promise<User> => {
  const token = getToken();
  if (!token) {
    const errorMsg = 'توکن احراز هویت یافت نشد';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const response = await axios.put(`${API_URL}/update`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 0,
    });
    const updatedUser = response.data;
    saveUser(updatedUser);
    toast.success('پروفایل با موفقیت به‌روزرسانی شد');
    return updatedUser;
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 401) {
        const errorMsg = 'توکن احراز هویت منقضی شده است';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      } else if (error.response.status === 409) {
        const errorMsg = 'این ایمیل قبلاً ثبت شده است';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      } else if (error.response.status === 400) {
        const errorMsg = 'اطلاعات وارد شده نامعتبر است';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    }
    const errorMsg = 'خطا در به‌روزرسانی اطلاعات';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

// Logout
export const logout = (): void => {
  localStorage.removeItem('user');
  toast.success('با موفقیت خارج شدید');
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  updateUser,
  getUser,
  getToken
};

export default authService; 