import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { ChevronRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';

interface ChatHistory {
  id: string;
  title: string;
  model: string;
  modelTitle: string;
  about: string;
  date: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

const Chat = () => {
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load existing chats
    const savedChats = localStorage.getItem('chatHistory');
    const existingChats = savedChats ? JSON.parse(savedChats) : [];
    setChats(existingChats);
    setIsLoading(false);

    // If we're on a specific chat page, validate that the chat exists
    if (id) {
      const chatExists = existingChats.some((chat: ChatHistory) => chat.id === id);
      if (!chatExists) {
        navigate('/chat', { replace: true });
      }
    }
  }, [isAuthenticated, id, navigate]);

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!chatToDelete) return;

    const updatedChats = chats.filter(chat => chat.id !== chatToDelete);
    setChats(updatedChats);
    localStorage.setItem('chatHistory', JSON.stringify(updatedChats));
    
    // If we're viewing the deleted chat, navigate back to chat list
    if (location.pathname === `/chat/${chatToDelete}`) {
      navigate('/chat');
    }

    setChatToDelete(null);
  };

  const saveChat = (updatedChat: ChatHistory) => {
    const updatedChats = chats.map(chat => 
      chat.id === updatedChat.id ? updatedChat : chat
    );
    setChats(updatedChats);
    localStorage.setItem('chatHistory', JSON.stringify(updatedChats));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">لطفا برای دسترسی به چت‌ها وارد شوید</p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            ورود
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If we're on a specific chat page and the chat exists, render the conversation
  if (id && chats.some(chat => chat.id === id)) {
    return (
      <Outlet context={{ chats, onSave: saveChat }} />
    );
  }

  // Otherwise, render the chat list
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setChatToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="حذف گفتگو"
        message="آیا از حذف این گفتگو اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="حذف"
        cancelText="انصراف"
        type="warning"
      />

      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-medium text-gray-900">تاریخچه گفتگوها</h1>
          <Link
            to="/explore"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronRightIcon className="h-5 w-5 ml-1" />
            گفتگوی جدید
          </Link>
        </div>
      </div>

      {/* Chat List */}
      <div className="max-w-3xl mx-auto p-4">
        {chats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">هنوز گفتگویی ندارید</p>
            <Link
              to="/explore"
              className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              شروع گفتگوی جدید
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {chats
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((chat) => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{chat.title}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="ml-4">{chat.modelTitle}</span>
                      <span>{new Date(chat.date).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(chat.id, e)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="حذف گفتگو"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
