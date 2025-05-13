import { useState, useRef, useEffect } from "react";
import { Navbar } from "../Navbar";
import gsap from "gsap";
import { toast } from "react-toastify";
import axiosInstance from "../../api";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

// Define voice options
const VOICES = {
  ADAM: { name: "Adam" },
  ALICE: { name: "Alice" },
  ANTONI: { name: "Antoni" },
  ARIA: { name: "Aria" },
  ARNOLD: { name: "Arnold" },
  BILL: { name: "Bill" },
  CALLUM: { name: "Callum" },
  ELLI: { name: "Elli" },
  EMILY: { name: "Emily" },
  FREYA: { name: "Freya" },
  SARAH: { name: "Sarah" },
  SERENA: { name: "Serena" },
  THOMAS: { name: "Thomas" },
  MICHAEL: { name: "Michael" },
  ETHAN: { name: "Ethan" },
  GEORGE: { name: "George" },
  PAUL: { name: "Paul" },
  GIGI: { name: "Gigi" },
  HUYEN_TRANG: { name: "Huyen Trang" },
  LY_HAI: { name: "Ly Hai" },
  TRAN_KIM_HUNG: { name: "Tran Kim Hung" },
  SANTA_CLAUS: { name: "Santa Claus" },
};

const TextToSpeech = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("settings");
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [voice, setVoice] = useState(VOICES.CALLUM.name);
  const [model] = useState("Eleven Turbo v2.5");
  const [speed, setSpeed] = useState(1);
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [loading, setLoading] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentAudioTimestamp, setCurrentAudioTimestamp] = useState(null);

  const audioRef = useRef(null);
  const historyAudioRefs = useRef({});
  const containerRef = useRef(null);
  const titleRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axiosInstance.get("/api/tools/history/tts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(response.data);
      } catch (err) {
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

    // GSAP animations
    gsap.fromTo(
      titleRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    );
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power3.out" }
    );
  }, [navigate]);

  // Update audio time and duration
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
  }, [generatedAudioUrl]);

  // Handle form submission for main generation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) {
      toast.warning("Please enter some text");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to generate speech.");
      navigate("/login");
      return;
    }

    setLoading(true);
    setGeneratedAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setCurrentAudioTimestamp(null);

    try {
      const response = await axiosInstance.post(
        "/api/tools/text-to-speech",
        {
          input,
          voice,
          speed,
          stability,
          similarity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );

      const blob = response.data;
      const audioUrl = URL.createObjectURL(blob);
      setGeneratedAudioUrl(audioUrl);
      setCurrentAudioTimestamp(new Date().toISOString());

      // Refresh history
      const historyResponse = await axiosInstance.get(
        "/api/tools/history/tts",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistory(historyResponse.data);

      toast.success("Speech generated successfully!");
    } catch (error) {
      let errorMessage = "Failed to generate speech.";
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          localStorage.removeItem("token");
          navigate("/login");
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle playback for history entries
  const handleHistoryPlayback = (item, index) => {
    const audio = historyAudioRefs.current[index];
    if (audio) {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    }
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
      await axiosInstance.delete(`/api/tools/history/tts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(history.filter((item) => item.id !== id));
      toast.success("History entry deleted!");
    } catch (err) {
      let errorMessage = "Failed to delete history.";
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          localStorage.removeItem("token");
          navigate("/login");
        } else if (err.response.status === 403) {
          errorMessage = "You are not authorized to delete this history.";
        } else if (err.response.status === 404) {
          errorMessage = "History not found.";
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      }
      toast.error(errorMessage);
    }
  };

  // Toggle play/pause for the main generated audio
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
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
    setSpeed(1);
    setStability(0.5);
    setSimilarity(0.75);
  };

  // Filter and group history by date
  const filteredHistory = history.filter(
    (item) =>
      item.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.voice.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedHistory = filteredHistory.reduce(
    (acc, item) => {
      const date = new Date(item.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        acc.today.push(item);
      } else if (date.toDateString() === yesterday.toDateString()) {
        acc.yesterday.push(item);
      }
      return acc;
    },
    { today: [], yesterday: [] }
  );

  // Format time in MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-700 to-black">
      <Navbar />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 ref={titleRef} className="text-2xl font-semibold text-white-900">
            Text to Speech
          </h1>
        </div>

        <div ref={containerRef} className="flex flex-col md:flex-row gap-6">
          {/* Left Section: Textarea and Generated Audio */}
          <div className="w-full md:w-2/3">
            <form onSubmit={handleSubmit}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Start typing here or paste any text you want to turn into lifelike speech..."
                className="w-full h-64 p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-400 resize-none"
                required
              />

              {/* Character Count */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span>{input.length} / 5,000 characters</span>
                </div>
                {generatedAudioUrl && (
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-semibold text-white transition duration-300 ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {loading ? "Generating..." : "Regenerate speech"}
                  </button>
                )}
              </div>
            </form>

            {/* Generated Audio Section */}
            {generatedAudioUrl && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <span className="text-sm text-gray-600">
                    {voice} •{" "}
                    {currentAudioTimestamp
                      ? formatDistanceToNow(new Date(currentAudioTimestamp)) +
                        " ago"
                      : "Created now"}
                  </span>
                </div>
                <div className="flex-1 flex items-center space-x-2">
                  <button
                    onClick={togglePlayPause}
                    className="focus:outline-none"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600"
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
                    src={generatedAudioUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleTimelineChange}
                      className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #007bff ${
                          (currentTime / (duration || 1)) * 100
                        }%, #d1d5db ${(currentTime / (duration || 1)) * 100}%)`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={generatedAudioUrl}
                    download={`speech-${Date.now()}.mp3`}
                    className="text-gray-600 hover:text-gray-900"
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
                </div>
              </div>
            )}
          </div>

          {/* Right Section: Settings/History Panel */}
          <div className="w-full md:w-1/3 bg-gray-50 rounded-lg p-4 shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "settings"
                    ? "text-gray-900 border-b-2 border-blue-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "history"
                    ? "text-gray-900 border-b-2 border-blue-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("history")}
              >
                History
              </button>
            </div>

            {activeTab === "settings" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Voice Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Voice
                  </label>
                  <div className="relative">
                    <select
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 text-gray-600 focus:border-blue-500 focus:outline-none appearance-none"
                    >
                      {Object.values(VOICES).map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Model
                  </label>
                  <div className="relative">
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 text-gray-600 focus:border-blue-500 focus:outline-none appearance-none"
                      disabled
                    >
                      <option value="Eleven Turbo v2.5">
                        Eleven Turbo v2.5
                      </option>
                    </select>
                    <svg
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Speed Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Speed
                  </label>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Slower</span>
                    <span>Faster</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #007bff ${
                        ((speed - 0.5) / 1.5) * 100
                      }%, #d1d5db ${((speed - 0.5) / 1.5) * 100}%)`,
                    }}
                  />
                </div>

                {/* Stability Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Stability
                  </label>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>More variable</span>
                    <span>More stable</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={stability}
                    onChange={(e) => setStability(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #007bff ${
                        (stability / 1) * 100
                      }%, #d1d5db ${(stability / 1) * 100}%)`,
                    }}
                  />
                </div>

                {/* Similarity Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Similarity
                  </label>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={similarity}
                    onChange={(e) => setSimilarity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #007bff ${
                        (similarity / 1) * 100
                      }%, #d1d5db ${(similarity / 1) * 100}%)`,
                    }}
                  />
                </div>

                {/* Reset Values */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={resetSettings}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    Reset values
                  </button>
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition duration-300 ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  {loading ? "Generating..." : "Generate"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search history..."
                    className="w-full p-2 rounded-lg border border-gray-300 text-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <svg
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* History Entries */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <p className="text-gray-400 text-center">No history yet</p>
                  ) : (
                    <>
                      {groupedHistory.today.length > 0 && (
                        <>
                          <h3 className="text-sm font-semibold text-gray-600">
                            Today
                          </h3>
                          {groupedHistory.today.map((item, index) => (
                            <div
                              key={item.id}
                              className="p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="flex justify-between items-center">
                                <div
                                  onClick={() => {
                                    setInput(item.input);
                                    setVoice(item.voice);
                                    setSpeed(item.speed || 1);
                                    setStability(item.stability || 0.5);
                                    setSimilarity(item.similarity || 0.75);
                                    setGeneratedAudioUrl(item.audioUrl);
                                    setCurrentAudioTimestamp(item.createdAt);
                                    setActiveTab("settings");
                                  }}
                                  className="flex-1"
                                >
                                  <p className="text-gray-900 line-clamp-1">
                                    {item.input}
                                  </p>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span
                                      className={`w-3 h-3 rounded-full ${
                                        item.voice === "George"
                                          ? "bg-orange-500"
                                          : item.voice === "Antoni"
                                          ? "bg-green-500"
                                          : item.voice === "Emily"
                                          ? "bg-pink-500"
                                          : item.voice === "Callum"
                                          ? "bg-orange-500"
                                          : item.voice === "Adam"
                                          ? "bg-blue-500"
                                          : "bg-blue-500"
                                      }`}
                                    ></span>
                                    <span>{item.voice}</span>
                                    <span>·</span>
                                    <span>
                                      {formatDistanceToNow(
                                        new Date(item.createdAt)
                                      )}{" "}
                                      ago
                                    </span>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      handleHistoryPlayback(
                                        item,
                                        `today-${item.id}`
                                      )
                                    }
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </button>
                                  <a
                                    href={item.audioUrl}
                                    download={`speech-${Date.now()}.mp3`}
                                    className={`text-gray-600 hover:text-gray-900 ${
                                      !item.audioUrl
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                    onClick={(e) =>
                                      !item.audioUrl && e.preventDefault()
                                    }
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
                                    onClick={() => handleDeleteHistory(item.id)}
                                    className="text-red-600 hover:text-red-800"
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
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              {item.audioUrl && (
                                <audio
                                  ref={(el) =>
                                    (historyAudioRefs.current[
                                      `today-${item.id}`
                                    ] = el)
                                  }
                                  src={item.audioUrl}
                                  className="hidden"
                                />
                              )}
                            </div>
                          ))}
                        </>
                      )}
                      {groupedHistory.yesterday.length > 0 && (
                        <>
                          <h3 className="text-sm font-semibold text-gray-600 mt-4">
                            Yesterday
                          </h3>
                          {groupedHistory.yesterday.map((item, index) => (
                            <div
                              key={item.id}
                              className="p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="flex justify-between items-center">
                                <div
                                  onClick={() => {
                                    setInput(item.input);
                                    setVoice(item.voice);
                                    setSpeed(item.speed || 1);
                                    setStability(item.stability || 0.5);
                                    setSimilarity(item.similarity || 0.75);
                                    setGeneratedAudioUrl(item.audioUrl);
                                    setCurrentAudioTimestamp(item.createdAt);
                                    setActiveTab("settings");
                                  }}
                                  className="flex-1"
                                >
                                  <p className="text-gray-900 line-clamp-1">
                                    {item.input}
                                  </p>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span
                                      className={`w-3 h-3 rounded-full ${
                                        item.voice === "George"
                                          ? "bg-orange-500"
                                          : item.voice === "Antoni"
                                          ? "bg-green-500"
                                          : item.voice === "Emily"
                                          ? "bg-pink-500"
                                          : item.voice === "Callum"
                                          ? "bg-orange-500"
                                          : item.voice === "Adam"
                                          ? "bg-blue-500"
                                          : "bg-blue-500"
                                      }`}
                                    ></span>
                                    <span>{item.voice}</span>
                                    <span>·</span>
                                    <span>
                                      {formatDistanceToNow(
                                        new Date(item.createdAt)
                                      )}{" "}
                                      ago
                                    </span>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      handleHistoryPlayback(
                                        item,
                                        `yesterday-${item.id}`
                                      )
                                    }
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </button>
                                  <a
                                    href={item.audioUrl}
                                    download={`speech-${Date.now()}.mp3`}
                                    className={`text-gray-600 hover:text-gray-900 ${
                                      !item.audioUrl
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                    onClick={(e) =>
                                      !item.audioUrl && e.preventDefault()
                                    }
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
                                    onClick={() => handleDeleteHistory(item.id)}
                                    className="text-red-600 hover:text-red-800"
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
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              {item.audioUrl && (
                                <audio
                                  ref={(el) =>
                                    (historyAudioRefs.current[
                                      `yesterday-${item.id}`
                                    ] = el)
                                  }
                                  src={item.audioUrl}
                                  className="hidden"
                                />
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #A5B4FC;
          border: 2px solid #6366F1;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #A5B4FC;
          border: 2px solid #6366F1;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #1F2937;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    </div>
  );
};

export default TextToSpeech;
