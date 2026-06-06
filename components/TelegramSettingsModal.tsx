'use client';

import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Settings, CheckCircle2, Trash2, X, AlertCircle, Loader } from 'lucide-react';

export function TelegramSettingsModal() {
  const {
    showSettingsModal,
    setShowSettingsModal,
    channels,
    addChannel,
    removeChannel,
    clearChannels,
    isTelegramLoggedIn,
    setIsTelegramLoggedIn,
  } = useApp();

  const [newChannel, setNewChannel] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!showSettingsModal) return null;

  const handleAdd = () => {
    if (newChannel.trim()) {
      addChannel(newChannel.trim());
      setNewChannel('');
    }
  };

  const handleSendOtp = async () => {
    if (!phone) return;
    setLoading(true);
    setError('');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to send OTP');
      }
      const data = await res.json();
      if (data.phone_code_hash) {
        setPhoneCodeHash(data.phone_code_hash);
      }
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    setError('');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp, phone_code_hash: phoneCodeHash }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Invalid OTP code');
      }
      setIsTelegramLoggedIn(true);
      setStep('phone');
      setPhone('');
      setOtp('');
      setPhoneCodeHash('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[32px] w-full max-w-[420px] p-8 shadow-xl border border-gray-100/50 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-2">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-400" />
            <h3 className="text-sm font-extrabold text-[#1a253c] tracking-wider uppercase">Telegram Settings</h3>
          </div>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-blue-600 hover:bg-gray-50 shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3px]" />
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">Telegram Session</h4>
          
          {isTelegramLoggedIn ? (
            <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-extrabold text-emerald-800">Active</span>
              </div>
              <button
                onClick={() => setIsTelegramLoggedIn(false)}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-extrabold text-xs px-4 py-2 rounded-full cursor-pointer transition-colors shadow-xs"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl space-y-4">
              {step === 'phone' ? (
                <div className="space-y-3">
                  <input
                    type="tel"
                    placeholder="Phone number e.g. +12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  />
                  <button
                    onClick={handleSendOtp}
                    disabled={loading || !phone}
                    className="w-full bg-black text-white hover:bg-gray-800 text-xs font-black py-3 rounded-full cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                    Send OTP
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400">Enter code sent to {phone}</p>
                  <input
                    type="text"
                    placeholder="Verification code (e.g. 123456)"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-center tracking-widest outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep('phone')}
                      className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-black py-3 rounded-full cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleVerifyOtp}
                      disabled={loading || !otp}
                      className="flex-1 bg-black text-white hover:bg-gray-800 text-xs font-black py-3 rounded-full cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                      Verify OTP
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-red-700">{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">Target Channels</h4>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Channel username"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              className="flex-1 bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm text-gray-800 outline-none focus:border-gray-300"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="bg-[#121315] hover:bg-[#202226] text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm text-lg font-bold"
            >
              +
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100/50 rounded-2xl border border-gray-100/80 transition-colors"
              >
                <span className="text-sm font-extrabold text-gray-800">{ch.name}</span>
                <button
                  onClick={() => removeChannel(ch.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={clearChannels}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-extrabold py-3.5 rounded-full border border-gray-200 transition-colors shadow-sm text-xs uppercase tracking-wider cursor-pointer"
          >
            Clear all channels
          </button>
        </div>
      </div>
    </div>
  );
}
