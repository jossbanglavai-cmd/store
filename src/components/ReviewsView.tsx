import React, { useState } from 'react';
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
  LogIn
} from 'lucide-react';
import { Review, UserProfile } from '../types';

interface Props {
  reviews: Review[];
  onAddReview: (review: Review) => void;
  onBackToHome: () => void;
  productNames: string[];
  user?: UserProfile;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
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
  const [helpfulMap, setHelpfulMap] = useState<Record<string, boolean>>({});

  // Write review form state
  const [userName, setUserName] = useState(user?.isLoggedIn ? user.name : '');
  const [productName, setProductName] = useState(productNames[0] || 'Netflix');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "5.0";

  const fiveStarCount = reviews.filter(r => r.rating === 5).length;
  const fourStarCount = reviews.filter(r => r.rating === 4).length;

  const filteredReviews = reviews.filter(r => {
    if (filterRating === 'all') return true;
    return r.rating === filterRating;
  });

  const handleHelpful = (id: string) => {
    setHelpfulMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenWriteReview = () => {
    if (!user || !user.isLoggedIn) {
      if (onOpenAuthModal) {
        onOpenAuthModal('login');
      }
      return;
    }
    setUserName(user.name || user.email.split('@')[0]);
    setIsWriteModalOpen(true);
  };

  const handleWriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.isLoggedIn) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }

    const finalName = (userName.trim() || user.name || user.email.split('@')[0]);
    if (!finalName || !comment.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        userName: finalName,
        userPhoto: "",
        productName,
        rating,
        comment: comment.trim(),
        status: 'Approved',
        dateFormatted: 'এইমাত্র'
      };

      onAddReview(newReview);
      setIsSubmitting(false);
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsWriteModalOpen(false);
        setComment('');
      }, 1500);
    }, 600);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-gray-900">
              গ্রাহকদের রিভিউ ও রেটিং (Customer Reviews)
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Amar Store থেকে পণ্য ক্রয় করা সম্মানিত গ্রাহকদের ১০০% বাস্তব মতামত
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenWriteReview}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {user?.isLoggedIn ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>রিভিউ লিখুন</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>রিভিউ দিতে লগইন করুন</span>
              </>
            )}
          </button>
          <button
            onClick={onBackToHome}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            দোকান
          </button>
        </div>
      </div>

      {/* Review Score Summary Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        
        {/* Left: Big Score */}
        <div className="text-center md:border-r border-gray-200 md:pr-4 flex flex-col items-center justify-center">
          <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 font-heading tracking-tight">
            {avgRating}
          </div>
          <div className="flex items-center gap-1 my-1.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            সর্বমোট {totalReviews} টি ভেরিফাইড রিভিউ এর ভিত্তিতে
          </div>
        </div>

        {/* Middle: Rating Distribution bars */}
        <div className="space-y-1.5 text-xs text-gray-600 md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="w-12 font-medium">৫ স্টার</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full" 
                style={{ width: `${totalReviews > 0 ? (fiveStarCount / totalReviews) * 100 : 90}%` }} 
              />
            </div>
            <span className="w-8 text-right font-semibold">{fiveStarCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-12 font-medium">৪ স্টার</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full" 
                style={{ width: `${totalReviews > 0 ? (fourStarCount / totalReviews) * 100 : 10}%` }} 
              />
            </div>
            <span className="w-8 text-right font-semibold">{fourStarCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-12 font-medium">৩ স্টার</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: '0%' }} />
            </div>
            <span className="w-8 text-right font-semibold">0</span>
          </div>
        </div>

        {/* Right: Satisfaction highlight */}
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-center text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-800 font-bold text-sm mb-1">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>৯৯.৮% গ্রাহক সন্তুষ্টি</span>
          </div>
          <p className="text-xs text-emerald-700/90 leading-relaxed">
            দ্রুততম ডেলিভারি, জেনুইন সাবস্ক্রিপশন এবং সার্বক্ষণিক কাস্টমার কেয়ার নিশ্চিত করে Amar Store।
          </p>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-gray-500 font-semibold flex items-center gap-1 pl-1 pr-2">
          <Filter className="w-3.5 h-3.5" />
          ফিল্টার:
        </span>
        <button
          onClick={() => setFilterRating('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            filterRating === 'all'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          সব রিভিউ ({totalReviews})
        </button>
        <button
          onClick={() => setFilterRating(5)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
            filterRating === 5
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
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
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
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
          const isHelpful = helpfulMap[review.id];
          return (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* User Info Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {review.userPhoto ? (
                      <img
                        src={review.userPhoto}
                        alt={review.userName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                        {review.userName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <span>{review.userName}</span>
                        <span title="Verified Customer">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {review.dateFormatted || 'সাম্প্রতিক'}
                      </div>
                    </div>
                  </div>

                  {/* Product Badge */}
                  <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[110px]">
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
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-1">
                    {review.rating}.0
                  </span>
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
                  "{review.comment}"
                </p>
              </div>

              {/* Bottom Helpful button */}
              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  ভেরিফাইড পারচেজ
                </span>
                <button
                  onClick={() => handleHelpful(review.id)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition ${
                    isHelpful
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isHelpful ? 'fill-blue-600' : ''}`} />
                  <span>{isHelpful ? 'সহায়ক (১)' : 'সহায়ক'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            
            {/* Header */}
            <div className="bg-neutral-900 text-white p-4 sm:p-5 flex items-center justify-between">
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

            {/* Form */}
            <form onSubmit={handleWriteSubmit} className="p-5 space-y-4 text-sm">
              
              {successNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>ধন্যবাদ! আপনার মূল্যবান রিভিউটি সফলভাবে গ্রহণ করা হয়েছে।</span>
                </div>
              )}

              {/* Star Rating selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  রেটিং নির্বাচন করুন (Rating)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-gray-200 text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-gray-800 ml-2">
                    {rating} স্টার
                  </span>
                </div>
              </div>

              {/* User name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  আপনার নাম (Your Name)
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. তানভীর হাসান"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-hidden text-sm"
                />
              </div>

              {/* Product select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  কোন পণ্যের রিভিউ (Product)
                </label>
                <select
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-hidden text-sm bg-white"
                >
                  {productNames.map((name, i) => (
                    <option key={i} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  আপনার অভিজ্ঞতা ও মন্তব্য (Comment)
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="ডেলিভারি স্পিড কেমন লেগেছে, সার্ভিস কেমন পেয়েছেন লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-hidden text-sm resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || successNotice}
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'জমা হচ্ছে...' : 'রিভিউ পাবলিশ করুন'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
