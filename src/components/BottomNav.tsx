import React from 'react';
import { Store, Package, User, Star, LogIn, Moon, Sun } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  activeTab: 'home' | 'orders' | 'reviews' | 'profile';
  setActiveTab: (tab: 'home' | 'orders' | 'reviews' | 'profile') => void;
  reviewsCount?: number;
  user?: UserProfile;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onSetTheme?: (dark: boolean) => void;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  reviewsCount = 0,
  user,
  onOpenAuthModal,
  isDark = false,
  onToggleTheme,
  onSetTheme,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#13151b]/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800 shadow-lg py-1.5 px-2 flex items-center justify-around transition-colors duration-200">
      
      {/* 1. Theme Toggle Single Button (Placed BEFORE Store) */}
      <button
        type="button"
        onClick={onToggleTheme}
        title={isDark ? "লাইট মোডে পরিবর্তন করুন" : "ডার্ক মোডে পরিবর্তন করুন"}
        className="flex flex-col items-center justify-center gap-0.5 transition min-w-[56px] py-1 rounded-xl cursor-pointer text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
      >
        <div className={`p-1 rounded-lg transition ${
          isDark 
            ? 'bg-amber-400/15 text-amber-400' 
            : 'bg-neutral-100 text-neutral-800 dark:bg-gray-800 dark:text-gray-200'
        }`}>
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 fill-amber-400 stroke-[2] animate-in zoom-in-50 duration-200" />
          ) : (
            <Moon className="w-5 h-5 text-neutral-800 stroke-[2] animate-in zoom-in-50 duration-200" />
          )}
        </div>
        <span className="text-[11px] font-medium leading-none">
          {isDark ? 'লাইট' : 'ডার্ক'}
        </span>
      </button>

      {/* 2. Store Tab */}
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center justify-center gap-0.5 transition min-w-[56px] py-1 rounded-xl cursor-pointer ${
          activeTab === 'home' 
            ? 'text-black dark:text-white font-bold' 
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <div className={`p-1 rounded-lg transition ${
          activeTab === 'home' 
            ? 'bg-gray-100 dark:bg-gray-800' 
            : ''
        }`}>
          <Store className={`w-5 h-5 ${
            activeTab === 'home' 
              ? 'stroke-[2.5] text-black dark:text-white' 
              : 'text-gray-500 dark:text-gray-400'
          }`} />
        </div>
        <span className="text-[11px] font-medium leading-none">স্টোর</span>
      </button>

      {/* 3. Orders Tab */}
      <button
        onClick={() => setActiveTab('orders')}
        className={`flex flex-col items-center justify-center gap-0.5 transition min-w-[56px] py-1 rounded-xl cursor-pointer ${
          activeTab === 'orders' 
            ? 'text-black dark:text-white font-bold' 
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <div className={`p-1 rounded-lg transition ${
          activeTab === 'orders' 
            ? 'bg-gray-100 dark:bg-gray-800' 
            : ''
        }`}>
          <Package className={`w-5 h-5 ${
            activeTab === 'orders' 
              ? 'stroke-[2.5] text-black dark:text-white' 
              : 'text-gray-500 dark:text-gray-400'
          }`} />
        </div>
        <span className="text-[11px] font-medium leading-none">অর্ডার</span>
      </button>

      {/* 4. Reviews Tab */}
      <button
        onClick={() => setActiveTab('reviews')}
        className={`flex flex-col items-center justify-center gap-0.5 relative transition min-w-[56px] py-1 rounded-xl cursor-pointer ${
          activeTab === 'reviews' 
            ? 'text-black dark:text-white font-bold' 
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <div className="relative">
          <div className={`p-1 rounded-lg transition ${
            activeTab === 'reviews' 
              ? 'bg-amber-50 dark:bg-amber-950/40' 
              : ''
          }`}>
            <Star className={`w-5 h-5 ${
              activeTab === 'reviews' 
                ? 'fill-amber-400 text-amber-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`} />
          </div>
        </div>
        <span className="text-[11px] font-medium leading-none">রিভিউ</span>
      </button>

      {/* 5. Auth / Profile Tab */}
      {user && !user.isLoggedIn ? (
        <button
          onClick={() => onOpenAuthModal ? onOpenAuthModal('login') : setActiveTab('profile')}
          className="flex flex-col items-center justify-center gap-0.5 transition min-w-[56px] py-1 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
        >
          <div className="p-1 rounded-lg transition">
            <LogIn className="w-5 h-5 text-gray-500 dark:text-gray-400 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-medium leading-none">লগইন</span>
        </button>
      ) : (
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 transition min-w-[56px] py-1 rounded-xl cursor-pointer ${
            activeTab === 'profile' 
              ? 'text-black dark:text-white font-bold' 
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <div className={`p-1 rounded-lg transition ${
            activeTab === 'profile' 
              ? 'bg-gray-100 dark:bg-gray-800' 
              : ''
          }`}>
            {user?.photoUrl ? (
              <img 
                src={user.photoUrl} 
                alt={user.name} 
                className={`w-5 h-5 rounded-full object-cover border ${
                  activeTab === 'profile' 
                    ? 'border-black dark:border-white' 
                    : 'border-gray-300 dark:border-gray-600'
                }`} 
              />
            ) : (
              <User className={`w-5 h-5 ${
                activeTab === 'profile' 
                  ? 'stroke-[2.5] text-black dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
            )}
          </div>
          <span className="text-[11px] font-medium leading-none">প্রোফাইল</span>
        </button>
      )}
    </div>
  );
};
