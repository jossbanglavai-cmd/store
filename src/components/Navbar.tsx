import React from 'react';
import { Wallet, ShoppingBag, Store, Package, User, HelpCircle, ShieldCheck, Star, LogIn, Moon, Sun } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  logoUrl: string;
  balance: number;
  activeTab: 'home' | 'orders' | 'reviews' | 'profile';
  setActiveTab: (tab: 'home' | 'orders' | 'reviews' | 'profile') => void;
  onOpenAddMoney: () => void;
  onOpenFixModal: () => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  user?: UserProfile;
  deviceMode: 'responsive' | 'mobile-mock';
  setDeviceMode: (mode: 'responsive' | 'mobile-mock') => void;
  reviewsCount?: number;
  ordersCount?: number;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onSetTheme?: (dark: boolean) => void;
}

export const Navbar: React.FC<Props> = ({
  logoUrl,
  balance,
  activeTab,
  setActiveTab,
  onOpenAddMoney,
  onOpenFixModal,
  onOpenAuthModal,
  user,
  deviceMode,
  setDeviceMode,
  reviewsCount = 6,
  ordersCount = 0,
  isDark = false,
  onToggleTheme,
  onSetTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#13151b]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 shadow-xs transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer transition hover:opacity-90 flex-shrink-0"
        >
          <img 
            src={logoUrl || "https://i.postimg.cc/prFhjX3v/20260514-210650.png"} 
            alt="Amar Store" 
            className="h-9 sm:h-11 max-w-[130px] sm:max-w-[170px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://i.postimg.cc/prFhjX3v/20260514-210650.png";
            }}
          />
        </div>

        {/* Desktop Nav Links with Icon on Top and Name Below */}
        <nav className="hidden md:flex items-center gap-1.5 bg-gray-100/90 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
          
          {/* 1 Single Theme Toggle Button (Before Store) */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDark ? "লাইট মোডে পরিবর্তন করুন" : "ডার্ক মোডে পরিবর্তন করুন"}
            className="px-3.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[66px] text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 transition cursor-pointer font-semibold"
          >
            {isDark ? (
              <Sun className="w-5 h-5 mb-0.5 text-amber-400 fill-amber-400 stroke-[2] animate-in zoom-in-50 duration-200" />
            ) : (
              <Moon className="w-5 h-5 mb-0.5 text-gray-700 stroke-[2] animate-in zoom-in-50 duration-200" />
            )}
            <span className="text-[11px] leading-tight">
              {isDark ? 'লাইট' : 'ডার্ক'}
            </span>
          </button>

          {/* Store Tab */}
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[66px] transition cursor-pointer ${
              activeTab === 'home' 
                ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-xs font-bold' 
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 font-semibold'
            }`}
          >
            <Store className={`w-5 h-5 mb-0.5 ${
              activeTab === 'home' 
                ? 'text-black dark:text-white stroke-[2.2]' 
                : 'text-gray-500 dark:text-gray-400'
            }`} />
            <span className="text-[11px] leading-tight">স্টোর</span>
          </button>

          {/* Orders Tab */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[66px] transition cursor-pointer ${
              activeTab === 'orders' 
                ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-xs font-bold' 
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 font-semibold'
            }`}
          >
            <Package className={`w-5 h-5 mb-0.5 ${
              activeTab === 'orders' 
                ? 'text-black dark:text-white stroke-[2.2]' 
                : 'text-gray-500 dark:text-gray-400'
            }`} />
            <span className="text-[11px] leading-tight">অর্ডার</span>
          </button>

          {/* Reviews Tab */}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[66px] relative transition cursor-pointer ${
              activeTab === 'reviews' 
                ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-xs font-bold' 
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 font-semibold'
            }`}
          >
            <div className="relative">
              <Star className="w-5 h-5 mb-0.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-[11px] leading-tight">রিভিউ</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">

          {/* Wallet Balance Pill - Only shown when logged in */}
          {user?.isLoggedIn && (
            <button
              onClick={onOpenAddMoney}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-gray-100 transition text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
              title="টাকা অ্যাড করতে ক্লিক করুন"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              <span>৳{balance}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 dark:text-emerald-700 px-1.5 py-0.2 rounded font-mono hidden xs:inline">+ADD</span>
            </button>
          )}

          {/* Profile or Login Tab beside balance */}
          {user && !user.isLoggedIn ? (
            <button
              onClick={() => onOpenAuthModal ? onOpenAuthModal('login') : setActiveTab('profile')}
              className="px-3.5 py-1.5 rounded-xl transition flex flex-col items-center justify-center min-w-[64px] sm:min-w-[68px] border bg-gray-100/90 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border-gray-200/60 dark:border-gray-700/60 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 cursor-pointer shadow-xs"
              title="লগইন বা রেজিস্ট্রেশন করুন"
            >
              <LogIn className="w-5 h-5 mb-0.5 text-gray-700 dark:text-gray-300 stroke-[2.2]" />
              <span className="text-[11px] font-semibold leading-tight">লগইন</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-xl transition flex flex-col items-center justify-center min-w-[64px] sm:min-w-[68px] border cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300/80 dark:border-gray-600 shadow-xs font-bold'
                  : 'bg-gray-100/90 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/60 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 font-semibold'
              }`}
              title="আমার প্রোফাইল দেখুন"
            >
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt={user.name} 
                  className={`w-5 h-5 mb-0.5 rounded-full object-cover border ${
                    activeTab === 'profile' 
                      ? 'border-black dark:border-white' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`} 
                />
              ) : (
                <User className={`w-5 h-5 mb-0.5 ${
                  activeTab === 'profile' 
                    ? 'text-black dark:text-white stroke-[2.2]' 
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
              )}
              <span className="text-[11px] font-semibold leading-tight">প্রোফাইল</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
