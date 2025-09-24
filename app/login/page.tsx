"use client";
import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Button } from "@/app/components/ui/Button";
import { TextInput } from "@/app/components/ui/TextInput";
import { useAuth } from "../providers/AuthProvider";
import axios from "axios";

// Create separate axios instance for login to avoid interceptor issues
const authAxios = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

export default function OfficerLoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.username.trim() || !form.password.trim()) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await authAxios.post("/api/auth/login", form);
      
      if (response.status === 200) {
        login(); // This will trigger redirect to dashboard
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-green-50 flex-1 p-10 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold text-emerald-700 mb-4">B-Trust Banking System</h2>
            <p className="text-gray-700 text-lg mb-6">Securely log in to access your officer dashboard.</p>
          </div>
        </div>

        <div className="bg-white flex-1 p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Log in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput 
              label="Username" 
              name="username" 
              value={form.username} 
              onChange={handleChange} 
              required 
            />
            <div>
              <label className="block mb-1 text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 disabled:opacity-50"
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm text-center">{errorMsg}</p>
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              size="md" 
              className="w-full mt-6" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>
          
          <div className="mt-6 space-y-2">
            <p className="text-center text-sm text-gray-600">
              Register Employee?{' '}
              <a href="/register/admin-check" className="text-green-600 hover:underline">
                Register
              </a>
            </p>
            <p className="text-center text-sm text-gray-600">
              Register a branch?{' '}
              <a href="/register-branch/admin-check" className="text-green-600 hover:underline">
                Register branch
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}