// utils/localStorage.js

// Convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Save history entry with audio as base64
export const saveToHistory = async (
  text,
  voice,
  speed,
  stability,
  similarity,
  blob
) => {
  try {
    const history = getHistory();
    let audioData = null;
    if (blob) {
      audioData = await blobToBase64(blob); // Convert blob to base64
    }
    const newEntry = {
      text,
      voice,
      speed,
      stability,
      similarity,
      audioData, // Store the base64 audio data
      timestamp: new Date().toISOString(),
    };
    history.unshift(newEntry);
    localStorage.setItem("speechHistory", JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save history to localStorage:", error);
    throw error;
  }
};

// Get history
export const getHistory = () => {
  const history = localStorage.getItem("speechHistory");
  return history ? JSON.parse(history) : [];
};

// Delete a history entry by index
export const deleteFromHistory = (index) => {
  try {
    const history = getHistory();
    if (index >= 0 && index < history.length) {
      history.splice(index, 1); // Remove the entry at the specified index
      localStorage.setItem("speechHistory", JSON.stringify(history));
      return history;
    }
    return history;
  } catch (error) {
    console.error("Failed to delete history entry from localStorage:", error);
    throw error;
  }
};
