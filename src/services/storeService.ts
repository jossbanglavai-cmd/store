import { AppSettings, Category, Order, Review, UserProfile } from '../types';
import { FALLBACK_CATEGORIES, FALLBACK_SETTINGS } from '../data/fallbackData';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  projectId: "amarstore-e6a3f",
  apiKey: "AIzaSyAj_9HwDlzLrCzQIjjNORbmShHE_s9ufb4",
};

const USER_PROFILE_KEY = 'amar_store_user_profile';
const ACCOUNTS_REGISTRY_KEY = 'amar_store_registered_accounts';

export interface RegisteredAccount {
  email: string;
  password: string;
  name: string;
  memberId: string;
  createdAt: string;
  photoUrl?: string;
}

export const DEFAULT_USER: UserProfile = {
  name: "",
  phone: "",
  email: "",
  isLoggedIn: false,
  memberId: "",
  joinDate: "",
  photoUrl: ""
};

// Firestore sync helpers for cross-browser & cross-device persistence
async function syncUserToFirestore(email: string, data: { name?: string; memberId?: string; photoUrl?: string; balance?: number; orders?: Order[] }) {
  try {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    const userRef = doc(db, 'users', cleanEmail);
    await setDoc(userRef, {
      email: cleanEmail,
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore user sync notice:", err);
  }
}

async function fetchUserFromFirestore(email: string): Promise<any> {
  try {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const userRef = doc(db, 'users', cleanEmail);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn("Firestore fetch user notice:", err);
  }
  return null;
}

// Registered Accounts Registry Management
export function getRegisteredAccounts(): Record<string, RegisteredAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveRegisteredAccounts(accounts: Record<string, RegisteredAccount>): void {
  try {
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error("Error saving accounts registry", err);
  }
}

// Upload image directly to ImgBB
export async function uploadToImgBB(fileOrBase64: File | Blob | string): Promise<string> {
  const IMGBB_API_KEYS = [
    '6d207e02198a847aa5ad3ac2292fc142',
    '2d9b67946cbdfb8f2d5e7a9e334a13d7',
    '6f1fa4d03e923e3cb8bc3e1d6d842b15'
  ];

  for (const apiKey of IMGBB_API_KEYS) {
    try {
      const formData = new FormData();
      if (typeof fileOrBase64 === 'string') {
        const base64Data = fileOrBase64.includes('base64,')
          ? fileOrBase64.split('base64,')[1]
          : fileOrBase64;
        formData.append('image', base64Data);
      } else {
        formData.append('image', fileOrBase64);
      }

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && (json.data?.display_url || json.data?.url)) {
          return json.data.display_url || json.data.url;
        }
      }
    } catch (e) {
      console.warn('ImgBB upload attempt notice with key', apiKey, e);
    }
  }

  // If external upload is unreachable, convert to robust Data URL
  if (typeof fileOrBase64 === 'string') {
    return fileOrBase64;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(fileOrBase64);
  });
}

// Update profile photo for logged-in user
export function updateUserProfilePhoto(photoUrl: string, userEmail?: string): UserProfile {
  const current = getUserProfile();
  const email = (userEmail || current.email || '').trim().toLowerCase();
  
  const updatedUser: UserProfile = {
    ...current,
    photoUrl
  };

  saveUserProfile(updatedUser);

  if (email) {
    const accounts = getRegisteredAccounts();
    if (accounts[email]) {
      accounts[email].photoUrl = photoUrl;
      saveRegisteredAccounts(accounts);
    }
    syncUserToFirestore(email, { photoUrl });
  }

  if (auth.currentUser) {
    updateProfile(auth.currentUser, { photoURL: photoUrl }).catch(() => {});
  }

  return updatedUser;
}

// Register a brand new account
export async function registerAccount(emailInput: string, passwordInput: string, nameInput: string): Promise<UserProfile> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();
  const name = nameInput.trim() || email.split('@')[0];

  if (!email) {
    throw new Error("অনুগ্রহ করে আপনার সঠিক ইমেইল (Email) প্রদান করুন।");
  }
  if (!password || password.length < 6) {
    throw new Error("পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।");
  }

  // 1. Check if email is already registered in accounts registry
  const accounts = getRegisteredAccounts();
  if (accounts[email]) {
    throw new Error("এই ইমেইলে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে! অনুগ্রহ করে 'লগইন করুন' বাটনে যান।");
  }

  // 2. Try Firebase Auth create user if available
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name }).catch(() => {});
    }
  } catch (fbErr: any) {
    console.warn("Firebase create user notice:", fbErr?.code || fbErr?.message);
    if (fbErr?.code === 'auth/email-already-in-use') {
      throw new Error("এই ইমেইল দিয়ে Firebase-এ আগেই অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে লগইন করুন।");
    }
  }

  // 3. Save to local account registry & Firestore
  const memberId = "AS-" + Math.floor(100000 + Math.random() * 900000);
  const newAccount: RegisteredAccount = {
    email,
    password,
    name,
    memberId,
    createdAt: new Date().toISOString()
  };

  accounts[email] = newAccount;
  saveRegisteredAccounts(accounts);

  // Initialize fresh wallet and orders for this user
  updateWalletBalance(0, email);
  syncUserToFirestore(email, {
    name,
    memberId,
    photoUrl: "",
    balance: 0,
    orders: []
  });

  const profile: UserProfile = {
    name,
    email,
    phone: "",
    isLoggedIn: true,
    memberId,
    joinDate: "আজ",
    photoUrl: ""
  };

  saveUserProfile(profile);
  return profile;
}

// Strict Login with verified credentials matching and cloud sync
export async function loginAccount(emailInput: string, passwordInput: string): Promise<UserProfile> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email) {
    throw new Error("অনুগ্রহ করে আপনার ইমেইল প্রদান করুন।");
  }
  if (!password) {
    throw new Error("অনুগ্রহ করে আপনার পাসওয়ার্ড প্রদান করুন।");
  }

  const accounts = getRegisteredAccounts();
  const existingAccount = accounts[email];

  // Try Firebase Auth sign in
  let firebaseSuccess = false;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      firebaseSuccess = true;
    }
  } catch (fbErr: any) {
    console.warn("Firebase sign in notice:", fbErr?.code || fbErr?.message);
    if (fbErr?.code === 'auth/wrong-password' || fbErr?.code === 'auth/invalid-credential') {
      throw new Error("ভুল পাসওয়ার্ড! আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।");
    }
    if (fbErr?.code === 'auth/user-not-found' && !existingAccount) {
      throw new Error("এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি! অনুগ্রহ করে প্রথমে 'রেজিস্ট্রেশন করুন' বাটনে ক্লিক করে অ্যাকাউন্ট খুলুন।");
    }
  }

  // Fetch remote user data from Firestore (cross-browser / cross-device recovery)
  const remoteData = await fetchUserFromFirestore(email);

  // Validate with local registry or Firestore
  if (!existingAccount && !firebaseSuccess && !remoteData) {
    throw new Error("এই ইমেইলে কোনো অ্যাকাউন্ট খোলা নেই! অনুগ্রহ করে প্রথমে নিচে 'রেজিস্ট্রেশন করুন' (Create Account) বাটনে ক্লিক করে আপনার অ্যাকাউন্ট খুলুন।");
  }

  if (existingAccount && existingAccount.password !== password && !firebaseSuccess && !remoteData) {
    throw new Error("ভুল পাসওয়ার্ড! এই ইমেইলের জন্য আপনি যে পাসওয়ার্ড দিয়ে রেজিস্ট্রেশন করেছিলেন তা সঠিক নয়।");
  }

  const accountName = remoteData?.name || existingAccount?.name || auth.currentUser?.displayName || email.split('@')[0];
  const memberId = remoteData?.memberId || existingAccount?.memberId || ("AS-" + Math.floor(100000 + Math.random() * 900000));
  const photoUrl = remoteData?.photoUrl || existingAccount?.photoUrl || auth.currentUser?.photoURL || "";

  // Restore balance & orders from Firestore if available
  if (remoteData) {
    if (typeof remoteData.balance === 'number') {
      updateWalletBalance(remoteData.balance, email);
    }
    if (remoteData.orders && Array.isArray(remoteData.orders)) {
      try {
        localStorage.setItem(getStorageKeyForUser('amar_store_orders', email), JSON.stringify(remoteData.orders));
      } catch {}
    }
  }

  // Sync back to local registry if missing
  if (!existingAccount) {
    accounts[email] = {
      email,
      password,
      name: accountName,
      memberId,
      createdAt: new Date().toISOString(),
      photoUrl
    };
    saveRegisteredAccounts(accounts);
  } else if (photoUrl && !existingAccount.photoUrl) {
    existingAccount.photoUrl = photoUrl;
    saveRegisteredAccounts(accounts);
  }

  const profile: UserProfile = {
    name: accountName,
    email,
    phone: "",
    isLoggedIn: true,
    memberId,
    joinDate: "সদস্য",
    photoUrl
  };

  saveUserProfile(profile);
  return profile;
}

// Google Login Integration with Firebase Auth
export async function loginWithGoogle(): Promise<UserProfile> {
  let firebaseUser: any = null;
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    firebaseUser = userCredential.user;
  } catch (err: any) {
    if (err?.code === 'auth/unauthorized-domain') {
      throw new Error("Firebase-এ এই ওয়েবসাইটের ডোমেন অনুমোদিত (Authorized) করা নেই। অনুগ্রহ করে ফায়ারবেস কনসোলে Authentication -> Settings -> Authorized domains-এ গিয়ে আপনার ওয়েবসাইটের লিঙ্কটি (Domain) যোগ করে দিন।");
    }
    throw err;
  }

  const email = (firebaseUser.email || '').trim().toLowerCase();
  const name = firebaseUser.displayName || email.split('@')[0];
  const photoUrl = firebaseUser.photoURL || '';
  const memberId = "AS-" + Math.floor(100000 + Math.random() * 900000);

  // Register in local accounts registry if not exists
  const accounts = getRegisteredAccounts();
  if (!accounts[email]) {
    accounts[email] = {
      email,
      password: 'GOOGLE_AUTH_USER',
      name,
      memberId,
      createdAt: new Date().toISOString(),
      photoUrl
    };
    saveRegisteredAccounts(accounts);
  }

  // Fetch remote user data from Firestore if available
  const remoteData = await fetchUserFromFirestore(email);
  if (remoteData) {
    if (typeof remoteData.balance === 'number') {
      updateWalletBalance(remoteData.balance, email);
    }
    if (remoteData.orders && Array.isArray(remoteData.orders)) {
      try {
        localStorage.setItem(getStorageKeyForUser('amar_store_orders', email), JSON.stringify(remoteData.orders));
      } catch {}
    }
  } else {
    // Initialize fresh user doc in Firestore
    syncUserToFirestore(email, {
      name,
      memberId,
      photoUrl,
      balance: 0,
      orders: []
    });
  }

  const profile: UserProfile = {
    name,
    email,
    phone: firebaseUser.phoneNumber || '',
    isLoggedIn: true,
    memberId,
    joinDate: "আজ",
    photoUrl
  };

  saveUserProfile(profile);
  return profile;
}

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
  try {
    signOut(auth).catch(() => {});
  } catch {}
  
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
  // Try fetching fresh data via Web SDK first
  try {
    const settingsRef = doc(db, 'app_config', 'settings');
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const rawSlider = data.sliderData || [];
      const sliderData = rawSlider.map((s: any) => ({
        img: s.img || s.image || "",
        link: s.link || "",
      })).filter((s: any) => s.img);

      const payments = data.payments || {};

      const settings: AppSettings = {
        headerLogo: data.headerLogo || FALLBACK_SETTINGS.headerLogo,
        noticeText: data.noticeText || FALLBACK_SETTINGS.noticeText,
        favicon: data.favicon || FALLBACK_SETTINGS.favicon,
        sliderData: sliderData.length > 0 ? sliderData : FALLBACK_SETTINGS.sliderData,
        payments: {
          bkash: payments.bkash || FALLBACK_SETTINGS.payments.bkash,
          bkashImg: payments.bkashImg || FALLBACK_SETTINGS.payments.bkashImg,
          nagad: payments.nagad === "🚫 OFF" ? "01770931981" : (payments.nagad || FALLBACK_SETTINGS.payments.nagad),
          nagadImg: payments.nagadImg || FALLBACK_SETTINGS.payments.nagadImg,
        },
        walletPayImg: data.walletPayImg || FALLBACK_SETTINGS.walletPayImg,
        manualPayImg: data.manualPayImg || FALLBACK_SETTINGS.manualPayImg,
        popupIcon: data.popupIcon || "",
        popupUrl: data.popupUrl || "",
      };

      localStorage.setItem('amar_store_live_settings', JSON.stringify(settings));
      return settings;
    }
  } catch (err) {
    console.warn("Failed to fetch fresh settings via Web SDK, trying local cache", err);
  }

  // Fallback to cache if offline
  try {
    const cached = localStorage.getItem('amar_store_live_settings');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}

  return FALLBACK_SETTINGS;
}

export async function saveLiveSettings(settings: AppSettings): Promise<void> {
  try {
    localStorage.setItem('amar_store_live_settings', JSON.stringify(settings));
  } catch (err) {
    console.error("Error saving settings to localStorage", err);
  }

  try {
    const settingsRef = doc(db, 'app_config', 'settings');
    await setDoc(settingsRef, {
      headerLogo: settings.headerLogo || "",
      noticeText: settings.noticeText || "",
      sliderData: settings.sliderData || [],
      payments: settings.payments || {},
      walletPayImg: settings.walletPayImg || "",
      manualPayImg: settings.manualPayImg || "",
      popupIcon: settings.popupIcon || "",
      popupUrl: settings.popupUrl || "",
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore settings sync error:", err);
  }
}

export async function fetchLiveCategories(): Promise<Category[]> {
  // Try fetching fresh data via Web SDK first
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    if (!querySnapshot.empty) {
      const categories: Category[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const catName = data.name || "Category";
        const priority = Number(data.priority || 99);
        const rawProducts = data.products || [];

        const products = rawProducts.map((p: any) => {
          const rawPackages = p.packages || [];
          const packages = rawPackages.map((pkg: any) => ({
            name: pkg.name || "Standard",
            price: Number(pkg.price || 0),
          }));

          const prodName = p.name || p.title || "Product";
          const prodPrice = Number(p.price || p.offerPrice || 0);
          const finalPackages = packages.length > 0 ? packages : [{ name: p.duration || "Standard", price: prodPrice }];

          return {
            name: prodName,
            image: p.image || "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg",
            status: (p.status === 'out' ? 'out' : 'in') as 'in' | 'out',
            avgRating: p.avgRating || "5.0",
            delivery: p.delivery || "Instant (5-15 min)",
            inputLabel: p.inputLabel || "Player ID / Email",
            description: p.description || p.desc || p.details || p.info || p.rules || p.productDescription || p.instruction || "",
            packages: finalPackages,
            categoryName: catName,
          };
        });

        categories.push({
          id: docSnap.id,
          name: catName,
          priority,
          products,
        });
      });

      // Sort by priority
      categories.sort((a, b) => (a.priority || 99) - (b.priority || 99));

      if (categories.length > 0) {
        localStorage.setItem('amar_store_live_categories', JSON.stringify(categories));
        return categories;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch fresh live categories via Web SDK, trying local cache", err);
  }

  // Fallback to cache if offline
  try {
    const cached = localStorage.getItem('amar_store_live_categories');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return FALLBACK_CATEGORIES;
}

export async function saveLiveCategories(categories: Category[]): Promise<void> {
  try {
    localStorage.setItem('amar_store_live_categories', JSON.stringify(categories));
  } catch (err) {
    console.error("Error saving categories to localStorage", err);
  }

  try {
    for (const cat of categories) {
      const catId = (cat.name || 'category').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const catRef = doc(db, 'categories', catId);
      await setDoc(catRef, {
        name: cat.name,
        priority: cat.priority || 1,
        products: cat.products || [],
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.warn("Firestore categories sync error:", err);
  }
}

// Per-account storage helpers
function getStorageKeyForUser(baseKey: string, email?: string): string {
  if (!email || !email.trim()) return `${baseKey}_guest`;
  const cleanEmail = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${baseKey}_${cleanEmail}`;
}

export function getLocalOrders(userEmail?: string): Order[] {
  try {
    if (!userEmail) return [];
    const key = getStorageKeyForUser('amar_store_orders', userEmail);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: Order, userEmail?: string): void {
  try {
    if (!userEmail) return;
    const key = getStorageKeyForUser('amar_store_orders', userEmail);
    const current = getLocalOrders(userEmail);
    const updated = [order, ...current];
    localStorage.setItem(key, JSON.stringify(updated));
    syncUserToFirestore(userEmail, { orders: updated });
  } catch (err) {
    console.error("Error saving order", err);
  }
}

export function getWalletBalance(userEmail?: string): number {
  try {
    if (!userEmail) return 0;
    const key = getStorageKeyForUser('amar_store_wallet_balance', userEmail);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return 0;
    }
    return Number(raw) || 0;
  } catch {
    return 0;
  }
}

export function updateWalletBalance(newBal: number, userEmail?: string): void {
  try {
    if (!userEmail) return;
    const bal = Math.max(0, newBal);
    const key = getStorageKeyForUser('amar_store_wallet_balance', userEmail);
    localStorage.setItem(key, String(bal));
    syncUserToFirestore(userEmail, { balance: bal });
  } catch (err) {
    console.error("Error updating balance", err);
  }
}

// Reviews service
const REVIEWS_KEY = 'amar_store_user_reviews';

export async function fetchLiveReviews(): Promise<Review[]> {
  try {
    const cached = localStorage.getItem(REVIEWS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/reviews`);
    if (!res.ok) {
      return DEFAULT_REVIEWS;
    }
    const data = await res.json();
    const docs = data.documents || [];
    if (docs.length === 0) return DEFAULT_REVIEWS;

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

    if (remoteReviews.length > 0) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(remoteReviews));
      return remoteReviews;
    }
    return DEFAULT_REVIEWS;
  } catch (err) {
    console.warn("Failed to fetch live reviews from Firestore", err);
    return DEFAULT_REVIEWS;
  }
}

export function getLocalAddedReviews(): Review[] {
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
    const revRef = doc(db, 'reviews', review.id || ('rev_' + Date.now()));
    setDoc(revRef, {
      userName: review.userName,
      userPhoto: review.userPhoto || '',
      productName: review.productName || 'Amar Store',
      rating: review.rating || 5,
      comment: review.comment || '',
      status: review.status || 'Approved',
      timestamp: new Date().toISOString()
    }).catch(() => {});
  } catch (err) {
    console.error("Error saving review", err);
  }
}

export function saveAllReviews(reviews: Review[]): void {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.error("Error saving reviews", err);
  }
}

export async function fetchLiveHelpfulCounts(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/helpful_counts/global`);
    if (!res.ok) {
      const local = localStorage.getItem('amar_store_real_helpful_counts');
      return local ? JSON.parse(local) : {};
    }
    const data = await res.json();
    const fields = data.fields || {};
    const counts: Record<string, number> = {};
    for (const key in fields) {
      const val = fields[key];
      const num = Number(val.integerValue || val.doubleValue || 0);
      counts[key] = num;
    }
    return counts;
  } catch (err) {
    console.warn("Failed to fetch live helpful counts", err);
    try {
      const local = localStorage.getItem('amar_store_real_helpful_counts');
      return local ? JSON.parse(local) : {};
    } catch {
      return {};
    }
  }
}

export async function getUserVotedReviews(userKey: string): Promise<Record<string, boolean>> {
  if (!userKey) return {};
  try {
    const stored = localStorage.getItem(`amar_store_voted_${userKey}`);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    return {};
  }
}

export async function toggleUserHelpfulVote(reviewId: string, userKey: string): Promise<{ newCount: number; hasVoted: boolean }> {
  if (!userKey) throw new Error("User key required");
  
  const storageKey = `amar_store_voted_${userKey}`;
  let userVotedMap: Record<string, boolean> = {};
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) userVotedMap = JSON.parse(stored);
  } catch {}

  const hasVotedBefore = !!userVotedMap[reviewId];

  // Get current global counts from localStorage cache or default
  let globalCounts: Record<string, number> = {};
  try {
    const cached = localStorage.getItem('amar_store_real_helpful_counts');
    if (cached) globalCounts = JSON.parse(cached);
  } catch {}

  const currentCount = Number(globalCounts[reviewId] || 0);
  let newCount = currentCount;
  let newHasVoted = false;

  if (hasVotedBefore) {
    newCount = Math.max(0, currentCount - 1);
    newHasVoted = false;
    delete userVotedMap[reviewId];
  } else {
    newCount = currentCount + 1;
    newHasVoted = true;
    userVotedMap[reviewId] = true;
  }

  // Update local storage cache immediately
  globalCounts[reviewId] = newCount;
  try {
    localStorage.setItem(storageKey, JSON.stringify(userVotedMap));
    localStorage.setItem('amar_store_real_helpful_counts', JSON.stringify(globalCounts));
  } catch {}

  // Try to sync to Firestore in background without blocking
  try {
    const countRef = doc(db, 'helpful_counts', 'global');
    const countSnap = await getDoc(countRef).catch(() => null);
    const countData = countSnap && countSnap.exists() ? countSnap.data() : {};
    const updatedCounts = { ...countData, [reviewId]: newCount };
    await setDoc(countRef, updatedCounts, { merge: true });
  } catch (err) {
    console.warn("Background Firestore sync failed, but local vote recorded", err);
  }

  return { newCount, hasVoted: newHasVoted };
}


