import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { Send, ArrowLeft } from "lucide-react";
import { mockMessages } from "./mockData";

export default function AdminMessages() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const loadMessages = () => {
      const saved = localStorage.getItem("mprss_messages");
      const allChats = saved ? JSON.parse(saved) : mockMessages;

      setChats(allChats);

      if (!saved) {
        localStorage.setItem(
          "mprss_messages",
          JSON.stringify(mockMessages)
        );
      }
    };

    loadMessages();

    const interval = setInterval(loadMessages, 2000);

    return () => clearInterval(interval);
  }, []);

  const selectedChat =
    chats.find((chat) => chat.id === selectedChatId) || null;

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);

    const updatedChats = chats.map((chat) =>
      chat.id === chatId
        ? { ...chat, unread: 0 }
        : chat
    );

    setChats(updatedChats);

    localStorage.setItem(
      "mprss_messages",
      JSON.stringify(updatedChats)
    );
  };

  const handleSend = () => {
    if (messageText.trim() && selectedChat) {
      const newMessage = {
        sender: "admin",
        text: messageText,
        timestamp: new Date().toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };

      const updatedChats = chats.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
            }
          : chat
      );

      setChats(updatedChats);

      localStorage.setItem(
        "mprss_messages",
        JSON.stringify(updatedChats)
      );

      setMessageText("");
    }
  };

  return (
    <AdminLayout title="Messages">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">

        {/* Chat List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg">Conversations</h3>
          </div>

          <div className="overflow-y-auto h-full">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedChatId === chat.id
                    ? "bg-gray-50"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium">
                    {chat.customerName}
                  </p>

                  {chat.unread > 0 && (
                    <span className="bg-black text-white text-xs px-2 py-1 rounded-full">
                      {chat.unread}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mt-1 truncate">
                  {chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].text
                    : "No messages yet"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setSelectedChatId(null)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={20} />
                </button>

                <h3 className="text-lg font-medium">
                  {selectedChat.customerName}
                </h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedChat.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.sender === "admin"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === "admin"
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">
                        {msg.text}
                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === "admin"
                            ? "text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) =>
                      setMessageText(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />

                  <button
                    onClick={handleSend}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}