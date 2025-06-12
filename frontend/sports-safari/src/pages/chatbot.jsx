import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const faqs = [
    "How do I book a ground?",
    "Can I cancel my booking?",
    "What sports are available?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat/ask', { 
        question: input 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setMessages(prev => [...prev, { 
        text: response.data.answer, 
        sender: 'bot' 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Sorry, I couldn't process your request. Please try again.", 
        sender: 'bot' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFAQClick = (faq) => {
    setInput(faq);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col">
          <div className="bg-green-600 text-white p-3 rounded-t-lg flex justify-between">
            <h3 className="font-bold">Booking Assistant</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto">
            <div className="mb-2 text-sm text-gray-500">
              Hi! Ask me about ground bookings.
            </div>
            
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`mb-2 p-2 rounded-lg max-w-xs ${msg.sender === 'user' 
                  ? 'bg-green-100 ml-auto' 
                  : 'bg-gray-100 mr-auto'}`}
              >
                {msg.text}
              </div>
            ))}
            
            {isLoading && (
              <div className="mb-2 p-2 rounded-lg bg-gray-100 mr-auto max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t">
            <div className="flex flex-wrap gap-1 mb-2">
              {faqs.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => handleFAQClick(faq)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                >
                  {faq}
                </button>
              ))}
            </div>
            
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="flex-1 border p-2 rounded-l focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-green-600 text-white px-3 rounded-r hover:bg-green-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Chatbot;