import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula, tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  SunIcon, 
  MoonIcon, 
  ClipboardIcon, 
  PaperAirplaneIcon, 
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  TrashIcon,
  Cog6ToothIcon,
  PlusIcon,
  BoltIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

const models = [
  {"name": "openai", "type": "chat", "censored": true, "description": "OpenAI GPT-4o-mini", "baseModel": true, "vision": true},
  {"name": "openai-large", "type": "chat", "censored": true, "description": "OpenAI GPT-4o", "baseModel": true, "vision": true},
  {"name": "openai-reasoning", "type": "chat", "censored": true, "description": "OpenAI o1-mini", "baseModel": true, "reasoning": true},
  {"name": "qwen-coder", "type": "chat", "censored": true, "description": "Qwen 2.5 Coder 32B", "baseModel": true},
  {"name": "llama", "type": "chat", "censored": false, "description": "Llama 3.3 70B", "baseModel": true},
  {"name": "mistral", "type": "chat", "censored": false, "description": "Mistral Nemo", "baseModel": true},
  {"name": "unity", "type": "chat", "censored": false, "description": "Unity with Mistral Large by Unity AI Lab", "baseModel": false},
  {"name": "midijourney", "type": "chat", "censored": true, "description": "Midijourney musical transformer", "baseModel": false},
  {"name": "rtist", "type": "chat", "censored": true, "description": "Rtist image generator by @bqrio", "baseModel": false},
  {"name": "searchgpt", "type": "chat", "censored": true, "description": "SearchGPT with realtime news and web search", "baseModel": false},
  {"name": "evil", "type": "chat", "censored": false, "description": "Evil Mode - Experimental", "baseModel": false},
  {"name": "deepseek", "type": "chat", "censored": true, "description": "DeepSeek-V3", "baseModel": true},
  {"name": "claude-hybridspace", "type": "chat", "censored": true, "description": "Claude Hybridspace", "baseModel": true},
  {"name": "deepseek-r1", "type": "chat", "censored": true, "description": "DeepSeek-R1 Distill Qwen 32B", "baseModel": true, "reasoning": true, "provider": "cloudflare"},
  {"name": "deepseek-reasoner", "type": "chat", "censored": true, "description": "DeepSeek R1 - Full", "baseModel": true, "reasoning": true, "provider": "deepseek"},
  {"name": "llamalight", "type": "chat", "censored": false, "description": "Llama 3.1 8B Instruct", "baseModel": true},
  {"name": "llamaguard", "type": "safety", "censored": false, "description": "Llamaguard 7B AWQ", "baseModel": false, "provider": "cloudflare"},
  {"name": "gemini", "type": "chat", "censored": true, "description": "Gemini 2.0 Flash", "baseModel": true, "provider": "google"},
  {"name": "gemini-thinking", "type": "chat", "censored": true, "description": "Gemini 2.0 Flash Thinking", "baseModel": true, "provider": "google"},
  {"name": "hormoz", "type": "chat", "description": "Hormoz 8b by Muhammadreza Haghiri", "baseModel": false, "provider": "modal.com", "censored": false},
  {"name": "hypnosis-tracy", "type": "chat", "description": "Hypnosis Tracy - Your Self-Help AI", "baseModel": false, "provider": "modal.com", "censored": false}
];

const samplePrompts = [
  "Explain quantum computing to a 10-year-old",
  "Create a 5-day itinerary for a trip to Tokyo",
  "Help me draft a professional email requesting a deadline extension",
  "Write a short story about a robot discovering emotions",
  "Compare and contrast different programming paradigms",
  "Generate image: serene mountain landscape at sunset",
  "Explain the basics of machine learning algorithms"
];

const Chat = () => {
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('doli-conversations');
    return saved ? JSON.parse(saved) : [
      {
        id: 'default',
        title: 'New Chat',
        messages: [
          {
            text: '# Welcome to Doli Assistant\n\nI\'m your advanced AI companion. Select a model from the dropdown to tailor my abilities. Try:\n\n- Asking questions\n- Requesting code with ```language\ncode\n```\n\n- Typing "generate image: [prompt]" for images\n\nHow can I assist you today?',
            isUser: false,
            timestamp: new Date().toISOString(),
          },
        ],
        model: models[0].name
      }
    ];
  });
  const [activeConversationId, setActiveConversationId] = useState(() => {
    const saved = localStorage.getItem('doli-active-conversation');
    return saved || 'default';
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [imageSize, setImageSize] = useState(() => localStorage.getItem('imageSize') || '512x512');
  const [autoScroll, setAutoScroll] = useState(() => localStorage.getItem('autoScroll') !== 'false');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];
  
  const scrollToBottom = useCallback(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('doli-conversations', JSON.stringify(conversations));
    localStorage.setItem('doli-active-conversation', activeConversationId);
  }, [conversations, activeConversationId]);

  // Theme persistence
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Settings persistence
  useEffect(() => {
    localStorage.setItem('imageSize', imageSize);
    localStorage.setItem('autoScroll', autoScroll.toString());
    localStorage.setItem('fontSize', fontSize);
  }, [imageSize, autoScroll, fontSize]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [activeConversation.messages, scrollToBottom]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConversationId]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isModelMenuOpen && !event.target.closest('.model-menu-container')) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModelMenuOpen]);

  // Function to create a new conversation
  const createNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConversation = {
      id: newId,
      title: 'New Chat',
      messages: [
        {
          text: '# Welcome to Doli Assistant\n\nHow can I help you today?',
          isUser: false,
          timestamp: new Date().toISOString(),
          model: activeConversation.model
        }
      ],
      model: activeConversation.model
    };
    setConversations(prev => [...prev, newConversation]);
    setActiveConversationId(newId);
    setInput('');
    setIsMobileSidebarOpen(false);
  };

  // Function to delete a conversation
  const deleteConversation = (id) => {
    if (conversations.length === 1) {
      // Don't delete the last conversation, reset it instead
      const resetConversation = {
        ...conversations[0],
        messages: [
          {
            text: '# Welcome to Doli Assistant\n\nHow can I help you today?',
            isUser: false,
            timestamp: new Date().toISOString(),
            model: conversations[0].model
          }
        ],
        title: 'New Chat'
      };
      setConversations([resetConversation]);
      return;
    }

    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (id === activeConversationId) {
      setActiveConversationId(conversations.find(c => c.id !== id)?.id || '');
    }
  };

  // Function to update conversation title based on first user message
  const updateConversationTitle = (id, messages) => {
    if (messages.length < 3) return; // Need at least one pair of messages to generate title

    const userMessages = messages.filter(m => m.isUser);
    if (userMessages.length > 0) {
      const firstUserMessage = userMessages[0].text;
      let title = firstUserMessage.slice(0, 30).trim();
      if (firstUserMessage.length > 30) title += '...';
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === id ? { ...conv, title } : conv
        )
      );
    }
  };

  // Change model for current conversation
  const changeModel = (modelName) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversationId ? { ...conv, model: modelName } : conv
      )
    );
    setIsModelMenuOpen(false);
  };

  const sendMessage = async (e, promptText = null) => {
    if (e) e.preventDefault();
    
    const messageText = promptText || input;
    if (!messageText.trim()) return;

    // Get current model
    const currentModel = activeConversation.model;

    const userMessage = {
      text: messageText,
      isUser: true,
      timestamp: new Date().toISOString(),
      model: currentModel,
    };

    // Update conversation messages
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversationId 
          ? { 
              ...conv, 
              messages: [...conv.messages, userMessage] 
            } 
          : conv
      )
    );
    
    setInput('');
    setIsLoading(true);
    setIsPromptLibraryOpen(false);

    try {
      let aiResponse;
      if (messageText.toLowerCase().startsWith('generate image:')) {
        const imagePrompt = messageText.slice(14).trim();
        const [width, height] = imageSize.split('x').map(Number);
        const response = await fetch(
          `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${width}&height=${height}`
        );
        if (!response.ok) throw new Error('Failed to generate image');
        aiResponse = `![Generated Image](${response.url})`;
      } else {
        const response = await fetch(
          `https://text.pollinations.ai/${currentModel}/${encodeURIComponent(messageText)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch text response');
        aiResponse = await response.text();
      }

      const aiMessage = {
        text: aiResponse,
        isUser: false,
        timestamp: new Date().toISOString(),
        model: currentModel,
      };

      // Update conversation with AI response
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? { 
                ...conv, 
                messages: [...conv.messages, aiMessage] 
              } 
            : conv
        )
      );

      // Update conversation title if this is the first exchange
      const updatedConversation = conversations.find(c => c.id === activeConversationId);
      if (updatedConversation && updatedConversation.title === 'New Chat') {
        updateConversationTitle(activeConversationId, [...updatedConversation.messages, userMessage, aiMessage]);
      }
    } catch (error) {
      console.error('Error with Pollinations.ai:', error);
      const errorMessage = {
        text: `**Error:** Unable to process your request with model "${currentModel}". Please try again or switch models.`,
        isUser: false,
        timestamp: new Date().toISOString(),
        model: currentModel,
      };
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? { 
                ...conv, 
                messages: [...conv.messages, errorMessage] 
              } 
            : conv
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Clear the current conversation
  const clearConversation = () => {
    const confirmClear = window.confirm("Are you sure you want to clear this conversation?");
    if (confirmClear) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? {
                ...conv,
                messages: [
                  {
                    text: '# Chat Cleared\n\nYou\'ve started a fresh conversation. How can I help you today?',
                    isUser: false,
                    timestamp: new Date().toISOString(),
                    model: conv.model
                  }
                ],
                title: 'New Chat'
              }
            : conv
        )
      );
    }
  };

  // Copy code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity';
    notification.innerText = 'Code copied to clipboard';
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => document.body.removeChild(notification), 500);
    }, 2000);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for conversation list
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  // Get model badge style
  const getModelBadgeStyle = (modelName) => {
    const model = models.find(m => m.name === modelName) || {};
    if (model.reasoning) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    if (model.vision) return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
    if (!model.baseModel) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (!model.censored) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  };

  const getMobileSidebarClasses = () => {
    return isMobileSidebarOpen 
      ? 'fixed inset-y-0 left-0 z-40 w-64 transition-transform transform translate-x-0' 
      : 'fixed inset-y-0 left-0 z-40 w-64 transition-transform transform -translate-x-full sm:translate-x-0 sm:relative sm:flex';
  };

  const fontSizeClasses = {
    small: 'text-xs sm:text-sm',
    medium: 'text-sm sm:text-base',
    large: 'text-base sm:text-lg',
  };

  // Get the appropriate icon for a model
  const getModelIcon = (modelName) => {
    const model = models.find(m => m.name === modelName) || {};
    if (model.vision) return <BoltIcon className="w-4 h-4" />;
    if (model.reasoning) return <span className="w-4 h-4">🧠</span>;
    if (!model.censored) return <span className="w-4 h-4">⚠️</span>;
    return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
  };

  // Custom markdown components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'javascript';
      const codeContent = String(children).replace(/\n$/, '');

      return !inline ? (
        <div className="relative my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center justify-between bg-gray-800 text-gray-200 text-sm px-4 py-2.5">
            <span className="font-medium">{language.charAt(0).toUpperCase() + language.slice(1)}</span>
            <button
              onClick={() => copyToClipboard(codeContent)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors py-1 px-2 rounded hover:bg-gray-700"
            >
              <ClipboardIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Copy</span>
            </button>
          </div>
          <SyntaxHighlighter
            language={language}
            style={isDarkMode ? dracula : tomorrow}
            customStyle={{ margin: 0, borderRadius: '0 0 8px 8px' }}
            showLineNumbers={true}
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
    img({ src, alt }) {
      return (
        <div className="my-4">
          <motion.img
            src={src}
            alt={alt}
            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-md"
            loading="lazy"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
          {alt && <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">{alt}</p>}
        </div>
      );
    },
    h1({ children }) {
      return <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100 border-b pb-2 border-gray-200 dark:border-gray-700">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">{children}</h3>;
    },
    p({ children }) {
      return <p className={`mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed ${fontSizeClasses[fontSize]}`}>{children}</p>;
    },
    ul({ children }) {
      return <ul className={`mb-4 pl-5 list-disc ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} space-y-1 ${fontSizeClasses[fontSize]}`}>{children}</ul>;
    },
    ol({ children }) {
      return <ol className={`mb-4 pl-5 list-decimal ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} space-y-1 ${fontSizeClasses[fontSize]}`}>{children}</ol>;
    },
    li({ children }) {
      return <li className="mb-1 leading-relaxed">{children}</li>;
    },
    blockquote({ children }) {
      return <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-4 text-gray-600 dark:text-gray-400 italic">{children}</blockquote>;
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto mb-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full">{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>;
    },
    tbody({ children }) {
      return <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>;
    },
    th({ children }) {
      return <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{children}</th>;
    },
    td({ children }) {
      return <td className="px-4 py-3 whitespace-nowrap">{children}</td>;
    },
    a({ href, children }) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline"
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className={`min-h-screen flex flex-col sm:flex-row ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      {/* Mobile Header (only visible on mobile) */}
      <div className={`sm:hidden border-b flex items-center justify-between p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <FolderIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="font-semibold tracking-tight">Doli</span>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Conversation List) */}
      <div className={`${getMobileSidebarClasses()} sm:w-72 transition-colors shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Mobile close button */}
        {isMobileSidebarOpen && (
          <button 
            className="absolute top-3 right-3 sm:hidden p-1 rounded-full bg-gray-200 dark:bg-gray-700"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col h-full p-4">
          {/* Logo and new chat button */}
          <div className="hidden sm:flex items-center gap-3 mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Doli Assistant</h1>
          </div>
          
          <button
            onClick={createNewConversation}
            className={`w-full p-3 rounded-lg flex items-center gap-3 border transition-colors shadow-sm mb-6 ${
              isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-100'
            }`}
          >
            <PlusIcon className="w-5 h-5 text-blue-500" />
            <span className="font-medium">New Chat</span>
          </button>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2 tracking-wider">Conversations</h2>
            <div className="space-y-1.5">
              {conversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  className={`group flex items-center gap-2 rounded-md cursor-pointer ${
                    activeConversationId === conversation.id
                      ? isDarkMode
                        ? 'bg-gray-700'
                        : 'bg-blue-50 border-blue-200'
                      : isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                  }`}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <button
                    onClick={() => {
                      setActiveConversationId(conversation.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex-1 flex items-center gap-2 p-3 text-left truncate"
                  >
                    <span className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                      {getModelIcon(conversation.model)}
                    </span>
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {conversation.messages.length > 1 && formatDate(conversation.messages[conversation.messages.length - 1].timestamp)}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteConversation(conversation.id)}
                    className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900 dark:hover:text-red-300 mr-2 transition-opacity"
                    aria-label="Delete conversation"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Settings button */}
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-full p-2.5 rounded-md flex items-center gap-3 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Cog6ToothIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium text-gray-600 dark:text-gray-300">Settings</span>
            </button>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400 pt-2">
              <span>Doli Assistant v2.0</span>
              <div>
                <span className="hidden sm:inline">Powered by </span>
                <span className="font-medium text-blue-500 dark:text-blue-400">Pollinations.ai</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen sm:h-auto">
        {/* Header */}
        <header className={`hidden sm:flex shadow-md px-6 py-4 items-center justify-between border-b transition-colors ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="model-menu-container relative">
              <button
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <span className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                  {getModelIcon(activeConversation.model)}
                </span>
                <div>
                  <div className="font-medium flex items-center gap-1.5">
                    {models.find(m => m.name === activeConversation.model)?.description || 'Select Model'}
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>
              
              <AnimatePresence>
                {isModelMenuOpen && (
                  <motion.div
                    className={`absolute z-50 w-72 mt-1 rounded-lg shadow-xl overflow-hidden border max-h-[420px] overflow-y-auto ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="sticky top-0 z-10 p-2 backdrop-blur-sm bg-opacity-90 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 px-2 py-1">Model Selection</div>
                    </div>
                    <div className="p-2">
                      {models.map((model) => (
                        <button
                          key={model.name}
                          onClick={() => changeModel(model.name)}
                          className={`w-full text-left px-3 py-3 text-sm rounded-md transition-colors mb-1.5 flex items-start gap-3 ${
                            activeConversation.model === model.name
                              ? isDarkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                              : isDarkMode
                              ? 'hover:bg-gray-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center ${
                            activeConversation.model === model.name ? 'bg-white bg-opacity-20' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {getModelIcon(model.name)}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="block font-medium">{model.description}</span>
                              {activeConversation.model === model.name && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 rounded-full bg-blue-400"
                                />
                              )}
                            </div>
                            <div className="flex items-center mt-1.5 gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                model.censored 
                                  ? isDarkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'
                                  : isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'
                              }`}>
                                {model.censored ? 'Censored' : 'Uncensored'}
                              </span>
                              {model.vision && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200">
                                  Vision
                                </span>
                              )}
                              {model.reasoning && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                                  Reasoning
                                </span>
                              )}
                              {!model.baseModel && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                                  Custom
                                </span>
                              )}
                            </div>
                            {model.provider && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Provider: {model.provider}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearConversation}
              className={`p-2 rounded-md transition-colors flex items-center gap-2 text-sm ${
                isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Clear conversation"
            >
              <ArrowUturnLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={() => setIsPromptLibraryOpen(!isPromptLibraryOpen)}
              className={`p-2 rounded-md transition-colors flex items-center gap-2 text-sm ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Prompt library"
            >
              <span className="hidden sm:inline">Prompts</span>
              <span className="w-4 h-4">💡</span>
            </button>
            <motion.button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600" />
              )}
            </motion.button>
          </div>
        </header>

        {/* App Area */}
        <div 
          className={`flex-1 p-3 sm:p-6 overflow-y-auto ${
            isDarkMode 
              ? 'bg-gradient-to-b from-gray-900 to-gray-800' 
              : 'bg-gradient-to-b from-gray-50 to-white'
          }`}
          style={{ minHeight: '0' }}
        >
          {/* Prompt library popover */}
          <AnimatePresence>
            {isPromptLibraryOpen && (
              <motion.div 
                className={`fixed bottom-20 sm:bottom-auto sm:right-10 sm:top-20 left-3 right-3 sm:w-72 rounded-lg shadow-xl border z-30 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="font-medium">Prompt Templates</div>
                  <button 
                    onClick={() => setIsPromptLibraryOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-3 max-h-80 overflow-y-auto">
                  <div className="space-y-2">
                    {samplePrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(prompt);
                          setIsPromptLibraryOpen(false);
                          inputRef.current?.focus();
                        }}
                        className={`w-full text-left p-2 rounded-md text-sm ${
                          isDarkMode 
                            ? 'hover:bg-gray-700 bg-gray-750' 
                            : 'hover:bg-gray-100 bg-gray-50'
                        }`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                  Click a prompt to insert it
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings panel */}
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div 
                className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className={`mx-4 sm:mx-0 w-full max-w-md rounded-lg shadow-2xl border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="font-medium text-lg">Settings</div>
                    <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Appearance</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsDarkMode(false)}
                          className={`flex-1 p-3 rounded-lg border ${
                            !isDarkMode 
                              ? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex justify-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <SunIcon className="w-5 h-5 text-yellow-500" />
                            </div>
                          </div>
                          <div className="text-center text-sm font-medium">Light</div>
                        </button>
                        <button 
                          onClick={() => setIsDarkMode(true)}
                          className={`flex-1 p-3 rounded-lg border ${
                            isDarkMode 
                              ? 'border-blue-500 ring-2 ring-blue-500 bg-gray-700' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex justify-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                              <MoonIcon className="w-5 h-5 text-gray-300" />
                            </div>
                          </div>
                          <div className="text-center text-sm font-medium">Dark</div>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Image Generation Size</label>
                      <select 
                        value={imageSize} 
                        onChange={(e) => setImageSize(e.target.value)}
                        className={`w-full p-2 rounded-md border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      >
                        <option value="256x256">Small (256x256)</option>
                        <option value="512x512">Medium (512x512)</option>
                        <option value="768x768">Large (768x768)</option>
                        <option value="1024x1024">Extra Large (1024x1024)</option>
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Text Size</label>
                      <div className="flex gap-2">
                        {['small', 'medium', 'large'].map((size) => (
                          <button 
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={`flex-1 p-2 rounded-lg border capitalize ${
                              fontSize === size 
                                ? isDarkMode
                                  ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                                  : 'border-blue-500 bg-blue-50 text-blue-700'
                                : isDarkMode
                                ? 'border-gray-600 hover:bg-gray-700'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Auto-scroll to new messages</label>
                      <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                          autoScroll 
                            ? 'bg-blue-600 dark:bg-blue-500' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform rounded-full bg-white transition-transform ${
                            autoScroll ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeConversation.messages.map((msg, index) => (
              <motion.div
                key={`${activeConversationId}-${index}`}
                className={`mb-6 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`flex flex-col max-w-[95%] sm:max-w-[75%] ${msg.isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-lg shadow-md ${
                      msg.isUser
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'bg-gray-700 text-gray-100 border border-gray-600'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {/* Desktop user avatar (only show on left messages) */}
                    {!msg.isUser && (
                      <div className="flex items-center gap-2 p-3 pb-0">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-xs">D</span>
                        </div>
                        <div className="font-medium text-sm">Doli</div>
                      </div>
                    )}

                    <div className={`prose max-w-none ${fontSizeClasses[fontSize]} ${isDarkMode ? 'dark:prose-invert' : ''} p-4 pt-3`}>
                      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1 mx-1 text-gray-500 dark:text-gray-400">
                    {!msg.isUser && (
                      <>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          {models.find(m => m.name === msg.model)?.description || msg.model}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                      </>
                    )}
                    <span>{formatTime(msg.timestamp)}</span>
                    {msg.isUser && (
                      <span className="font-medium ml-1">You</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              className="flex justify-start items-center my-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-md ${
                isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
              }`}>
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    {getModelIcon(activeConversation.model)}
                  </div>
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-blue-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                </div>
                <div>
                  <div className="text-sm flex items-center gap-1">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 1 }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {models.find(m => m.name === activeConversation.model)?.description || 'Doli'} is thinking...
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className={`p-3 sm:p-4 border-t transition-colors shadow-lg ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <form onSubmit={sendMessage} className="flex flex-col gap-3 relative max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder={`Message ${models.find(m => m.name === activeConversation.model)?.description || 'Doli'} or type 'generate image: [prompt]'`}
                className={`w-full p-3.5 pl-5 pr-14 border rounded-xl focus:outline-none focus:ring-2 shadow-sm transition-all min-h-[60px] max-h-32 resize-none ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-800 focus:ring-blue-400'
                }`}
                disabled={isLoading}
                rows={1}
              />
              <motion.button
                type="submit"
                className={`absolute right-2 bottom-2 h-10 w-10 flex items-center justify-center rounded-full ${
                  isLoading || !input.trim()
                    ? isDarkMode 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                } text-white transition-colors shadow-md`}
                disabled={isLoading || !input.trim()}
                whileHover={!isLoading && input.trim() ? { scale: 1.05 } : {}}
                whileTap={!isLoading && input.trim() ? { scale: 0.95 } : {}}
              >
                <PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
              </motion.button>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
              <div className="flex items-center gap-1.5">
                <span>Shift+Enter for new line</span>
                <span>•</span>
                <button
                  onClick={() => setIsPromptLibraryOpen(!isPromptLibraryOpen)}
                  className="text-blue-500 dark:text-blue-400 hover:underline"
                >
                  Prompt templates
                </button>
              </div>
              <div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  {models.find(m => m.name === activeConversation.model)?.description}
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;