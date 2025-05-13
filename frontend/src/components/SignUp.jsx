import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import gsap from "gsap";

// Form validation schema using zod
const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .min(1, { message: "Email is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

// Define icons (consistent with Login component)
const Icons = {
  spinner: (props) => (
    <div
      className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"
      {...props}
    />
  ),
};

export const SignUp = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const heroRef = useRef(null);
  const logoRef = useRef(null); // Ref for the "AI Tool Hub" button

  // Use react-hook-form for form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  // Background slideshow effect (using framer-motion)
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

  // Handle form submission
  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const responseData = await response.json(); // Sử dụng response.json() nếu backend trả về JSON
        let errorMessage =
          responseData.error || responseData.message || "Sign-up failed";

        // Handle specific error messages from backend
        if (errorMessage.includes("Email already in use")) {
          toast.error("Registration failed: Email already in use!");
        } else if (errorMessage.includes("Username already in use")) {
          toast.error("Registration failed: Username already in use!");
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.text(); // Get full response including success message
      toast.success("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Error during sign-up:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation to home
  const handleGoHome = () => {
    navigate("/");
  };

  // GSAP Animation for the Logo (copied from Login)
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
      {/* Left side - Hero/Slideshow */}
      <motion.div
        ref={heroRef}
        className={`hidden md:flex w-1/2 bg-cover bg-center relative ${backgrounds[backgroundIndex]}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        key={backgroundIndex}
      >
        <div className="absolute inset-0 bg-black/50" />

        {/* AI Tool Hub Text as Link to Home with Animation (copied from Login) */}
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
            <h1 className="text-4xl font-bold mb-4">Join Us Today!</h1>
            <p className="text-xl max-w-md text-center text-white/80">
              Create an account to start your journey with us.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Sign-Up Form */}
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
                Create an Account
              </h2>
              <p className="text-gray-400 text-center mt-2">
                Sign up to get started
              </p>
            </div>

            <div className="p-6 pt-0 space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-white"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    placeholder="Enter your username"
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    {...register("username")}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500">
                      {errors.username.message}
                    </p>
                  )}
                </div>

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
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full py-2 px-4 text-white font-bold rounded-lg transition duration-300 ease-in-out ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 active:bg-green-800"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin inline-block" />
                      Signing up...
                    </>
                  ) : (
                    "Register"
                  )}
                </button>
              </form>
            </div>

            <div className="flex justify-center border-t border-gray-700 pt-4 pb-6">
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-indigo-400 hover:text-indigo-500 hover:underline font-medium"
                >
                  Login
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;
