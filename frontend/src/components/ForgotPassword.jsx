import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastContainer, toast } from "react-toastify";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).min(1, { message: "Email is required" }),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to send reset email");
      }

      toast.success(responseData.message || "Reset email sent successfully. Check your inbox.");
      navigate("/login"); // Quay lại trang đăng nhập sau khi gửi thành công
    } catch (error) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    
    <div className="flex min-h-screen w-full">
      {/* Left side - Hero/Slideshow (giữ nguyên từ Login component) */}
      <motion.div
        className="hidden md:flex w-1/2 bg-cover bg-center relative bg-hero-pattern"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-white p-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold mb-4">Forgot Password</h1>
            <p className="text-xl max-w-md text-center text-white/80">
              Enter your email to receive a password reset link.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Forgot Password Form */}
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
                Reset Your Password
              </h2>
              <p className="text-gray-400 text-center mt-2">
                Enter your email to receive a reset link
              </p>
            </div>

            <div className="p-6 pt-0 space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-white">
                    Email
                  </label>
                  <input
                    id="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
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
                      <span className="mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin inline-block" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="flex justify-center pt-4">
                <p className="text-sm text-gray-400">
                  Remember your password?{" "}
                  <a
                    href="/login"
                    className="text-indigo-400 hover:text-indigo-500 hover:underline font-medium"
                  >
                    Back to Login
                  </a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;