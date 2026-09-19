import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { registerAccount, loginAccount } from '../services/storeService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  if (!isOpen) return null;

  // By default, start with login. Only show account creation when user clicks "রেজিস্ট্রেশন করুন"
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email validation helper
  const isValidEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('আপনার জিমেইল বা ইমেইল অ্যাড্রেস লিখুন');
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg('সঠিক ইমেইল ফরম্যাট (যেমন: yourname@gmail.com) লিখুন');
      return;
    }

    if (!password.trim() || password.length < 6) {
      setErrorMsg('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('আপনার পুরো নাম লিখুন');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('উভয় পাসওয়ার্ড একই হতে হবে');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const newUser = await registerAccount(email, password, name);
        setSuccessMsg('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!');
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(newUser);
          onClose();
        }, 500);
      } else {
        const loggedInUser = await loginAccount(email, password);
        setSuccessMsg('লগইন সফল হয়েছে!');
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(loggedInUser);
          onClose();
        }, 400);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'লগইন বা রেজিস্ট্রেশনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#16181f] text-gray-900 dark:text-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 font-bold">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {mode === 'login' ? 'লগইন করুন (Login)' : 'অ্যাকাউন্ট তৈরি করুন (Create Account)'}
              </h3>
              <p className="text-xs text-gray-300">
                {mode === 'login' ? 'রেজিস্ট্রেশনকৃত ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করে ব্যালেন্স ও অর্ডার ট্র্যাক করুন'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <span className="font-bold">✓</span>
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* If registering, ask for Name */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                আপনার পুরো নাম (Full Name)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: নুহূ হোসেন"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-hidden text-sm"
                />
              </div>
            </div>
          )}

          {/* Email / Gmail ONLY */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              আপনার ইমেইল (Gmail / Email)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-hidden text-sm font-sans"
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              {mode === 'register' ? 'অ্যাকাউন্ট খোলার পর এই ইমেইল দিয়েই পরবর্তীতে লগইন করবেন' : 'আপনার নিবন্ধিত জিমেইল/ইমেইল লিখুন'}
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-hidden text-sm"
              />
            </div>
          </div>

          {/* Confirm Password only when creating account */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-hidden text-sm"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>যাচাই হচ্ছে...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>লগইন করুন</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>অ্যাকাউন্ট তৈরি করুন</span>
                </>
              )}
            </button>
          </div>

          {/* Toggle between Login and Register via the prompt */}
          <div className="pt-2 pb-1 text-center text-xs text-gray-600 border-t border-gray-100 mt-3">
            {mode === 'login' ? (
              <div>
                অ্যাকাউন্ট নেই?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-black font-bold underline hover:text-neutral-700 cursor-pointer ml-1"
                >
                  রেজিস্ট্রেশন করুন (Create Account)
                </button>
              </div>
            ) : (
              <div>
                পূর্বেই অ্যাকাউন্ট আছে?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-black font-bold underline hover:text-neutral-700 cursor-pointer ml-1"
                >
                  লগইন করুন (Back to Login)
                </button>
              </div>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
