'use client';

import { useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';

export default function OfficerSignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent',
    branch: '',
    employeeId: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Signing up as ${form.role} at branch ${form.branch} with email: ${form.email}`
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden">
        {/* Left Section */}
        <div className="bg-green-50 flex-1 p-10 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold text-emerald-700 mb-4">
              Welcome to<br /> 
              Registration Portal
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              Register new employee accounts to manage branch operations, oversee transactions, and provide trusted banking services to customers.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-white flex-1 p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Register</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <TextInput
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 text-gray-700">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="flex-2">
                <label className="block mb-1 text-gray-700">Branch</label>
                <select
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Branch</option>
                  <option value="colombo">Colombo</option>
                  <option value="galle">Galle</option>
                  <option value="kandy">Kandy</option>
                  <option value="anuradhapura">Anuradhapura</option>
                  <option value="matara">Matara</option>
                  <option value="moratuwa">Moratuwa</option>
                  <option value="peradeniya">Peradeniya</option>
                  <option value="polonnaruwa">Polonnaruwa</option>
                  <option value="ampara">Ampara</option>
                </select>
              </div>
            </div>

            <TextInput
              label="Employee ID"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              required
            />

            <TextInput
              label="Phone Number"
              type="tel"
              name="phone"
              value={form.phone}
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
                  placeholder=""
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

            <Button type="submit" className="w-full mt-6">
              Register
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already registered?{' '}
            <a href="/login" className="text-green-600 hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}