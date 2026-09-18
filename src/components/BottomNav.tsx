import React from 'react';
import { Store, Package, User, Star, LogIn } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  activeTab: 'home' | 'orders' | 'reviews' | 'profile';
  setActiveTab: (tab: 'home' | 'orders' | 'reviews' | 'profile') => void;
  reviewsCount?: number;
  user?: UserProfile;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  reviewsCount = 0,
  user,
  onOpenAuthModal,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-lg py-1.5 px-3 flex items-center justify-around">
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center justify-center gap-0.5 transition min-w-[62px] py-1 rounded-xl cursor-pointer ${
          activeTab === 'home' ? 'text-black font-bold' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className={`p-1 rounded-lg transition ${activeTab === 'home' ? 'bg-gray-100' : ''}`}>
          <Store className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5] text-black' : 'text-gray-500'}`} />
        </div>
        <span className="text-[11px] font-medium leading-none">স্টোর</span>
      </button>

      <button
        onClick={() => setActiveTab('orders')}
        className={`flex flex-col items-center justify-center gap-0.5 transition min-w-[62px] py-1 rounded-xl cursor-pointer ${
          activeTab === 'orders' ? 'text-black font-bold' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className={`p-1 rounded-lg transition ${activeTab === 'orders' ? 'bg-gray-100' : ''}`}>
          <Package className={`w-5 h-5 ${activeTab === 'orders' ? 'stroke-[2.5] text-black' : 'text-gray-500'}`} />
        </div>
        <span className="text-[11px] font-medium leading-none">অর্ডার</span>
      </button>

      <button
        onClick={() => setActiveTab('reviews')}
        className={`flex flex-col items-center justify-center gap-0.5 relative transition min-w-[62px] py-1 rounded-xl cursor-pointer ${
          activeTab === 'reviews' ? 'text-black font-bold' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className="relative">
          <div className={`p-1 rounded-lg transition ${activeTab === 'reviews' ? 'bg-amber-50' : ''}`}>
            <Star className={`w-5 h-5 ${activeTab === 'reviews' ? 'fill-amber-400 text-amber-500' : 'text-gray-500'}`} />
          </div>
          {reviewsCount > 0 && (
            <span className="absolute -top-0.5 -right-1.5 bg-amber-400 text-amber-950 text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
              {reviewsCount}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium leading-none">রিভিউ</span>
      </button>

      {user && !user.isLoggedIn ? (
        <button
          onClick={() => onOpenAuthModal ? onOpenAuthModal('login') : setActiveTab('profile')}
          className="flex flex-col items-center justify-center gap-0.5 transition min-w-[62px] py-1 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <div className="p-1 rounded-lg transition">
            <LogIn className="w-5 h-5 text-gray-500 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-medium leading-none">লগইন</span>
        </button>
      ) : (
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 transition min-w-[62px] py-1 rounded-xl cursor-pointer ${
            activeTab === 'profile' ? 'text-black font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className={`p-1 rounded-lg transition ${activeTab === 'profile' ? 'bg-gray-100' : ''}`}>
            {user?.photoUrl ? (
              <img 
                src={user.photoUrl} 
                alt={user.name} 
                className={`w-5 h-5 rounded-full object-cover border ${activeTab === 'profile' ? 'border-black' : 'border-gray-300'}`} 
              />
            ) : (
              <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5] text-black' : 'text-gray-500'}`} />
            )}
          </div>
          <span className="text-[11px] font-medium leading-none">প্রোফাইল</span>
        </button>
      )}
    </div>
  );
};
