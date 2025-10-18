'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';

export default function BranchRegisterPage() {
  const router = useRouter();

  // Admin check
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Branch form
  const [form, setForm] = useState({
    branchName: '',
    address: '',
    district: '',
    phoneNumber: '',
    email: '',
    establishedDate: '',
    status: 'ACTIVE', 
  });

  const validStatus = ['ACTIVE', 'INACTIVE'];

  // Admin password submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('${process.env.NEXT_PUBLIC_API_URL}/api/admin-check', { password });
      if (res.status === 200 && res.data.success) {
        setIsVerified(true);
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

  // Branch form input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Ensure status is enum-safe
    if (name === 'status') {
      setForm({ ...form, status: validStatus.includes(value) ? value : 'ACTIVE' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Branch form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/branches/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Branch registered with ID: ${data.branch.branch_id} - ${data.branch.branch_name}`);
        setForm({
          branchName: '',
          address: '',
          district: '',
          phoneNumber: '',
          email: '',
          establishedDate: '',
          status: 'ACTIVE',
        });
      } else {
        alert(`Error: ${data.error || 'Failed to register branch'}`);
        console.error('Error details:', data.details);
      }
    } catch (err) {
      console.error('Request failed:', err);
      alert('Failed to connect to server');
    }
  };

  // Render admin password form
  if (!isVerified) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Admin Verification
          </h1>
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
              <Button type="submit" variant="primary" size="md" className="flex-7 w-full">
                Verify
              </Button>
              <Button type="button" variant="secondary" size="md" className="flex-1 w-full" onClick={() => router.push('/login')}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // Render branch registration form
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden">
        {/* Left Section */}
        <div className="bg-green-50 flex-1 p-10 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold text-emerald-700 mb-4">
              Branch Registration Portal
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              Register new branches to expand your banking network and manage operations efficiently.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-white flex-1 p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Register New Branch
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput label="Branch Name" name="branchName" value={form.branchName} onChange={handleChange} required />
            <TextInput label="Address" name="address" value={form.address} onChange={handleChange} />
            <TextInput label="District" name="district" value={form.district} onChange={handleChange} />
            <TextInput label="Phone Number" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
            <TextInput label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
            <TextInput label="Established Date" type="date" name="establishedDate" value={form.establishedDate} onChange={handleChange} />

            <div>
              <label className="block mb-1 text-gray-700">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500">
                {validStatus.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full mt-6">Register Branch</Button>

            <p className="mt-6 text-center text-sm text-gray-600">
              Go back to <a href="/login" className="text-green-600 hover:underline">Log in</a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
