import React, { useState, useRef, useEffect } from "react";
import { Navbar } from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

// Random music prompts for the bubbles
const musicPrompts = [
  "Upbeat jazz melody",
  "Calm piano tune",
  "Energetic rock beat",
  "Soothing classical violin",
  "Chill lo-fi hip hop",
  "Epic orchestral soundtrack",
  "Funky disco groove",
  "Relaxing acoustic guitar",
  "Dreamy synthwave",
  "Lively pop anthem",
  "Mystical ambient drone",
  "Retro 80s synth pop",
  "Dark cinematic tension",
  "Bouncy tropical house",
  "Melancholic acoustic ballad",
  "Fast-paced drum and bass",
  "Smooth R&B groove",
  "Ethereal choir harmony",
  "Pulsing techno beat",
  "Warm vinyl crackle with jazz",
];

// Generate random positions and delays for the bubbles
const getRandomBubbleProps = () => ({
  x: Math.random() * 400 - 200,
  y: Math.random() * 400 - 200,
  delay: Math.random() * 3,
  duration: 5 + Math.random() * 5,
});

const TextToMusic = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(null); // null means "Auto"
  const [promptInfluence, setPromptInfluence] = useState(0.5); // Default to 50%
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentAudioTimestamp, setCurrentAudioTimestamp] = useState(null);
  const audioRef = useRef(null);
  const historyAudioRefs = useRef({});

  // Handle audio play/pause state for main player
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // Fetch history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axiosInstance.get("/api/tools/history/sounds", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched history:", response.data);
        setHistory(response.data);
      } catch (err) {
        console.error("Error fetching history:", err);
        let errorMessage = "Failed to load history.";
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
      }
    };

    fetchHistory();
  }, [navigate]);

  // Update audio time and duration for main player
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const setAudioDuration = () => setDuration(audio.duration);
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("loadedmetadata", setAudioDuration);
      return () => {
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("loadedmetadata", setAudioDuration);
      };
    }
  }, [audioUrl]);

  // Handle conversion to music
  const handleConvert = async () => {
    if (!text) {
      setError("Please enter some text to convert!");
      return;
    }

    if (
      durationSeconds !== null &&
      (durationSeconds < 0.5 || durationSeconds > 22)
    ) {
      setError("Duration must be between 0.5 and 22 seconds.");
      return;
    }

    if (promptInfluence < 0 || promptInfluence > 1) {
      setError("Prompt influence must be between 0 and 1.");
      return;
    }

    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to generate music.");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        text: text,
        durationSeconds: durationSeconds,
        promptInfluence: promptInfluence,
      };

      const response = await axiosInstance.post(
        "/api/tools/text-to-music",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );

      const contentType = response.headers["content-type"];
      if (contentType.includes("audio/mp3")) {
        const audioBlob = response.data;
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        setCurrentAudioTimestamp(new Date().toISOString());

        try {
          const historyResponse = await axiosInstance.get(
            "/api/tools/history/sounds",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("Synced history:", historyResponse.data);
          setHistory(historyResponse.data);
        } catch (err) {
          console.error("Error syncing history:", err);
          toast.error("Failed to sync history.");
        }
      } else if (contentType.includes("application/json")) {
        const reader = new FileReader();
        reader.onload = () => {
          const errorData = JSON.parse(reader.result);
          const errorMessage = errorData.error || "Error generating music.";
          setError(errorMessage);
          toast.error(errorMessage);
        };
        reader.readAsText(response.data);
      } else {
        throw new Error("Unexpected response type: " + contentType);
      }
    } catch (err) {
      console.error("Error generating music:", err);
      let errorMessage = "Error generating music. Please try again.";
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          localStorage.removeItem("token");
          setTimeout(() => {
            navigate("/login");
          }, 1000);
        } else if (
          err.response.headers["content-type"]?.includes("application/json")
        ) {
          const reader = new FileReader();
          reader.onload = () => {
            const errorData = JSON.parse(reader.result);
            errorMessage = errorData.error || "Error generating music.";
            setError(errorMessage);
            toast.error(errorMessage);
          };
          reader.readAsText(err.response.data);
          return;
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle download of the generated audio
  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = "generated_sound.mp3";
      link.click();
    }
  };

  // Toggle history sidebar
  const toggleHistory = () => {
    if (isHistoryOpen) {
      Object.keys(historyAudioRefs.current).forEach((key) => {
        if (
          historyAudioRefs.current[key] &&
          !historyAudioRefs.current[key].paused
        ) {
          historyAudioRefs.current[key].pause();
          setHistory((prevHistory) =>
            prevHistory.map((item) =>
              item.id === parseInt(key.split("-")[1])
                ? { ...item, isPlaying: false }
                : item
            )
          );
        }
      });
    }
    setIsHistoryOpen(!isHistoryOpen);
  };

  // Handle duration slider change
  const handleDurationChange = (value) => {
    setDurationSeconds(Number(value));
  };

  // Handle deletion of a history entry
  const handleDeleteHistory = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to delete history.");
      navigate("/login");
      return;
    }

    try {
      console.log(`Attempting to delete history entry with ID: ${id}`);
      await axiosInstance.delete(`/api/tools/history/sounds/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(history.filter((item) => item.id !== id));
      toast.info("Sound history deleted successfully!");
    } catch (err) {
      console.error("Error deleting sound history:", err);
      let errorMessage = "Failed to delete sound history.";
      if (err.response) {
        console.error("Delete error response:", err.response);
        if (err.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          localStorage.removeItem("token");
          navigate("/login");
        } else if (err.response.status === 403) {
          errorMessage = "You are not authorized to delete this sound history.";
        } else if (err.response.status === 404) {
          errorMessage = "Sound history not found.";
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      }
      toast.error(errorMessage);
    }
  };

  // Handle play/pause for history entries
  const handleHistoryPlayback = (item, index) => {
    const audio = historyAudioRefs.current[index];
    if (audio) {
      console.log(
        `Playing audio for history entry ID: ${item.id}, URL: ${audio.src}`
      );
      if (audio.paused) {
        Object.keys(historyAudioRefs.current).forEach((key) => {
          if (
            key !== index &&
            historyAudioRefs.current[key] &&
            !historyAudioRefs.current[key].paused
          ) {
            console.log(`Pausing other history audio ID: ${key}`);
            historyAudioRefs.current[key].pause();
            setHistory((prevHistory) =>
              prevHistory.map((entry) =>
                entry.id === parseInt(key.split("-")[1])
                  ? { ...entry, isPlaying: false }
                  : entry
              )
            );
          }
        });
        if (audioRef.current && !audioRef.current.paused) {
          console.log("Pausing main audio player");
          audioRef.current.pause();
          setIsPlaying(false);
        }
        audio
          .play()
          .then(() => {
            console.log(`Successfully started playing audio ID: ${item.id}`);
            setHistory((prevHistory) =>
              prevHistory.map((entry) =>
                entry.id === item.id
                  ? { ...entry, isPlaying: true }
                  : { ...entry, isPlaying: false }
              )
            );
          })
          .catch((err) => {
            console.error(`Error playing audio ID: ${item.id}`, err);
            toast.error("Failed to play audio: " + err.message);
          });
      } else {
        audio.pause();
        console.log(`Paused audio ID: ${item.id}`);
        setHistory((prevHistory) =>
          prevHistory.map((entry) =>
            entry.id === item.id ? { ...entry, isPlaying: false } : entry
          )
        );
      }
    } else {
      console.error(`Audio element not found for ID: ${item.id}`);
      toast.error("Audio element not found.");
    }
  };

  // Toggle play/pause for the main generated audio
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        Object.keys(historyAudioRefs.current).forEach((key) => {
          if (
            historyAudioRefs.current[key] &&
            !historyAudioRefs.current[key].paused
          ) {
            historyAudioRefs.current[key].pause();
            setHistory((prevHistory) =>
              prevHistory.map((item) =>
                item.id === parseInt(key.split("-")[1])
                  ? { ...item, isPlaying: false }
                  : item
              )
            );
          }
        });
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle timeline scrubbing for main audio
  const handleTimelineChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Reset settings
  const resetSettings = () => {
    setDurationSeconds(null);
    setPromptInfluence(0.5);
  };

  // Format time in MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Function to generate a random prompt
  const generateRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * musicPrompts.length);
    const randomPrompt = musicPrompts[randomIndex];
    setText(randomPrompt);
  };

  return (
    <div className="bg-gradient-to-br from-black via-gray-700 to-black min-h-screen text-gray-300 flex flex-col">
      <Navbar />

      <div className="flex-1 w-full flex items-center justify-center relative z-10">
        <div className="w-full max-w-3xl px-4 relative">
          <h1 className="text-5xl font-bold text-center mb-10 text-gray-200 tracking-wide">
            Generate Sound Effects
          </h1>

          {/* Floating Music Prompt Bubbles */}
          <div className="absolute inset-0 pointer-events-none">
            {musicPrompts.map((prompt, index) => {
              const bubbleProps = getRandomBubbleProps();
              return (
                <motion.div
                  key={index}
                  className="absolute bg-gray-800 bg-opacity-40 text-gray-400 text-xs font-medium px-4 py-2 rounded-full shadow-lg"
                  initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1, 1, 0.5],
                    x: bubbleProps.x,
                    y: bubbleProps.y,
                  }}
                  transition={{
                    duration: bubbleProps.duration,
                    delay: bubbleProps.delay,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut",
                  }}
                >
                  {prompt}
                </motion.div>
              );
            })}
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-20"
          >
            <div className="flex items-center space-x-2 mb-6 text-nowrap">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text here (e.g Spacious braam suitable for high-impact movie trailer')"
                className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                onClick={generateRandomPrompt}
                className="p-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all flex items-center space-x-2"
                title="Inspire Me"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-200"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span className="text-gray-200 text-sm">Inspire Me</span>
              </button>
              <button
                onClick={toggleHistory}
                className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {/* Duration Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-400">
                  Duration
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (durationSeconds === null) {
                        setDurationSeconds(0.5);
                      } else {
                        setDurationSeconds(null);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      durationSeconds === null
                        ? "bg-indigo-600 text-gray-200"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {durationSeconds === null ? "Auto" : "Manual"}
                  </button>
                  <span className="text-sm text-gray-400">
                    {durationSeconds !== null
                      ? `${durationSeconds.toFixed(1)}s`
                      : "Auto"}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max="22"
                step="0.1"
                value={durationSeconds !== null ? durationSeconds : 0.5}
                onChange={(e) => handleDurationChange(e.target.value)}
                disabled={durationSeconds === null}
                onMouseDown={() => {
                  if (durationSeconds === null) {
                    setDurationSeconds(0.5);
                  }
                }}
                className="w-full h-6 bg-transparent appearance-none pointer-events-auto z-10 relative"
              />
              <style>{`
                input[type="range"] {
                  -webkit-appearance: none;
                  width: 100%;
                  height: 6px;
                  background: linear-gradient(to right, #4B5563 0%, #4B5563 100%);
                  outline: none;
                  border-radius: 3px;
                }
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  height: 20px;
                  width: 20px;
                  background: #A5B4FC;
                  border-radius: 50%;
                  cursor: pointer;
                  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
                }
                input[type="range"]::-moz-range-thumb {
                  height: 20px;
                  width: 20px;
                  background: #A5B4FC;
                  border-radius: 50%;
                  cursor: pointer;
                  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
                }
                input[type="range"]::-webkit-slider-runnable-track {
                  height: 6px;
                  background: #4B5563;
                  border-radius: 3px;
                }
                input[type="range"]::-moz-range-track {
                  height: 6px;
                  background: #4B5563;
                  border-radius: 3px;
                }
                input[type="range"][disabled]::-webkit-slider-thumb {
                  background: #6B7280;
                  cursor: not-allowed;
                }
                input[type="range"][disabled]::-moz-range-thumb {
                  background: #6B7280;
                  cursor: not-allowed;
                }
              `}</style>
            </div>

            {/* Prompt Influence Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-400">
                  Prompt Influence
                </label>
                <span className="text-sm text-gray-400">
                  {(promptInfluence * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={promptInfluence}
                onChange={(e) => setPromptInfluence(Number(e.target.value))}
                className="w-full h-6 bg-transparent appearance-none pointer-events-auto z-10 relative"
              />
            </div>

            {error && (
              <div className="text-red-500 text-center font-medium mb-4">
                {error}
              </div>
            )}

            {/* Reset Values */}
            <div className="text-right mb-4">
              <button
                type="button"
                onClick={resetSettings}
                className="text-indigo-400 hover:text-indigo-300 text-sm transition"
              >
                Reset values
              </button>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleConvert}
                className={`px-8 py-3 rounded-full text-white font-semibold transition-all ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg hover:shadow-xl"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                ) : (
                  "Generate"
                )}
              </button>
            </div>

            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 bg-gray-900 p-4 rounded-lg shadow-lg flex items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <span className="text-sm text-gray-400">
                    {currentAudioTimestamp
                      ? formatDistanceToNow(new Date(currentAudioTimestamp)) +
                        " ago"
                      : "Created now"}
                  </span>
                </div>
                <div className="flex-1 flex items-center space-x-2">
                  <button
                    onClick={togglePlayPause}
                    className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none transition"
                  >
                    <svg
                      className="w-5 h-5 text-gray-200"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {isPlaying ? (
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      ) : (
                        <path d="M8 5v14l11-7z" />
                      )}
                    </svg>
                  </button>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-400">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleTimelineChange}
                      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #6366F1 ${
                          (currentTime / (duration || 1)) * 100
                        }%, #4B5563 ${(currentTime / (duration || 1)) * 100}%)`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={audioUrl}
                    download={`sound-${Date.now()}.mp3`}
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </a>
                  <button
                    onClick={handleConvert}
                    disabled={loading}
                    className={`p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 text-white transition duration-300 ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* History Sidebar */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-16 right-0 w-80 h-[calc(100%-4rem)] bg-gray-900 shadow-lg z-50 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900"
            >
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-base font-semibold text-gray-200">
                    History
                  </h2>
                  <button
                    onClick={toggleHistory}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <div key={item.id} className="mb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </h3>
                        <div className="flex space-x-1">
                          <button
                            onClick={() =>
                              handleHistoryPlayback(item, `history-${item.id}`)
                            }
                            className="text-gray-400 hover:text-gray-200"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {item.isPlaying ? (
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              ) : (
                                <path d="M8 5v14l11-7z" />
                              )}
                            </svg>
                          </button>
                          <a
                            href={item.audioUrl}
                            download={`sound-${Date.now()}.mp3`}
                            className={`text-gray-400 hover:text-gray-200 ${
                              !item.audioUrl
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            onClick={(e) =>
                              !item.audioUrl && e.preventDefault()
                            }
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </a>
                          <button
                            onClick={() => handleDeleteHistory(item.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <button
                          className="w-full text-left p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                          onClick={() => {
                            setText(item.prompt);
                            setDurationSeconds(item.durationSeconds);
                            setPromptInfluence(item.promptInfluence);
                            setAudioUrl(item.audioUrl);
                            setCurrentAudioTimestamp(item.createdAt);
                            toggleHistory();
                          }}
                        >
                          <p className="text-sm text-gray-200 font-medium line-clamp-1">
                            {item.prompt}
                          </p>
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <span>
                              {item.durationSeconds !== null
                                ? `← ${item.durationSeconds.toFixed(1)}s`
                                : "Auto"}
                            </span>
                            <span>·</span>
                            <span>
                              @ {(item.promptInfluence * 100).toFixed(0)}%
                            </span>
                            <span>·</span>
                            <span>
                              {formatDistanceToNow(new Date(item.createdAt))}{" "}
                              ago
                            </span>
                          </div>
                        </button>
                      </div>
                      {item.audioUrl && (
                        <audio
                          ref={(el) =>
                            (historyAudioRefs.current[`history-${item.id}`] =
                              el)
                          }
                          src={item.audioUrl}
                          className="hidden"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center text-sm">
                    No history available.
                  </p>
                )}
              </div>
              <div className="absolute bottom-3 right-3">
                <button
                  onClick={toggleHistory}
                  className="p-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition text-sm"
                >
                  Hide history
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* More Sensitive Music Wave at the Bottom */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 h-50 bg-gray-900 bg-opacity-0 flex items-center justify-center overflow-hidden"
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
            >
              {[...Array(50)].map((_, i) => {
                const baseHeight = 10 + Math.sin(i * 0.5) * 2;
                const maxHeight = baseHeight + 15 + Math.sin(i * 0.3) * 4;
                const colorTransition =
                  i % 2 === 0 ? ["#A5B4FC", "#6366F1"] : ["#6366F1", "#A5B4FC"];

                return (
                  <motion.rect
                    key={i}
                    x={i * 2}
                    width={1}
                    initial={{
                      height: baseHeight,
                      y: 60 - baseHeight,
                      opacity: 0,
                    }}
                    animate={{
                      height: [baseHeight, maxHeight, baseHeight],
                      y: [60 - baseHeight, 60 - maxHeight, 60 - baseHeight],
                      fill: colorTransition,
                      opacity: [0.6, 0.9, 0.6],
                    }}
                    transition={{
                      duration: 0.4 + Math.sin(i * 0.2) * 0.1,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                      delay: i * 0.03,
                      times: [0, 0.5, 1],
                    }}
                  />
                );
              })}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TextToMusic;
