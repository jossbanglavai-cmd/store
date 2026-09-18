import React from 'react';
import { User, Wallet, Store, Package, Star, CheckCircle2, Phone, Clock, ArrowRight, ShieldCheck, Sparkles, ChevronRight, LogOut, LogIn, UserPlus } from 'lucide-react';
import { Order, UserProfile } from '../types';

interface Props {
  balance: number;
  orders: Order[];
  user: UserProfile;
  onOpenAddMoney: () => void;
  onOpenFixModal: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onNavigateTab?: (tab: 'home' | 'orders' | 'reviews') => void;
}

export const ProfileView: React.FC<Props> = ({
  balance,
  orders,
  user,
  onOpenAddMoney,
  onOpenFixModal,
  onOpenAuthModal,
  onLogout,
  onNavigateTab,
}) => {
  const completedOrders = orders.filter(o => o.status === 'Success').length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.status === 'Success' ? o.price : 0), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      
      {/* Profile Header Card */}
      {!user.isLoggedIn ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-gray-200 text-neutral-800 flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-neutral-700" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-gray-900">লগইন অথবা অ্যাকাউন্ট তৈরি করুন</h2>
            <p className="text-xs text-gray-500">
              ব্যালেন্স রিচার্জ, অর্ডার হিস্ট্রি এবং কেনাকাটা সম্পন্ন করতে আপনার অ্যাকাউন্টে লগইন করুন।
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={() => onOpenAuthModal('login')}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>লগইন করুন (Login)</span>
            </button>
            <button
              onClick={() => onOpenAuthModal('register')}
              className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-black text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>নতুন অ্যাকাউন্ট তৈরি করুন</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-2xl border-4 border-gray-100 shadow-sm uppercase">
              {user.name.slice(0, 2) || "AS"}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Verified Customer">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
                <User className="w-5 h-5 text-gray-700" />
                <span>{user.name}</span>
              </h2>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center justify-center gap-1.5 self-center sm:self-auto cursor-pointer"
                title="অ্যাকাউন্ট থেকে লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট (Logout)</span>
              </button>
            </div>

            <p className="text-xs text-gray-500">
              আইডি: <span className="font-mono font-semibold text-gray-700">{user.memberId}</span> | ইমেইল: <span className="font-mono text-gray-700">{user.email}</span>
            </p>

            <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Account
              </span>
              <span className="bg-gray-100 text-gray-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                bKash / Nagad Ready
              </span>
            </div>
          </div>

          <button
            onClick={onOpenAddMoney}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            টাকা যোগ করুন
          </button>
        </div>
      )}

      {/* Quick Navigation Cards with Icons */}
      {onNavigateTab && (
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onNavigateTab('home')}
            className="bg-white p-3.5 rounded-xl border border-gray-200 hover:border-black hover:shadow-xs transition flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-black group-hover:text-white text-gray-800 flex items-center justify-center transition">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-black">স্টোর (Store)</span>
          </button>

          <button
            onClick={() => onNavigateTab('orders')}
            className="bg-white p-3.5 rounded-xl border border-gray-200 hover:border-black hover:shadow-xs transition flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-black group-hover:text-white text-gray-800 flex items-center justify-center transition">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-black">অর্ডার (Orders)</span>
          </button>

          <button
            onClick={() => onNavigateTab('reviews')}
            className="bg-white p-3.5 rounded-xl border border-gray-200 hover:border-black hover:shadow-xs transition flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 group-hover:bg-amber-400 group-hover:text-black text-amber-500 flex items-center justify-center transition">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-black">রিভিউ (Reviews)</span>
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs text-center">
          <div className="text-xs text-gray-500 font-medium">ওয়ালেট ব্যালেন্স</div>
          <div className="text-lg sm:text-xl font-bold text-emerald-600 font-heading">৳{balance}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs text-center">
          <div className="text-xs text-gray-500 font-medium">মোট অর্ডার</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 font-heading">{orders.length} টি</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs text-center">
          <div className="text-xs text-gray-500 font-medium">সম্পন্ন খরচ</div>
          <div className="text-lg sm:text-xl font-bold text-blue-600 font-heading">৳{totalSpent}</div>
        </div>
      </div>

      {/* Responsive Diagnostic Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            রেসপনসিভ সমস্যা কেন হয়েছিল এবং Netlify CSS ফিক্স
          </div>
          <p className="text-xs text-amber-800/80">
            ব্যানার ও প্রোডাক্ট কার্ডের সাইজ ঠিক করার সমাধান কোড দেখতে ক্লিক করুন।
          </p>
        </div>
        <button
          onClick={onOpenFixModal}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex-shrink-0 flex items-center gap-1"
        >
          সমাধান দেখুন
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Store Information */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-gray-900">স্টোর সহায়তা ও তথ্য</h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>অপারেশন সময়: সকাল ১০:০০ টা থেকে রাত ১০:০০ টা (প্রতিদিন)</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>হেল্পলাইন ও পেমেন্ট নম্বর: <strong>01770931981</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>স্বয়ংক্রিয় ও তাৎক্ষণিক ডেলিভারি (সাধারণত ৫ থেকে ১৫ মিনিটের মধ্যে)</span>
          </div>
        </div>
      </div>

    </div>
  );
};
