import React, { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { GlobeAltIcon, ArrowRightOnRectangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProPopup, setShowProPopup] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData = {
        ...(formData.name !== user?.name && { name: formData.name }),
        ...(formData.email !== user?.email && { email: formData.email }),
        ...(formData.password && { password: formData.password })
      };

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }

      await updateProfile(updateData);
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('خطا در به‌روزرسانی پروفایل');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
  };

  return (
    <div dir="rtl" className="flex flex-col min-h-screen bg-gray-50">
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="خروج از حساب"
        message="آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟"
        confirmText="خروج"
        cancelText="انصراف"
        type="warning"
      />

      {/* Pro Subscription Popup */}
      <ConfirmDialog
        isOpen={showProPopup}
        onClose={() => setShowProPopup(false)}
        onConfirm={() => {
          window.open('https://t.me/chatycharm', '_blank');
          setShowProPopup(false);
        }}
        title="ارتقا به حساب ویژه"
        message={
          <div className="space-y-4">
            <p>برای خرید اشتراک ویژه و دسترسی به امکانات بیشتر، به کانال تلگرام ما مراجعه کنید.</p>
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <p className="text-blue-900 font-bold text-center mb-4">
                قیمت اشتراک ویژه: ۵۰ هزار تومان (دائمی)
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">چت نامحدود با تمام مدل‌ها در روز</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">دسترسی به تمام مدل‌های ویژه</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">پشتیبانی اختصاصی</span>
                </div>
              </div>
            </div>
          </div>
        }
        confirmText="انتقال به تلگرام"
        cancelText="بعداً"
        type="info"
      />

      {/* Profile Info */}
      <div className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'ک'}
                </div>
              </div>
              {!isEditing ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {user?.name || 'کاربر'}
                    {user?.type === 'pro' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-500">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    )}
                  </h2>
                  <p className="text-gray-600 mb-4">{user?.email}</p>
                  <div className={`px-4 py-2 rounded-lg mb-4 ${user?.type === 'pro' ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className={`text-sm ${user?.type === 'pro' ? 'text-blue-800' : 'text-yellow-800'}`}>
                      {user?.type === 'pro' ? 'شما از تمام امکانات ویژه بهره‌مند هستید' : 'نوع حساب: رایگان'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ویرایش پروفایل
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit} className="w-full max-w-sm">
                  <div className="mb-4">
                    <label className="block text-right text-gray-700 text-sm font-bold mb-2">
                      نام
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-right text-gray-700 text-sm font-bold mb-2">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-right text-gray-700 text-sm font-bold mb-2">
                      رمز عبور جدید (اختیاری)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  </div>
                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || '',
                          email: user?.email || '',
                          password: '',
                        });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors ml-2"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ذخیره تغییرات
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Settings List */}
            <div className="space-y-2">
              {user?.type !== 'pro' ? (
                <button
                  onClick={() => setShowProPopup(true)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-colors border border-blue-200"
                >
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-6 w-6 text-blue-600 ml-3" />
                    <div className="flex flex-col items-start">
                      <span className="text-blue-900 font-semibold">خرید اشتراک ویژه</span>
                      <span className="text-xs text-blue-600">دسترسی به تمام امکانات</span>
                    </div>
                  </div>
                  <ChevronLeftIcon className="h-5 w-5 text-blue-500" />
                </button>
              ) : (
                <div className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-75">
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-6 w-6 text-gray-400 ml-3" />
                    <div className="flex flex-col items-start">
                      <span className="text-gray-600">اشتراک ویژه</span>
                      <span className="text-xs text-gray-500">شما کاربر ویژه هستید</span>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500 ml-3" />
                  <span className="text-gray-800">خروج</span>
                </div>
                <ChevronLeftIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 