import React, { useState } from 'react';
import { X, Copy, Check, Wallet, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { AppSettings, UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  user: UserProfile;
  onRequireLogin: () => void;
  onAddMoneySuccess: (amount: number) => void;
}

export const AddMoneyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  user,
  onRequireLogin,
  onAddMoneySuccess,
}) => {
  if (!isOpen) return null;

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

  const handleAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Guest users cannot add money without login
    if (!user.isLoggedIn) {
      onRequireLogin();
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('সঠিক টাকার পরিমাণ লিখুন (কমপক্ষে ১০ টাকা)');
      return;
    }
    if (!senderPhone.trim()) {
      setErrorMsg('যে নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন');
      return;
    }
    if (!trxId.trim()) {
      setErrorMsg('ট্রানজেকশন আইডি (TrxID) লিখুন');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onAddMoneySuccess(numAmount);
      setIsSubmitting(false);
      onClose();
    }, 700);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        
        {/* Header */}
        <div className="bg-neutral-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">ওয়ালেটে টাকা অ্যাড করুন</h2>
              <p className="text-xs text-neutral-400">bKash বা Nagad দিয়ে টাকা অ্যাড করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAddMoney} className="p-5 space-y-4 text-sm">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select method */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod('bkash')}
              className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${
                method === 'bkash'
                  ? 'border-[#e2136e] bg-[#e2136e] text-white shadow-xs'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <img src={settings.payments.bkashImg} alt="bKash" className="w-5 h-5 rounded-full object-contain bg-white" />
              bKash Personal
            </button>
            <button
              type="button"
              onClick={() => setMethod('nagad')}
              className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${
                method === 'nagad'
                  ? 'border-[#f7941d] bg-[#f7941d] text-white shadow-xs'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <img src={settings.payments.nagadImg} alt="Nagad" className="w-5 h-5 rounded-full object-contain bg-white" />
              Nagad Personal
            </button>
          </div>

          {/* Copy Number Box */}
          <div className="bg-neutral-100 p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                {method === 'bkash' ? 'bKash Personal Number' : 'Nagad Personal Number'}
              </div>
              <div className="font-mono text-base font-bold text-gray-900 tracking-wider">
                {activeNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={copyNumber}
              className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copiedNum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedNum ? 'কপি হয়েছে' : 'Copy'}
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              টাকার পরিমাণ (Amount in ৳)
            </label>
            <input
              type="number"
              min="10"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-hidden text-sm font-semibold"
            />
            {/* Quick chips */}
            <div className="flex gap-2 mt-2">
              {['100', '250', '500', '1000'].map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => setAmount(chip)}
                  className="flex-1 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                >
                  ৳{chip}
                </button>
              ))}
            </div>
          </div>

          {/* Sender Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              আপনার প্রেরক নম্বর (Sender Phone)
            </label>
            <input
              type="text"
              required
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-hidden text-sm font-mono"
            />
          </div>

          {/* TrxID */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              ট্রানজেকশন আইডি (TrxID)
            </label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="e.g. 9HJ72L980"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-hidden text-sm font-mono uppercase"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>যাচাই করা হচ্ছে...</span>
            ) : !user.isLoggedIn ? (
              <>
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>টাকা অ্যাড করতে লগইন বা অ্যাকাউন্ট তৈরি করুন</span>
              </>
            ) : (
              <>
                <span>টাকা অ্যাড করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
