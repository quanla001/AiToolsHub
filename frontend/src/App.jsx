import { Routes, Route } from "react-router-dom";
import TextAssistance from "./components/TextAssistance";
import { TextToImage } from "./components/TextToImage";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import TextToMusic from "./components/TextToMusic";
import ImageToText from "./components/ImageToText";
import { SignUp } from "./components/SignUp";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Ensure CSS is imported
import TextToSpeech from "./components/Text-to-speech/TextToSpeech";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Pricing from "./components/Pricing";

const App = () => {
  const clientId =
    "522998804102-5uimtk30nrj73tunjkqjllkolma27970.apps.googleusercontent.com";

  return (
    <>
      <ToastContainer
        position="top-right" // Ensure position is explicitly set
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <Routes>
            <Route index element={<Home />} />
            <Route path="/text-assistance" element={<TextAssistance />} />
            <Route path="/text-to-image" element={<TextToImage />} />
            <Route path="/text-to-music" element={<TextToMusic />} />
            <Route path="/image-to-text" element={<ImageToText />} />
            <Route path="/text-to-speech" element={<TextToSpeech />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pricing" element={<Pricing />} />
          </Routes>
        </AuthProvider>
      </GoogleOAuthProvider>
    </>
  );
};

export default App;
