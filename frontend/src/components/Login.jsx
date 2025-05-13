import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import gsap from "gsap";
import { ToastContainer, toast } from "react-toastify";

// Define icons
const Icons = {
  spinner: (props) => (
    <div
      className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"
      {...props}
    />
  ),
  google: (props) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      />
    </svg>
  ),
};

// Form validation schema using zod
const formSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .min(1, { message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
});

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const heroRef = useRef(null);
  const logoRef = useRef(null);

  // Use react-hook-form for form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Background slideshow effect
  useEffect(() => {
    const images = [
      "bg-hero-pattern",
      "bg-hero-pattern-1",
      "bg-hero-pattern-2",
    ];

    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const backgrounds = [
    "bg-hero-pattern",
    "bg-hero-pattern-1",
    "bg-hero-pattern-2",
  ];

  // Handle Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Google authentication failed");
      }

      const responseData = await response.json();
      login({ email: responseData.email, token: responseData.token }); // Lưu JWT từ backend
      navigate("/");
      toast.success("Successfully logged in with Google!");
    } catch (error) {
      toast.error(error.message || "Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Login failed");
      }

      login(responseData);
      navigate("/");
      toast.success("Successfully logged in!");
    } catch (error) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation to home
  const handleGoHome = () => {
    navigate("/");
  };

  // GSAP Animation for the Logo
  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    tl.fromTo(
      logoRef.current,
      { y: 10, opacity: 0, scale: 0.95, rotation: -2 },
      {
        y: -10,
        opacity: 1,
        scale: 1.05,
        rotation: 2,
        ease: "elastic.out(1, 0.5)",
        duration: 1.5,
      }
    )
      .to(logoRef.current, {
        y: 0,
        scale: 1,
        rotation: 0,
        ease: "power2.inOut",
        duration: 1,
      })
      .to(logoRef.current, {
        boxShadow: "0 0 15px rgba(255, 255, 255, 0.6)",
        scale: 1.1,
        opacity: 0.95,
        duration: 0.8,
        yoyo: true,
        repeat: 1,
      })
      .to(logoRef.current, {
        boxShadow: "0 0 5px rgba(255, 255, 255, 0.3)",
        scale: 1,
        opacity: 1,
        duration: 0.7,
      });
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - Hero/Slideshow with AI Tool Hub text */}
      <motion.div
        ref={heroRef}
        className={`hidden md:flex w-1/2 bg-cover bg-center relative ${backgrounds[backgroundIndex]}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        key={backgroundIndex}
      >
        <div className="absolute inset-0 bg-black/50" />

        {/* AI Tool Hub Text as Link to Home with Animation */}
        <motion.button
          ref={logoRef}
          onClick={handleGoHome}
          className="absolute top-4 left-4 text-white text-2xl font-bold px-4 py-2 rounded-md transition duration-300 z-20 logo-title"
          style={{
            fontFamily: "'Poppins', sans-serif",
            background: "rgba(0, 0, 0, 0.5)",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
          whileHover={{
            scale: 1.1,
            boxShadow: "0 8px 20px rgba(255, 255, 255, 0.5)",
          }}
          whileTap={{
            scale: 0.95,
          }}
        >
          AI Tool Hub
        </motion.button>

        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-white p-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
            <p className="text-xl max-w-md text-center text-white/80">
              Sign in to access your account and continue your journey with us.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="border border-gray-700 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white text-center">
                Login to your account
              </h2>
              <p className="text-gray-400 text-center mt-2">
                Enter your credentials to access your account
              </p>
            </div>

            <div className="p-6 pt-0 space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-white"
                    >
                      Password
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-sm text-indigo-400 hover:text-indigo-500 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    className="h-4 w-4 text-indigo-600 border-gray-600 rounded focus:ring-indigo-500"
                    {...register("rememberMe")}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm text-white font-normal"
                  >
                    Remember me for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2 px-4 text-white font-bold rounded-lg transition duration-300 ease-in-out ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 active:bg-indigo-800"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin inline-block" />
                      Logging in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <hr className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-800 px-2 text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    disabled={isGoogleLoading}
                    render={(renderProps) => (
                      <span
                        onClick={renderProps.onClick}
                        disabled={renderProps.disabled}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center border-t border-gray-700 pt-4 pb-6">
              <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="text-indigo-400 hover:text-indigo-500 hover:underline font-medium"
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;
