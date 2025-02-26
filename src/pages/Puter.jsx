import { useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

const App = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  
  const handleChat = async () => {
    if (!input.trim()) return;
  
    try {
      const replyObject = await puter.ai.chat(input);
      console.log(replyObject); // Debugging: Check full API response
      
      const reply = replyObject?.message?.content || "No response"; // Extract content safely
      setResponse(reply);
      speak(reply);
    } catch (error) {
      console.error("AI Request Failed:", error);
      setResponse("Error fetching response.");
    }
  };
  
  

  const speak = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="p-4 max-w-lg mx-auto bg-gray-900 flex justify-center text-white rounded-lg shadow-lg"
    >
      <h2 className="text-xl font-bold mb-4">Puter AI Chat</h2>
      <input
        type="text"
        placeholder="Ask something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full mb-2 p-2 text-black border border-gray-300 rounded"
      />
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleChat} 
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
      >
        Chat
      </motion.button>
      {response && (
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4 p-3 bg-gray-800 rounded-lg"
        >
          <strong>AI:</strong> {response}
        </motion.div>
      )}
    </motion.div>
  );
};

export default App;
