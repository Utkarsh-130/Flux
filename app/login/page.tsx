'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      const baseUrl = (envUrl && envUrl.length > 0) ? envUrl : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to send OTP');
      }

      const data = await response.json();
      if (data.phone_code_hash) {
        setPhoneCodeHash(data.phone_code_hash);
      }

      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      const baseUrl = (envUrl && envUrl.length > 0) ? envUrl : 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp, phone_code_hash: phoneCodeHash }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Invalid OTP');
      }

      localStorage.setItem('isTelegramLoggedIn', 'true');
      window.location.href = '/listings';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-lime-400 rounded-full mb-4">
            <span className="text-2xl font-bold text-black">⚡</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">flux</h1>
          <p className="text-gray-400">Telegram Job Scraper</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-8 shadow-2xl">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 h-12"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter your phone number with country code (e.g., +1 for US)
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-200">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !phone}
                className="w-full h-12 bg-lime-400 hover:bg-lime-500 text-black font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  OTP Code
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Enter the code sent to {phone}
                </p>
                <Input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  className="bg-gray-900 border-gray-700 text-white text-center text-2xl tracking-widest placeholder-gray-500 h-14 font-mono"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-200">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 h-12 border-gray-700 text-gray-300 hover:text-white"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 h-12 bg-lime-400 hover:bg-lime-500 text-black font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            </form>
          )}

          <p className="text-xs text-gray-600 text-center mt-6">
            We never store your phone number or OTP
          </p>
        </div>
      </div>
    </div>
  );
}
