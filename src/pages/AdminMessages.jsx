import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Send, ArrowLeft } from "lucide-react";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

export default function AdminMessages() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState("");

  /*
   * ============================================================
   * FIRESTORE REAL-TIME MESSAGES
   * ============================================================
   */

  useEffect(() => {
    const unsubscribeMessages = onSnapshot(
      collection(db, "messages"),
      (snapshot) => {
        const data = snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...messageDoc.data(),
        }));

        // Sort conversations by latest update
        data.sort((a, b) => {
          const getTime = (value) => {
            if (!value) return 0;

            if (typeof value.toMillis === "function") {
              return value.toMillis();
            }

            if (value instanceof Date) {
              return value.getTime();
            }

            const parsed = new Date(value).getTime();

            return Number.isNaN(parsed) ? 0 : parsed;
          };

          return (
            getTime(b.updatedAt) -
            getTime(a.updatedAt)
          );
        });

        setChats(data);
        setLoading(false);
        setFirestoreError("");
      },
      (error) => {
        console.error(
          "MESSAGES FIRESTORE ERROR:",
          error
        );

        setChats([]);
        setLoading(false);
        setFirestoreError(error.message);
      }
    );

    return () => unsubscribeMessages();
  }, []);

  /*
   * ============================================================
   * SELECTED CHAT
   * ============================================================
   */

  const selectedChat =
    chats.find(
      (chat) => chat.id === selectedChatId
    ) || null;

  /*
   * ============================================================
   * SELECT CHAT
   * ============================================================
   */

  const handleSelectChat = async (chatId) => {
    setSelectedChatId(chatId);

    const chat = chats.find(
      (item) => item.id === chatId
    );

    if (!chat) {
      return;
    }

    // Reset unread count in Firestore
    if (Number(chat.unread || 0) > 0) {
      try {
        const chatRef = doc(
          db,
          "messages",
          chatId
        );

        await updateDoc(chatRef, {
          unread: 0,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error(
          "Error marking conversation as read:",
          error
        );
      }
    }
  };

  /*
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */

  const handleSend = async () => {
    if (
      !messageText.trim() ||
      !selectedChat
    ) {
      return;
    }

    const trimmedMessage =
      messageText.trim();

    const newMessage = {
      sender: "admin",
      text: trimmedMessage,

      // Simple readable timestamp
      timestamp: new Date().toISOString(),
    };

    try {
      const chatRef = doc(
        db,
        "messages",
        selectedChat.id
      );

      await updateDoc(chatRef, {
        messages: arrayUnion(newMessage),

        /*
         * Updated so the conversation moves
         * to the top of the list.
         */
        updatedAt: serverTimestamp(),

        /*
         * Admin is sending the message,
         * so admin unread stays at 0.
         */
        unread: 0,
      });

      setMessageText("");
    } catch (error) {
      console.error(
        "Error sending message:",
        error
      );

      alert(
        "Failed to send message. Check the browser console for details."
      );
    }
  };

  /*
   * ============================================================
   * FORMAT MESSAGE TIME
   * ============================================================
   */

  const formatMessageTime = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    try {
      let date;

      if (
        typeof timestamp?.toDate ===
        "function"
      ) {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }

      if (Number.isNaN(date.getTime())) {
        return String(timestamp);
      }

      return date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return String(timestamp);
    }
  };

  return (
    <AdminLayout title="Messages">

      {/* ======================================================
          FIRESTORE ERROR
      ======================================================= */}

      {firestoreError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          <strong>Firestore Error:</strong>{" "}
          {firestoreError}
        </div>
      )}

      {/* ======================================================
          LOADING
      ======================================================= */}

      {loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 text-sm text-gray-500">
          Loading conversations...
        </div>
      )}

      {/* ======================================================
          MESSAGES LAYOUT
      ======================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">

        {/* ====================================================
            CHAT LIST
        ===================================================== */}

        <div className="bg-white rounded-lg shadow overflow-hidden">

          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg">
              Conversations
            </h3>
          </div>

          <div className="overflow-y-auto h-full">

            {chats.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No conversations yet.
              </div>
            ) : (
              chats.map((chat) => {

                const chatMessages =
                  Array.isArray(
                    chat.messages
                  )
                    ? chat.messages
                    : [];

                const lastMessage =
                  chatMessages.length > 0
                    ? chatMessages[
                        chatMessages.length - 1
                      ]
                    : null;

                return (
                  <div
                    key={chat.id}
                    onClick={() =>
                      handleSelectChat(
                        chat.id
                      )
                    }
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedChatId ===
                      chat.id
                        ? "bg-gray-50"
                        : ""
                    }`}
                  >

                    <div className="flex justify-between items-start">

                      <p className="font-medium">
                        {chat.customerName ||
                          "Customer"}
                      </p>

                      {Number(
                        chat.unread || 0
                      ) > 0 && (
                        <span className="bg-black text-white text-xs px-2 py-1 rounded-full">
                          {chat.unread}
                        </span>
                      )}

                    </div>

                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {lastMessage
                        ? lastMessage.text
                        : "No messages yet"}
                    </p>

                  </div>
                );
              })
            )}

          </div>
        </div>

        {/* ====================================================
            CHAT AREA
        ===================================================== */}

        <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">

          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">

                <button
                  onClick={() =>
                    setSelectedChatId(null)
                  }
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={20} />
                </button>

                <div>
                  <h3 className="text-lg font-medium">
                    {selectedChat.customerName ||
                      "Customer"}
                  </h3>

                  {selectedChat.customerEmail && (
                    <p className="text-xs text-gray-500">
                      {selectedChat.customerEmail}
                    </p>
                  )}
                </div>

              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {Array.isArray(
                  selectedChat.messages
                ) &&
                selectedChat.messages.length > 0 ? (
                  selectedChat.messages.map(
                    (msg, idx) => (
                      <div
                        key={`${selectedChat.id}-${idx}`}
                        className={`flex ${
                          msg.sender === "admin"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.sender ===
                            "admin"
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >

                          <p className="text-sm">
                            {msg.text}
                          </p>

                          <p
                            className={`text-xs mt-1 ${
                              msg.sender ===
                              "admin"
                                ? "text-gray-300"
                                : "text-gray-500"
                            }`}
                          >
                            {formatMessageTime(
                              msg.timestamp
                            )}
                          </p>

                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center text-gray-400 text-sm py-10">
                    No messages yet.
                  </div>
                )}

              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">

                <div className="flex gap-2">

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) =>
                      setMessageText(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter"
                      ) {
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />

                  <button
                    onClick={handleSend}
                    disabled={
                      !messageText.trim()
                    }
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
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