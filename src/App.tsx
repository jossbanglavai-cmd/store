import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Volume2, 
  X, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Layers,
  Smartphone,
  Monitor,
  Flame
} from 'lucide-react';
import { Category, Product, AppSettings, Order, Review } from './types';
import { FALLBACK_CATEGORIES, FALLBACK_SETTINGS } from './data/fallbackData';
import { 
  fetchLiveSettings, 
  fetchLiveCategories, 
  fetchLiveReviews,
  saveUserReview,
  getLocalOrders, 
  saveLocalOrder, 
  getWalletBalance, 
  updateWalletBalance 
} from './services/storeService';
import { Navbar } from './components/Navbar';
import { BannerSlider } from './components/BannerSlider';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { AddMoneyModal } from './components/AddMoneyModal';
import { OrdersView } from './components/OrdersView';
import { ProfileView } from './components/ProfileView';
import { ReviewsView } from './components/ReviewsView';
import { ResponsiveFixModal } from './components/ResponsiveFixModal';
import { BottomNav } from './components/BottomNav';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(FALLBACK_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'reviews' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isFixModalOpen, setIsFixModalOpen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile-mock'>('responsive');
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  
  // Wallet & Orders
  const [balance, setBalance] = useState<number>(() => getWalletBalance());
  const [orders, setOrders] = useState<Order[]>(() => getLocalOrders());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load live data
  useEffect(() => {
    async function loadData() {
      try {
        const [liveSettings, liveCategories, liveReviews] = await Promise.all([
          fetchLiveSettings(),
          fetchLiveCategories(),
          fetchLiveReviews(),
        ]);
        setSettings(liveSettings);
        if (liveCategories.length > 0) {
          setCategories(liveCategories);
        }
        if (liveReviews.length > 0) {
          setReviews(liveReviews);
        }
      } catch (err) {
        console.warn("Using fallback store data", err);
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAddReview = (newReview: Review) => {
    saveUserReview(newReview);
    setReviews(prev => [newReview, ...prev]);
    showToast("আপনার রিভিউ জমা হয়েছে! ধন্যবাদ।");
  };

  const handleOrderPlaced = (newOrder: Order, newBalance?: number) => {
    saveLocalOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);

    if (typeof newBalance === 'number') {
      updateWalletBalance(newBalance);
      setBalance(newBalance);
      showToast(`অর্ডার সম্পন্ন হয়েছে! নতুন ব্যালেন্স ৳${newBalance}`);
    } else {
      showToast(`অর্ডার প্লেস করা হয়েছে! খুব দ্রুত ভেরিফাই করে সম্পন্ন করা হবে।`);
    }
  };

  const handleAddMoneySuccess = (amount: number) => {
    const updated = balance + amount;
    updateWalletBalance(updated);
    setBalance(updated);
    showToast(`৳${amount} টাকা যোগের রিকুয়েস্ট সফল হয়েছে! নতুন ব্যালেন্স: ৳${updated}`);
  };

  // Filtered categories and products
  const filteredCategories = categories.map(cat => {
    const prods = cat.products.filter(p => {
      const matchesSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
    return { ...cat, products: prods };
  }).filter(cat => {
    if (selectedCategory !== 'all' && cat.name !== selectedCategory) return false;
    return cat.products.length > 0;
  });

  return (
    <div className={`min-h-screen bg-[#f4f6f9] text-gray-900 flex flex-col ${deviceMode === 'mobile-mock' ? 'items-center py-6 px-2 bg-neutral-900' : ''}`}>
      
      {/* Device Mode banner when simulating mobile */}
      {deviceMode === 'mobile-mock' && (
        <div className="w-full max-w-[420px] mb-3 flex items-center justify-between text-white text-xs px-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">মোবাইল ফ্রেম সিমুলেশন (390px)</span>
          </div>
          <button
            onClick={() => setDeviceMode('responsive')}
            className="text-xs text-blue-300 hover:text-white underline font-semibold flex items-center gap-1"
          >
            <Monitor className="w-3.5 h-3.5" />
            ডেক্সটপ ফুলস্ক্রিন
          </button>
        </div>
      )}

      {/* Main Container Wrapper */}
      <div className={`w-full flex-1 flex flex-col transition-all duration-300 ${
        deviceMode === 'mobile-mock' 
          ? 'max-w-[410px] min-h-[844px] bg-[#f4f6f9] rounded-3xl shadow-2xl overflow-hidden border-4 border-neutral-700 relative pb-16' 
          : 'pb-20 md:pb-10'
      }`}>
        
        {/* Navigation */}
        <Navbar
          logoUrl={settings.headerLogo}
          balance={balance}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddMoney={() => setIsAddMoneyOpen(true)}
          onOpenFixModal={() => setIsFixModalOpen(true)}
          deviceMode={deviceMode}
          setDeviceMode={setDeviceMode}
          reviewsCount={reviews.length}
          ordersCount={orders.length}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm border border-neutral-700 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 space-y-5">
          
          {activeTab === 'home' && (
            <>
              {/* Notice Bar */}
              {!noticeDismissed && settings.noticeText && (
                <div className="bg-black text-white px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    <span className="font-semibold truncate tracking-wide">
                      {settings.noticeText}
                    </span>
                  </div>
                  <button
                    onClick={() => setNoticeDismissed(true)}
                    className="text-gray-400 hover:text-white flex-shrink-0"
                    title="Dismiss notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Banner Slider (Properly constrained on desktop!) */}
              <BannerSlider slides={settings.sliderData} />

              {/* Customer Reviews Spotlight Strip */}
              <div 
                onClick={() => setActiveTab('reviews')}
                className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/90 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-amber-400 transition group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <span className="font-bold text-sm text-gray-900 font-heading mr-1">⭐ 5.0</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    <strong className="text-gray-900 font-semibold">{reviews.length} টি ভেরিফাইড রিভিউ</strong> — গ্রাহকদের মতামত ও অভিজ্ঞতা দেখুন
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-black group-hover:translate-x-0.5 transition flex-shrink-0">
                  <span>রিভিউ পড়ুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Responsive Fix Callout Pill on Desktop */}
              <div className="bg-white border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 leading-tight">
                      ডেক্সটপে ব্যানার ও কার্ড এতো বড় কেন হয়েছিল?
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      অরিজিনাল কোডে <code>max-width</code> ও <code>@media</code> না থাকায় ১৯২০ পিক্সেল স্ক্রিনে বড় দেখাচ্ছিল।
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFixModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 flex-shrink-0 shadow-xs"
                >
                  <span>কারণ ও Netlify ফিক্স CSS দেখুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="space-y-3 pt-1">
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Crunchyroll, WhatsApp, Netflix, VPN বা যেকোনো পণ্য খুঁজুন..."
                    className="w-full pl-10 pr-9 py-2.5 bg-white rounded-xl border border-gray-200/90 focus:border-black focus:ring-1 focus:ring-black outline-hidden text-xs sm:text-sm shadow-xs transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                      selectedCategory === 'all'
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    সব ক্যাটাগরি (All)
                  </button>
                  {categories.map((cat, idx) => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                          isSelected
                            ? 'bg-black text-white shadow-xs'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Product Grid Sections */}
              {filteredCategories.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-xs">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h4 className="font-bold text-gray-800 text-sm">কোনো প্রোডাক্ট পাওয়া যায়নি</h4>
                  <p className="text-xs text-gray-500 mt-1">ভিন্ন কি-ওয়ার্ড দিয়ে সার্চ করুন অথবা অন্য ক্যাটাগরি বেছে নিন</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="mt-3 px-4 py-1.5 bg-black text-white text-xs font-semibold rounded-lg"
                  >
                    রিসেট করুন
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredCategories.map((cat, catIdx) => (
                    <section key={catIdx} className="space-y-3">
                      
                      {/* Section Title */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-4 rounded-full bg-black" />
                          <h2 className="text-base sm:text-lg font-bold font-heading tracking-wide text-gray-900">
                            {cat.name}
                          </h2>
                          <span className="text-[11px] text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                            {cat.products.length} টি আইটেম
                          </span>
                        </div>
                      </div>

                      {/* 
                        RESPONSIVE GRID FIX:
                        Instead of repeat(3, 1fr) stretching across 1920px screen,
                        we use mobile-3, tablet-4, desktop-6!
                      */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3.5">
                        {cat.products.map((prod, prodIdx) => (
                          <ProductCard
                            key={prodIdx}
                            product={prod}
                            onSelect={(p) => setSelectedProduct(p)}
                          />
                        ))}
                      </div>

                    </section>
                  ))}
                </div>
              )}

            </>
          )}

          {/* Orders View */}
          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              onBackToHome={() => setActiveTab('home')}
            />
          )}

          {/* Reviews View */}
          {activeTab === 'reviews' && (
            <ReviewsView
              reviews={reviews}
              onAddReview={handleAddReview}
              onBackToHome={() => setActiveTab('home')}
              productNames={Array.from(new Set(categories.flatMap(c => c.products.map(p => p.name))))}
            />
          )}

          {/* Profile View */}
          {activeTab === 'profile' && (
            <ProfileView
              balance={balance}
              orders={orders}
              onOpenAddMoney={() => setIsAddMoneyOpen(true)}
              onOpenFixModal={() => setIsFixModalOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reviewsCount={reviews.length}
        />

        {/* Modals */}
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          settings={settings}
          userBalance={balance}
          onOrderPlaced={handleOrderPlaced}
          onViewReviews={() => setActiveTab('reviews')}
        />

        <AddMoneyModal
          isOpen={isAddMoneyOpen}
          onClose={() => setIsAddMoneyOpen(false)}
          settings={settings}
          onAddMoneySuccess={handleAddMoneySuccess}
        />

        <ResponsiveFixModal
          isOpen={isFixModalOpen}
          onClose={() => setIsFixModalOpen(false)}
        />

      </div>
    </div>
  );
}
