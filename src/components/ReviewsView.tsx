import React, { useState, useMemo, useEffect } from 'react';
import { 
  Star, 
  Sparkles, 
  MessageSquare, 
  ThumbsUp, 
  ShieldCheck, 
  Plus, 
  X, 
  Check, 
  Filter, 
  ArrowLeft, 
  UserCheck, 
  LogIn, 
  Clock, 
  User,
  AlertCircle
} from 'lucide-react';
import { Review, UserProfile } from '../types';
import { getLocalAddedReviews, fetchLiveHelpfulCounts, updateLiveHelpfulCount } from '../services/storeService';

interface Props {
  reviews: Review[];
  onAddReview: (review: Review) => void;
  onBackToHome: () => void;
  productNames: string[];
  user?: UserProfile;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
}

function toBanglaNum(num: number): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => banglaDigits[Number(d)]);
}

export const ReviewsView: React.FC<Props> = ({
  reviews,
  onAddReview,
  onBackToHome,
  productNames,
  user,
  onOpenAuthModal,
}) => {
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  
  // Persistent user voted state (which reviews this device/user has liked)
  const [helpfulMap, setHelpfulMap] = useState<Record<string, boolean>>(() => {
    try {
      // Clear out old fake count data if present in localStorage
      localStorage.removeItem('amar_store_helpful_counts');
      const stored = localStorage.getItem('amar_store_user_helpful_votes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Real helpful counts per review ID (starts at 0 unless voted)
  const [helpfulCountsMap, setHelpfulCountsMap] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('amar_store_real_helpful_counts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Fetch live global helpful counts from Firestore on mount
  useEffect(() => {
    fetchLiveHelpfulCounts().then(liveCounts => {
      if (liveCounts && Object.keys(liveCounts).length > 0) {
        setHelpfulCountsMap(prev => ({
          ...prev,
          ...liveCounts
        }));
      }
    });
  }, []);

  // Write review form state
  const [productName, setProductName] = useState(productNames[0] || 'Netflix');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Filter public approved reviews only (Pending reviews require Admin Approval)
  const approvedReviews = reviews.filter(
    r => r.status === 'Approved' || r.status === 'approved'
  );

  const totalReviews = approvedReviews.length;
  const avgRating = totalReviews > 0 
    ? (approvedReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "5.0";

  const fiveStarCount = approvedReviews.filter(r => r.rating === 5).length;
  const fourStarCount = approvedReviews.filter(r => r.rating === 4).length;

  const filteredReviews = approvedReviews.filter(r => {
    if (filterRating === 'all') return true;
    return r.rating === filterRating;
  });

  // Set of product names the current user has already reviewed (1 review per product rule)
  const userReviewedProducts = useMemo(() => {
    if (!user || !user.isLoggedIn) return new Set<string>();
    const userEmail = (user.email || '').toLowerCase().trim();
    const userMemberId = (user.memberId || '').trim();

    if (!userEmail && !userMemberId) return new Set<string>();

    const localList = getLocalAddedReviews();
    const allCombined = [...reviews, ...localList];

    const reviewed = new Set<string>();
    allCombined.forEach(r => {
      // Ignore default system reviews that don't belong to a registered account
      if (!r.userEmail && !r.memberId) return;

      const rEmail = (r.userEmail || '').toLowerCase().trim();
      const rMemberId = (r.memberId || '').trim();

      const isMatch = 
        (userEmail && rEmail && rEmail === userEmail) ||
        (userMemberId && rMemberId && rMemberId === userMemberId);

      if (isMatch && r.productName) {
        reviewed.add(r.productName.trim().toLowerCase());
      }
    });

    return reviewed;
  }, [user, reviews]);

  const availableProducts = useMemo(() => {
    return productNames.filter(p => !userReviewedProducts.has(p.trim().toLowerCase()));
  }, [productNames, userReviewedProducts]);

  const isCurrentProductReviewed = userReviewedProducts.has(productName.trim().toLowerCase());
  const allProductsReviewed = productNames.length > 0 && availableProducts.length === 0;

  const getHelpfulCount = (review: Review) => {
    return helpfulCountsMap[review.id] || 0;
  };

  const handleHelpful = (id: string, review: Review) => {
    const isCurrentlyHelpful = !!helpfulMap[id];
    const currentCount = getHelpfulCount(review);
    const newCount = isCurrentlyHelpful 
      ? Math.max(0, currentCount - 1) 
      : currentCount + 1;
    
    const newHelpfulMap = {
      ...helpfulMap,
      [id]: !isCurrentlyHelpful
    };

    const newCountsMap = {
      ...helpfulCountsMap,
      [id]: newCount
    };

    setHelpfulMap(newHelpfulMap);
    setHelpfulCountsMap(newCountsMap);

    // Save user's local vote state
    try {
      localStorage.setItem('amar_store_user_helpful_votes', JSON.stringify(newHelpfulMap));
      localStorage.setItem('amar_store_real_helpful_counts', JSON.stringify(newCountsMap));
    } catch (e) {
      console.warn("Could not save helpful votes to localStorage", e);
    }

    // Synchronize global count to Firestore so all users see the update
    updateLiveHelpfulCount(id, newCount, helpfulCountsMap);
  };

  const handleOpenWriteReview = () => {
    if (!user || !user.isLoggedIn) {
      if (onOpenAuthModal) {
        onOpenAuthModal('login');
      }
      return;
    }
    const nextProduct = availableProducts[0] || productNames[0] || 'Netflix';
    setProductName(nextProduct);
    setDuplicateError(null);
    setComment('');
    setRating(5);
    setIsWriteModalOpen(true);
  };

  const handleWriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.isLoggedIn) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }

    // Check 1 review per product constraint
    if (userReviewedProducts.has(productName.trim().toLowerCase())) {
      setDuplicateError(`আপনি ইতিমধ্যে "${productName}" পণ্যে রিভিউ জমা দিয়েছেন! প্রতিটি পণ্যে ১টি রিভিউ প্রযোজ্য।`);
      return;
    }

    // Auto-bind logged in profile name without needing manual input
    const finalName = user.name.trim() || user.email.split('@')[0];
    if (!finalName || !comment.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Review is saved with 'Pending' status (admin approval required)
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        userName: finalName,
        userEmail: user.email,
        memberId: user.memberId,
        userPhoto: user.photoUrl || "",
        productName: productName.trim(),
        rating,
        comment: comment.trim(),
        status: 'Pending', // Pending admin approval
        dateFormatted: 'এইমাত্র'
      };

      onAddReview(newReview);
      setIsSubmitting(false);
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsWriteModalOpen(false);
        setComment('');
      }, 2000);
    }, 600);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-gray-900 dark:text-white">
              গ্রাহকদের রিভিউ ও রেটিং (Customer Reviews)
            </h2>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Verified
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Amar Store থেকে পণ্য ক্রয় করা সম্মানিত গ্রাহকদের ১০০% বাস্তব মতামত
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenWriteReview}
            className="px-4 py-2 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-gray-200 text-white dark:text-black text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {user?.isLoggedIn ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>রিভিউ লিখুন</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>রিভিউ দিতে লগইন করুন</span>
              </>
            )}
          </button>
          <button
            onClick={onBackToHome}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            দোকান
          </button>
        </div>
      </div>

      {/* Review Score Summary Banner */}
      <div className="bg-white dark:bg-[#16181f] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        
        {/* Left: Big Score */}
        <div className="text-center md:border-r border-gray-200 dark:border-gray-800 md:pr-4 flex flex-col items-center justify-center">
          <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white font-heading tracking-tight">
            {avgRating}
          </div>
          <div className="flex items-center gap-1 my-1.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            সর্বমোট {totalReviews} টি ভেরিফাইড রিভিউ এর ভিত্তিতে
          </div>
        </div>

        {/* Middle: Rating Distribution bars */}
        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="w-12 font-medium">৫ স্টার</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full" 
                style={{ width: `${totalReviews > 0 ? (fiveStarCount / totalReviews) * 100 : 90}%` }} 
              />
            </div>
            <span className="w-8 text-right font-semibold">{fiveStarCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-12 font-medium">৪ স্টার</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full" 
                style={{ width: `${totalReviews > 0 ? (fourStarCount / totalReviews) * 100 : 10}%` }} 
              />
            </div>
            <span className="w-8 text-right font-semibold">{fourStarCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-12 font-medium">৩ স্টার</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: '0%' }} />
            </div>
            <span className="w-8 text-right font-semibold">0</span>
          </div>
        </div>

        {/* Right: Satisfaction highlight */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/60 flex flex-col justify-center text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-1">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>৯৯.৮% গ্রাহক সন্তুষ্টি</span>
          </div>
          <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
            দ্রুততম ডেলিভারি, জেনুইন সাবস্ক্রিপশন এবং সার্বক্ষণিক কাস্টমার কেয়ার নিশ্চিত করে Amar Store।
          </p>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1 pl-1 pr-2">
          <Filter className="w-3.5 h-3.5" />
          ফিল্টার:
        </span>
        <button
          onClick={() => setFilterRating('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            filterRating === 'all'
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs font-bold'
              : 'bg-white dark:bg-[#16181f] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          সব রিভিউ
        </button>
        <button
          onClick={() => setFilterRating(5)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
            filterRating === 5
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs font-bold'
              : 'bg-white dark:bg-[#16181f] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <span>৫ স্টার</span>
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>({fiveStarCount})</span>
        </button>
        <button
          onClick={() => setFilterRating(4)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
            filterRating === 4
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs font-bold'
              : 'bg-white dark:bg-[#16181f] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <span>৪ স্টার</span>
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>({fourStarCount})</span>
        </button>
      </div>

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredReviews.map((review) => {
          const isHelpful = !!helpfulMap[review.id];
          const count = getHelpfulCount(review);
          const countDisplay = toBanglaNum(count);
          return (
            <div
              key={review.id}
              className="bg-white dark:bg-[#16181f] rounded-2xl border border-gray-200/90 dark:border-gray-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* User Info Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {review.userPhoto ? (
                      <img
                        src={review.userPhoto}
                        alt={review.userName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center font-bold text-sm">
                        {review.userName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>{review.userName}</span>
                        <span title="Verified Customer" className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-50 dark:fill-blue-950" />
                          <span>ভেরিফাইড</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Badge */}
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[110px]">
                    {review.productName}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                    {review.rating}.0
                  </span>
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                  "{review.comment}"
                </p>
              </div>

              {/* Bottom Helpful button */}
              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  ভেরিফাইড পারচেজ
                </span>
                <button
                  onClick={() => handleHelpful(review.id, review)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                    isHelpful
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800 shadow-2xs'
                      : 'bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700/60'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isHelpful ? 'fill-blue-600 dark:fill-blue-400' : ''}`} />
                  <span>{count > 0 ? `সহায়ক (${countDisplay})` : 'সহায়ক'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#16181f] text-gray-900 dark:text-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col">
            
            {/* Header */}
            <div className="bg-neutral-900 dark:bg-black text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading">আপনার রিভিউ দিন (Write Review)</h3>
                  <p className="text-xs text-neutral-400">আপনার মতামত অন্য গ্রাহকদের সাহায্য করবে</p>
                </div>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form / Content */}
            {allProductsReviewed ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">সকল পণ্যের রিভিউ সম্পন্ন হয়েছে!</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                    আপনি ইতিমধ্যে প্রতিটি পণ্যের জন্য রিভিউ প্রদান করেছেন। একজন গ্রাহক প্রতিটি পণ্যে ১টি রিভিউ দিতে পারেন। আপনার ইতিবাচক সাপোর্টের জন্য আন্তরিক ধন্যবাদ!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-6 py-2.5 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-xl text-xs font-bold uppercase cursor-pointer transition"
                >
                  বন্ধ করুন
                </button>
              </div>
            ) : (
              <form onSubmit={handleWriteSubmit} className="p-5 space-y-4 text-sm">
                
                {successNotice && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-bold text-xs">আপনার রিভিউটি সফলভাবে জমা হয়েছে, ধন্যবাদ!</span>
                  </div>
                )}

                {duplicateError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{duplicateError}</span>
                  </div>
                )}

                {/* Auto-Bound User Profile Info */}
                {user?.isLoggedIn && (
                  <div className="bg-neutral-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.name.slice(0, 2) || "AS"}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>{user.name}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        ভেরিফাইড গ্রাহক
                      </div>
                    </div>
                  </div>
                )}

                {/* Star Rating selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                    রেটিং নির্বাচন করুন (Rating)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-200 dark:fill-gray-700 text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200 ml-2">
                      {rating} স্টার
                    </span>
                  </div>
                </div>

                {/* Product select */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                    কোন পণ্যের রিভিউ (Product)
                  </label>
                  <select
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      setDuplicateError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white outline-hidden text-sm bg-white dark:bg-[#16181f] text-gray-900 dark:text-white"
                  >
                    {productNames.map((name, i) => {
                      const isAlready = userReviewedProducts.has(name.trim().toLowerCase());
                      return (
                        <option key={i} value={name} disabled={isAlready}>
                          {name} {isAlready ? '(ইতিমধ্যে রিভিউ দেওয়া হয়েছে)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {isCurrentProductReviewed && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1">
                      * আপনি ইতিমধ্যে এই পণ্যে রিভিউ দিয়েছেন। অন্য পণ্য নির্বাচন করুন।
                    </p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                    আপনার অভিজ্ঞতা ও মন্তব্য (Comment)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="ডেলিভারি স্পিড কেমন লেগেছে, সার্ভিস কেমন পেয়েছেন লিখুন..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white outline-hidden text-sm resize-none bg-white dark:bg-[#16181f] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || successNotice || isCurrentProductReviewed}
                  className="w-full py-3 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'জমা হচ্ছে...' : 'রিভিউ সাবমিট করুন'}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
