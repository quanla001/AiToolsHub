import { createContext, useState } from "react";
import { toast } from "react-toastify"; // Import toast

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (data) => {
    setUser({ email: data.email, token: data.token });
    localStorage.setItem("token", data.token);
  };

  const logout = () => {
    // Clear all toasts before logging out
    toast.dismiss(); // Dismiss all active toasts

    // Perform logout logic
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
