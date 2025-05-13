import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import gsap from "gsap";
import { Navbar } from "./Navbar";
import axiosInstance from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function TextAssistance() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistories, setChatHistories] = useState([]);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(
    localStorage.getItem("currentConversationId") || null
  );
  const [historyLoading, setHistoryLoading] = useState(false);

  const titleRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // GSAP animation for title
  useEffect(() => {
    gsap.fromTo(
      titleRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    );
  }, []);

  // Persist currentConversationId
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem("currentConversationId", currentConversationId);
    } else {
      localStorage.removeItem("currentConversationId");
    }
  }, [currentConversationId]);

  // Fetch chat history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setHistoryLoading(true);
      try {
        const response = await axiosInstance.get("/api/tools/history/chatbot", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const historyMap = new Map();
        response.data.forEach((entry) => {
          if (!entry.conversationId) return;

          const history = historyMap.get(entry.conversationId) || {
            id: entry.conversationId,
            title:
              entry.input.substring(0, 50) +
              (entry.input.length > 50 ? "..." : ""),
            messages: [],
            timestamp: entry.timestamp,
            backendIds: [],
          };

          history.messages.push(
            {
              id: uuidv4(),
              role: "user",
              text: entry.input,
              timestamp: entry.timestamp,
            },
            {
              id: uuidv4(),
              role: "model",
              text: entry.response,
              timestamp: entry.timestamp,
            }
          );
          history.backendIds.push(entry.id);
          if (
            !history.timestamp ||
            new Date(entry.timestamp) > new Date(history.timestamp)
          ) {
            history.timestamp = entry.timestamp;
          }

          historyMap.set(entry.conversationId, history);
        });

        const groupedHistories = Array.from(historyMap.values()).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setChatHistories(groupedHistories);

        if (currentConversationId && groupedHistories.length > 0) {
          const activeHistory = groupedHistories.find(
            (h) => h.id === currentConversationId
          );
          if (activeHistory) {
            setActiveHistoryIndex(groupedHistories.indexOf(activeHistory));
            setMessages(activeHistory.messages);
          } else {
            setActiveHistoryIndex(0);
            setMessages(groupedHistories[0]?.messages || []);
            setCurrentConversationId(groupedHistories[0]?.id || null);
          }
        } else if (groupedHistories.length > 0) {
          setActiveHistoryIndex(0);
          setMessages(groupedHistories[0].messages);
          setCurrentConversationId(groupedHistories[0].id);
        }
      } catch (err) {
        console.error("Error fetching chat history:", err);
        let errorMessage = "Failed to load chat history.";
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = "Session expired. Please log in again.";
            localStorage.removeItem("token");
            navigate("/login");
          } else if (err.response.data?.error) {
            errorMessage = err.response.data.error;
          }
        }
        toast.error(errorMessage);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleInput = (e) => setInput(e.target.value);

  const handleSend = async () => {
    if (!input.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to send messages.");
      navigate("/login");
      return;
    }

    const userMessage = {
      id: uuidv4(),
      role: "user",
      text: input,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = uuidv4();
        setCurrentConversationId(conversationId);
      }

      const response = await axiosInstance.post(
        "/api/tools/chatbot",
        { messages: updatedMessages, conversationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiText = response.data?.extractedText || "No response from AI";
      const aiResponse = {
        id: uuidv4(),
        role: "model",
        text: aiText,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);

      const updatedHistories = [...chatHistories];
      const existingHistoryIndex = updatedHistories.findIndex(
        (h) => h.id === conversationId
      );

      if (existingHistoryIndex !== -1) {
        updatedHistories[existingHistoryIndex].messages = finalMessages;
        updatedHistories[existingHistoryIndex].timestamp =
          new Date().toISOString();
        updatedHistories[existingHistoryIndex].backendIds.push(
          response.data?.id || Date.now()
        );
        setActiveHistoryIndex(existingHistoryIndex);
      } else {
        const newHistory = {
          id: conversationId,
          title: input.substring(0, 50) + (input.length > 50 ? "..." : ""),
          messages: finalMessages,
          timestamp: new Date().toISOString(),
          backendIds: [response.data?.id || Date.now()],
        };
        updatedHistories.unshift(newHistory);
        setChatHistories(updatedHistories);
        setActiveHistoryIndex(0);
      }
    } catch (err) {
      console.error("Error calling chatbot API:", err);
      let errorMessage = "Error calling AI.";
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          localStorage.removeItem("token");
          navigate("/login");
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) handleSend();
  };

  const handleHistorySelect = (index) => {
    setActiveHistoryIndex(index);
    setMessages(chatHistories[index]?.messages || []);
    setCurrentConversationId(chatHistories[index]?.id);
    setIsHistoryOpen(false);
  };

  const handleClearHistory = async () => {
    if (activeHistoryIndex === null || !chatHistories[activeHistoryIndex]) {
      toast.warn("No history selected to delete!");
      return;
    }

    const history = chatHistories[activeHistoryIndex];
    const confirmDelete = window.confirm(
      `Do you want to delete this history: "${history.title}"?`
    );

    if (confirmDelete) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to delete history.");
          navigate("/login");
          return;
        }

        for (const backendId of history.backendIds) {
          await axiosInstance.delete(
            `/api/tools/history/chatbot/${backendId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }

        const updatedHistories = chatHistories.filter(
          (_, index) => index !== activeHistoryIndex
        );
        setChatHistories(updatedHistories);

        if (updatedHistories.length === 0) {
          setActiveHistoryIndex(null);
          setMessages([]);
          setCurrentConversationId(null);
        } else {
          const newIndex = 0;
          setActiveHistoryIndex(newIndex);
          setMessages(updatedHistories[newIndex]?.messages || []);
          setCurrentConversationId(updatedHistories[newIndex]?.id);
        }

        toast.info("Chat history deleted successfully!");
      } catch (err) {
        console.error("Error deleting chat history:", err);
        let errorMessage = "Failed to delete chat history.";
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = "Session expired. Please log in again.";
            localStorage.removeItem("token");
            navigate("/login");
          } else if (err.response.status === 403) {
            errorMessage = "You are not authorized to delete this history.";
          } else if (err.response.status === 404) {
            errorMessage = "History not found.";
          } else if (err.response.status === 400) {
            errorMessage =
              err.response.data?.error || "Invalid request to delete history.";
          } else if (err.response.data?.error) {
            errorMessage = err.response.data.error;
          }
        }
        toast.error(errorMessage);
      }
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveHistoryIndex(null);
    setInput("");
    setCurrentConversationId(null);
  };

  const groupHistoriesByDate = () => {
    const grouped = {};
    chatHistories.forEach((history, index) => {
      const date = new Date(history.timestamp).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push({ ...history, originalIndex: index });
    });
    return grouped;
  };

  // Group messages into pairs (user and model) for display
  const groupedMessages = [];
  for (let i = 0; i < messages.length; i += 2) {
    const userMessage = messages[i];
    const modelMessage = messages[i + 1] || null;
    if (userMessage && userMessage.role === "user") {
      groupedMessages.push({ user: userMessage, model: modelMessage });
    }
  }

  const groupedHistories = groupHistoriesByDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-700 to-black text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <div
          className={`fixed top-16 left-0 w-[18rem] md:w-72 lg:w-80 h-[calc(100vh-4rem)] 
            bg-gradient-to-r from-black via-gray-800 to-transparent z-20 transform 
            ${isHistoryOpen ? "translate-x-0" : "-translate-x-full"} 
            transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg border-r border-gray-700`}
        >
          <div className="p-4 flex justify-between items-center border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Chat History</h2>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-5rem)]">
            {chatHistories.length === 0 ? (
              historyLoading ? (
                <p className="text-gray-400 text-center">Loading history...</p>
              ) : (
                <p className="text-gray-400 text-center">No history yet</p>
              )
            ) : (
              Object.keys(groupedHistories).map((date) => (
                <div key={date} className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {groupedHistories[date].map((history) => (
                      <button
                        key={history.originalIndex}
                        onClick={() =>
                          handleHistorySelect(history.originalIndex)
                        }
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          activeHistoryIndex === history.originalIndex
                            ? "bg-gray-700 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {history.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="absolute bottom-0 w-full p-4 border-t border-gray-700 bg-gray-900/60 backdrop-blur-lg">
            <button
              onClick={handleClearHistory}
              className="w-full p-3 bg-red-600 rounded-lg hover:bg-red-700 transition text-white font-medium disabled:bg-gray-500"
              disabled={activeHistoryIndex === null}
            >
              Delete Selected History
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col ml-0 lg:ml-80">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <h1
                ref={titleRef}
                className="text-3xl font-bold mb-6 text-center"
              >
                AI Chat Assistant
              </h1>
              {messages.length === 0 && (
                <div className="text-center text-gray-400">
                  Start a conversation by typing below...
                </div>
              )}
              {groupedMessages.map((pair) => (
                <div key={pair.user.id} className="mb-4">
                  {/* User message (question) */}
                  {pair.user && (
                    <div className="flex justify-end mb-2">
                      <div className="max-w-[70%] p-4 rounded-lg shadow-md select-text break-words bg-gray-800 text-white">
                        <ReactMarkdown>
                          {pair.user.text || "Error: No text available"}
                        </ReactMarkdown>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(pair.user.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Model message (answer) */}
                  {pair.model && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] p-4 rounded-lg shadow-md select-text break-words bg-gray-700 text-white">
                        <ReactMarkdown>
                          {pair.model.text || "Error: No text available"}
                        </ReactMarkdown>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(pair.model.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-700 p-4 rounded-lg shadow-md max-w-[70%]">
                    <span className="text-gray-400 animate-pulse">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="sticky bottom-0 p-6 bg-transparent">
            <div className="max-w-3xl mx-auto flex items-center bg-gray-800 rounded-full shadow-lg p-2">
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="p-2 text-gray-400 hover:text-white lg:hidden"
              >
                ☰
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInput}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-white p-3 outline-none placeholder-gray-400"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:bg-gray-500"
                disabled={loading}
              >
                ➤
              </button>
            </div>
            {error && (
              <div className="text-red-500 text-center mt-2">{error}</div>
            )}
          </div>

          <button
            onClick={startNewChat}
            className="fixed bottom-20 right-6 p-3 bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-500 hover:to-emerald-600 shadow-md hover:shadow-lg rounded-full text-white"
          >
            New Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default TextAssistance;
