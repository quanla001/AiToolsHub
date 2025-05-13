import gsap from "gsap";
import { useEffect, useRef, useState, useCallback } from "react";
import { Navbar } from "./Navbar";
import axiosInstance from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "./Loader";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

export const TextToImage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("Default");
  const [apiEndpoint, setApiEndpoint] = useState("/api/tools/model1");
  const [history, setHistory] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const [generationTime, setGenerationTime] = useState(null);
  const [numInferenceSteps, setNumInferenceSteps] = useState(28);
  const [isGuideVisible, setIsGuideVisible] = useState(false);

  const guideRef = useRef(null);
  const formRef = useRef(null);
  const imageRef = useRef(null);
  const historyRef = useRef(null);

  const models = [
    { name: "Stable Diffusion 1.0", api: "/api/tools/model1" },
    { name: "Stable Diffusion SDXL", api: "/api/tools/model2" },
  ];

  const styles = [
    { name: "Default", thumbnail: "assets/images/blue.jpg" },
    { name: "Cartoon", thumbnail: "assets/images/cartoon.jpg" },
    { name: "Realistic", thumbnail: "assets/images/realistic.png" },
    { name: "Fantasy", thumbnail: "assets/images/fantasy.jpg" },
    { name: "Cyberpunk", thumbnail: "assets/images/cyberpunk.png" },
    { name: "Abstract", thumbnail: "assets/images/abstract.jpg" },
    { name: "Origami", thumbnail: "assets/images/origami-dragon.jpg" },
    { name: "Pixel Art", thumbnail: "assets/images/pixel-art.jpg" },
    { name: "Anime", thumbnail: "assets/images/anime.jpg" },
    { name: "Chibi", thumbnail: "assets/images/chibi.png" },
    { name: "3D", thumbnail: "assets/images/3d.jpg" },
    { name: "Watercolor", thumbnail: "assets/images/watercolor.jpg" },
    { name: "Oil Painting", thumbnail: "assets/images/oilpainting.jpg" },
    { name: "Sketch", thumbnail: "assets/images/sketch.jpg" },
    { name: "Glitch Art", thumbnail: "assets/images/glitch-art.jpg" },
    { name: "Steampunk", thumbnail: "assets/images/steampunk.jpg" },
    { name: "Sci-Fi", thumbnail: "assets/images/sci-fi.jpg" },
    { name: "Vaporwave", thumbnail: "assets/images/vaporwave.jpg" },
    { name: "Comic", thumbnail: "assets/images/comicbook.png" },
    { name: "Psychedelic", thumbnail: "assets/images/Psychedelic.png" },
    { name: "Mythological", thumbnail: "assets/images/Mythological.jpg" },
    { name: "Minimalist", thumbnail: "assets/images/Minimalist.jpg" },
  ];

  const negativePrompts = {
    Default: "distorted",
    Cartoon: "realistic, photo, ultra detail",
    Realistic:
      "unnatural colors, bad skin texture, plastic-like, uncanny valley, cartoon, anime, painting, abstract",
    Fantasy: "washed out colors, low contrast, lack of depth, bad anatomy",
    Cyberpunk:
      "muted colors, boring composition, lack of neon glow, bad reflections",
    Abstract: "realistic, structured, organized",
    Origami: "distorted, too detailed",
    "Pixel Art": "realistic, soft details, high resolution",
    Anime:
      "low detail, blurry lines, messy shading, bad anatomy, off-model, extra limbs",
    "3D": "flat, pixelated, hand-drawn",
    Watercolor: "sharp details, high contrast, digital rendering",
    "Oil Painting": "photorealistic, sharp details, digital effects",
    Sketch: "colorful, ultra detail, high resolution, realistic textures",
    "Glitch Art": "smooth, clean lines, high detail, natural colors",
    Steampunk: "modern, futuristic, minimalistic, soft details",
    "Sci-Fi": "old, outdated, low-tech, blurry details",
    Vaporwave: "sharp contrast, high realism, non-pastel colors",
    "Comic Book": "photo-realistic, soft edges, pastel colors",
    Psychedelic: "muted colors, lack of surreal elements, low contrast",
    Mythological: "modern, sci-fi, cyberpunk, futuristic, digital look",
    Minimalist: "high detail, complex background, realistic textures",
  };

  // Load history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axiosInstance.get("/api/tools/history/images", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const historyData = response.data.map((entry) => ({
          id: entry.id,
          image: `https://storage.googleapis.com/aitoolhub/${entry.gcsPath.replace(
            "gs://aitoolhub/",
            ""
          )}`,
          prompt: entry.prompt,
          style: entry.modelUsed,
          negativePrompt: "",
          numInferenceSteps: entry.numInferenceSteps || 28,
          timestamp: entry.createdAt,
          generationTime: null,
        }));
        // Sort by timestamp descending to show newest first
        setHistory(
          historyData.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          )
        );
      } catch (err) {
        console.error("Error fetching history:", err);
        let errorMessage = "Failed to load history.";
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = "Session expired. Please log in again.";
            localStorage.removeItem("token");
            navigate("/login");
          } else if (err.response.status === 400) {
            errorMessage = err.response.data?.message || "Invalid request.";
          } else if (err.response.data?.error) {
            errorMessage = err.response.data.error;
          }
        }
        toast.error(errorMessage);
      }
    };

    fetchHistory();

    // GSAP animations
    if (formRef.current && historyRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 1, ease: "power2.out" }
      );
      gsap.fromTo(
        historyRef.current,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 1, ease: "power2.out" }
      );
    }
  }, [navigate]);

  // Handle scroll to show/hide guide
  useEffect(() => {
    const handleScroll = () => {
      if (guideRef.current) {
        const guidePosition = guideRef.current.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        setIsGuideVisible(guidePosition < windowHeight * 0.8);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleModelClick = useCallback((model) => {
    setApiEndpoint(model.api);
    toast.info(`Switched to ${model.name}`);
  }, []);

  const handleStyleClick = useCallback((style) => {
    setSelectedStyle(style.name);
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this image?"
    );
    if (confirmDelete) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to delete images.");
          navigate("/login");
          return;
        }

        await axiosInstance.delete(`/api/tools/history/images/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setHistory((prevHistory) =>
          prevHistory.filter((entry) => entry.id !== id)
        );
        toast.info("Image deleted successfully!");
      } catch (err) {
        console.error("Error deleting image:", err);
        let errorMessage = "Failed to delete image.";
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = "Session expired. Please log in again.";
            localStorage.removeItem("token");
            navigate("/login");
          } else if (err.response.status === 403) {
            errorMessage = "You are not authorized to delete this image.";
          } else if (err.response.status === 404) {
            errorMessage = "Image not found.";
          } else if (err.response.data?.error) {
            errorMessage = err.response.data.error;
          }
        }
        toast.error(errorMessage);
      }
    }
  };

  const query = async () => {
    if (!input.trim()) {
      toast.warn("⚠️ Please enter a prompt!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to generate images.");
      navigate("/login");
      return;
    }

    setLoading(true);
    setImageSrc("");
    const startTime = Date.now();

    const negativePrompt = negativePrompts[selectedStyle] || "";
    const combinedInput =
      selectedStyle === "Default"
        ? input
        : `${input} in ${selectedStyle.toLowerCase()} style`;

    try {
      const payload = {
        input: combinedInput,
        negativePrompt,
        numInferenceSteps: Number(numInferenceSteps),
      };

      const response = await axiosInstance.post(apiEndpoint, payload, {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const reader = new FileReader();
      reader.readAsDataURL(response.data);
      reader.onloadend = async () => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        setGenerationTime(duration);

        const newImage = reader.result;
        const historyEntry = {
          id: Date.now(), // Temporary ID
          image: newImage,
          prompt: input,
          style: selectedStyle,
          negativePrompt,
          numInferenceSteps,
          timestamp: new Date().toISOString(),
          generationTime: duration,
        };

        // Add to history locally (temporary)
        setHistory((prevHistory) => [historyEntry, ...prevHistory]);
        setImageSrc(newImage);
        toast.success("🎨 Image generated successfully!");

        // Sync with backend history
        try {
          const historyResponse = await axiosInstance.get(
            "/api/tools/history/images",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const historyData = historyResponse.data.map((entry) => ({
            id: entry.id,
            image: `https://storage.googleapis.com/aitoolhub/${entry.gcsPath.replace(
              "gs://aitoolhub/",
              ""
            )}`,
            prompt: entry.prompt,
            style: entry.modelUsed,
            negativePrompt: "",
            numInferenceSteps: entry.numInferenceSteps || 28,
            timestamp: entry.createdAt,
            generationTime: null,
          }));
          // Sort by timestamp descending
          setHistory(
            historyData.sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            )
          );
        } catch (err) {
          console.error("Error updating history:", err);
          toast.error("Failed to sync history.");
        }

        // GSAP animation
        setTimeout(() => {
          if (imageRef.current) {
            gsap.fromTo(
              imageRef.current,
              { opacity: 0, scale: 0.8 },
              { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
            );
          }
        }, 200);
      };
    } catch (err) {
      console.error("Error generating image:", err);
      let errorMessage = "⚠️ Error generating image";
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage =
            err.response.data?.message ||
            "Invalid input. Please check your prompt and try again.";
        } else if (err.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          localStorage.removeItem("token");
          navigate("/login");
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black via-gray-700 to-black min-h-screen text-white flex flex-col">
      <Navbar />
      <div className="grid grid-cols-12 gap-6 p-6 pt-10 mt-6 max-w-[1800px] xl:max-w-[95%] mx-auto w-full">
        {/* Left Sidebar - Form */}
        <div
          ref={formRef}
          className="col-span-12 md:col-span-4 lg:col-span-3 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col justify-between"
        >
          <h3 className="text-xl font-bold">Choose a Model</h3>
          <div className="grid grid-cols-1 gap-3 mt-3">
            {models.map((model) => (
              <button
                key={model.name}
                onClick={() => handleModelClick(model)}
                className={`p-2 rounded-lg transition-all ${
                  apiEndpoint === model.api
                    ? "bg-gradient-to-r from-fuchsia-500 to-cyan-400 hover:from-fuchsia-600 hover:to-cyan-500 shadow-md hover:shadow-lg"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>
          <div className="flex-grow mt-6 min-h-[300px] flex flex-col">
            <h3 className="text-xl font-bold">Choose a Style</h3>
            <div className="mt-3 p-3 border border-gray-700 rounded-xl overflow-y-auto max-h-[250px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="grid grid-cols-3 gap-4">
                {styles.map((style) => (
                  <motion.div
                    key={style.name}
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.img
                      src={style.thumbnail}
                      alt={style.name}
                      onClick={() => handleStyleClick(style)}
                      initial={false}
                      animate={
                        selectedStyle === style.name
                          ? { scale: 1.1 }
                          : { scale: 1.0 }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className={`w-16 h-16 lg:w-20 lg:h-20 object-cover rounded-xl cursor-pointer shadow-md ${
                        selectedStyle === style.name
                          ? "ring-4 ring-indigo-500"
                          : "hover:opacity-80"
                      }`}
                    />
                    <span className="mt-2 text-xs text-center">
                      {style.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold">Inference Steps</h3>
            <div className="relative mt-4 h-6">
              <div className="absolute top-1/2 w-full h-2 bg-gray-300 rounded-full transform -translate-y-1/2" />
              <motion.div
                className="absolute top-1/2 h-2 bg-blue-600 rounded-full transform -translate-y-1/2"
                initial={false}
                animate={{ width: `${((numInferenceSteps - 1) / 49) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <input
                type="range"
                min="1"
                max="50"
                value={numInferenceSteps}
                onChange={(e) => setNumInferenceSteps(Number(e.target.value))}
                className="w-full h-6 bg-transparent appearance-none pointer-events-auto z-10 relative"
              />
              <style>{`
                input[type="range"] {
                  -webkit-appearance: none;
                  width: 100%;
                  height: 6px;
                  background: transparent;
                  outline: none;
                }
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  height: 20px;
                  width: 20px;
                  background: white;
                  border: 3px solid #2563eb;
                  border-radius: 50%;
                  cursor: pointer;
                }
                input[type="range"]::-moz-range-thumb {
                  height: 20px;
                  width: 20px;
                  background: white;
                  border: 3px solid #2563eb;
                  border-radius: 50%;
                  cursor: pointer;
                }
                input[type="range"]::-webkit-slider-runnable-track {
                  height: 6px;
                  background: transparent;
                }
                input[type="range"]::-moz-range-track {
                  height: 6px;
                  background: transparent;
                }
              `}</style>
            </div>
            <div className="text-center text-white mt-2">
              Selected: {numInferenceSteps} steps
            </div>
          </div>

          <div className="mt-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your prompt"
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              rows="2"
            />
            <button
              onClick={query}
              disabled={loading}
              className={`w-full mt-4 p-3 rounded-lg font-bold text-lg transition-all ${
                loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Center - Image Preview */}
        <div className="col-span-12 md:col-span-5 lg:col-span-6 flex items-center justify-center">
          <div
            ref={imageRef}
            className="bg-gray-800 p-8 lg:p-10 rounded-xl border border-gray-600 w-full max-w-[600px] h-[500px] flex items-center justify-center"
          >
            {loading ? (
              <Loader />
            ) : imageSrc ? (
              <img
                src={imageSrc}
                alt="Generated"
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
            ) : (
              <p className="text-gray-400 text-center">
                No image generated yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Sidebar - History */}
        <div
          ref={historyRef}
          className="col-span-12 md:col-span-4 lg:col-span-3 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col h-[90vh]"
        >
          <h3 className="text-2xl font-extrabold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 drop-shadow-md tracking-wide">
            Generated Images
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {history.length > 0 ? (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-700 rounded-lg p-2 shadow-md hover:shadow-lg transition"
                >
                  <div className="relative group">
                    <img
                      src={entry.image}
                      alt={`Generated ${entry.id}`}
                      className="w-full h-[150px] lg:h-[180px] object-cover rounded-lg cursor-pointer transition duration-300 hover:opacity-90"
                      onClick={() => setModalImage(entry.image)}
                    />
                    <div className="absolute inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/50 rounded-lg">
                      <button
                        onClick={() => setModalImage(entry.image)}
                        className="p-2 bg-white text-black rounded-md mx-2 hover:bg-gray-200 transition"
                      >
                        🔍 View
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 bg-red-500 text-white rounded-md mx-2 hover:bg-red-600 transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-300 select-text">
                    <p className="text-white">📝 {entry.prompt}</p>
                    <p className="text-indigo-400">🎨 {entry.style}</p>
                    <p className="text-gray-500">
                      ⏳{" "}
                      {new Date(entry.timestamp).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                    {entry.generationTime && (
                      <p className="text-gray-500">
                        🕒 Generated in {entry.generationTime.toFixed(2)}{" "}
                        seconds
                      </p>
                    )}
                    {entry.numInferenceSteps && (
                      <p className="text-gray-500">
                        🚀 Inference Steps: {entry.numInferenceSteps}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">No history available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Text Guide Section */}
      <motion.div
        ref={guideRef}
        initial={{ opacity: 0, y: 50 }}
        animate={isGuideVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-4xl mx-auto p-6 mt-10 mb-10 bg-gray-800 rounded-xl shadow-lg border border-gray-700 text-white"
      >
        <h2 className="text-3xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
          AI Image Generator Guide
        </h2>
        <p className="mb-4">
          Bring your imagination to life with our Free Online AI Image
          Generator. Simply type your ideas, and watch as they transform into
          captivating images in seconds. Whether you're a content creator,
          designer, or entrepreneur, our AI-powered tool helps you generate
          unique visuals tailored to your needs.
        </p>
        <h3 className="text-xl font-semibold mb-2">
          Turn Words into Art with AI
        </h3>
        <p className="mb-4">
          Our AI Image Generator uses advanced machine learning algorithms to
          convert text descriptions into high-quality images. From abstract
          concepts to detailed scenes, the possibilities are endless. Describe
          what you envision, and let our AI bring it to life.
        </p>
        <h3 className="text-xl font-semibold mb-2">
          Features of Our AI Image Generator
        </h3>
        <ul className="list-disc list-inside mb-4">
          <li>
            Multiple Styles and Modes: Choose from a variety of artistic styles
            like photorealistic, watercolor, abstract, fantasy, and more.
          </li>
          <li>
            Customization Options: Adjust colors, lighting, and composition to
            fine-tune your images.
          </li>
          <li>
            High-Resolution Output: Generate images suitable for web, print, or
            social media.
          </li>
          <li>
            User-Friendly Interface: No technical skills required—just enter
            your text prompt and select your preferences.
          </li>
        </ul>
        <h3 className="text-xl font-semibold mb-2">
          How to Use the AI Image Generator
        </h3>
        <ol className="list-decimal list-inside mb-4">
          <li>
            <strong>Enter Your Text Prompt:</strong> Start by typing a
            description of the image you want to create. Be as detailed or as
            simple as you like. Example: "A serene sunset over a mountain lake
            with reflection."
          </li>
          <li>
            <strong>Select Style and Settings:</strong> Choose an art style that
            matches your vision—Photorealistic, Illustration, Abstract, Fantasy,
            or Modern Art. Adjust settings like color palette, aspect ratio, and
            more to customize your image.
          </li>
          <li>
            <strong>Generate and Refine:</strong> Click "Generate Image" to see
            your creation. If you're not satisfied, tweak your prompt or
            settings and try again.
          </li>
          <li>
            <strong>Download and Share:</strong> Once you're happy with your
            image, download it in your preferred format or share it directly on
            social media.
          </li>
        </ol>
        <h3 className="text-xl font-semibold mb-2">
          Why Use Our AI Image Generator?
        </h3>
        <ul className="list-disc list-inside mb-4">
          <li>
            <strong>For Content Creators:</strong> Enhance your blogs, articles,
            and social media posts with unique visuals that grab attention.
          </li>
          <li>
            <strong>For Designers:</strong> Quickly prototype ideas or generate
            inspiration for your next project without starting from scratch.
          </li>
          <li>
            <strong>For Entrepreneurs:</strong> Create eye-catching graphics for
            ads, presentations, and promotional materials effortlessly.
          </li>
        </ul>
        <h3 className="text-xl font-semibold mb-2">
          Tips for Creating Amazing AI-Generated Images
        </h3>
        <ul className="list-disc list-inside mb-4">
          <li>
            <strong>Be Specific:</strong> The more details you include, the
            better the AI understands your request.
          </li>
          <li>
            <strong>Experiment with Styles:</strong> Try different art styles to
            see which one best suits your needs.
          </li>
          <li>
            <strong>Use Descriptive Keywords:</strong> Words like "digital art,"
            "oil painting," or "minimalist" can influence the style.
          </li>
          <li>
            <strong>Adjust Settings:</strong> Customize color filters, lighting,
            and aspect ratios for a unique touch.
          </li>
        </ul>
        <p className="text-center font-semibold">
          Unleash your creativity and start generating stunning images today!
        </p>
      </motion.div>

      {/* Modal for Viewing Image */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative bg-gray-800 p-4 rounded-xl max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 text-3xl font-bold"
            >
              ✕
            </button>
            <img
              src={modalImage}
              alt="Enlarged"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToImage;
