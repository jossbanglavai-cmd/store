import React from 'react';
import { User, Wallet, Store, Package, Star, CheckCircle2, Phone, Clock, ArrowRight, ShieldCheck, Sparkles, ChevronRight, LogOut, LogIn, UserPlus, Camera, Bot } from 'lucide-react';
import { AppSettings, Order, UserProfile } from '../types';
import { isUserAdmin } from '../services/storeService';

interface Props {
  balance: number;
  orders: Order[];
  user: UserProfile;
  settings?: AppSettings;
  onOpenAddMoney: () => void;
  onOpenFixModal: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onOpenPhotoModal?: () => void;
  onLogout: () => void;
  onNavigateTab?: (tab: 'home' | 'orders' | 'reviews') => void;
  onOpenAdmin?: () => void;
}

export const ProfileView: React.FC<Props> = ({
  balance,
  orders,
  user,
  settings,
  onOpenAddMoney,
  onOpenFixModal,
  onOpenAuthModal,
  onOpenPhotoModal,
  onLogout,
  onNavigateTab,
  onOpenAdmin,
}) => {
  const activeHours = settings?.operatingHours || "সকাল ১০:০০ টা থেকে রাত ১০:০০ টা (প্রতিদিন)";
  const activePhone = settings?.whatsappPhone || settings?.payments?.bkash || "01770931981";
  const activeDelivery = settings?.deliverySpeedText || "স্বয়ংক্রিয় ও তাৎক্ষণিক ডেলিভারি (সাধারণত ৫ থেকে ১৫ মিনিটের মধ্যে)";
  const isAdmin = Boolean(user.isLoggedIn && isUserAdmin(user.email));
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      
      {/* Profile Header Card */}
      {!user.isLoggedIn ? (
        <div className="bg-white dark:bg-[#16181f] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-neutral-800 dark:text-gray-200 flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-neutral-700 dark:text-gray-300" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">লগইন অথবা অ্যাকাউন্ট তৈরি করুন</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ব্যালেন্স অ্যাড, অর্ডার হিস্ট্রি এবং কেনাকাটা সম্পন্ন করতে আপনার অ্যাকাউন্টে লগইন করুন।
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={() => onOpenAuthModal('login')}
              className="px-5 py-2.5 rounded-xl bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-gray-200 text-white dark:text-black text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4 text-amber-400 dark:text-amber-600" />
              <span>লগইন করুন (Login)</span>
            </button>
            <button
              onClick={() => onOpenAuthModal('register')}
              className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>নতুন অ্যাকাউন্ট তৈরি করুন</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#16181f] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          
          {/* Avatar with Cloud Photo Support & 1 Centered Camera Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={onOpenPhotoModal}
              className="relative w-20 h-20 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center font-bold text-2xl border-4 border-gray-100 dark:border-gray-700 shadow-sm uppercase overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white group"
              title="ছবি পরিবর্তন করতে ক্লিক করুন"
            >
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-200">{user.name.slice(0, 2) || "AS"}</span>
              )}

              {/* 1 Single Centered Camera Icon Overlay in the Middle */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all ${
                user.photoUrl 
                  ? 'bg-black/35 opacity-0 group-hover:opacity-100 text-white' 
                  : 'bg-black/30 text-amber-300 group-hover:bg-black/50'
              }`}>
                <div className="p-2 rounded-full bg-black/50 backdrop-blur-xs text-white border border-white/20 shadow-xs flex items-center justify-center">
                  <Camera className="w-5 h-5 text-amber-400" />
                </div>
              </div>
            </button>

            {/* Verified badge */}
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white shadow-xs" title="Verified Customer">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span>{user.name}</span>
              </h2>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition flex items-center justify-center gap-1.5 self-center sm:self-auto cursor-pointer"
                title="অ্যাকাউন্ট থেকে লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট (Logout)</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              ইমেইল: <span className="font-mono text-gray-700 dark:text-gray-200">{user.email}</span>
            </p>

            <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start items-center">
              {isAdmin ? (
                <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  সুপার অ্যাডমিন (Admin)
                </span>
              ) : (
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Verified Account
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onOpenAddMoney}
            className="px-4 py-2 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-gray-200 text-white dark:text-black text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            টাকা অ্যাড করুন
          </button>
        </div>
      )}

      {/* Admin Panel Access Banner - Strictly for trxrafiff@gmail.com */}
      {isAdmin && onOpenAdmin && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm sm:text-base">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>অ্যাডমিন ম্যানেজমেন্ট পোর্টাল (Admin Portal)</span>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
              প্রোডাক্ট, ক্যাটেগরি, অর্ডার ও স্টোর সেটিংস পরিবর্তন করার সরাসরি প্রবেশাধিকার।
            </p>
          </div>
          <button
            onClick={onOpenAdmin}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>অ্যাডমিন প্যানেল ওপেন করুন</span>
          </button>
        </div>
      )}

      {/* Quick Navigation Cards with Icons */}
      {onNavigateTab && (
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onNavigateTab('home')}
            className="bg-white dark:bg-[#16181f] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white hover:shadow-xs transition flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black text-gray-800 dark:text-gray-200 flex items-center justify-center transition">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white">স্টোর (Store)</span>
          </button>

          <button
            onClick={() => onNavigateTab('orders')}
            className="bg-white dark:bg-[#16181f] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white hover:shadow-xs transition flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black text-gray-800 dark:text-gray-200 flex items-center justify-center transition">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white">অর্ডার (Orders)</span>
          </button>

          <button
            onClick={() => onNavigateTab('reviews')}
            className="bg-white dark:bg-[#16181f] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white hover:shadow-xs transition flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 group-hover:bg-amber-400 group-hover:text-black text-amber-500 flex items-center justify-center transition">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white">রিভিউ (Reviews)</span>
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#16181f] p-4 rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-xs text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">ওয়ালেট ব্যালেন্স</div>
          <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 font-heading">৳{balance}</div>
        </div>

        <div className="bg-white dark:bg-[#16181f] p-4 rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-xs text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">মোট অর্ডার</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-heading">{orders.length} টি</div>
        </div>
      </div>

      {/* AI Support Chatbot Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-sm">
            <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            স্টোর চ্যাটবট
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
            স্টোরের সময়সূচি, পেমেন্ট ও সাপোর্ট সম্পর্কিত তথ্য দেখতে পারেন।
          </p>
        </div>
        <button
          onClick={onOpenFixModal}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition flex-shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
        >
          চ্যাট শুরু করুন
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Store Information */}
      <div className="bg-white dark:bg-[#16181f] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">স্টোর সহায়তা ও তথ্য</h3>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>অপারেশন সময়: {activeHours}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>হেল্পলাইন ও পেমেন্ট নম্বর: <strong className="text-gray-800 dark:text-gray-200">{activePhone}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{activeDelivery}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
