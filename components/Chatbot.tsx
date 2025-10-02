import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Card } from './common/Card';
import { Button } from './common/Button';
import {} from '../types'; // For ion-icon types

// As per guidelines, assume API_KEY is set in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ChatbotProps {
  onClose: () => void;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Hello! How can I help you with your projects or inventory today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the chat session
    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a helpful assistant for the ProjectFlow application. You can answer questions about project management, inventory, and general topics. Be friendly and concise.',
      },
    });
    setChat(chatSession);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chat) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage, { sender: 'bot', text: '' }]);
    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: messageToSend });
      
      let botResponse = '';
      for await (const chunk of stream) {
        botResponse += chunk.text;
        setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].sender === 'bot') {
                newMessages[newMessages.length - 1].text = botResponse;
            }
            return newMessages;
        });
      }

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      setMessages(prev => {
          const newMessages = [...prev];
           if (newMessages.length > 0 && newMessages[newMessages.length - 1].sender === 'bot') {
              newMessages[newMessages.length - 1].text = 'Sorry, something went wrong. Please try again.';
          } else {
              newMessages.push({ sender: 'bot', text: 'Sorry, something went wrong. Please try again.'});
          }
          return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 lg:right-8 w-[calc(100%-2rem)] max-w-sm h-[60vh] max-h-[500px] z-40">
      <Card className="h-full flex flex-col !p-0">
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <ion-icon name="sparkles-outline" className="mr-2 text-blue-400"></ion-icon>
            AI Assistant
          </h2>
          <Button onClick={onClose} variant="secondary" size="sm" iconName="close-outline" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.text === '' && (
            <div className="flex justify-start">
               <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-700 text-gray-200 flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2 [animation-delay:0s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2 [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
              placeholder="Ask something..."
              className="flex-1 bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-2 resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button type="submit" variant="primary" iconName="send" disabled={isLoading || !input.trim()} aria-label="Send Message" />
          </div>
        </form>
      </Card>
    </div>
  );
};
