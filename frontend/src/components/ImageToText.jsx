import { useState, useRef, useEffect } from "react";
import { Navbar } from "./Navbar";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Icons for actions (copy, download, expand)
const Icons = {
  copy: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="w-5 h-5"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  ),
  download: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="w-5 h-5"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  ),
  expand: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="w-5 h-5"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  ),
  collapse: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="w-5 h-5"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    </svg>
  ),
  spinner: (props) => (
    <div
      className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"
      {...props}
    />
  ),
};

export const ImageToText = () => {
  const [imageFiles, setImageFiles] = useState([]);
  const [extractedResults, setExtractedResults] = useState([]);
  const [expandedResults, setExpandedResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const apiEndpoint = "http://localhost:8080/api/tools/ocr";

  const dropZoneRef = useRef(null);

  // Handle multiple image uploads
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
    }));
    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  // Handle drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    const newFiles = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
    }));
    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  // Handle pasting images from clipboard
  const handlePaste = async () => {
    try {
      // Check if the browser supports clipboard read
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast.error("Clipboard pasting is not supported in this browser.");
        return;
      }

      // Request permission to access the clipboard
      const permission = await navigator.permissions.query({
        name: "clipboard-read",
      });
      if (permission.state === "denied") {
        toast.error(
          "Clipboard access denied. Please enable clipboard permissions."
        );
        return;
      }

      // Read clipboard items
      const clipboardItems = await navigator.clipboard.read();
      const newFiles = [];

      for (const item of clipboardItems) {
        // Check for image types (e.g., image/png, image/jpeg)
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const fileName = `pasted-image-${Date.now()}.${
            imageType.split("/")[1]
          }`;
          const file = new File([blob], fileName, { type: imageType });
          newFiles.push({
            file,
            preview: URL.createObjectURL(file),
            name: fileName,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
          });
        }
      }

      if (newFiles.length === 0) {
        toast.error("No images found in the clipboard.");
        return;
      }

      setImageFiles((prev) => [...prev, ...newFiles]);
      toast.success(`Pasted ${newFiles.length} image(s) successfully!`);
    } catch (err) {
      console.error("Error pasting from clipboard:", err);
      toast.error("Failed to paste image: " + err.message);
    }
  };

  // Remove an image from the list
  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all images
  const clearAll = () => {
    setImageFiles([]);
    setExtractedResults([]);
    setExpandedResults({});
  };

  // Extract text from all images
  const extractText = async () => {
    if (imageFiles.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    setLoading(true);
    setExtractedResults([]);

    try {
      const results = await Promise.all(
        imageFiles.map(async (image) => {
          const formData = new FormData();
          formData.append("file", image.file);

          const response = await axios.post(apiEndpoint, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          return {
            imageName: image.name,
            imagePreview: image.preview,
            extractedText: response.data?.extractedText || "No text extracted.",
          };
        })
      );

      setExtractedResults(results);
      toast.success("Text extracted successfully!");
    } catch (err) {
      console.error("❌ Error extracting text:", err);
      toast.error(
        `Error extracting text: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Download text as a file
  const downloadText = (text, fileName) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Toggle expand/collapse for a result
  const toggleExpand = (index) => {
    setExpandedResults((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Download all extracted texts as a single file
  const downloadAll = () => {
    const allText = extractedResults
      .map(
        (result) => `Image: ${result.imageName}\n${result.extractedText}\n\n`
      )
      .join("");
    const blob = new Blob([allText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "extracted_texts.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Truncate long image names
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  // Truncate extracted text for preview
  const truncateExtractedText = (text, maxLines = 3) => {
    const lines = text.split("\n");
    if (lines.length <= maxLines) return text;
    return lines.slice(0, maxLines).join("\n") + "...";
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center pt-20 pb-6 px-4">
        <div className="w-full max-w-5xl">
          <h1 className="text-4xl font-bold text-white text-center mb-2">
            Image to Text Converter
          </h1>
          <p className="text-gray-400 text-center mb-8">
            An online image to text converter to extract text from images.
          </p>

          {/* Drop Zone */}
          <motion.div
            ref={dropZoneRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full p-8 bg-white rounded-xl border-2 border-dashed transition duration-200 text-center shadow-lg ${
              dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {imageFiles.length > 0 ? (
              <div className="flex flex-wrap gap-4 justify-center">
                {imageFiles.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-32 h-32 bg-gray-100 rounded-lg shadow-md flex flex-col items-center justify-center"
                  >
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-3/4 object-cover rounded-t-lg"
                    />
                    <p className="text-xs text-gray-600 truncate w-full px-1">
                      {truncateText(image.name, 15)}
                    </p>
                    <p className="text-xs text-gray-500">{image.size}</p>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-gray-200 rounded-full p-1 text-gray-600 hover:bg-gray-300 transition duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-12 h-12 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-600 font-medium">
                  Drop, Upload or Paste image
                </p>
                <p className="text-gray-500 text-sm">
                  Supported formats: .JPG, .PNG, .GIF, .JFIF (.JPEG), .HEIC,
                  .PDF
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-center gap-2">
              <label
                htmlFor="fileUpload"
                className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Browse
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="fileUpload"
              />
              <button
                onClick={handlePaste}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Paste
              </button>
            </div>
          </motion.div>

          {/* Clear All and Convert Buttons */}
          {imageFiles.length > 0 && (
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-white text-red-400 border border-purple-400 rounded-lg hover:bg-purple-50 transition font-semibold"
              >
                Clear All
              </button>
              <button
                onClick={extractText}
                disabled={loading}
                className={`px-4 py-2 text-white rounded-lg transition duration-200 flex items-center gap-2 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-rose-400 to-pink-300 hover:from-rose-500 hover:to-pink-400 shadow-md hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  "Convert"
                )}
              </button>
            </div>
          )}

          {/* Results Section */}
          {extractedResults.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-white">
                  Result ({extractedResults.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Start Over
                  </button>
                  <button
                    onClick={downloadAll}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 flex items-center gap-2"
                  >
                    <Icons.download />
                    Download All
                  </button>
                </div>
              </div>

              <div className="max-h-[50vh] overflow-y-auto space-y-4">
                {extractedResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={result.imagePreview}
                          alt={result.imageName}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <p className="text-xs text-gray-600 mt-1 text-center truncate w-20">
                          {truncateText(result.imageName, 15)}
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          {/* Preview text when not expanded */}
                          {!expandedResults[index] && (
                            <div className="relative max-h-16 overflow-hidden">
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {truncateExtractedText(result.extractedText, 3)}
                              </p>
                              {/* Fade effect at the bottom */}
                              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent"></div>
                            </div>
                          )}
                          {/* Full text when expanded */}
                          {expandedResults[index] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {result.extractedText}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => copyToClipboard(result.extractedText)}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
                          title="Copy"
                        >
                          <Icons.copy />
                        </button>
                        <button
                          onClick={() =>
                            downloadText(result.extractedText, result.imageName)
                          }
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
                          title="Download"
                        >
                          <Icons.download />
                        </button>
                        <button
                          onClick={() => toggleExpand(index)}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
                          title={expandedResults[index] ? "Collapse" : "Expand"}
                        >
                          {expandedResults[index] ? (
                            <Icons.collapse />
                          ) : (
                            <Icons.expand />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Note and Rate Experience */}
          <div className="flex justify-between items-center mt-6 w-full max-w-5xl">
            <p className="text-gray-400 text-sm">
              *Your privacy is protected! No data is transmitted or stored.
            </p>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-sm">
                Rate your experience
              </span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-400 cursor-pointer hover:text-yellow-400 transition duration-200"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z"
                    />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToText;
