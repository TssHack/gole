import { Outlet, Link, useLocation } from 'react-router-dom';
import { ChatBubbleLeftIcon, UserIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const Layout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const isChatMessagesPage = location.pathname.startsWith('/chat/');
  
  useEffect(() => {
    // Add Vazirmatn font link to head
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Set RTL direction for the entire document
    document.documentElement.dir = 'rtl';
    document.body.classList.add('font-[Vazirmatn]');

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const navigation = [
    { name: 'کاوش', href: '/explore', icon: RocketLaunchIcon },
    { name: 'گفتگو', href: '/chat', icon: ChatBubbleLeftIcon },
    { name: 'پروفایل', href: '/profile', icon: UserIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-[Vazirmatn]" dir="rtl">
      {/* Header - only show when authenticated and not on chat messages page */}
      {isAuthenticated && !isChatMessagesPage && (
        <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-20">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <img className="w-auto h-8" src="/logo.svg" alt="چتی چارم" />
              <span className="mr-2 text-lg font-medium text-gray-900">چتی چارم</span>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={clsx(
        'flex-1',
        isAuthenticated && !isChatMessagesPage ? 'mt-14 mb-16' : ''
      )}>
        <Outlet />
      </main>

      {/* Mobile bottom navigation - only show when authenticated and not on chat messages page */}
      {isAuthenticated && !isChatMessagesPage && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="flex justify-around">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex flex-col items-center py-2 px-3',
                  location.pathname === item.href
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={clsx(
                    'h-6 w-6',
                    location.pathname === item.href
                      ? 'text-indigo-600'
                      : 'text-gray-400'
                  )}
                  aria-hidden="true"
                />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout; 