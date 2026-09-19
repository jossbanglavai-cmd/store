import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Copy, Check, Sparkles, Monitor, Smartphone, Code2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsiveFixModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'explanation' | 'css-code'>('explanation');

  if (!isOpen) return null;

  const fixCssCode = `/* ==========================================================
   amarstorebd.netlify.app - RESPONSIVE FIX PATCH
   Paste this into the <style> tag of your HTML to fix:
   1. Giant Banner 
   2. Oversized 3-column product cards on desktop/PC
   3. Unconstrained full-screen stretching
   ========================================================== */

/* 1. Wrap whole page into a responsive max-width container */
body {
  margin: 0;
  padding: 0;
  background-color: #f4f6f9;
  padding-bottom: 90px;
}

header, #noticeBoard, .slider-box, #dynamicHomeContent, 
#productDetailSection, #paymentChoiceSection, #addMoneySection, 
#orderSection, #profileSection {
  max-width: 1200px; /* Limits desktop stretching */
  margin-left: auto !important;
  margin-right: auto !important;
}

/* 2. Fix Giant Banner (Previously aspect-ratio: 16/9 with 92% width = 993px tall!) */
.slider-box {
  width: 92%;
  max-width: 1200px;
  margin: 16px auto;
  aspect-ratio: 16 / 7; /* Sleeker banner ratio */
  max-height: 380px;    /* HARD LIMIT: Banner will never exceed 380px */
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.slider-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* 3. Responsive Product Grid (Instead of fixed repeat(3, 1fr) everywhere) */
.product-grid {
  display: grid;
  /* Mobile default: 3 columns */
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 5px 15px;
  margin-bottom: 25px;
}

/* Tablet: 4 columns */
@media (min-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .slider-box {
    aspect-ratio: 21 / 9;
    max-height: 340px;
  }
}

/* Laptop: 5 columns */
@media (min-width: 900px) {
  .product-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 18px;
  }
}

/* Desktop / PC: 6 columns - Perfectly sized cards! */
@media (min-width: 1100px) {
  .product-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
    padding: 10px 0;
  }
}

/* 4. Product Card Styling: Cap image height so icons aren't gigantic */
.product-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(0,0,0,0.06);
  border-bottom: 3px solid var(--primary-color);
  display: flex;
  flex-direction: column;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.product-img-box {
  width: 100%;
  aspect-ratio: 1 / 1; /* Clean square icon */
  max-height: 180px;   /* Never stretches indefinitely */
  overflow: hidden;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-img-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
}

/* 5. Center Bottom Nav on Desktop */
@media (min-width: 768px) {
  .bottom-nav {
    max-width: 480px;
    left: 50% !important;
    transform: translateX(-50%);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -4px 25px rgba(0,0,0,0.15);
  }
}`;

  const copyCss = () => {
    navigator.clipboard.writeText(fixCssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#16181f] text-gray-900 dark:text-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading tracking-wide">কেন এতো বড় দেখাচ্ছিল এবং সমাধান (Responsive Diagnosis)</h2>
              <p className="text-xs text-gray-300 font-normal">amarstorebd.netlify.app এর ডেক্সটপ রেসপনসিভ সমস্যা বিশ্লেষণ</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'explanation' 
                ? 'border-black dark:border-white text-black dark:text-white font-bold' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            সমস্যা ও কারণ (Root Causes)
          </button>
          <button
            onClick={() => setActiveTab('css-code')}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'css-code' 
                ? 'border-black dark:border-white text-black dark:text-white font-bold' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Code2 className="w-4 h-4 text-blue-500" />
            সরাসরি Netlify ফিক্স CSS কোড (Copy Code)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-800 text-sm leading-relaxed">
          {activeTab === 'explanation' ? (
            <>
              {/* Point 1: Banner */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-100 text-red-600 font-bold text-base">১</div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-red-900 text-base">Eid Al-Adha ব্যানার পুরো মনিটর জুড়ে এত বড় কেন?</h3>
                    <p className="text-gray-700 text-xs sm:text-sm">
                      আপনার Netlify সাইটের CSS এ লিখা ছিল:
                    </p>
                    <code className="block bg-white p-2.5 rounded-lg border border-red-200 text-xs font-mono text-red-700 my-1">
                      .slider-box &#123; width: 92%; aspect-ratio: 16 / 9; &#125;
                    </code>
                    <p className="text-gray-700 text-xs sm:text-sm">
                      <strong>কারণ:</strong> কোনো <code className="text-red-600 bg-red-100 px-1 py-0.5 rounded">max-width</code> বা <code className="text-red-600 bg-red-100 px-1 py-0.5 rounded">max-height</code> ছিল না! 
                      ডেক্সটপে স্ক্রিন থাকে ১৯২০ পিক্সেল। ১৯২০ পিক্সেলের ৯২% মানে ১৭৬৬ পিক্সেল চওড়া, আর ১৬:৯ অনুপাতে এর উচ্চতা দাঁড়ায় <strong>৯৯৩ পিক্সেল!</strong> 
                      যার ফলে ব্যানার একাই পুরো ল্যাপটপ/মনিটরের স্ক্রিন দখল করে ফেলছিল।
                    </p>
                  </div>
                </div>
              </div>

              {/* Point 2: 3-column Grid */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 font-bold text-base">২</div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-amber-900 text-base">Crunchyroll, WhatsApp, Outlook কার্ডগুলো দৈত্যের মতো বড় কেন?</h3>
                    <p className="text-gray-700 text-xs sm:text-sm">
                      আপনার সাইটে প্রোডাক্ট গ্রিড ফিক্সড করা ছিল:
                    </p>
                    <code className="block bg-white p-2.5 rounded-lg border border-amber-200 text-xs font-mono text-amber-800 my-1">
                      .product-grid &#123; grid-template-columns: repeat(3, 1fr); &#125;<br />
                      .product-img-box &#123; width: 100%; aspect-ratio: 1 / 1.2; &#125;
                    </code>
                    <p className="text-gray-700 text-xs sm:text-sm">
                      <strong>কারণ:</strong> কোনো রেসপনসিভ মিডিয়া কোয়েরি (<code className="bg-amber-100 px-1 py-0.5 rounded">@media</code>) ছিল না। মোবাইলে ৩ কলাম হয়তো ছোট দেখায়, কিন্তু ১৯২০ পিক্সেলের মনিটরে ৩ কলাম মানে প্রতিটি প্রোডাক্টের কার্ড চওড়ায় প্রায় <strong>৬০০ পিক্সেল</strong> এবং উচ্চতায় <strong>৭২০ পিক্সেল</strong> হয়ে যাচ্ছিল!
                    </p>
                  </div>
                </div>
              </div>

              {/* Point 3: Solution */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-base">৩</div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-emerald-900 text-base">আমরা এই অ্যাপটিতে কীভাবে সমাধান করেছি?</h3>
                    <ul className="text-gray-700 text-xs sm:text-sm list-disc list-inside space-y-1 mt-1">
                      <li><strong>ম্যাক্স উইথ কন্টেইনার:</strong> পুরো ওয়েবসাইটকে <code className="bg-emerald-100 px-1 rounded">max-w-6xl mx-auto</code> দিয়ে কেন্দ্রে রাখা হয়েছে, যাতে আল্ট্রা-ওয়াইড ডিসপ্লেতেও সুন্দর দেখায়।</li>
                      <li><strong>ব্যানার হাইট লক:</strong> ব্যানারের সর্বোচ্চ উচ্চতা ৩৪০–৩৮০ পিক্সেলে লক করা হয়েছে এবং কভার ফিট দেওয়া হয়েছে।</li>
                      <li><strong>অ্যাডাপ্টিভ গ্রিড:</strong> মোবাইলে ৩ কলাম, ট্যাবলেটে ৪ কলাম এবং ডেক্সটপ স্ক্রিনে সুন্দর ৬ কলামে প্রোডাক্ট সাজানো হয়েছে।</li>
                      <li><strong>কার্ড সাইজ ব্যালেন্স:</strong> প্রতিটি কার্ডের আইকনকে সুন্দর প্যাডিং ও স্কেলিং দেওয়া হয়েছে।</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-500">আপনার Netlify কোডে পেস্ট করার জন্য CSS কোড দরকার?</span>
                <button
                  onClick={() => setActiveTab('css-code')}
                  className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition flex items-center gap-2"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  CSS কোড দেখুন ও কপি করুন
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  নিচের CSS কোডটি কপি করে আপনার মূল HTML ফাইলের <code className="text-blue-600 font-mono">&lt;style&gt;...&lt;/style&gt;</code> এর একদম শেষে পেস্ট করে দিলেই আপনার Netlify সাইটও পুরো রেসপনসিভ হয়ে যাবে:
                </p>
                <button
                  onClick={copyCss}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      কপি হয়েছে!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy CSS
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-neutral-900 text-gray-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[360px] leading-5 selection:bg-amber-500 selection:text-black">
                  {fixCssCode}
                </pre>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>টিপস:</strong> আপনি সরাসরি এই বর্তমান AI Studio অ্যাপটিও লাইভ চালাতে পারেন। এতে অলরেডি সব ডাটা, বিকাশ/নগদ পেমেন্ট এবং আধুনিক রেসপনসিভ ইন্টারফেস নিখুঁতভাবে বিল্ট-ইন রয়েছে।
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition"
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
