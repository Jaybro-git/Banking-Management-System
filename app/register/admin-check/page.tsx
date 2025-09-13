'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';

export default function AdminCheckPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null); // Clear error when user starts typing
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdmin', 'true');
      router.push('/register');
    } else {
      setError('Incorrect admin password');
      setPassword('');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Admin Verification
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Admin Password"
            type="password"
            name="password"
            value={password}
            onChange={handleChange}
            required
            className={error ? 'mb-1' : ''}
          />

          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}

          <div className="flex gap-4 mt-4">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-7 w-full"
            >
              Verify
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-1 w-full"
              onClick={() => router.push('/login')}
            >
              Back
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}