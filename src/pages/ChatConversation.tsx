import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { useAuth } from '../context/AuthContext';
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  PencilIcon,
  ClipboardIcon,
  CheckIcon,
  ChevronRightIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import axios from 'axios';
import remarkGfm from 'remark-gfm';

// Helper function to detect RTL text
const isRTL = (text: string) => {
  const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  id: string;
  title: string;
  model: string;
  modelTitle: string;
  about: string;
  date: string;
  messages: Message[];
}

interface ChatContextType {
  chats: ChatState[];
  onSave: (chat: ChatState) => void;
}

const ChatConversation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chats, onSave } = useOutletContext<ChatContextType>();
  const [chat, setChat] = useState<ChatState | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const currentChat = chats.find(c => c.id === id);
    if (currentChat) {
      setChat(currentChat);
    } else {
      navigate('/chat');
    }
  }, [id, user, navigate, chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, currentStreamedMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const saveChat = (updatedChat: ChatState) => {
    setChat(updatedChat);
    onSave(updatedChat);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || isStreaming) return;

    let updatedMessages = [...chat.messages];
    
    // If we're editing a message, update that message and remove subsequent messages
    if (editingMessageIndex !== null) {
      // Update the message at the editing index
      updatedMessages[editingMessageIndex] = { role: 'user' as const, content: input };
      // Remove all messages after the edited message
      updatedMessages = updatedMessages.slice(0, editingMessageIndex + 1);
      
      // Save the chat with the edited message
      const updatedChat = {
        ...chat,
        messages: updatedMessages,
      };
      saveChat(updatedChat);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Get AI response for the edited message
      setIsStreaming(true);
      try {
        let fullResponse = '';
        let lastChunkResponse = '';
        await axios({
          method: 'post',
          url: 'https://myaiapp-chi.vercel.app/chat',
          data: {
            modelId: chat.model,
            messages: updatedMessages,
          },
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${user?.token}`,
          },
          timeout: 0,
          responseType: 'stream',
          onDownloadProgress: (progressEvent) => {
            const chunk = progressEvent.event.target.response;
            if (!chunk) return;

            const newChunk = chunk.substring(lastChunkResponse.length);
            lastChunkResponse = chunk;

            const lines = newChunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(5);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || '';
                  fullResponse += content;
                  setCurrentStreamedMessage(fullResponse);
                } catch (e) {
                  console.error('خطا در پردازش داده‌های استریم:', e);
                }
              }
            }
          },
        });

        // After streaming is complete, save the final message and clear editing state
        if (fullResponse) {
          const finalChat = {
            ...updatedChat,
            messages: [...updatedMessages, { role: 'assistant' as const, content: fullResponse }],
          };
          saveChat(finalChat);
          setEditingMessageIndex(null); // Clear editing state only after successful response
        }
      } catch (error: any) {
        console.error('خطا در ارسال پیام:', error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            toast.error('لطفا مجددا وارد شوید');
            navigate('/login');
          } else if (error.response?.status === 429) {
            toast.error('محدودیت روزانه - لطفا بعدا تلاش کنید');
          } else {
            toast.error(error.response?.data?.message || 'خطا در ارسال پیام');
          }
        } else {
          toast.error('خطا در ارسال پیام');
        }
      } finally {
        setIsStreaming(false);
        setCurrentStreamedMessage('');
      }
      return;
    }

    // If not editing, add new message as before
    const updatedChat = {
      ...chat,
      messages: [...updatedMessages, { role: 'user' as const, content: input }],
    };
    saveChat(updatedChat);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsStreaming(true);
    try {
      let fullResponse = '';
      let lastChunkResponse = '';
      await axios({
        method: 'post',
        url: 'https://myaiapp-chi.vercel.app/chat',
        data: {
          modelId: chat.model,
          messages: [...updatedChat.messages],
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${user?.token}`,
        },
        timeout: 0,
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          const chunk = progressEvent.event.target.response;
          if (!chunk) return;

          // Get only the new part of the response
          const newChunk = chunk.substring(lastChunkResponse.length);
          lastChunkResponse = chunk;

          const lines = newChunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                fullResponse += content;
                setCurrentStreamedMessage(fullResponse);
              } catch (e) {
                console.error('خطا در پردازش داده‌های استریم:', e);
              }
            }
          }
        },
      });

      // After streaming is complete, save the final message
      if (fullResponse) {
        const finalChat = {
          ...updatedChat,
          messages: [...updatedChat.messages, { role: 'assistant' as const, content: fullResponse }],
        };
        saveChat(finalChat);
      }
    } catch (error: any) {
      console.error('خطا در ارسال پیام:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('لطفا مجددا وارد شوید');
          navigate('/login');
        } else if (error.response?.status === 429) {
          toast.error('محدودیت روزانه - لطفا بعدا تلاش کنید');
        } else {
          toast.error(error.response?.data?.message || 'خطا در ارسال پیام');
        }
      } else {
        toast.error('خطا در ارسال پیام');
      }
    } finally {
      setIsStreaming(false);
      setCurrentStreamedMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Remove the Enter key submission
    if (e.key === 'Enter' && !e.shiftKey) {
      // Do nothing - let the user type multiline content
      return;
    }
  };

  const regenerateMessage = async (messageIndex: number) => {
    if (!chat || isStreaming) return;
    
    const messages = chat.messages.slice(0, messageIndex);
    const updatedChat = { ...chat, messages };
    saveChat(updatedChat);
    setCurrentStreamedMessage('');
    setIsStreaming(true);

    try {
      let fullResponse = '';
      let lastChunkResponse = '';
      await axios({
        method: 'post',
        url: 'https://myaiapp-chi.vercel.app/chat',
        data: {
          modelId: chat.model,
          messages: messages,
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${user?.token}`,
        },
        timeout: 0,
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          const chunk = progressEvent.event.target.response;
          if (!chunk) return;

          // Get only the new part of the response
          const newChunk = chunk.substring(lastChunkResponse.length);
          lastChunkResponse = chunk;

          const lines = newChunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                fullResponse += content;
                setCurrentStreamedMessage(fullResponse);
              } catch (e) {
                console.error('خطا در پردازش داده‌های استریم:', e);
              }
            }
          }
        },
      });

      // After streaming is complete, save the final message
      if (fullResponse) {
        const finalChat = {
          ...updatedChat,
          messages: [...messages, { role: 'assistant' as const, content: fullResponse }],
        };
        saveChat(finalChat);
      }
    } catch (error: any) {
      console.error('خطا در بازسازی پیام:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('لطفا مجددا وارد شوید');
          navigate('/login');
        } else if (error.response?.status === 429) {
          toast.error('محدودیت روزانه - لطفا بعدا تلاش کنید');
        } else if (error.response?.status === 400) {
          toast.error('درخواست نامعتبر است');
        } else {
          toast.error(error.response?.data?.message || 'خطا در بازسازی پیام');
        }
      } else {
        toast.error('خطا در بازسازی پیام');
      }
    } finally {
      setIsStreaming(false);
      setCurrentStreamedMessage('');
    }
  };

  const copyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
      toast.success('پیام کپی شد');
    } catch (error) {
      toast.error('خطا در کپی پیام');
    }
  };

  const editMessage = (index: number) => {
    if (!chat) return;
    const message = chat.messages[index];
    if (message.role === 'user') {
      setEditingMessageIndex(index);
      setInput(message.content);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const cancelEdit = () => {
    setEditingMessageIndex(null);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTitleEdit = () => {
    setNewTitle(chat?.title || '');
    setIsEditingTitle(true);
  };

  const saveTitleEdit = () => {
    if (!chat || !newTitle.trim()) return;
    
    const updatedChat = {
      ...chat,
      title: newTitle.trim()
    };
    saveChat(updatedChat);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitleEdit();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center flex-1">
            <Link to="/chat" className="text-gray-600 hover:text-gray-900 ml-2">
              <ChevronRightIcon className="h-5 w-5" />
            </Link>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={saveTitleEdit}
                onKeyDown={handleTitleKeyDown}
                className="text-xl font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="عنوان گفتگو"
              />
            ) : (
              <div className="flex items-center">
                <h1 className="text-xl font-medium text-gray-900">{chat?.title}</h1>
                <button
                  onClick={handleTitleEdit}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-full transition-colors ${
                showInfo ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <InformationCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">مدل هوش مصنوعی</h3>
                <p className="text-gray-900">{chat?.modelTitle || chat?.model}</p>
              </div>
              {chat?.about && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">درباره مدل</h3>
                  <p className="text-gray-900 text-sm">{chat.about}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">تاریخ ایجاد</h3>
                <p className="text-gray-900">{new Date(chat?.date).toLocaleDateString('fa-IR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {chat.messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
            >
              <div
                className={`relative max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white shadow-md'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs opacity-70">
                    {message.role === 'user' ? 'شما' : 'ربات'}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyMessage(message.content, index)}
                      className={`p-1 rounded transition-colors ${
                        message.role === 'user' 
                          ? 'hover:bg-blue-500 text-white' 
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="کپی پیام"
                    >
                      {copiedMessageIndex === index ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <ClipboardIcon className="h-4 w-4" />
                      )}
                    </button>
                    {message.role === 'user' && (
                      <button
                        onClick={() => editMessage(index)}
                        className="p-1 hover:bg-blue-500 text-white rounded transition-colors"
                        title="ویرایش پیام"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => regenerateMessage(index)}
                        className="p-1 hover:bg-gray-100 text-gray-500 rounded transition-colors"
                        title="تولید مجدد"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div 
                  className={`${
                    message.role === 'assistant' 
                      ? 'prose prose-sm max-w-none dark:prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-headings:mt-2 prose-headings:mb-2 prose-p:my-2 prose-img:my-2 prose-img:rounded-lg prose-strong:font-bold prose-strong:text-gray-900 prose-table:my-4 prose-table:w-full prose-table:border-collapse prose-td:border prose-td:p-2 prose-th:border prose-th:p-2 prose-th:bg-gray-100 [&_.katex-display]:my-4 [&_.katex]:mx-1' 
                      : ''
                  }`}
                  dir="auto"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code(props: any) {
                        const { inline, className, children } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const content = String(children).replace(/\n$/, '');

                        // Handle display math blocks
                        if (content.startsWith('\\[') && content.endsWith('\\]')) {
                          try {
                            const mathContent = content.slice(2, -2).trim();
                            return <BlockMath math={mathContent} errorColor="#EF4444" />;
                          } catch (error) {
                            console.error('LaTeX Error:', error);
                            return <code className="text-red-500">LaTeX Error: {content}</code>;
                          }
                        }

                        // Handle math code blocks
                        if (match && match[1] === 'math') {
                          try {
                            return <BlockMath math={content} errorColor="#EF4444" />;
                          } catch (error) {
                            console.error('LaTeX Error:', error);
                            return <code className="text-red-500">LaTeX Error: {content}</code>;
                          }
                        }

                        // Handle inline math with $ or \( \)
                        if (inline || 
                            (content.startsWith('$') && content.endsWith('$')) || 
                            (content.startsWith('\\(') && content.endsWith('\\)'))) {
                          try {
                            let mathContent = content;
                            if (content.startsWith('$')) {
                              mathContent = content.slice(1, -1);
                            } else if (content.startsWith('\\(')) {
                              mathContent = content.slice(2, -2);
                            }
                            return <InlineMath math={mathContent} errorColor="#EF4444" />;
                          } catch (error) {
                            console.error('LaTeX Error:', error);
                            return <code className="text-red-500">LaTeX Error: {content}</code>;
                          }
                        }

                        // Regular code blocks
                        if (!inline && match) {
                          return (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                            >
                              {content}
                            </SyntaxHighlighter>
                          );
                        }

                        // Regular inline code
                        return <code className={className}>{children}</code>;
                      },
                      p(props: any) {
                        const { children, ...rest } = props;
                        if (typeof children === 'string') {
                          // Enhanced regex pattern for LaTeX delimiters including direct display math
                          const parts = children.split(/((?:\$[^$\n]+\$)|(?:\[.*?\])|(?:\\\[[^\]]+\\\])|(?:\\\([^)]+\\\))|\n+)/g);
                          
                          return (
                            <p {...rest}>
                              {parts.map((part, i) => {
                                // Handle newlines
                                if (part.match(/^\n+$/)) {
                                  const breakCount = part.length;
                                  return Array(breakCount).fill(<br key={`${i}-br`} />);
                                }

                                // Handle direct display math with [...]
                                if (part.startsWith('[') && part.endsWith(']')) {
                                  try {
                                    const math = part.slice(1, -1).trim();
                                    return <BlockMath key={i} math={math} errorColor="#EF4444" />;
                                  } catch (error) {
                                    console.error('LaTeX Error:', error);
                                    return <code key={i} className="text-red-500">LaTeX Error: {part}</code>;
                                  }
                                }

                                // Handle display math with \[...\]
                                if (part.startsWith('\\[') && part.endsWith('\\]')) {
                                  try {
                                    const math = part.slice(2, -2).trim();
                                    return <BlockMath key={i} math={math} errorColor="#EF4444" />;
                                  } catch (error) {
                                    console.error('LaTeX Error:', error);
                                    return <code key={i} className="text-red-500">LaTeX Error: {part}</code>;
                                  }
                                }

                                // Handle inline math with $ or \( \)
                                if ((part.startsWith('$') && part.endsWith('$')) ||
                                    (part.startsWith('\\(') && part.endsWith('\\)'))) {
                                  try {
                                    let math = part;
                                    if (part.startsWith('$')) {
                                      math = part.slice(1, -1);
                                    } else if (part.startsWith('\\(')) {
                                      math = part.slice(2, -2);
                                    }
                                    return <InlineMath key={i} math={math} errorColor="#EF4444" />;
                                  } catch (error) {
                                    console.error('LaTeX Error:', error);
                                    return <code key={i} className="text-red-500">LaTeX Error: {part}</code>;
                                  }
                                }

                                // Handle regular text with RTL support
                                if (part.trim()) {
                                  return (
                                    <span 
                                      key={i}
                                      dir={isRTL(part) ? 'rtl' : 'ltr'} 
                                      style={{ 
                                        display: 'block', 
                                        whiteSpace: 'pre-wrap',
                                        textAlign: isRTL(part) ? 'right' : 'left'
                                      }}
                                    >
                                      {part}
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </p>
                          );
                        }
                        return <p {...props}>{children}</p>;
                      },
                      // Add link component
                      a(props: any) {
                        const { href, children } = props;
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {children}
                          </a>
                        );
                      },
                      img({ src, alt, ...props }: any) {
                        return (
                          <img
                            src={src}
                            alt={alt}
                            className="max-w-full h-auto rounded-lg shadow-md"
                            loading="lazy"
                            {...props}
                          />
                        );
                      },
                      table({ children, ...props }: any) {
                        return (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-gray-200" {...props}>
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children, ...props }: any) {
                        return (
                          <thead className="bg-gray-100" {...props}>
                            {children}
                          </thead>
                        );
                      },
                      th({ children, ...props }: any) {
                        return (
                          <th 
                            className="border border-gray-200 px-4 py-2 text-right font-medium text-gray-700" 
                            {...props}
                          >
                            {children}
                          </th>
                        );
                      },
                      td({ children, ...props }: any) {
                        return (
                          <td 
                            className="border border-gray-200 px-4 py-2 text-gray-700" 
                            {...props}
                          >
                            {children}
                          </td>
                        );
                      },
                      strong({ children, ...props }: any) {
                        return (
                          <strong className="font-bold text-gray-900" {...props}>
                            {children}
                          </strong>
                        );
                      },
                      br(props: any) {
                        return <br className="block my-2" {...props} />;
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {currentStreamedMessage && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[85%] bg-white rounded-2xl p-4 shadow-md prose prose-sm prose-headings:mt-2 prose-headings:mb-2 prose-p:my-2 prose-img:my-2 prose-img:rounded-lg prose-strong:font-bold prose-strong:text-gray-900 prose-table:my-4 prose-table:w-full prose-table:border-collapse prose-td:border prose-td:p-2 prose-th:border prose-th:p-2 prose-th:bg-gray-100">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code(props: any) {
                        const { inline, className, children } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const content = String(children).replace(/\n$/, '');

                        // Handle display math blocks
                        if (content.startsWith('\\[') && content.endsWith('\\]')) {
                          try {
                            const mathContent = content.slice(2, -2).trim();
                            return <BlockMath math={mathContent} errorColor="#EF4444" />;
                          } catch (error) {
                            console.error('LaTeX Error:', error);
                            return <code className="text-red-500">LaTeX Error: {content}</code>;
                          }
                        }

                        // Handle math code blocks
                        if (match && match[1] === 'math') {
                          try {
                            return <BlockMath math={content} errorColor="#EF4444" />;
                          } catch (error) {
                            console.error('LaTeX Error:', error);
                            return <code className="text-red-500">LaTeX Error: {content}</code>;
                          }
                        }

                        // Handle inline math with $ or \( \)
                        if (inline || 
                            (content.startsWith('$') && content.endsWith('$')) || 
                            (content.startsWith('\\(') && content.endsWith('\\)'))) {
                          try {
                            let mathContent = content;
                            if (content.startsWith('$')) {
                              mathContent = content.slice(1, -1);
                            } else if (content.startsWith('\\(')) {
                              mathContent = content.slice(2, -2);
                            }
                            return <InlineMath math={mathContent} errorColor="#EF4444" />;
                          } catch (error) {
                            console.error('LaTeX Error:', error);
                            return <code className="text-red-500">LaTeX Error: {content}</code>;
                          }
                        }

                        // Regular code blocks
                        if (!inline && match) {
                          return (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                            >
                              {content}
                            </SyntaxHighlighter>
                          );
                        }

                        // Regular inline code
                        return <code className={className}>{children}</code>;
                      },
                      p(props: any) {
                        const { children, ...rest } = props;
                        if (typeof children === 'string') {
                          // Enhanced regex pattern for LaTeX delimiters including direct display math
                          const parts = children.split(/((?:\$[^$\n]+\$)|(?:\[.*?\])|(?:\\\[[^\]]+\\\])|(?:\\\([^)]+\\\))|\n+)/g);
                          
                          return (
                            <p {...rest}>
                              {parts.map((part, i) => {
                                // Handle newlines
                                if (part.match(/^\n+$/)) {
                                  const breakCount = part.length;
                                  return Array(breakCount).fill(<br key={`${i}-br`} />);
                                }

                                // Handle direct display math with [...]
                                if (part.startsWith('[') && part.endsWith(']')) {
                                  try {
                                    const math = part.slice(1, -1).trim();
                                    return <BlockMath key={i} math={math} errorColor="#EF4444" />;
                                  } catch (error) {
                                    console.error('LaTeX Error:', error);
                                    return <code key={i} className="text-red-500">LaTeX Error: {part}</code>;
                                  }
                                }

                                // Handle display math with \[...\]
                                if (part.startsWith('\\[') && part.endsWith('\\]')) {
                                  try {
                                    const math = part.slice(2, -2).trim();
                                    return <BlockMath key={i} math={math} errorColor="#EF4444" />;
                                  } catch (error) {
                                    console.error('LaTeX Error:', error);
                                    return <code key={i} className="text-red-500">LaTeX Error: {part}</code>;
                                  }
                                }

                                // Handle inline math with $ or \( \)
                                if ((part.startsWith('$') && part.endsWith('$')) ||
                                    (part.startsWith('\\(') && part.endsWith('\\)'))) {
                                  try {
                                    let math = part;
                                    if (part.startsWith('$')) {
                                      math = part.slice(1, -1);
                                    } else if (part.startsWith('\\(')) {
                                      math = part.slice(2, -2);
                                    }
                                    return <InlineMath key={i} math={math} errorColor="#EF4444" />;
                                  } catch (error) {
                                    console.error('LaTeX Error:', error);
                                    return <code key={i} className="text-red-500">LaTeX Error: {part}</code>;
                                  }
                                }

                                // Handle regular text with RTL support
                                if (part.trim()) {
                                  return (
                                    <span 
                                      key={i}
                                      dir={isRTL(part) ? 'rtl' : 'ltr'} 
                                      style={{ 
                                        display: 'block', 
                                        whiteSpace: 'pre-wrap',
                                        textAlign: isRTL(part) ? 'right' : 'left'
                                      }}
                                    >
                                      {part}
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </p>
                          );
                        }
                        return <p {...props}>{children}</p>;
                      },
                      // Add link component
                      a(props: any) {
                        const { href, children } = props;
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {children}
                          </a>
                        );
                      },
                      img({ src, alt, ...props }: any) {
                        return (
                          <img
                            src={src}
                            alt={alt}
                            className="max-w-full h-auto rounded-lg shadow-md"
                            loading="lazy"
                            {...props}
                          />
                        );
                      },
                      table({ children, ...props }: any) {
                        return (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-gray-200" {...props}>
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children, ...props }: any) {
                        return (
                          <thead className="bg-gray-100" {...props}>
                            {children}
                          </thead>
                        );
                      },
                      th({ children, ...props }: any) {
                        return (
                          <th 
                            className="border border-gray-200 px-4 py-2 text-right font-medium text-gray-700" 
                            {...props}
                          >
                            {children}
                          </th>
                        );
                      },
                      td({ children, ...props }: any) {
                        return (
                          <td 
                            className="border border-gray-200 px-4 py-2 text-gray-700" 
                            {...props}
                          >
                            {children}
                          </td>
                        );
                      },
                      strong({ children, ...props }: any) {
                        return (
                          <strong className="font-bold text-gray-900" {...props}>
                            {children}
                          </strong>
                        );
                      },
                      br(props: any) {
                        return <br className="block my-2" {...props} />;
                      }
                    }}
                  >
                    {currentStreamedMessage}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Container */}
      <div className={`border-t bg-white p-4 transition-all ${isInputFocused ? 'pb-6' : ''}`}>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            {editingMessageIndex !== null && (
              <div className="absolute -top-6 right-0 left-0 bg-yellow-50 text-yellow-800 text-xs px-4 py-1 rounded-t-lg flex items-center justify-end">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="hover:text-yellow-900 p-1"
                  aria-label="لغو ویرایش"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                setIsInputFocused(false);
                if (!input.trim()) {
                  setEditingMessageIndex(null);
                }
              }}
              placeholder="پیام خود را بنویسید..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[44px] max-h-32 transition-all"
              dir="auto"
              style={{ overflow: 'hidden' }}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="absolute left-2 bottom-2 p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-6 w-6 rotate-90" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatConversation; 