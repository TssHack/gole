// @ts-ignore - React is needed for JSX
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import chatService, { ChatModel } from '../services/chatService';
import { MagnifyingGlassIcon, SparklesIcon, HeartIcon, ShieldCheckIcon, ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

const Explore = () => {
  const [models, setModels] = useState<ChatModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ChatModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const isProUser = user?.type === 'pro'; // Assuming user object has a 'type' field
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      if (isAuthenticated) {
        setLoading(true);
        const data = await chatService.getChatModels();
        setModels(data);
        localStorage.setItem('chatModels', JSON.stringify(data));
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    fetchModels();
  }, [isAuthenticated]);

  const filteredModels = models.filter(model => 
    model.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.about.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedModels = filteredModels.reduce((acc, model) => {
    let category = model.botType || 'chat';
    // Group girlfriend and boyfriend under companion category
    if (category === 'girlfriend' || category === 'boyfriend') {
      category = 'companion';
    }
    if (!acc[category]) acc[category] = [];
    acc[category].push(model);
    return acc;
  }, {} as Record<string, ChatModel[]>);

  const categoryTitles = {
    chat: 'چت هوش مصنوعی',
    doctor: 'دستیار پزشکی',
    math: 'دستیار ریاضی',
    companion: 'همراه مجازی',
  };

  const categoryIcons = {
    chat: '💬',
    doctor: '👨‍⚕️',
    math: '🔢',
    companion: '🫂',
  };

  const createNewChat = (model: ChatModel) => {
    const savedChats = localStorage.getItem('chatHistory');
    const existingChats = savedChats ? JSON.parse(savedChats) : [];
    const newChat = {
      id: uuidv4(),
      title: 'گفتگوی جدید',
      model: model.id,
      modelTitle: model.title,
      about: model.about,
      date: new Date().toISOString(),
      messages: [],
    };
    const updatedChats = [...existingChats, newChat];
    localStorage.setItem('chatHistory', JSON.stringify(updatedChats));
    navigate(`/chat/${newChat.id}`, { replace: true });
  };

  const ModelDetailsPopup = ({ model, onClose }: { model: ChatModel; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <img
            src={model.avatar}
            alt={model.title}
            className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-gradient-to-r from-blue-500 to-purple-500"
          />
          <h3 className="text-2xl font-bold text-gray-900">{model.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{model.botType}</p>
        </div>
        <p className="text-gray-700 text-center mb-6">{model.about}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              createNewChat(model);
              onClose();
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            شروع گفتگو
          </button>
          <button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 transition-all"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );

  const features = {
    chat: {
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" />,
      title: "چت هوشمند",
      description: "با پیشرفته‌ترین مدل‌های هوش مصنوعی گفتگو کنید. پاسخ‌های دقیق و هوشمندانه برای تمام سوالات شما.",
      color: "blue"
    },
    companion: {
      icon: <HeartIcon className="w-5 h-5 text-purple-500" />,
      title: "همراه همیشگی",
      description: "در هر زمان و هر مکان، دستیار هوشمند شما آماده پاسخگویی و همراهی است. تجربه‌ای شخصی‌سازی شده برای شما.",
      color: "purple"
    },
    security: {
      icon: <ShieldCheckIcon className="w-5 h-5 text-pink-500" />,
      title: "امنیت کامل",
      description: "با خیال راحت گفتگو کنید. تمام اطلاعات شما با بالاترین استانداردهای امنیتی محافظت می‌شود.",
      color: "pink"
    }
  };

  const FeaturePopup = ({ feature, onClose }: { feature: keyof typeof features; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex flex-col items-center text-center mb-6 pt-4">
            <div className={`w-16 h-16 rounded-2xl bg-${features[feature].color}-100 flex items-center justify-center mb-4`}>
              {features[feature].icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{features[feature].title}</h3>
            <p className="text-gray-600 leading-relaxed">
              {features[feature].description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white">
        {/* Mobile App Style Container */}
        <div className="h-full flex flex-col">
          {/* Top Bar */}
          <div className="flex justify-between items-center p-6">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ورود
            </Link>
          </div>

          {/* Main Content - Full Height */}
          <div className="flex-1 flex flex-col justify-between px-6">
            {/* Hero Section */}
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="relative mb-8">
                <img src="/logo.svg" alt="Chatty Charm Logo" className="w-32 h-32 animate-float" />
                <SparklesIcon className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-ping" />
              </div>
              <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                چتی چارم
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                دستیار هوشمند شما برای هر سؤال و نیاز
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>توسعه شده توسط</span>
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-50 via-white to-red-50 border border-gradient-to-r from-green-200 via-white to-red-200">
                    <span className="bg-gradient-to-r from-green-600 via-gray-700 to-red-600 bg-clip-text text-transparent font-bold">
                      برنامه‌نویسان ایرانی
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>ساخته شده با</span>
                  <div className="flex flex-wrap justify-center items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 font-medium border border-blue-200">React</span>
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 font-medium border border-blue-200">TypeScript</span>
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-600 font-medium border border-red-200">NestJS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Pills - Horizontally Scrollable */}
            <div className="flex gap-3 overflow-x-auto py-4 no-scrollbar">
              {Object.entries(features).map(([key, feature]) => (
                <div
                  key={key}
                  onClick={() => setSelectedFeature(key)}
                  className="flex-none bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm flex items-center gap-2 active:scale-95 transition-transform cursor-pointer hover:shadow-md"
                >
                  {feature.icon}
                  <span className="text-sm whitespace-nowrap">{feature.title}</span>
                </div>
              ))}
            </div>

            {/* Bottom Action Area */}
            <div className="py-8">
              <Link
                to="/register"
                className="block w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl text-center font-semibold shadow-lg shadow-purple-200/50 active:scale-[0.98] transition-transform"
              >
                شروع کنید
              </Link>
            </div>
          </div>

          {/* Feature Description Popup */}
          {selectedFeature && (
            <FeaturePopup
              feature={selectedFeature as keyof typeof features}
              onClose={() => setSelectedFeature(null)}
            />
          )}

          {/* Animated Background Elements - More Subtle */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {selectedModel && <ModelDetailsPopup model={selectedModel} onClose={() => setSelectedModel(null)} />}
        
        {/* Search Input */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در مدل‌ها..."
              className="w-full px-4 py-3 pr-12 rounded-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {Object.entries(groupedModels).length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">هیچ مدلی با این عبارت پیدا نشد!</p>
          </div>
        ) : (
          Object.entries(groupedModels).map(([category, categoryModels]) => (
            <div key={category} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {categoryTitles[category as keyof typeof categoryTitles]}
                  </h2>
                </div>
                <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                  {categoryModels.length} مدل
                </span>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300">
                {categoryModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className="flex-none w-40 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  >
                    <div className="p-4 flex flex-col items-center">
                      <div className="relative w-20 h-20 mb-3">
                        <img
                          src={model.avatar}
                          alt={model.title}
                          className="w-full h-full rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-500 transition-all duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.svg';
                          }}
                        />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-center text-sm mb-1 line-clamp-1">
                        {model.title}
                      </h3>
                      <p className="text-xs text-gray-500 text-center">
                        {isProUser ? (
                          <span className="text-green-600">نامحدود</span>
                        ) : model.limit === -1 ? (
                          <span className="text-green-600">نامحدود</span>
                        ) : (
                          `${model.limit} پیام/روز`
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Explore;

// Update the styles
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;
document.head.appendChild(style);