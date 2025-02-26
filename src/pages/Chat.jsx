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
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

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

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [selectedModel, setSelectedModel] = useState(models[0].name); // Default to first model
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        text: '# Welcome to Doli Assistant\n\nI\'m your advanced AI companion. Select a model from the dropdown to tailor my abilities. Try:\n\n- Asking questions\n- Requesting code with ```language\ncode\n```\n\n- Typing "generate image: [prompt]" for images\n\nHow can I assist you today?',
        isUser: false,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Theme toggle persistence
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

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
      if (input.toLowerCase().startsWith('generate image:')) {
        const imagePrompt = input.slice(14).trim();
        const response = await fetch(
          `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512`
        );
        if (!response.ok) throw new Error('Failed to generate image');
        aiResponse = `![Generated Image](${response.url})`;
      } else {
        const response = await fetch(
          `https://text.pollinations.ai/${selectedModel}/${encodeURIComponent(input)}`,
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
      setMessages((prev) => [...prev, aiMessage]);
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
    if (model.reasoning) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    if (model.vision) return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
    if (!model.baseModel) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (!model.censored) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  };

  // Custom markdown components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'javascript';
      const codeContent = String(children).replace(/\n$/, '');

      return !inline ? (
        <div id="scroll-container" className="relative my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
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
      return <p className="mb-4 text-white dark:text-gray-300 leading-relaxed">{children}</p>;
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

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      {/* Sidebar (Model Selector) */}
      <div className={`w-full sm:w-72 p-4 border-r flex-shrink-0 transition-colors shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Doli Assistant</h1>
          </div>
          
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Select AI Model</h2>
          <button
            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
            className={`w-full p-3 rounded-lg flex items-center justify-between border transition-colors shadow-sm ${
              isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-100'
            }`}
          >
            <span className="text-sm font-medium truncate">
              {models.find(m => m.name === selectedModel)?.description || 'Select a model'}
            </span>
            <ChevronDownIcon width={20} height={20} className={`w-5 h-5 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isModelMenuOpen && (
              <motion.div
                className={`absolute z-10 w-64 mt-1 rounded-lg shadow-xl overflow-hidden border max-h-96 overflow-y-auto ${
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
                      onClick={() => {
                        setSelectedModel(model.name);
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-3 text-sm rounded-md transition-colors mb-1 ${
                        selectedModel === model.name
                          ? isDarkMode
                            ? 'bg-blue-700 text-white'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                          : isDarkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="block font-medium truncate">{model.description}</span>
                        {selectedModel === model.name && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-blue-500"
                          />
                        )}
                      </div>
                      <div className="flex items-center mt-1 gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          model.censored 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {model.censored ? 'Censored' : 'Uncensored'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getModelBadgeStyle(model)}`}>
                          {model.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="mt-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active Model</h2>
          <div className={`p-3 rounded-lg border transition-colors ${
            isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
          }`}>
            {(() => {
              const model = models.find(m => m.name === selectedModel);
              if (!model) return null;
              
              return (
                <>
                  <div className="font-medium mb-1">{model.description}</div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      model.censored 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {model.censored ? 'Censored' : 'Uncensored'}
                    </span>
                    {model.vision && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                        Vision
                      </span>
                    )}
                    {model.reasoning && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Reasoning
                      </span>
                    )}
                    {!model.baseModel && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {model.provider ? `Provider: ${model.provider}` : 'Standard model'}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
        
        <div className="mt-10 text-xs text-center text-gray-500 dark:text-gray-400 border-t pt-4 border-gray-200 dark:border-gray-700">
          Doli Assistant v2.0 • Powered by Pollinations.ai
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`shadow-md px-6 py-4 flex items-center justify-between border-b transition-colors ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-semibold tracking-tight">Chat with {models.find(m => m.name === selectedModel)?.description}</h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
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
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-800/30">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                className={`mb-6 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`flex flex-col max-w-[90%] sm:max-w-[75%] ${msg.isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-lg shadow-md border ${
                      msg.isUser
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-700'
                        : isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="prose dark:prose-invert prose-sm sm:prose max-w-none">
                      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1.5 ml-1 text-gray-500 dark:text-gray-400">
                    <span className="font-medium">{msg.isUser ? 'You' : `Doli`}</span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    {!msg.isUser && (
                      <>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          {msg.model}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                      </>
                    )}
                    <span>{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              className="flex justify-center items-center my-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-md border border-gray-200 dark:border-gray-700">
                <motion.div
                  className="w-4 h-4 border-2 border-t-blue-500 border-blue-200 dark:border-t-blue-400 dark:border-gray-600 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-sm font-medium">Processing with {models.find(m => m.name === selectedModel)?.description}...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className={`p-4 sm:p-6 border-t transition-colors shadow-inner ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <form onSubmit={sendMessage} className="flex items-center gap-3 relative max-w-4xl mx-auto">
            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${models.find(m => m.name === selectedModel)?.description || 'Doli'} or 'generate image: [prompt]'...`}
              className={`w-full p-3.5 pl-5 pr-14 border rounded-full focus:outline-none focus:ring-2 shadow-sm transition-all ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-800 focus:ring-blue-400'
              }`}
              disabled={isLoading}
            />
            <motion.button
              type="submit"
              className={`absolute right-2 h-10 w-10 flex items-center justify-center rounded-full ${
                isLoading || !input.trim()
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700'
              } text-white transition-colors shadow-md`}
              disabled={isLoading || !input.trim()}
              whileHover={!isLoading && input.trim() ? { scale: 1.05 } : {}}
              whileTap={!isLoading && input.trim() ? { scale: 0.95 } : {}}
            >
              <PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
            </motion.button>
          </form>
          <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            Press Enter to send • Active model: {models.find(m => m.name === selectedModel)?.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;