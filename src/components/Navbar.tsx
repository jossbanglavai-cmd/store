import React from 'react';
import { Wallet, ShoppingBag, Store, Package, User, HelpCircle, Smartphone, Monitor, ShieldCheck, Star } from 'lucide-react';

interface Props {
  logoUrl: string;
  balance: number;
  activeTab: 'home' | 'orders' | 'reviews' | 'profile';
  setActiveTab: (tab: 'home' | 'orders' | 'reviews' | 'profile') => void;
  onOpenAddMoney: () => void;
  onOpenFixModal: () => void;
  deviceMode: 'responsive' | 'mobile-mock';
  setDeviceMode: (mode: 'responsive' | 'mobile-mock') => void;
  reviewsCount?: number;
  ordersCount?: number;
}

export const Navbar: React.FC<Props> = ({
  logoUrl,
  balance,
  activeTab,
  setActiveTab,
  onOpenAddMoney,
  onOpenFixModal,
  deviceMode,
  setDeviceMode,
  reviewsCount = 6,
  ordersCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
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
        <nav className="hidden md:flex items-center gap-2 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/60">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3.5 py-1.5 rounded-xl transition flex flex-col items-center justify-center min-w-[68px] ${
              activeTab === 'home' 
                ? 'bg-white text-black shadow-xs font-bold' 
                : 'text-gray-500 hover:text-black hover:bg-white/60'
            }`}
          >
            <Store className={`w-5 h-5 mb-0.5 ${activeTab === 'home' ? 'text-black stroke-[2.2]' : 'text-gray-500'}`} />
            <span className="text-[11px] font-semibold leading-tight">স্টোর</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl transition flex flex-col items-center justify-center min-w-[68px] ${
              activeTab === 'orders' 
                ? 'bg-white text-black shadow-xs font-bold' 
                : 'text-gray-500 hover:text-black hover:bg-white/60'
            }`}
          >
            <Package className={`w-5 h-5 mb-0.5 ${activeTab === 'orders' ? 'text-black stroke-[2.2]' : 'text-gray-500'}`} />
            <span className="text-[11px] font-semibold leading-tight">অর্ডার</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-1.5 rounded-xl transition flex flex-col items-center justify-center min-w-[68px] relative ${
              activeTab === 'reviews' 
                ? 'bg-white text-black shadow-xs font-bold' 
                : 'text-gray-500 hover:text-black hover:bg-white/60'
            }`}
          >
            <div className="relative">
              <Star className="w-5 h-5 mb-0.5 fill-amber-400 text-amber-400" />
              {reviewsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-amber-200 text-amber-950 text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-amber-300">
                  {reviewsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold leading-tight">রিভিউ</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* Responsive Diagnostic & Fix Button */}
          <button
            onClick={onOpenFixModal}
            title="কেন বড় লাগছিল এবং Netlify ফিক্স CSS কোড দেখুন"
            className="relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition shadow-xs cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="hidden sm:inline font-bold">রেসপনসিভ ফিক্স</span>
            <span className="sm:hidden font-bold">Fix</span>
          </button>

          {/* Device Mock Toggle */}
          <button
            onClick={() => setDeviceMode(deviceMode === 'responsive' ? 'mobile-mock' : 'responsive')}
            title={deviceMode === 'responsive' ? "মোবাইল ফ্রেম ভিউ টেস্ট করুন" : "ফুল রেসপনসিভ ভিউতে ফিরুন"}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition flex items-center gap-1"
          >
            {deviceMode === 'responsive' ? (
              <>
                <Smartphone className="w-4 h-4 text-gray-600" />
                <span className="hidden lg:inline">Mobile Preview</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 text-blue-600" />
                <span className="hidden lg:inline text-blue-600 font-semibold">Desktop Full</span>
              </>
            )}
          </button>

          {/* Wallet Balance Pill */}
          <button
            onClick={onOpenAddMoney}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-black text-white hover:bg-neutral-800 transition text-xs sm:text-sm font-semibold shadow-xs"
            title="টাকা যোগ করতে ক্লিক করুন"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>৳{balance}</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono hidden xs:inline">+ADD</span>
          </button>

          {/* Profile Tab beside balance: identical styling as store/orders/reviews */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-xl transition flex flex-col items-center justify-center min-w-[64px] sm:min-w-[68px] border ${
              activeTab === 'profile'
                ? 'bg-white text-black border-gray-300/80 shadow-xs font-bold'
                : 'bg-gray-100/90 text-gray-500 border-gray-200/60 hover:text-black hover:bg-white/60'
            }`}
            title="আমার প্রোফাইল দেখুন"
          >
            <User className={`w-5 h-5 mb-0.5 ${activeTab === 'profile' ? 'text-black stroke-[2.2]' : 'text-gray-500'}`} />
            <span className="text-[11px] font-semibold leading-tight">প্রোফাইল</span>
          </button>

        </div>

      </div>
    </header>
  );
};
