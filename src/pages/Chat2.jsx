import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  SunIcon, 
  MoonIcon, 
  ClipboardIcon, 
  PaperAirplaneIcon, 
  ChevronDownIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  CommandLineIcon,
  UserIcon,
  BoltIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { StarIcon, SparklesIcon } from '@heroicons/react/24/solid';

// Available models
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

// Default saved prompt templates
const defaultPromptTemplates = [
  {
    id: 'temp_1',
    title: 'Professional Writer',
    description: 'Make responses sound like a professional writer',
    prompt: 'You are a professional writer with excellent grammar and vocabulary. Respond in a sophisticated, clear manner with well-structured paragraphs.',
    icon: 'DocumentTextIcon'
  },
  {
    id: 'temp_2',
    title: 'Code Expert',
    description: 'Focus on providing well-commented code examples',
    prompt: 'You are a senior software engineer. Provide detailed code examples with clear comments. Explain your approach and any design patterns used.',
    icon: 'CommandLineIcon'
  },
  {
    id: 'temp_3',
    title: 'Friendly Assistant',
    description: 'More conversational and approachable tone',
    prompt: 'You are a friendly and helpful assistant. Use conversational language, simple explanations, and occasionally add some light humor to make interactions more engaging.',
    icon: 'UserIcon'
  },
  {
    id: 'temp_4',
    title: 'Expert Instructor',
    description: 'Educational responses with clear explanations',
    prompt: 'You are an expert instructor with years of teaching experience. Break down complex topics into understandable parts. Use examples and analogies to illustrate points.',
    icon: 'AdjustmentsHorizontalIcon'
  }
];

// Chat themes with Claude-like colors
const themes = [
  { id: 'light', name: 'Light', bgColor: 'bg-white', textColor: 'text-gray-800', accentColor: 'from-indigo-500 to-indigo-600' },
  { id: 'dark', name: 'Dark', bgColor: 'bg-gray-900', textColor: 'text-gray-100', accentColor: 'from-indigo-500 to-indigo-600' },
  { id: 'purple', name: 'Claude Purple', bgColor: 'bg-white', textColor: 'text-gray-800', accentColor: 'from-purple-500 to-purple-600' },
  { id: 'dark-purple', name: 'Dark Purple', bgColor: 'bg-gray-900', textColor: 'text-gray-100', accentColor: 'from-purple-500 to-purple-600' },
  { id: 'blue', name: 'Blue', bgColor: 'bg-white', textColor: 'text-gray-800', accentColor: 'from-blue-500 to-blue-600' },
  { id: 'green', name: 'Green', bgColor: 'bg-white', textColor: 'text-gray-800', accentColor: 'from-emerald-500 to-emerald-600' }
];

const Chat = () => {
  // State management
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('selectedModel') || models[0].name);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'settings', 'templates'
  const [promptTemplates, setPromptTemplates] = useState(() => {
    const saved = localStorage.getItem('promptTemplates');
    return saved ? JSON.parse(saved) : defaultPromptTemplates;
  });
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('conversations');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentConversation, setCurrentConversation] = useState(() => {
    const savedId = localStorage.getItem('currentConversationId');
    if (savedId) {
      const saved = localStorage.getItem('conversations');
      if (saved) {
        const parsedConvs = JSON.parse(saved);
        const found = parsedConvs.find(c => c.id === savedId);
        if (found) return found;
      }
    }
    return { id: 'default', title: 'New Chat', messages: [] };
  });
  const [showConversationList, setShowConversationList] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || (isDarkMode ? 'dark' : 'light');
  });
  const [fileUpload, setFileUpload] = useState(null);
  const [aiConfigurations, setAiConfigurations] = useState(() => {
    const saved = localStorage.getItem('aiConfigurations');
    return saved ? JSON.parse(saved) : {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0
    };
  });
  const [showAiConfig, setShowAiConfig] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    if (currentConversation.messages && currentConversation.messages.length > 0) {
      setMessages(currentConversation.messages);
    } else {
      setMessages([
        {
          text: '# Welcome to Doli Assistant\n\nI\'m your advanced AI companion. How can I assist you today?\n\n- You can select different AI models from the dropdown\n- Save custom prompt templates to personalize my responses\n- Upload files for analysis\n- Configure advanced AI parameters',
          isUser: false,
          timestamp: new Date().toISOString(),
          model: selectedModel
        },
      ]);
    }
  }, [currentConversation]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Theme toggle persistence
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    setCurrentTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Save selected model
  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);

  // Save prompt templates
  useEffect(() => {
    localStorage.setItem('promptTemplates', JSON.stringify(promptTemplates));
  }, [promptTemplates]);

  // Save conversations
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Save current conversation
  useEffect(() => {
    localStorage.setItem('currentConversationId', currentConversation.id);
    
    // Update the conversations array with the current conversation
    setConversations(prevConversations => {
      const index = prevConversations.findIndex(c => c.id === currentConversation.id);
      if (index >= 0) {
        const updated = [...prevConversations];
        updated[index] = {...currentConversation, messages: messages};
        return updated;
      } else {
        return [...prevConversations, {...currentConversation, messages: messages}];
      }
    });
  }, [currentConversation.id, messages]);

  // Save AI configurations
  useEffect(() => {
    localStorage.setItem('aiConfigurations', JSON.stringify(aiConfigurations));
  }, [aiConfigurations]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Focus input on load and when changing conversations
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentConversation]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() && !currentTemplate) return;

    const userMessage = {
      text: input,
      isUser: true,
      timestamp: new Date().toISOString(),
      model: selectedModel,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let aiResponse;
      let systemPrompt = '';
      
      // Add template to system prompt if selected
      if (currentTemplate) {
        systemPrompt = currentTemplate.prompt;
      }
      
      // Handle image generation requests
      if (input.toLowerCase().startsWith('generate image:')) {
        const imagePrompt = input.slice(14).trim();
        const response = await fetch(
          `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512`
        );
        if (!response.ok) throw new Error('Failed to generate image');
        aiResponse = `![Generated Image](${response.url})`;
      } else {
        // For text responses, include any system prompt + file content if uploaded
        let fullPrompt = input;
        if (systemPrompt) {
          fullPrompt = `${systemPrompt}\n\nUser: ${input}`;
        }
        
        if (fileUpload) {
          fullPrompt = `The user has uploaded a file with the following content: ${fileUpload.content}\n\nTheir query is: ${input}`;
          setFileUpload(null); // Clear after using
        }
        
        const apiParams = new URLSearchParams({
          temperature: aiConfigurations.temperature,
          max_tokens: aiConfigurations.maxTokens,
          top_p: aiConfigurations.topP,
          frequency_penalty: aiConfigurations.frequencyPenalty,
          presence_penalty: aiConfigurations.presencePenalty,
        }).toString();
        
        const response = await fetch(
          `https://text.pollinations.ai/${selectedModel}/${encodeURIComponent(fullPrompt)}?${apiParams}`,
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
        model: selectedModel,
      };
      
      const newMessages = [...messages, userMessage, aiMessage];
      setMessages(newMessages);
      
      // Update the current conversation with the new messages
      setCurrentConversation(prev => {
        // Create a new conversation title based on the first user message if it's a new conversation
        let title = prev.title;
        if (prev.title === 'New Chat' && userMessage.text.length > 0) {
          title = userMessage.text.slice(0, 30) + (userMessage.text.length > 30 ? '...' : '');
        }
        return {...prev, title, messages: newMessages};
      });
      
      // Clear current template after using it
      setCurrentTemplate(null);
    } catch (error) {
      console.error('Error with Pollinations.ai:', error);
      const errorMessage = {
        text: `**Error:** Unable to process your request with model "${selectedModel}". Please try again or switch models.`,
        isUser: false,
        timestamp: new Date().toISOString(),
        model: selectedModel,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle template selection
  const applyTemplate = (template) => {
    setCurrentTemplate(template);
    inputRef.current?.focus();
  };

  // Create new conversation
  const createNewConversation = () => {
    const newConversation = {
      id: `conv_${Date.now()}`,
      title: 'New Chat',
      messages: [],
      timestamp: new Date().toISOString()
    };
    
    setConversations([newConversation, ...conversations]);
    setCurrentConversation(newConversation);
    setMessages([]);
    setShowConversationList(false);
  };

  // Select conversation
  const selectConversation = (conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages || []);
    setShowConversationList(false);
  };

  // Delete conversation
  const deleteConversation = (id, e) => {
    e.stopPropagation();
    setConversations(conversations.filter(c => c.id !== id));
    
    // If we're deleting the current conversation, create a new one
    if (id === currentConversation.id) {
      createNewConversation();
    }
  };

  // Add new prompt template
  const addPromptTemplate = () => {
    const newTemplate = {
      id: `template_${Date.now()}`,
      title: 'New Template',
      description: 'Template description',
      prompt: 'Enter your system prompt here.',
      icon: 'DocumentTextIcon'
    };
    
    setEditingTemplate(newTemplate);
    setIsEditingTemplate(true);
  };

  // Edit prompt template
  const editTemplate = (template) => {
    setEditingTemplate({...template});
    setIsEditingTemplate(true);
  };

  // Save template
  const saveTemplate = () => {
    if (editingTemplate) {
      const isNew = !promptTemplates.some(t => t.id === editingTemplate.id);
      
      if (isNew) {
        setPromptTemplates([...promptTemplates, editingTemplate]);
      } else {
        setPromptTemplates(promptTemplates.map(t => 
          t.id === editingTemplate.id ? editingTemplate : t
        ));
      }
      
      setIsEditingTemplate(false);
      setEditingTemplate(null);
    }
  };

  // Delete template
  const deleteTemplate = (id) => {
    setPromptTemplates(promptTemplates.filter(t => t.id !== id));
  };

  // Upload file handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileUpload({
        name: file.name,
        type: file.type,
        size: file.size,
        content: event.target.result
      });
    };
    
    if (file.type.match('text.*') || file.type === 'application/json') {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // Apply theme
  const applyTheme = (theme) => {
    const themeObj = themes.find(t => t.id === theme);
    if (themeObj) {
      setIsDarkMode(theme.includes('dark'));
      setCurrentTheme(theme);
      setIsThemeMenuOpen(false);
    }
  };

  // Get the current theme object
  const getThemeObject = () => {
    return themes.find(t => t.id === currentTheme) || themes[0];
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

  // Get model badge style
  const getModelBadgeStyle = (model) => {
    const modelObj = models.find(m => m.name === model) || {};
    
    if (modelObj.reasoning) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    if (modelObj.vision) return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
    if (!modelObj.baseModel) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (!modelObj.censored) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  };

  // Render icon based on string name
  const renderIcon = (iconName, className) => {
    const icons = {
      DocumentTextIcon: <DocumentTextIcon className={className} />,
      CommandLineIcon: <CommandLineIcon className={className} />,
      UserIcon: <UserIcon className={className} />,
      AdjustmentsHorizontalIcon: <AdjustmentsHorizontalIcon className={className} />,
      BoltIcon: <BoltIcon className={className} />
    };
    
    return icons[iconName] || <DocumentTextIcon className={className} />;
  };

  // Get current model details
  const getCurrentModel = () => {
    return models.find(m => m.name === selectedModel) || models[0];
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
            style={dracula}
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
          <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">{alt}</p>
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
      return <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>;
    },
    ul({ children }) {
      return <ul className="mb-4 pl-5 list-disc text-gray-700 dark:text-gray-300 space-y-1">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="mb-4 pl-5 list-decimal text-gray-700 dark:text-gray-300 space-y-1">{children}</ol>;
    },
    li({ children }) {
      return <li className="mb-1 leading-relaxed">{children}</li>;
    },
    blockquote({ children }) {
      return <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-4 text-gray-600 dark:text-gray-400 italic">{children}</blockquote>;
    },
    table({ children }) {
      return <div className="overflow-x-auto mb-4"><table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg">{children}</table></div>;
    },
    th({ children }) {
      return <th className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 text-left font-medium">{children}</th>;
    },
    td({ children }) {
      return <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{children}</td>;
    },
  };

  const theme = getThemeObject();

  return (
    <div className={`min-h-screen flex ${theme.bgColor} ${theme.textColor} transition-colors`}>
      {/* Mobile sidebar toggle */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed top-4 left-4 z-50 p-2 rounded-full shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
        </button>
      )}
      
      {/* Sidebar backdrop (mobile) */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        fixed lg:relative z-50 w-80 h-full transition-transform duration-300 ease-in-out 
        ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} 
        border-r shadow-xl flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Doli Assistant</h1>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Sidebar Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 
            ${activeTab === 'chat' 
              ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Chats</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 
            ${activeTab === 'templates' 
              ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <BookmarkIcon className="w-4 h-4" />
            <span>Templates</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 
            ${activeTab === 'settings' 
              ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Chat list */}
          {activeTab === 'chat' && (
            <div className="p-4 space-y-4">
              <button 
                onClick={createNewConversation}
                className="w-full py-2.5 px-4 flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Chat</span>
              </button>
              
              <div className="mt-6 space-y-1">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Recent Conversations</h3>
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between group ${
                      conversation.id === currentConversation.id 
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="truncate text-sm">{conversation.title}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteConversation(conversation.id, e)} 
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity"
                    >
                      <TrashIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Templates */}
          {activeTab === 'templates' && (
            <div className="p-4 space-y-4">
              <button 
                onClick={addPromptTemplate}
                className="w-full py-2.5 px-4 flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Template</span>
              </button>
              
              <div className="mt-6 space-y-3">
                {promptTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {renderIcon(template.icon, "w-5 h-5 text-purple-500")}
                        <h3 className="font-medium">{template.title}</h3>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => editTemplate(template)}
                          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button 
                          onClick={() => deleteTemplate(template.id)}
                          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <TrashIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button 
                          onClick={() => applyTemplate(template)}
                          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <ArrowUpTrayIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="p-4 space-y-6">
              <div>
                <h3 className="font-medium mb-3">Theme</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {themes.map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => applyTheme(themeOption.id)}
                      className={`p-2 rounded-lg flex flex-col items-center transition-all border ${
                        currentTheme === themeOption.id
                          ? 'border-purple-500 ring-1 ring-purple-500'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className={`w-full h-8 rounded mb-2 bg-gradient-to-r ${themeOption.accentColor}`}></div>
                      <span className="text-xs">{themeOption.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">AI Parameters</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Temperature: {aiConfigurations.temperature.toFixed(1)}</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={aiConfigurations.temperature} 
                      onChange={(e) => setAiConfigurations({...aiConfigurations, temperature: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1">Max Tokens: {aiConfigurations.maxTokens}</label>
                    <input 
                      type="range" 
                      min="256" 
                      max="4096" 
                      step="256" 
                      value={aiConfigurations.maxTokens} 
                      onChange={(e) => setAiConfigurations({...aiConfigurations, maxTokens: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Version 1.0.2
            </div>
          </div>
        </div>
      </div>
      
      {/* Template editing modal */}
      {isEditingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-xl shadow-2xl p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingTemplate.id.startsWith('template_') ? 'New Template' : 'Edit Template'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text" 
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({...editingTemplate, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input 
                  type="text" 
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Prompt</label>
                <textarea 
                  value={editingTemplate.prompt}
                  onChange={(e) => setEditingTemplate({...editingTemplate, prompt: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <select
                  value={editingTemplate.icon}
                  onChange={(e) => setEditingTemplate({...editingTemplate, icon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="DocumentTextIcon">Document</option>
                  <option value="CommandLineIcon">Code</option>
                  <option value="UserIcon">User</option>
                  <option value="AdjustmentsHorizontalIcon">Settings</option>
                  <option value="BoltIcon">Lightning</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsEditingTemplate(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveTemplate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Chat Header */}
        <div className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
          {/* Current conversation info */}
          <div className="flex items-center">
            <h2 className="font-medium">{currentConversation.title}</h2>
          </div>
          
          {/* Model selector */}
          <div className="relative">
            <button 
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="text-sm font-medium">{getCurrentModel().description}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            
            {/* Model dropdown */}
            {isModelMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg shadow-lg py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
                <div className="max-h-80 overflow-y-auto">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Base Models
                  </div>
                  {models.filter(m => m.baseModel).map((model) => (
                    <button
                      key={model.name}
                      onClick={() => {
                        setSelectedModel(model.name);
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                        selectedModel === model.name ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{model.description}</span>
                        <div className="flex items-center mt-1 space-x-1">
                          {model.reasoning && (
                            <span className="px-1.5 py-0.5 text-xs rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Reasoning
                            </span>
                          )}
                          {model.vision && (
                            <span className="px-1.5 py-0.5 text-xs rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                              Vision
                            </span>
                          )}
                          {!model.censored && (
                            <span className="px-1.5 py-0.5 text-xs rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Uncensored
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedModel === model.name && (
                        <StarIcon className="w-4 h-4 text-yellow-500" />
                      )}
                    </button>
                  ))}
                  
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-2">
                    Fine-tuned Models
                  </div>
                  {models.filter(m => !m.baseModel).map((model) => (
                    <button
                      key={model.name}
                      onClick={() => {
                        setSelectedModel(model.name);
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                        selectedModel === model.name ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                      }`}
                    >
                      <span className="font-medium">{model.description}</span>
                      {selectedModel === model.name && (
                        <StarIcon className="w-4 h-4 text-yellow-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div 
        className="flex-1 overflow-y-auto py-4 px-4 md:px-6 lg:px-8 space-y-6"
        onClick={() => setShowAiConfig(false)}
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-3xl ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 mt-1 ${message.isUser ? 'ml-4' : 'mr-4'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                    ${message.isUser 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                      : 'bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800'}`}
                  >
                    {message.isUser 
                      ? <UserIcon className="w-4 h-4 text-white" />
                      : <SparklesIcon className="w-4 h-4 text-white" />
                    }
                  </div>
                </div>
                <div className={`rounded-2xl px-4 py-3 shadow-sm 
                  ${message.isUser 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' 
                    : isDarkMode 
                      ? 'bg-gray-800 border border-gray-700' 
                      : 'bg-white border border-gray-200'}`}
                >
                  <ReactMarkdown
                    className="markdown-body"
                    remarkPlugins={[remarkGfm]}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex max-w-3xl flex-row">
                <div className="flex-shrink-0 mt-1 mr-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className={`rounded-2xl px-6 py-4 shadow-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 transition-all">
        {fileUpload && (
          <div className="flex items-center mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-2 flex-1">
              <DocumentTextIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {fileUpload.name} ({(fileUpload.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button onClick={() => setFileUpload(null)} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full">
              <XMarkIcon className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex items-end gap-2">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()} 
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              onChange={handleFileUpload}
            />
            <ArrowUpTrayIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <button 
            type="button"
            onClick={() => setShowAiConfig(!showAiConfig)}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}

export default ChatApp;

