import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Copy, 
  AlertCircle, 
  ShieldCheck, 
  Wallet, 
  Zap, 
  LogIn, 
  Info, 
  CreditCard, 
  Star,
  ChevronRight,
  Clock,
  Sparkles,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
import { Product, Package, AppSettings, Order, UserProfile } from '../types';

interface Props {
  product: Product;
  onBack: () => void;
  settings: AppSettings;
  userBalance: number;
  user: UserProfile;
  onRequireLogin: () => void;
  onOrderPlaced: (order: Order, newBalance?: number) => void;
  onViewReviews?: () => void;
  onSelectRelatedProduct?: (prod: Product) => void;
  relatedProducts?: Product[];
  onOpenAddMoney?: () => void;
}

export const ProductDetailView: React.FC<Props> = ({
  product,
  onBack,
  settings,
  userBalance,
  user,
  onRequireLogin,
  onOrderPlaced,
  onViewReviews,
  onSelectRelatedProduct,
  relatedProducts = [],
  onOpenAddMoney
}) => {
  const [selectedPkg, setSelectedPkg] = useState<Package>(
    product.packages && product.packages.length > 0 ? product.packages[0] : { name: "Standard", price: 100 }
  );
  const [playerInfo, setPlayerInfo] = useState('');
  const [payType, setPayType] = useState<'direct' | 'wallet'>('wallet');
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
      setErrorMsg(product.inputLabel ? `${product.inputLabel} প্রদান করুন` : 'প্রয়োজনীয় তথ্য বা আইডি প্রদান করুন');
      const inputEl = document.getElementById('player-info-input');
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
      }
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
          status: 'Pending',
          method: 'Wallet Pay',
          timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
        };

        const newBal = userBalance - selectedPkg.price;
        onOrderPlaced(order, newBal);
        setIsSubmitting(false);
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
      }, 800);
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
          <span>সকল প্রোডাক্টে ফিরে যান</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span onClick={onBack} className="hover:underline cursor-pointer">হোম</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 dark:text-white font-bold truncate max-w-[180px] sm:max-w-none">
            {product.name}
          </span>
        </div>
      </div>

      {/* Main 2-Column Product Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Product Showcase & Details */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Product Hero Card */}
          <div className="bg-white dark:bg-[#16181f] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs text-center relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            {/* Circular Product Image with Golden Ring */}
            <div className="relative inline-block mx-auto mb-4">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white dark:bg-neutral-800 p-1.5 ring-4 ring-amber-400/50 shadow-xl overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg";
                  }}
                />
              </div>
              <span className="absolute bottom-0 right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black dark:bg-white text-white dark:text-black shadow-md border border-amber-400/40">
                ইন স্টক
              </span>
            </div>

            {/* Product Title & Badges */}
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-gray-900 dark:text-white tracking-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3 text-xs">
              {onViewReviews ? (
                <button
                  type="button"
                  onClick={onViewReviews}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800/60 hover:scale-105 transition cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.avgRating || "5.0"} (রিভিউ দেখুন)</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800/60">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.avgRating || "5.0"} রেটিং</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/60">
                <Zap className="w-3.5 h-3.5" />
                <span>{product.delivery || settings.deliverySpeedText || "Instant (5-15 min)"}</span>
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-around text-center">
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">শুরুর মূল্য</div>
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  ৳{product.packages && product.packages.length > 0 ? Math.min(...product.packages.map(p => p.price)) : 100}
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">প্যাকেজ সংখ্যা</div>
                <div className="text-base font-extrabold text-gray-800 dark:text-gray-200">
                  {product.packages ? product.packages.length : 1} টি
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
              <div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">ডেলিভারি ধরন</div>
                <div className="text-base font-extrabold text-gray-800 dark:text-gray-200">
                  অটোমেটিক
                </div>
              </div>
            </div>
          </div>

          {/* Product Description */}
          {product.description && product.description.trim() !== "" && (
            <div className="bg-white dark:bg-[#16181f] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2.5 text-left">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <Info className="w-4 h-4 text-amber-500" />
                <span>পণ্যের বিবরণ ও নির্দেশিকা (Product Details)</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                {product.description.trim()}
              </div>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="bg-gradient-to-r from-gray-50 to-white dark:from-[#16181f] dark:to-[#1a1d26] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 space-y-2.5">
            <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>আমার স্টোর নিশ্চয়তা (Amar Store Guarantee)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>১০০% নিরাপদ ও জেনুইন</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>দ্রুত ডেলিভারি নিশ্চিত</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>২৪/৭ হেল্পডেস্ক সাপোর্ট</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>সহজ বিকাশ/নগদ পেমেন্ট</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Order & Checkout Process */}
        <div className="lg:col-span-7 space-y-4">
          
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#16181f] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-6">
            
            {/* Header info */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  অর্ডার ফরম ও কনফার্মেশন
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  নিচের তথ্যগুলো পূরণ করে সরাসরি অর্ডার সাবমিট করুন
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-400 text-black font-bold text-xs rounded-xl shadow-2xs">
                সহজ ৩টি ধাপ
              </span>
            </div>

            {/* Error Message Notice */}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Package Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs">১</span>
                  <span>প্যাকেজ নির্বাচন করুন (Select Package)</span>
                </label>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  নির্বাচিত: ৳{selectedPkg.price}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.packages.map((pkg, idx) => {
                  const isSelected = selectedPkg.name === pkg.name;
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setSelectedPkg(pkg);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition relative cursor-pointer ${
                        isSelected
                          ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-md ring-2 ring-black/10 dark:ring-white/20'
                          : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1d26] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-semibold truncate mb-1">{pkg.name}</div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs sm:text-sm font-bold font-mono ${
                          isSelected ? 'text-amber-300 dark:text-amber-700' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          ৳{pkg.price}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Player Information / Account details */}
            <div className="space-y-2">
              <label 
                htmlFor="player-info-input"
                className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs">২</span>
                <span>{product.inputLabel || "প্লেয়ার আইডি বা একাউন্ট তথ্য লিখুন"}</span>
              </label>
              
              <div className="relative">
                <input
                  id="player-info-input"
                  type="text"
                  required
                  value={playerInfo}
                  onChange={(e) => {
                    setPlayerInfo(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={product.inputLabel ? `আপনার ${product.inputLabel} এখানে লিখুন...` : "Player ID / Email / Tag / Account Info"}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1d26] text-gray-900 dark:text-white dark:placeholder-gray-500 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-hidden text-sm font-semibold transition"
                />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                • তথ্যটি সতর্কতার সাথে লিখুন। আপনার দেওয়া তথ্যে স্বয়ংক্রিয়ভাবে রিচার্জ পৌঁছাবে।
              </p>
            </div>

            {/* Step 3: Payment Method */}
            <div className="space-y-3 pt-1">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs">৩</span>
                <span>পেমেন্ট পদ্ধতি বেছে নিন (Payment Method)</span>
              </label>

              {/* Payment Type Tabs */}
              <div className="grid grid-cols-2 gap-3">
                {/* Wallet Pay Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setPayType('wallet');
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                    payType === 'wallet'
                      ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 text-gray-900 dark:text-white ring-2 ring-emerald-500/30'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1d26] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${payType === 'wallet' ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm font-bold">ওয়ালেট ব্যালেন্স (Wallet)</div>
                    <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ব্যালেন্স: ৳{userBalance}
                    </div>
                  </div>
                </button>

                {/* Direct Pay Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setPayType('direct');
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                    payType === 'direct'
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 text-gray-900 dark:text-white ring-2 ring-amber-500/30'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1d26] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${payType === 'direct' ? 'bg-amber-500 text-black' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm font-bold">বিকাশ / নগদ (Direct)</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      সেন্ড মানি পেমেন্ট
                    </div>
                  </div>
                </button>
              </div>

              {/* Wallet Pay Details */}
              {payType === 'wallet' && (
                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">আপনার বর্তমান ব্যালেন্স:</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">৳{userBalance}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">প্যাকেজের মূল্য:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">৳{selectedPkg.price}</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs font-bold">
                    <span>অর্ডারের পর অবশিষ্ট থাকবে:</span>
                    <span className={userBalance >= selectedPkg.price ? 'text-emerald-700 dark:text-emerald-400 font-mono' : 'text-red-600 dark:text-red-400 font-mono'}>
                      ৳{userBalance - selectedPkg.price}
                    </span>
                  </div>

                  {userBalance < selectedPkg.price && (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                        ⚠️ পর্যাপ্ত ব্যালেন্স নেই! ব্যালেন্স রিচার্জ করুন অথবা বিকাশ/নগদে ডিরেক্ট পে করুন।
                      </p>
                      {onOpenAddMoney && (
                        <button
                          type="button"
                          onClick={onOpenAddMoney}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>টাকা অ্যাড করুন</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Direct Pay bKash / Nagad Details */}
              {payType === 'direct' && (
                <div className="bg-neutral-900 text-white p-4 rounded-xl space-y-3.5 animate-in fade-in">
                  {/* bKash / Nagad Selector */}
                  <div className="flex items-center justify-center gap-3 pb-2 border-b border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setPayMethod('bkash')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        payMethod === 'bkash' 
                          ? 'bg-[#e2136e] border-[#e2136e] text-white shadow-xs' 
                          : 'border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <img 
                        src={settings.payments.bkashImg} 
                        alt="bKash" 
                        className="w-4 h-4 rounded-full object-contain bg-white"
                      />
                      bKash
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('nagad')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        payMethod === 'nagad' 
                          ? 'bg-[#f7941d] border-[#f7941d] text-white shadow-xs' 
                          : 'border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <img 
                        src={settings.payments.nagadImg} 
                        alt="Nagad" 
                        className="w-4 h-4 rounded-full object-contain bg-white"
                      />
                      Nagad
                    </button>
                  </div>

                  {/* Account number box */}
                  <div className="flex items-center justify-between bg-neutral-800 p-2.5 rounded-xl border border-neutral-700">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-neutral-400 font-medium block">
                        {payMethod === 'bkash' ? 'bKash' : 'Nagad'} Personal Send Money নম্বর:
                      </span>
                      <span className="font-mono text-sm font-bold text-amber-400 tracking-wider">
                        {activeNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={copyNumber}
                      className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-xs text-white rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedNum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNum ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-neutral-300 leading-normal">
                    • উপরের নম্বরে Send Money করে ঠিক <strong>৳{selectedPkg.price}</strong> টাকা পাঠান।<br />
                    • টাকা পাঠানোর পর সেন্ডার নম্বর এবং TrxID নিচে লিখুন।
                  </p>

                  {/* Sender Phone and TrxID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
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
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
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
            </div>

            {/* Order Summary Card */}
            <div className="bg-gray-50 dark:bg-[#1a1d26] rounded-xl p-4 border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                অর্ডার সামারি (Summary)
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                <span>পণ্য:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{product.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                <span>প্যাকেজ:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedPkg.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                <span>পেমেন্ট মাধ্যম:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {payType === 'wallet' ? 'ওয়ালেট ব্যালেন্স' : `${payMethod === 'bkash' ? 'bKash' : 'Nagad'} Direct`}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">সর্বমোট মূল্য:</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  ৳{selectedPkg.price}
                </span>
              </div>
            </div>

            {/* Submit / Confirm Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-gray-100 text-white dark:text-black rounded-xl font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>প্রসেসিং হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</span>
              ) : !user.isLoggedIn ? (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>লগইন করে অর্ডার নিশ্চিত করুন (৳{selectedPkg.price})</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>অর্ডার নিশ্চিত করুন (Pay ৳{selectedPkg.price})</span>
                </>
              )}
            </button>

            {/* Back button */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white underline font-semibold transition"
              >
                ← অন্য পণ্য দেখতে হোমে ফিরে যান
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};
