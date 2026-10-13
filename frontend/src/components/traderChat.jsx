import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Globe, MapPin, Users } from 'lucide-react';

export default function TraderChat({ socket, player }) {
  const [activeChannel, setActiveChannel] = useState('GLOBAL'); // 'GLOBAL' or player's currentLocation
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef(null);

  const currentLocation = player?.currentLocation || 'Lagos';

  // Join channel room & subscribe to messages
  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('JOIN_CHAT_CHANNEL', { channel: activeChannel });

    // Handle historical messages load
    const handleHistory = (history) => {
      setMessages(history);
      scrollToBottom();
    };

    // Handle new incoming live message
    const handleNewMessage = (msg) => {
      if (msg.channel === activeChannel) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };

    socket.on('CHAT_HISTORY', handleHistory);
    socket.on('NEW_CHAT_MESSAGE', handleNewMessage);

    return () => {
      socket.off('CHAT_HISTORY', handleHistory);
      socket.off('NEW_CHAT_MESSAGE', handleNewMessage);
    };
  }, [socket, activeChannel]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !player) return;

    socket.emit('SEND_CHAT_MESSAGE', {
      playerId: player._id,
      username: player.username,
      channel: activeChannel,
      text: inputText.trim()
    });

    setInputText('');
  };

  return (
    <div className="bg-hustle-card border border-gray-800 rounded-xl p-5 shadow-xl flex flex-col h-[500px]">
      
      {/* Header & Channel Selector */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-gray-800 gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-hustle-green w-5 h-5" />
          <h3 className="font-bold text-white text-base">Trader Network Chat</h3>
        </div>

        {/* Toggle Channels */}
        <div className="flex gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs">
          <button
            onClick={() => setActiveChannel('GLOBAL')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition ${
              activeChannel === 'GLOBAL'
                ? 'bg-hustle-green text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Global
          </button>

          <button
            onClick={() => setActiveChannel(currentLocation)}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition ${
              activeChannel === currentLocation
                ? 'bg-hustle-green text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> {currentLocation}
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-800">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-12">
            No active trades discussed yet in <span className="text-white font-semibold">{activeChannel}</span> channel. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSelf = msg.username === player?.username;
            const msgTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={msg._id || idx}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px]">
                  <span className={`font-bold ${isSelf ? 'text-hustle-green' : 'text-hustle-gold'}`}>
                    {msg.username}
                  </span>
                  <span className="text-gray-500 font-mono text-[10px]">{msgTime}</span>
                </div>

                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                    isSelf
                      ? 'bg-hustle-green/20 border border-hustle-green/40 text-green-100 rounded-br-none'
                      : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-gray-800">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Broadcast to ${activeChannel} channel...`}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hustle-green"
        />
        <button
          type="submit"
          className="bg-hustle-green hover:bg-green-700 text-white font-bold px-4 rounded-lg transition flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}