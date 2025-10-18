'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';

interface Branch {
  branch_id: string;
  branch_name: string;
}

export default function AdminProtectedRegister() {
  const router = useRouter();

  // Admin check
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Employee form
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    nic: '',
    phone: '',
    branch: '',
    role: 'AGENT',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Fetch branches after admin verification
  const fetchBranches = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/branches`);
      const data = await res.json();
      setBranches(data.branches || []);
    } catch (err) {
      console.error('Failed to fetch branches', err);
    }
  };

  // Admin password submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin-check`, { password });
      if (res.status === 200 && res.data.success) {
        setIsVerified(true);
        fetchBranches();
      } else {
        setError('Incorrect admin password');
        setPassword('');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Server error');
      setPassword('');
    }
  };

  // Employee form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'role' ? value.toUpperCase() : value });
  };

  // Employee form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/register`, form);
      alert(`Employee registered! ID: ${res.data.employee.employee_id}`);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        nic: '',
        phone: '',
        branch: '',
        role: 'AGENT',
        username: '',
        password: ''
      });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  // Render admin password form
  if (!isVerified) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Verification</h1>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <TextInput
              label="Admin Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
              required
              className={error ? 'mb-1' : ''}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <div className="flex gap-4 mt-4">
              <Button type="submit" variant="primary" size="md" className="flex-7 w-full">Verify</Button>
              <Button type="button" variant="secondary" size="md" className="flex-1 w-full" onClick={() => router.push('/login')}>Back</Button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // Render registration form
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden">
        {/* Left panel */}
        <div className="bg-green-50 flex-1 p-10 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold text-emerald-700 mb-4">Employee Registration Portal</h2>
            <p className="text-gray-700 text-lg mb-6">Register new employee accounts to manage branch operations.</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white flex-1 p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Register Employee</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <TextInput label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
            <TextInput label="NIC Number" name="nic" value={form.nic} onChange={handleChange} required />
            <TextInput label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <TextInput label="Phone Number" type="tel" name="phone" value={form.phone} onChange={handleChange} required />

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 text-gray-700">Role</label>
                <select name="role" value={form.role} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="AGENT">Agent</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block mb-1 text-gray-700">Branch</label>
                <select name="branch" value={form.branch} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.branch_id} value={branch.branch_id}>{branch.branch_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <TextInput label="Username" name="username" value={form.username} onChange={handleChange} required />

            <div>
              <label className="block mb-1 text-gray-700">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-500 cursor-pointer" tabIndex={-1}>
                  {showPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 cursor-pointer">Register</Button>
            <p className="mt-6 text-center text-sm text-gray-600">
              Go back to <a href="/login" className="text-green-600 hover:underline">Log in</a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
