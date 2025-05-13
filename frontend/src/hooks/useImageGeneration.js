import { useState } from "react";
import publicAPI from "../api/publicApi";

const useImageGeneration = () => {
  const [input, setInput] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [loading, setLoading] = useState(false);

  const query = async (apiEndpoint, selectedStyle, styles) => {
    if (!input || !input.trim()) {
      alert("Please enter a prompt.");
      return;
    }

    setLoading(true);
    setImageSrc("");

    try {
      const styleDescription =
        Array.isArray(styles) && styles.length > 0
          ? styles.find((style) => style.name === selectedStyle)?.description ||
            ""
          : "";

      const fullInput = `${styleDescription} ${input}`;
      console.log("Full input:", fullInput);

      const response = await publicAPI.post(
        apiEndpoint,
        {
          input: fullInput,
          style: selectedStyle,
        },
        { responseType: "blob" }
      );

      console.log("API response:", response.data);
      if (!response.data) {
        throw new Error("API did not return an image.");
      }

      const objectURL = URL.createObjectURL(response.data);
      setImageSrc(objectURL);
    } catch (err) {
      console.error("Error generating image:", err);
      alert(
        err.response?.data?.error || err.message || "Error generating image"
      );
    } finally {
      setLoading(false);
    }
  };

  return { input, setInput, imageSrc, loading, query };
};

export default useImageGeneration;
