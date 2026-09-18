import React, { useState } from 'react';
import { X, Check, Copy, AlertCircle, ShieldCheck, Wallet, ArrowRight, Zap, LogIn, Info } from 'lucide-react';
import { Product, Package, AppSettings, Order, UserProfile } from '../types';

interface Props {
  product: Product | null;
  onClose: () => void;
  settings: AppSettings;
  userBalance: number;
  user: UserProfile;
  onRequireLogin: () => void;
  onOrderPlaced: (order: Order, newBalance?: number) => void;
  onViewReviews?: () => void;
}

export const ProductModal: React.FC<Props> = ({
  product,
  onClose,
  settings,
  userBalance,
  user,
  onRequireLogin,
  onOrderPlaced,
  onViewReviews,
}) => {
  if (!product) return null;

  const [selectedPkg, setSelectedPkg] = useState<Package>(
    product.packages && product.packages.length > 0 ? product.packages[0] : { name: "Standard", price: 100 }
  );
  const [playerInfo, setPlayerInfo] = useState('');
  const [payType, setPayType] = useState<'direct' | 'wallet'>('direct');
  const [payMethod, setPayMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copiedNum, setCopiedNum] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeNumber = payMethod === 'bkash' 
    ? settings.payments.bkash 
    : (settings.payments.nagad !== "🚫 OFF" ? settings.payments.nagad : settings.payments.bkash);

  const copyNumber = () => {
    navigator.clipboard.writeText(activeNumber);
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Guest users CANNOT place order - must log in or create account with Gmail
    if (!user.isLoggedIn) {
      onRequireLogin();
      return;
    }

    if (!playerInfo.trim()) {
      setErrorMsg(product.inputLabel ? `${product.inputLabel} পূরণ করুন` : 'প্রয়োজনীয় তথ্য প্রদান করুন');
      return;
    }

    if (payType === 'wallet') {
      if (userBalance < selectedPkg.price) {
        setErrorMsg(`অপর্যাপ্ত ব্যালেন্স! আপনার ব্যালেন্স ৳${userBalance}, কিন্তু মূল্য ৳${selectedPkg.price}। ওয়ালেটে টাকা অ্যাড করুন অথবা সরাসরি বিকাশ/নগদে পেমেন্ট করুন।`);
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        const order: Order = {
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          product: product.name,
          package: selectedPkg.name,
          price: selectedPkg.price,
          playerInfo,
          status: 'Success',
          method: 'Wallet Pay',
          timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
        };

        const newBal = userBalance - selectedPkg.price;
        onOrderPlaced(order, newBal);
        setIsSubmitting(false);
        onClose();
      }, 700);

    } else {
      // Direct bKash / Nagad
      if (!senderPhone.trim()) {
        setErrorMsg('যে নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন');
        return;
      }
      if (!trxId.trim()) {
        setErrorMsg('bKash / Nagad ট্রানজেকশন আইডি (TrxID) লিখুন');
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        const order: Order = {
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          product: product.name,
          package: selectedPkg.name,
          price: selectedPkg.price,
          playerInfo,
          status: 'Pending',
          method: payMethod === 'bkash' ? 'bKash Direct' : 'Nagad Direct',
          senderPhone,
          trx: trxId.toUpperCase(),
          timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
        };

        onOrderPlaced(order);
        setIsSubmitting(false);
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-neutral-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center flex-shrink-0">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg";
                }}
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-heading tracking-wide leading-tight">{product.name}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                {onViewReviews ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewReviews();
                    }}
                    className="flex items-center gap-1 text-amber-400 font-semibold hover:underline cursor-pointer"
                  >
                    ★ {product.avgRating || "5.0"} (রিভিউ দেখুন)
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    ★ {product.avgRating || "5.0"}
                  </span>
                )}
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {product.delivery || "Instant Delivery (5-15 min)"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm">
          
          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Select Package */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              ১. প্যাকেজ নির্বাচন করুন (Select Package)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {product.packages.map((pkg, idx) => {
                const isSelected = selectedPkg.name === pkg.name;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-black bg-black text-white shadow-xs font-bold'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-semibold">{pkg.name}</div>
                      <div className={`text-xs ${isSelected ? 'text-emerald-300' : 'text-emerald-600'} font-bold`}>
                        ৳{pkg.price}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Recipient Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              ২. {product.inputLabel || "প্লেয়ার আইডি বা ইমেইল লিখুন"}
            </label>
            <input
              type="text"
              required
              value={playerInfo}
              onChange={(e) => setPlayerInfo(e.target.value)}
              placeholder={product.inputLabel || "User ID / Email / Tag"}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-hidden text-sm bg-white"
            />
          </div>

          {/* Description (Above Payment Type & Left-Aligned) */}
          {product.description && product.description.trim() !== "" && (
            <div className="bg-neutral-50 border border-gray-200/90 rounded-xl p-3.5 space-y-1.5 text-left animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <Info className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />
                <span>পণ্যের বিবরণ (Description)</span>
              </div>
              <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line text-left">
                {product.description.trim()}
              </div>
            </div>
          )}

          {/* Step 3: Payment Type Choice */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              ৩. পেমেন্ট মেথড বেছে নিন (Payment Type)
            </label>
            <div className="grid grid-cols-2 gap-2">
              
              {/* Direct Pay */}
              <div
                onClick={() => setPayType('direct')}
                className={`p-3 rounded-xl border cursor-pointer flex flex-col items-center text-center transition ${
                  payType === 'direct'
                    ? 'border-black bg-black text-white shadow-xs font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xs sm:text-sm">বিকাশ / নগদ (Direct)</span>
                <span className={`text-[10px] ${payType === 'direct' ? 'text-gray-300' : 'text-gray-500'}`}>
                  সেন্ড মানি (Send Money)
                </span>
              </div>

              {/* Wallet Pay */}
              <div
                onClick={() => setPayType('wallet')}
                className={`p-3 rounded-xl border cursor-pointer flex flex-col items-center text-center transition ${
                  payType === 'wallet'
                    ? 'border-black bg-black text-white shadow-xs font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs sm:text-sm">ওয়ালেট ব্যালেন্স</span>
                </div>
                <span className={`text-[10px] ${payType === 'wallet' ? 'text-emerald-300' : 'text-emerald-700'} font-bold`}>
                  (ব্যালেন্স: ৳{userBalance})
                </span>
              </div>

            </div>
          </div>

          {/* Direct Pay Gateway Area */}
          {payType === 'direct' && (
            <div className="bg-neutral-900 text-white p-4 rounded-xl space-y-3">
              
              {/* Method toggles */}
              <div className="flex items-center justify-center gap-4 pb-2 border-b border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPayMethod('bkash')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                    payMethod === 'bkash' 
                      ? 'bg-[#e2136e] border-[#e2136e] text-white shadow-xs' 
                      : 'border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  <img 
                    src={settings.payments.bkashImg} 
                    alt="bKash" 
                    className="w-5 h-5 rounded-full object-contain bg-white"
                  />
                  bKash
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('nagad')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                    payMethod === 'nagad' 
                      ? 'bg-[#f7941d] border-[#f7941d] text-white shadow-xs' 
                      : 'border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  <img 
                    src={settings.payments.nagadImg} 
                    alt="Nagad" 
                    className="w-5 h-5 rounded-full object-contain bg-white"
                  />
                  Nagad
                </button>
              </div>

              {/* Instructions */}
              <div className="text-xs space-y-1.5 text-neutral-300">
                <div className="flex items-center justify-between bg-neutral-800 p-2.5 rounded-lg">
                  <span className="text-neutral-400 font-mono text-[11px]">Personal Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-400 tracking-wider">
                      {activeNumber}
                    </span>
                    <button
                      type="button"
                      onClick={copyNumber}
                      className="px-2 py-0.5 bg-neutral-700 hover:bg-neutral-600 text-[10px] text-white rounded font-semibold flex items-center gap-1 transition"
                    >
                      {copiedNum ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedNum ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-300 leading-normal">
                  • উপরের নম্বরে Send Money করে <strong>৳{selectedPkg.price}</strong> টাকা পাঠান।<br />
                  • টাকা পাঠানোর পর সেন্ডার নম্বর এবং TrxID নিচে লিখুন।
                </p>
              </div>

              {/* Form inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                    আপনার ফোন নম্বর (Sender Phone)
                  </label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                    ট্রানজেকশন আইডি (TrxID)
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. 9HJ78KL90"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400 font-mono uppercase"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>প্রসেসিং হচ্ছে...</span>
            ) : !user.isLoggedIn ? (
              <>
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>অর্ডার করতে লগইন বা অ্যাকাউন্ট তৈরি করুন (৳{selectedPkg.price})</span>
              </>
            ) : (
              <>
                <span>অর্ডার নিশ্চিত করুন (Pay ৳{selectedPkg.price})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
