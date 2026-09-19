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
  Flame,
  Bot,
  ArrowRight
} from 'lucide-react';
import { Category, Product, AppSettings, Order, Review, UserProfile } from './types';
import { FALLBACK_CATEGORIES, FALLBACK_SETTINGS } from './data/fallbackData';
import { 
  fetchLiveSettings, 
  fetchLiveCategories, 
  fetchLiveReviews,
  saveUserReview,
  getLocalOrders, 
  saveLocalOrder, 
  getWalletBalance, 
  updateWalletBalance,
  getUserProfile,
  saveUserProfile,
  logoutUser,
  listenToLiveUser,
  listenToLiveUserOrders,
  listenToLiveCategories,
  listenToLiveSettings,
  listenToLiveReviews
} from './services/storeService';
import { Navbar } from './components/Navbar';
import { BannerSlider } from './components/BannerSlider';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { AddMoneyModal } from './components/AddMoneyModal';
import { OrdersView } from './components/OrdersView';
import { ProfileView } from './components/ProfileView';
import { ReviewsView } from './components/ReviewsView';
import { AiSupportModal } from './components/AiSupportModal';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { ProfilePhotoModal } from './components/ProfilePhotoModal';
import { AdminPanelModal } from './components/AdminPanelModal';

// Fully updated Live Sync Firebase integration for Amar Store with Web SDK support
export default function App() {
  const [settings, setSettings] = useState<AppSettings>(FALLBACK_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('amar_store_live_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return FALLBACK_CATEGORIES;
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'reviews' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isFixModalOpen, setIsFixModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile-mock'>('responsive');
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  // Security: Prevent right-click and common inspection shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
      }
      if (
        e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')
      ) {
        e.preventDefault();
      }
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Dark mode theme state with localStorage persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('amarstore_theme');
      if (saved) return saved === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('amarstore_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('amarstore_theme', 'light');
    }
  }, [isDark]);

  const setThemeExplicitly = (dark: boolean) => {
    setIsDark(dark);
  };

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };
  
  // User Profile
  const [user, setUser] = useState<UserProfile>(() => getUserProfile());

  // Wallet & Orders tied strictly to logged-in user account
  const [balance, setBalance] = useState<number>(() => getWalletBalance(user.isLoggedIn ? user.email : undefined));
  const [orders, setOrders] = useState<Order[]>(() => getLocalOrders(user.isLoggedIn ? user.email : undefined));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync balance and orders whenever logged in user changes
  useEffect(() => {
    if (user.isLoggedIn && user.email) {
      setBalance(getWalletBalance(user.email));
      setOrders(getLocalOrders(user.email));
    } else {
      setBalance(0);
      setOrders([]);
    }
  }, [user.isLoggedIn, user.email]);

  // Load live data
  useEffect(() => {
    // One-time cache reset to wipe old demo cache for all users
    const versionKey = 'amar_store_cache_reset_v4';
    if (localStorage.getItem(versionKey) !== 'true') {
      localStorage.removeItem('amar_store_live_categories');
      localStorage.removeItem('amar_store_live_settings');
      localStorage.removeItem('amar_store_user_reviews');
      localStorage.setItem(versionKey, 'true');
      window.location.reload();
      return;
    }

    async function loadData() {
      try {
        const [liveSettings, liveCategories, liveReviews] = await Promise.all([
          fetchLiveSettings(),
          fetchLiveCategories(),
          fetchLiveReviews(),
        ]);
        setSettings(liveSettings);
        if (liveCategories) {
          setCategories(liveCategories);
        }
        setReviews(liveReviews);
      } catch (err) {
        console.warn("Using fallback store data", err);
      }
    }
    loadData();

    // Listen to live category changes in real time
    const unsubscribeCategories = listenToLiveCategories((updatedCats) => {
      setCategories(updatedCats);
    });

    // Listen to live settings changes in real time (notices, banners, payments)
    const unsubscribeSettings = listenToLiveSettings((updatedSettings) => {
      setSettings(updatedSettings);
    });

    // Listen to live reviews in real time
    const unsubscribeReviews = listenToLiveReviews((updatedReviews) => {
      setReviews(updatedReviews);
    });

    return () => {
      unsubscribeCategories();
      unsubscribeSettings();
      unsubscribeReviews();
    };
  }, []);

  // Listen to live user balance and live orders in real-time from Firestore
  useEffect(() => {
    if (!user.isLoggedIn || !user.email) return;

    const unsubscribeUser = listenToLiveUser(user.email, (liveData) => {
      setBalance(liveData.balance);
      if (liveData.photoUrl && liveData.photoUrl !== user.photoUrl) {
        setUser(prev => ({ ...prev, photoUrl: liveData.photoUrl }));
      }
    });

    const unsubscribeOrders = listenToLiveUserOrders(user.email, (liveOrders) => {
      setOrders(liveOrders);
    });

    return () => {
      unsubscribeUser();
      unsubscribeOrders();
    };
  }, [user.email, user.isLoggedIn]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAddReview = (newReview: Review) => {
    saveUserReview(newReview);
    setReviews(prev => [newReview, ...prev]);
    showToast("আপনার রিভিউটি সফলভাবে জমা হয়েছে, ধন্যবাদ!");
  };

  const handleOrderPlaced = (newOrder: Order, newBalance?: number) => {
    if (!user.isLoggedIn || !user.email) return;

    saveLocalOrder(newOrder, user.email);
    setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);

    if (typeof newBalance === 'number') {
      updateWalletBalance(newBalance, user.email);
      setBalance(newBalance);
      showToast(`অর্ডার সম্পন্ন হয়েছে! নতুন ব্যালেন্স ৳${newBalance}`);
    } else {
      showToast(`অর্ডার প্লেস করা হয়েছে! খুব দ্রুত ভেরিফাই করে সম্পন্ন করা হবে।`);
    }
  };

  const handleAddMoneySuccess = (amount: number, reqId?: string) => {
    if (!user.isLoggedIn || !user.email) return;

    // Refresh orders so the pending deposit appears in the order history
    setOrders(getLocalOrders(user.email));
    showToast(`৳${amount} টাকা অ্যাড করার রিকোয়েস্ট সাবমিট হয়েছে! অ্যাডমিন অনুমোদন করলেই ব্যালেন্স যোগ হবে।`);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    saveUserProfile(loggedInUser);
    setUser(loggedInUser);
    setBalance(getWalletBalance(loggedInUser.email));
    setOrders(getLocalOrders(loggedInUser.email));
    showToast(`স্বাগতম, ${loggedInUser.name}! সফলভাবে লগইন হয়েছে।`);
  };

  const handleLogout = () => {
    const guest = logoutUser();
    setUser(guest);
    setBalance(0);
    setOrders([]);
    showToast("সফলভাবে লগআউট করা হয়েছে।");
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
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#0b0d12] text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
      
      {/* Main Container Wrapper */}
      <div className="w-full flex-1 flex flex-col transition-all duration-300 pb-20 md:pb-10">
        
        {/* Navigation */}
        <Navbar
          logoUrl={settings.headerLogo}
          balance={balance}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddMoney={() => setIsAddMoneyOpen(true)}
          onOpenFixModal={() => setIsFixModalOpen(true)}
          onOpenAuthModal={handleOpenAuthModal}
          user={user}
          deviceMode={deviceMode}
          setDeviceMode={setDeviceMode}
          reviewsCount={reviews.filter(r => r.status === 'Approved' || (!r.status) || r.status === 'approved').length}
          ordersCount={orders.length}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onSetTheme={setThemeExplicitly}
          onOpenAdmin={() => setIsAdminOpen(true)}
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
                <div className="bg-black dark:bg-gray-800 text-white px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xs animate-in fade-in border border-transparent dark:border-gray-700">
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
                className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/90 dark:border-amber-700/60 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 transition group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <span className="font-bold text-sm text-gray-900 dark:text-white font-heading mr-1">⭐ 5.0</span>
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white font-semibold">{reviews.length} টি ভেরিফাইড রিভিউ</strong> — গ্রাহকদের মতামত ও অভিজ্ঞতা দেখুন
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-black dark:text-amber-400 group-hover:translate-x-0.5 transition flex-shrink-0">
                  <span>রিভিউ পড়ুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* AI Support Chatbot Box Card (Right below Review button) */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 shadow-2xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-xs sm:text-sm">
                    <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    স্টোর চ্যাটবট
                  </div>
                  <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-400/80 leading-snug">
                    স্টোরের সময়সূচি, পেমেন্ট ও সাপোর্ট সম্পর্কিত তথ্য দেখতে পারেন।
                  </p>
                </div>
                <button
                  onClick={() => setIsFixModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition flex-shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  চ্যাট শুরু করুন
                  <ArrowRight className="w-3.5 h-3.5" />
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
                    className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-[#16181f] text-gray-900 dark:text-white rounded-xl border border-gray-200/90 dark:border-gray-800 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-gray-500 outline-hidden text-xs sm:text-sm shadow-xs transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
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
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs font-bold'
                        : 'bg-white dark:bg-[#16181f] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs font-bold'
                            : 'bg-white dark:bg-[#16181f] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                <div className="bg-white dark:bg-[#16181f] rounded-2xl p-10 text-center border border-gray-200 dark:border-gray-800 shadow-xs">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">কোনো প্রোডাক্ট পাওয়া যায়নি</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ভিন্ন কি-ওয়ার্ড দিয়ে সার্চ করুন অথবা অন্য ক্যাটাগরি বেছে নিন</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="mt-3 px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-lg"
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
                          <span className="w-1.5 h-4 rounded-full bg-black dark:bg-white" />
                          <h2 className="text-base sm:text-lg font-bold font-heading tracking-wide text-gray-900 dark:text-white">
                            {cat.name}
                          </h2>
                          <span className="text-[11px] text-gray-600 dark:text-gray-300 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-transparent dark:border-gray-700">
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
              user={user}
              onOpenAuthModal={handleOpenAuthModal}
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
              user={user}
              onOpenAuthModal={handleOpenAuthModal}
            />
          )}

          {/* Profile View */}
          {activeTab === 'profile' && (
            <ProfileView
              balance={balance}
              orders={orders}
              user={user}
              onOpenAddMoney={() => setIsAddMoneyOpen(true)}
              onOpenFixModal={() => setIsFixModalOpen(true)}
              onOpenAuthModal={handleOpenAuthModal}
              onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
              onLogout={handleLogout}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reviewsCount={reviews.length}
          user={user}
          onOpenAuthModal={handleOpenAuthModal}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onSetTheme={setThemeExplicitly}
        />

        {/* Floating AI Chatbot Button */}
        <button
          onClick={() => setIsFixModalOpen(true)}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-neutral-900 dark:bg-amber-400 text-white dark:text-black p-3 sm:px-4 sm:py-3 rounded-2xl shadow-2xl border border-neutral-700 dark:border-amber-300 flex items-center gap-2 hover:scale-105 active:scale-95 transition cursor-pointer group"
          title="স্টোর চ্যাটবটের সাথে কথা বলুন"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-amber-400 dark:text-black" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-900 dark:border-amber-400 animate-pulse"></span>
          </div>
          <span className="hidden sm:inline font-bold text-xs">স্টোর চ্যাটবট</span>
        </button>

        {/* Modals */}
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          settings={settings}
          userBalance={balance}
          user={user}
          onRequireLogin={() => handleOpenAuthModal('login')}
          onOrderPlaced={handleOrderPlaced}
          onViewReviews={() => setActiveTab('reviews')}
        />

        <AddMoneyModal
          isOpen={isAddMoneyOpen}
          onClose={() => setIsAddMoneyOpen(false)}
          settings={settings}
          user={user}
          onRequireLogin={() => handleOpenAuthModal('login')}
          onAddMoneySuccess={handleAddMoneySuccess}
        />

        <AiSupportModal
          isOpen={isFixModalOpen}
          onClose={() => setIsFixModalOpen(false)}
          reviewsCount={reviews.length}
          settings={settings}
          onOpenAddMoney={() => setIsAddMoneyOpen(true)}
        />

        {/* Authentication Modal (Login & Registration) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          initialMode={authModalMode}
        />

        {/* Profile Photo Modal (Cloud Upload) */}
        <ProfilePhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          user={user}
          onUpdatePhoto={(newPhotoUrl) => {
            setUser(prev => ({ ...prev, photoUrl: newPhotoUrl }));
            showToast('প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!');
          }}
        />

        {/* Admin Panel Modal */}
        <AdminPanelModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          categories={categories}
          onUpdateCategories={setCategories}
          settings={settings}
          onUpdateSettings={setSettings}
        />

      </div>
    </div>
  );
}
