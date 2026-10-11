import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Send, ArrowLeft } from "lucide-react";

import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

export default function AdminMessages() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [firestoreError, setFirestoreError] = useState("");

  /*
   * ============================================================
   * FIRESTORE REAL-TIME CONVERSATIONS
   *
   * Conversation structure:
   *
   * conversations/{conversationId}
   *   customerId
   *   customerUid
   *   customerName
   *   customerEmail
   *   recipientRole: "admin"
   *   unreadForCustomer
   *   unreadForRecipient
   *   lastMessage
   *   lastMessageAt
   *   updatedAt
   *
   * conversations/{conversationId}/messages/{messageId}
   *   senderId
   *   senderRole
   *   senderName
   *   message
   *   createdAt
   * ============================================================
   */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "conversations"),
      (snapshot) => {
        const data = snapshot.docs
          .map((conversationDoc) => ({
            id: conversationDoc.id,
            ...conversationDoc.data(),
          }))
          .filter(
            (conversation) =>
              (conversation.recipientId === "admin" ||
              conversation.recipientRole === "admin" ||
              (!conversation.recipientId && !conversation.recipientRole))
          );

        data.sort((a, b) => {
          const getTime = (value) => {
            if (!value) return 0;

            if (typeof value.toMillis === "function") {
              return value.toMillis();
            }

            if (typeof value.toDate === "function") {
              return value.toDate().getTime();
            }

            if (value instanceof Date) {
              return value.getTime();
            }

            if (
              typeof value.seconds === "number"
            ) {
              return value.seconds * 1000;
            }

            const parsed = new Date(value).getTime();

            return Number.isNaN(parsed) ? 0 : parsed;
          };

          return (
            getTime(b.lastMessageAt || b.updatedAt) -
            getTime(a.lastMessageAt || a.updatedAt)
          );
        });

        setChats(data);
        setLoading(false);
        setFirestoreError("");
      },
      (error) => {
        console.error(
          "CONVERSATIONS FIRESTORE ERROR:",
          error
        );

        setChats([]);
        setLoading(false);
        setFirestoreError(error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * ============================================================
   * REAL-TIME MESSAGES FOR SELECTED CONVERSATION
   * ============================================================
   */

  useEffect(() => {
    if (!selectedChatId) {
      setSelectedMessages([]);
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);

    const messagesRef = collection(
      db,
      "conversations",
      selectedChatId,
      "messages"
    );

    const unsubscribe = onSnapshot(
      messagesRef,
      (snapshot) => {
        const data = snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...messageDoc.data(),
        }));

        data.sort((a, b) => {
          const getTime = (value) => {
            if (!value) return 0;

            if (typeof value.toMillis === "function") {
              return value.toMillis();
            }

            if (typeof value.toDate === "function") {
              return value.toDate().getTime();
            }

            if (typeof value.seconds === "number") {
              return value.seconds * 1000;
            }

            const parsed = new Date(value).getTime();

            return Number.isNaN(parsed) ? 0 : parsed;
          };

          return (
            getTime(a.createdAt) -
            getTime(b.createdAt)
          );
        });

        setSelectedMessages(data);
        setMessagesLoading(false);
      },
      (error) => {
        console.error(
          "CONVERSATION MESSAGES FIRESTORE ERROR:",
          error
        );

        setSelectedMessages([]);
        setMessagesLoading(false);
        setFirestoreError(error.message);
      }
    );

    return () => unsubscribe();
  }, [selectedChatId]);

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

    /*
     * Admin has opened the conversation,
     * so clear the unread count for admin.
     */
    if (Number(chat.unreadForRecipient || 0) > 0) {
      try {
        const chatRef = doc(
          db,
          "conversations",
          chatId
        );

        await updateDoc(chatRef, {
          unreadForRecipient: 0,
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

    const trimmedMessage = messageText.trim();
    const conversationRef = doc(
      db,
      "conversations",
      selectedChat.id
    );

    const messagesRef = collection(
      conversationRef,
      "messages"
    );

    try {
      /*
       * Add the actual message document to the
       * conversation's messages subcollection.
       */
      await addDoc(messagesRef, {
        senderId: "admin",
        senderRole: "admin",
        senderName: "MPRSS Admin",
        message: trimmedMessage,
        createdAt: serverTimestamp(),
      });

      /*
       * Update conversation preview and unread count.
       *
       * Admin is sending, so:
       * - unreadForRecipient = 0
       * - customer's unread count increases by 1
       */
      await updateDoc(conversationRef, {
        lastMessage: trimmedMessage,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadForRecipient: 0,
        unreadForCustomer: increment(1),
      });

      const customerId =
        selectedChat.customerUid ||
        selectedChat.customerId ||
        selectedChat.userId ||
        "";

      if (customerId) {
        await addDoc(collection(db, "notifications"), {
          customerId,
          recipientRole: "customer",
          type: "message",
          title: "New Reply from MPRSS",
          message: trimmedMessage.length > 140
            ? `${trimmedMessage.slice(0, 137)}...`
            : trimmedMessage,
          route: "/messages",
          conversationId: selectedChat.id,
          read: false,
          createdAt: serverTimestamp(),
        });
      } else {
        console.warn(
          "Message was sent, but no customer UID was found for notification.",
          selectedChat.id
        );
      }

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
      } else if (
        typeof timestamp?.seconds ===
        "number"
      ) {
        date = new Date(
          timestamp.seconds * 1000 +
            Math.floor(
              (timestamp.nanoseconds || 0) / 1000000
            )
        );
      } else {
        date = new Date(timestamp);
      }

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      return date.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  /*
   * ============================================================
   * FORMAT CONVERSATION TIME
   * ============================================================
   */

  const formatConversationTime = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    try {
      let date;

      if (typeof timestamp?.toDate === "function") {
        date = timestamp.toDate();
      } else if (typeof timestamp?.seconds === "number") {
        date = new Date(
          timestamp.seconds * 1000 +
            Math.floor(
              (timestamp.nanoseconds || 0) / 1000000
            )
        );
      } else {
        date = new Date(timestamp);
      }

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      return date.toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
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
                return (
                  <div
                    key={chat.id}
                    onClick={() =>
                      handleSelectChat(chat.id)
                    }
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedChatId === chat.id
                        ? "bg-gray-50"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <p className="font-medium truncate">
                        {chat.customerName ||
                          "Customer"}
                      </p>

                      {Number(
                        chat.unreadForRecipient || 0
                      ) > 0 && (
                        <span className="bg-black text-white text-xs px-2 py-1 rounded-full shrink-0">
                          {chat.unreadForRecipient}
                        </span>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {chat.lastMessage ||
                          "No messages yet"}
                      </p>

                      {chat.lastMessageAt && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {formatConversationTime(
                            chat.lastMessageAt
                          )}
                        </span>
                      )}
                    </div>

                    {chat.customerEmail && (
                      <p className="text-[11px] text-gray-400 mt-1 truncate">
                        {chat.customerEmail}
                      </p>
                    )}
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
                {messagesLoading ? (
                  <div className="text-center text-gray-400 text-sm py-10">
                    Loading messages...
                  </div>
                ) : selectedMessages.length > 0 ? (
                  selectedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderRole === "admin"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.senderRole === "admin"
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message || ""}
                        </p>

                        <p
                          className={`text-xs mt-1 ${
                            msg.senderRole === "admin"
                              ? "text-gray-300"
                              : "text-gray-500"
                          }`}
                        >
                          {formatMessageTime(
                            msg.createdAt
                          )}
                        </p>
                      </div>
                    </div>
                  ))
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
                        e.key === "Enter" &&
                        !e.shiftKey
                      ) {
                        e.preventDefault();
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
