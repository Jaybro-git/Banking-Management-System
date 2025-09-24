'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';

export default function BranchRegisterPage() {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Ensure status is always enum-safe
    if (name === 'status') {
      setForm({ ...form, status: validStatus.includes(value) ? value : 'ACTIVE' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/branches/register', {
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
              Register new branches to expand your banking network and manage your operations efficiently.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-white flex-1 p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Register New Branch
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label="Branch Name"
              name="branchName"
              value={form.branchName}
              onChange={handleChange}
              required
            />

            <TextInput
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
            />

            <TextInput
              label="District"
              name="district"
              value={form.district}
              onChange={handleChange}
            />

            <TextInput
              label="Phone Number"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
            />

            <TextInput
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

            <TextInput
              label="Established Date"
              type="date"
              name="establishedDate"
              value={form.establishedDate}
              onChange={handleChange}
            />

            {/* Status dropdown (enum-safe) */}
            <div>
              <label className="block mb-1 text-gray-700">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {validStatus.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full mt-6">
              Register Branch
            </Button>

            <p className="mt-6 text-center text-sm text-gray-600">
              Go back to{' '}
              <a href="/login" className="text-green-600 hover:underline">
                Log in
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
