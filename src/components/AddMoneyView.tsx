import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Wallet, 
  Copy, 
  Check, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  LogIn, 
  ArrowRight,
  HelpCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import { submitDepositRequest } from '../services/storeService';

interface Props {
  onBack: () => void;
  settings: AppSettings;
  user: UserProfile;
  userBalance: number;
  onRequireLogin: () => void;
  onAddMoneySuccess: (amount: number, reqId?: string) => void;
}

export const AddMoneyView: React.FC<Props> = ({
  onBack,
  settings,
  user,
  userBalance,
  onRequireLogin,
  onAddMoneySuccess,
}) => {
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [amount, setAmount] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copiedNum, setCopiedNum] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeNumber = method === 'bkash' 
    ? settings.payments.bkash 
    : (settings.payments.nagad !== "🚫 OFF" ? settings.payments.nagad : settings.payments.bkash);

  const copyNumber = () => {
    navigator.clipboard.writeText(activeNumber);
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 2000);
  };

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Guest users cannot add money without login
    if (!user.isLoggedIn) {
      onRequireLogin();
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      setErrorMsg('সঠিক টাকার পরিমাণ লিখুন (কমপক্ষে ১০ টাকা)');
      return;
    }
    if (!senderPhone.trim()) {
      setErrorMsg('যে নম্বর থেকে টাকা পাঠিয়েছেন তা সঠিকভাবে লিখুন');
      return;
    }
    if (!trxId.trim()) {
      setErrorMsg('bKash বা Nagad ট্রানজেকশন আইডি (TrxID) লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      const reqId = await submitDepositRequest({
        userEmail: user.email,
        userName: user.name || 'User',
        amount: numAmount,
        method,
        senderPhone: senderPhone.trim(),
        trxId: trxId.trim()
      });

      onAddMoneySuccess(numAmount, reqId);
      setIsSubmitting(false);
    } catch (err: any) {
      setErrorMsg('রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে: ' + (err?.message || 'অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#16181f] p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোম পেজে ফিরে যান</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span onClick={onBack} className="hover:underline cursor-pointer">হোম</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 dark:text-white font-bold">
            ওয়ালেটে টাকা অ্যাড
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Add Money Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Wallet Overview & Instructions */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Current Balance Card */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-black text-white rounded-2xl p-6 border border-neutral-800 shadow-lg relative overflow-hidden">
            {/* Glow effects */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
{/* Official Number Copy Box */}
            <div className="bg-neutral-900 text-white p-4 rounded-xl space-y-2 border border-neutral-800 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block truncate">
                    {method === 'bkash' ? 'bKash পার্সোনাল নম্বর' : 'Nagad পার্সোনাল নম্বর'}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-amber-400 tracking-wider block">
                    {activeNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="min-w-[95px] px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-neutral-700 shrink-0"
                >
                  {copiedNum ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{copiedNum ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80 leading-tight">
                • এই নম্বরে Send Money করার পর নিচের বক্সে টাকার পরিমাণ, আপনার প্রেরক নম্বর এবং TrxID লিখুন।
              </p>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-200">আমার ওয়ালেট ব্যালেন্স</h3>
                  <p className="text-[11px] text-gray-400">আমার স্টোর ইনস্ট্যান্ট চেকআউট</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                সক্রিয় একাউন্ট
              </span>
            </div>

            <div className="space-y-1 my-3">
              <span className="text-xs text-gray-400">বর্তমান ব্যালেন্স</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1">
                <span className="text-emerald-400">৳</span>{userBalance}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-gray-300">
              <span>ব্যবহারকারী: <strong className="text-white">{user.name || 'গেস্ট'}</strong></span>
              <span className="font-mono text-gray-400 truncate max-w-[140px]">{user.email || 'লগইন নেই'}</span>
            </div>
          </div>

          {/* How to Add Money Steps Card */}
          <div className="bg-white dark:bg-[#16181f] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3.5 text-left">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>টাকা অ্যাড করার নিয়মাবলী (How to Deposit)</span>
            </div>

            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  ১
                </span>
                <div>
                  <strong className="text-gray-900 dark:text-white block font-semibold mb-0.5">সেন্ড মানি করুন</strong>
                  নিচে দেওয়া বিকাশ বা নগদ পার্সোনাল নম্বরে আপনার পছন্দের পরিমাণ টাকা সেন্ড মানি করুন।
                </div>
              </div>

              <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  ২
                </span>
                <div>
                  <strong className="text-gray-900 dark:text-white block font-semibold mb-0.5">তথ্য পূরণ করুন</strong>
                  টাকা পাঠানোর পর আপনি যে নম্বর থেকে পাঠিয়েছেন তা এবং মেসেজে পাওয়া TrxID ফরমটিতে লিখুন।
                </div>
              </div>

              <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  ৩
                </span>
                <div>
                  <strong className="text-gray-900 dark:text-white block font-semibold mb-0.5">ব্যালেন্স যুক্ত হওয়া</strong>
                  অ্যাডমিন ট্রানজেকশন ভেরিফাই করে ৫-১৫ মিনিটের মধ্যে আপনার ওয়ালেটে ব্যালেন্স অনুমোদন করে দেবেন।
                </div>
              </div>
            </div>
          </div>

          {/* Amar Store Deposit Guarantee */}
          <div className="bg-gradient-to-r from-gray-50 to-white dark:from-[#16181f] dark:to-[#1a1d26] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 space-y-2.5">
            <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>নিরাপদ ডিপোজিট নিশ্চয়তা (Amar Store Guarantee)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>১০০% নিরাপদ ট্রানজেকশন</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>অটোমেটিক রেকর্ড সেভ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>দ্রুত অ্যাডমিন ভেরিফিকেশন</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>২৪/৭ হেল্পডেস্ক সহায়তা</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Deposit Form */}
        <div className="lg:col-span-7 space-y-4">
          
          <form onSubmit={handleAddMoney} className="bg-white dark:bg-[#16181f] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
            
            {/* Header info */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  ডিপোজিট রিকোয়েস্ট ফরম
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  সঠিক তথ্য দিয়ে রিকোয়েস্ট সাবমিট করুন
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-400 text-black font-bold text-xs rounded-xl shadow-2xs">
                ইনস্ট্যান্ট রিকোয়েস্ট
              </span>
            </div>

            {/* Error Message Notice */}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Select Method (bKash / Nagad) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs">১</span>
                <span>পেমেন্ট মাধ্যম বেছে নিন (bKash / Nagad)</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('bkash');
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm transition cursor-pointer ${
                    method === 'bkash'
                      ? 'border-[#e2136e] bg-[#e2136e] text-white shadow-md ring-2 ring-[#e2136e]/30'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1d26] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <img 
                    src={settings.payments.bkashImg} 
                    alt="bKash" 
                    className="w-5 h-5 rounded-full object-contain bg-white p-0.5" 
                  />
                  <span>bKash Personal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethod('nagad');
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm transition cursor-pointer ${
                    method === 'nagad'
                      ? 'border-[#f7941d] bg-[#f7941d] text-white shadow-md ring-2 ring-[#f7941d]/30'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1d26] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <img 
                    src={settings.payments.nagadImg} 
                    alt="Nagad" 
                    className="w-5 h-5 rounded-full object-contain bg-white p-0.5" 
                  />
                  <span>Nagad Personal</span>
                </button>
              </div>
            </div>
            
            {/* Step 2: Amount with Quick Chips */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs">২</span>
                  <span>টাকার পরিমাণ (Amount in ৳)</span>
                </span>
                {amount && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    ৳{amount}
                  </span>
                )}
              </label>

              <input
                type="number"
                min="10"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="কত টাকা পাঠিয়েছেন লিখুন (যেমন: ৫০০)"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1d26] text-gray-900 dark:text-white dark:placeholder-gray-500 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-hidden text-sm font-semibold transition font-mono"
              />

              {/* Quick Preset Amount Chips */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                {['100', '250', '500', '1000', '2000'].map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => {
                      setAmount(chip);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                      amount === chip
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    ৳{chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Sender Phone & TrxID in 2 columns */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs">৩</span>
                <span>প্রেরক নম্বর ও TrxID তথ্য</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    আপনার প্রেরক নম্বর (Sender Phone)
                  </label>
                  <input
                    type="text"
                    required
                    value={senderPhone}
                    onChange={(e) => {
                      setSenderPhone(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1d26] text-gray-900 dark:text-white dark:placeholder-gray-500 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-hidden text-xs sm:text-sm font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ট্রানজেকশন আইডি (TrxID)
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => {
                      setTrxId(e.target.value.toUpperCase());
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="e.g. 9HJ72L980"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1d26] text-gray-900 dark:text-white dark:placeholder-gray-500 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-hidden text-xs sm:text-sm font-mono uppercase transition"
                  />
                </div>
              </div>
            </div>

            {/* Helpful verification reminder notice */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">ভেরিফিকেশন নিশ্চয়তা:</span>
                <p className="leading-relaxed">
                  টাকা পাঠানোর পর সঠিকভাবে রিকোয়েস্ট সাবমিট করুন। অ্যাডমিন ভেরিফাই করে অনুমোদন (Approve) করলেই আপনার একাউন্টে ব্যালেন্স যুক্ত হয়ে যাবে।
                </p>
              </div>
            </div>

            {/* Submit / Confirm Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-gray-100 text-white dark:text-black rounded-xl font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>রিকোয়েস্ট প্রসেসিং হচ্ছে, অপেক্ষা করুন...</span>
              ) : !user.isLoggedIn ? (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>টাকা অ্যাড করতে লগইন করুন</span>
                </>
              ) : (
                <>
                  <span>টাকা জমার রিকোয়েস্ট পাঠান {amount ? `(৳${amount})` : ''}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back to store navigation */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white underline font-semibold transition"
              >
                ← ব্যালেন্স পরে অ্যাড করতে হোমে ফিরে যান
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};
