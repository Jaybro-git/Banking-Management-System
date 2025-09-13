'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';

export default function OfficerLoginPage() {
  const [form, setForm] = useState({
    employeeId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Logging in as with email: ${form.employeeId}`
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden">
        {/* Left Section */}
        <div className="bg-green-50 flex-1 p-10 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold text-emerald-700 mb-4">
              B-Trust Banking System
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              Securely log in to access your officer dashboard, manage customer accounts, and monitor financial activities across branches.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-white flex-1 p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Log in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label="Employee ID"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block mb-1 text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  tabIndex={-1}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </button>
              </div>
            </div>

            <Link href="/" passHref>
            <Button type="button" variant="primary" size="md" className="w-full mt-6">
                Log In
            </Button>
            </Link>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Register Employee?{' '}
            <a href="/register/admin-check" className="text-green-600 hover:underline">
              Register
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}