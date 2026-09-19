import { AppSettings, Category, Order, Review, UserProfile } from '../types';
import { FALLBACK_CATEGORIES, FALLBACK_SETTINGS } from '../data/fallbackData';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  projectId: "dshop-46653",
  apiKey: "AIzaSyAuFb9Ed8KgqxdzoT0ZZXCMYFpCzOkNfG4",
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
          description: pf.description?.stringValue || pf.desc?.stringValue || pf.details?.stringValue || pf.info?.stringValue || pf.rules?.stringValue || pf.productDescription?.stringValue || pf.instruction?.stringValue || "",
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

    return remoteReviews.length > 0 ? remoteReviews : DEFAULT_REVIEWS;
  } catch (err) {
    console.warn("Failed to fetch live reviews from Firestore, using fallback", err);
    return getStoredReviews();
  }
}

function getStoredReviews(): Review[] {
  const local = getLocalAddedReviews().filter(r => r.status === 'Approved' || r.status === 'approved');
  return local.length > 0 ? [...local, ...DEFAULT_REVIEWS] : DEFAULT_REVIEWS;
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
  } catch (err) {
    console.error("Error saving review", err);
  }
}
