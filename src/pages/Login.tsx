import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      // Login successful, redirect handled by AuthContext
    } catch (err) {
      // Error handling is now done with toast notifications in the auth service
    }
  };

  return (
    <div dir="rtl" className="flex flex-col min-h-screen bg-gray-50 p-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <img src="/logo.svg" alt="چتی چارم" className="w-25" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">خوش آمدید</h1>
          <p className="text-gray-700 mb-8">
            وارد حساب کاربری چتی چارم خود شوید
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="آدرس ایمیل"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 text-right"
                required
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 text-right"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'در حال ورود...' : 'ورود'}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              حساب کاربری ندارید؟{' '}
              <Link to="/register" className="text-black font-medium">
                ثبت نام رایگان
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 