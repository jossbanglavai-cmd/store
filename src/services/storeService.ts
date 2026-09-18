import { AppSettings, Category, Order, Review, UserProfile } from '../types';
import { FALLBACK_CATEGORIES, FALLBACK_SETTINGS } from '../data/fallbackData';

const FIREBASE_CONFIG = {
  projectId: "dshop-46653",
  apiKey: "AIzaSyAuFb9Ed8KgqxdzoT0ZZXCMYFpCzOkNfG4",
};

const USER_PROFILE_KEY = 'amar_store_user_profile';

export const DEFAULT_USER: UserProfile = {
  name: "",
  phone: "",
  email: "",
  isLoggedIn: false,
  memberId: "",
  joinDate: ""
};

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) {
      return DEFAULT_USER;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.isLoggedIn) {
      return DEFAULT_USER;
    }
    return parsed;
  } catch {
    return DEFAULT_USER;
  }
}

export function saveUserProfile(user: UserProfile): void {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error("Error saving user profile", err);
  }
}

export function logoutUser(): UserProfile {
  const guest: UserProfile = {
    name: "",
    phone: "",
    email: "",
    isLoggedIn: false,
    memberId: "",
    joinDate: ""
  };
  saveUserProfile(guest);
  return guest;
}


const DEFAULT_REVIEWS: Review[] = [
  {
    id: "rev-1",
    userName: "Rayhan Sultan",
    userPhoto: "https://i.ibb.co/dJX1rwzn/photo-1708581939764-89af474a1dff.jpg",
    productName: "Netflix",
    rating: 5,
    comment: "Honestly Amar Store এর সার্ভিস অনেক ভালো লেগেছে। Netflix একদম দ্রুত ডেলিভারি দিয়েছে এবং একাউন্ট পারফেক্টভাবে কাজ করছে।",
    status: "Approved",
    dateFormatted: "1 দিন আগে"
  },
  {
    id: "rev-2",
    userName: "Mahira Chowdhury",
    userPhoto: "https://i.ibb.co/Wv5RxRsg/photo-1650603697840-f3cfca6bcc2d.jpg",
    productName: "Netflix",
    rating: 5,
    comment: "এক কথায় দারুণ সার্ভিস! Netflix একাউন্ট খুব দ্রুত পেয়েছি এবং ব্যবহার করেও অনেক ভালো লাগছে 🌸",
    status: "Approved",
    dateFormatted: "2 দিন আগে"
  },
  {
    id: "rev-3",
    userName: "Farhan Reza",
    userPhoto: "https://i.ibb.co/rGy4z0vz/photo-1741441030950-11897c485dfc.jpg",
    productName: "Netflix",
    rating: 5,
    comment: "প্রথমবার Amar Store থেকে কিনলাম এবং এক্সপেরিয়েন্স অনেক ভালো ছিল। কয়েক মিনিটের মধ্যেই পেয়ে গেছি।",
    status: "Approved",
    dateFormatted: "3 দিন আগে"
  },
  {
    id: "rev-4",
    userName: "Nafis Tahmid",
    userPhoto: "https://i.ibb.co/MD5gXPC7/photo-1636546113525-47c298b119ef.jpg",
    productName: "Crunchyroll",
    rating: 5,
    comment: "Crunchyroll ও Netflix নেওয়ার জন্য আমার স্টোর কে অবশ্যই রেকমেন্ড করবো। খুব দ্রুত একাউন্ট পেয়েছি আর সাপোর্টও ছিল অসাধারণ!",
    status: "Approved",
    dateFormatted: "4 দিন আগে"
  },
  {
    id: "rev-5",
    userName: "Fariha Ahmed",
    userPhoto: "https://i.ibb.co/chBWkQgV/FB-IMG-1779868481911.jpg",
    productName: "WhatsApp BD",
    rating: 5,
    comment: "অর্ডার করার পর খুব কম সময়ে ডেলিভারি পেয়েছি। আমার স্টোর সত্যিই অনেক ভালো সার্ভিস দেয় 👍",
    status: "Approved",
    dateFormatted: "5 দিন আগে"
  },
  {
    id: "rev-6",
    userName: "Adnan Chowdhury",
    userPhoto: "https://i.ibb.co/LdB2tfMS/photo-1777719202738-f9face4b7d9b.jpg",
    productName: "Outlook",
    rating: 5,
    comment: "Amar Store থেকে ডিজিটাল অ্যাকাউন্ট নেওয়ার অভিজ্ঞতা দারুণ ছিল। পেমেন্ট করার কিছুক্ষণের মধ্যেই পেয়ে গেছি। সার্ভিস খুবই ফাস্ট এবং রিলায়েবল।",
    status: "Approved",
    dateFormatted: "1 সপ্তাহ আগে"
  }
];

export async function fetchLiveSettings(): Promise<AppSettings> {
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/app_config/settings`);
    if (!res.ok) return FALLBACK_SETTINGS;
    const data = await res.json();
    const fields = data.fields;
    if (!fields) return FALLBACK_SETTINGS;

    const sliderValues = fields.sliderData?.arrayValue?.values || [];
    const sliderData = sliderValues.map((v: any) => ({
      img: v.mapValue?.fields?.img?.stringValue || "",
      link: v.mapValue?.fields?.link?.stringValue || "",
    })).filter((s: any) => s.img);

    const paymentsFields = fields.payments?.mapValue?.fields || {};

    return {
      headerLogo: fields.headerLogo?.stringValue || FALLBACK_SETTINGS.headerLogo,
      noticeText: fields.noticeText?.stringValue || FALLBACK_SETTINGS.noticeText,
      favicon: fields.favicon?.stringValue || FALLBACK_SETTINGS.favicon,
      sliderData: sliderData.length > 0 ? sliderData : FALLBACK_SETTINGS.sliderData,
      payments: {
        bkash: paymentsFields.bkash?.stringValue || FALLBACK_SETTINGS.payments.bkash,
        bkashImg: paymentsFields.bkashImg?.stringValue || FALLBACK_SETTINGS.payments.bkashImg,
        nagad: paymentsFields.nagad?.stringValue === "🚫 OFF" ? "01770931981" : (paymentsFields.nagad?.stringValue || FALLBACK_SETTINGS.payments.nagad),
        nagadImg: paymentsFields.nagadImg?.stringValue || FALLBACK_SETTINGS.payments.nagadImg,
      },
      walletPayImg: fields.walletPayImg?.stringValue || FALLBACK_SETTINGS.walletPayImg,
      manualPayImg: fields.manualPayImg?.stringValue || FALLBACK_SETTINGS.manualPayImg,
      popupIcon: fields.popupIcon?.stringValue || "",
      popupUrl: fields.popupUrl?.stringValue || "",
    };
  } catch (err) {
    console.warn("Failed to fetch live settings from Firestore, using fallback", err);
    return FALLBACK_SETTINGS;
  }
}

export async function fetchLiveCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/categories`);
    if (!res.ok) return FALLBACK_CATEGORIES;
    const data = await res.json();
    const docs = data.documents || [];
    if (docs.length === 0) return FALLBACK_CATEGORIES;

    const categories: Category[] = docs.map((doc: any) => {
      const f = doc.fields || {};
      const catName = f.name?.stringValue || "Category";
      const priority = Number(f.priority?.integerValue || f.priority?.stringValue || 99);
      const productValues = f.products?.arrayValue?.values || [];

      const products = productValues.map((pv: any) => {
        const pf = pv.mapValue?.fields || {};
        const packagesValues = pf.packages?.arrayValue?.values || [];
        const packages = packagesValues.map((pkg: any) => {
          const pkf = pkg.mapValue?.fields || {};
          return {
            name: pkf.name?.stringValue || "Standard",
            price: Number(pkf.price?.integerValue || pkf.price?.stringValue || 0),
          };
        });

        return {
          name: pf.name?.stringValue || "Product",
          image: pf.image?.stringValue || "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg",
          status: (pf.status?.stringValue === 'out' ? 'out' : 'in') as 'in' | 'out',
          avgRating: pf.avgRating?.stringValue || pf.avgRating?.doubleValue || "5.0",
          delivery: pf.delivery?.stringValue || "Instant (5-15 min)",
          inputLabel: pf.inputLabel?.stringValue || "Player ID / Email",
          description: pf.description?.stringValue || "",
          packages: packages.length > 0 ? packages : [{ name: "Standard", price: 100 }],
          categoryName: catName,
        };
      });

      return {
        id: doc.name,
        name: catName,
        priority,
        products,
      };
    }).sort((a: Category, b: Category) => (a.priority || 99) - (b.priority || 99));

    return categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  } catch (err) {
    console.warn("Failed to fetch live categories from Firestore, using fallback", err);
    return FALLBACK_CATEGORIES;
  }
}

// Local state helpers for seamless user interaction
const ORDERS_KEY = 'amar_store_orders';
const BALANCE_KEY = 'amar_store_wallet_balance';

export function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      // Seed a sample order so the user sees a realistic order list
      const sample: Order[] = [
        {
          id: 'ORD-9842',
          product: 'Crunchyroll',
          package: '7 দিন 🔥',
          price: 45,
          playerInfo: 'demo_user@gmail.com',
          status: 'Success',
          method: 'bKash Direct',
          trx: '9H3JK89LP2',
          senderPhone: '01712345678',
          timeString: new Date(Date.now() - 3600000 * 4).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now() - 3600000 * 4
        }
      ];
      localStorage.setItem(ORDERS_KEY, JSON.stringify(sample));
      return sample;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: Order): void {
  try {
    const current = getLocalOrders();
    const updated = [order, ...current];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving order", err);
  }
}

export function getWalletBalance(): number {
  try {
    const raw = localStorage.getItem(BALANCE_KEY);
    if (raw === null) {
      localStorage.setItem(BALANCE_KEY, '250');
      return 250;
    }
    return Number(raw) || 0;
  } catch {
    return 250;
  }
}

export function updateWalletBalance(newBal: number): void {
  try {
    localStorage.setItem(BALANCE_KEY, String(Math.max(0, newBal)));
  } catch (err) {
    console.error("Error updating balance", err);
  }
}

// Reviews service
const REVIEWS_KEY = 'amar_store_user_reviews';

export async function fetchLiveReviews(): Promise<Review[]> {
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/reviews`);
    if (!res.ok) {
      return getStoredReviews();
    }
    const data = await res.json();
    const docs = data.documents || [];
    if (docs.length === 0) return getStoredReviews();

    const remoteReviews: Review[] = docs.map((doc: any) => {
      const f = doc.fields || {};
      const id = doc.name.split('/').pop() || Math.random().toString();
      const rating = Number(f.rating?.integerValue || f.rating?.doubleValue || 5);
      const timestamp = f.timestamp?.timestampValue || doc.createTime;
      
      let dateFormatted = "সাম্প্রতিক";
      if (timestamp) {
        const diffDays = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) dateFormatted = "আজকে";
        else if (diffDays === 1) dateFormatted = "১ দিন আগে";
        else if (diffDays < 7) dateFormatted = `${diffDays} দিন আগে`;
        else dateFormatted = `${Math.floor(diffDays / 7)} সপ্তাহ আগে`;
      }

      return {
        id,
        userName: f.userName?.stringValue || "সম্মানিত গ্রাহক",
        userPhoto: f.userPhoto?.stringValue || "",
        productName: f.productName?.stringValue || "Amar Store",
        rating,
        comment: f.comment?.stringValue || "",
        status: f.status?.stringValue || "Approved",
        timestamp,
        dateFormatted
      };
    }).filter((r: Review) => r.comment);

    // Merge with any locally added reviews by this user
    const local = getLocalAddedReviews();
    const combined = [...local, ...remoteReviews];

    // Deduplicate by id
    const seen = new Set();
    const unique = combined.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return unique.length > 0 ? unique : DEFAULT_REVIEWS;
  } catch (err) {
    console.warn("Failed to fetch live reviews from Firestore, using fallback", err);
    return getStoredReviews();
  }
}

function getStoredReviews(): Review[] {
  const local = getLocalAddedReviews();
  return [...local, ...DEFAULT_REVIEWS];
}

function getLocalAddedReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserReview(review: Review): void {
  try {
    const current = getLocalAddedReviews();
    const updated = [review, ...current];
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving review", err);
  }
}
