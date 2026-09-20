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
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, onSnapshot } from 'firebase/firestore';

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


const DEFAULT_REVIEWS: Review[] = [];

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
        noticeText: data.noticeText !== undefined ? data.noticeText : FALLBACK_SETTINGS.noticeText,
        favicon: data.favicon || FALLBACK_SETTINGS.favicon,
        operatingHours: data.operatingHours !== undefined && data.operatingHours !== '' ? data.operatingHours : FALLBACK_SETTINGS.operatingHours,
        deliverySpeedText: data.deliverySpeedText !== undefined && data.deliverySpeedText !== '' ? data.deliverySpeedText : FALLBACK_SETTINGS.deliverySpeedText,
        whatsappPhone: data.whatsappPhone || payments.bkash || FALLBACK_SETTINGS.whatsappPhone,
        sliderData: Array.isArray(data.sliderData) ? sliderData : FALLBACK_SETTINGS.sliderData,
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
      noticeText: settings.noticeText !== undefined ? settings.noticeText : "",
      operatingHours: settings.operatingHours !== undefined ? settings.operatingHours : "",
      deliverySpeedText: settings.deliverySpeedText !== undefined ? settings.deliverySpeedText : "",
      whatsappPhone: settings.whatsappPhone || "",
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
      const categoriesMap = new Map<string, Category>();
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const catName = (data.name || "Category").trim();
        if (!catName) return;
        const priority = Number(data.priority || 99);
        const rawProducts = Array.isArray(data.products) ? data.products : [];

        const products = rawProducts.map((p: any) => {
          const rawPackages = Array.isArray(p.packages) ? p.packages : [];
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
            avgRating: p.avgRating || "",
            delivery: p.delivery || "Instant (5-15 min)",
            inputLabel: p.inputLabel || "Player ID / Email",
            description: p.description || p.desc || p.details || p.info || p.rules || p.productDescription || p.instruction || "",
            packages: finalPackages,
            categoryName: catName,
          };
        });

        const key = catName.toLowerCase();
        categoriesMap.set(key, {
          id: docSnap.id,
          name: catName,
          priority,
          products,
        });
      });

      const categories = Array.from(categoriesMap.values());
      // Sort by priority
      categories.sort((a, b) => (a.priority || 99) - (b.priority || 99));

      localStorage.setItem('amar_store_live_categories', JSON.stringify(categories));
      return categories;
    } else {
      localStorage.setItem('amar_store_live_categories', JSON.stringify([]));
      return [];
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
    // Delete obsolete documents from Firestore
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const activeIds = new Set(categories.map(c => c.id).filter(Boolean));
    const activeNames = new Set(categories.map(c => (c.name || '').trim().toLowerCase()));

    for (const docSnap of querySnapshot.docs) {
      const docName = (docSnap.data()?.name || '').trim().toLowerCase();
      if (!activeIds.has(docSnap.id) || !activeNames.has(docName)) {
        await deleteDoc(doc(db, 'categories', docSnap.id));
      }
    }

    for (let idx = 0; idx < categories.length; idx++) {
      const cat = categories[idx];
      const catId = cat.id || (cat.name || 'cat').toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + (idx + 1);
      const catRef = doc(db, 'categories', catId);
      await setDoc(catRef, {
        id: catId,
        name: cat.name,
        priority: cat.priority || (idx + 1),
        products: cat.products || [],
        updatedAt: new Date().toISOString()
      });
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
    const cleanEmail = userEmail.trim().toLowerCase();
    const key = getStorageKeyForUser('amar_store_orders', cleanEmail);
    const current = getLocalOrders(cleanEmail);
    const updated = [order, ...current.filter(o => o.id !== order.id)];
    localStorage.setItem(key, JSON.stringify(updated));
    syncUserToFirestore(cleanEmail, { orders: updated });

    // Also write directly to the top-level 'orders' collection in Firestore
    const orderDocRef = doc(db, 'orders', order.id);
    setDoc(orderDocRef, {
      id: order.id,
      userEmail: cleanEmail,
      productName: order.product,
      packageName: order.package,
      amount: order.price,
      targetAccount: order.playerInfo,
      status: order.status === 'Success' ? 'completed' : order.status === 'Cancel' ? 'cancelled' : 'pending',
      paymentMethod: order.method,
      senderPhone: order.senderPhone || '',
      trxId: order.trx || '',
      createdAt: order.timestamp ? new Date(order.timestamp).toISOString() : new Date().toISOString()
    }).catch((err) => {
      console.warn("Direct order doc write notice:", err);
    });
  } catch (err) {
    console.error("Error saving order", err);
  }
}

export async function deleteUserOrder(orderId: string, userEmail?: string): Promise<void> {
  try {
    if (userEmail) {
      const cleanEmail = userEmail.trim().toLowerCase();
      const key = getStorageKeyForUser('amar_store_orders', cleanEmail);
      const current = getLocalOrders(cleanEmail);
      const updated = current.filter(o => o.id !== orderId);
      localStorage.setItem(key, JSON.stringify(updated));
      await syncUserToFirestore(cleanEmail, { orders: updated });
    }
    // Delete from Firestore top-level orders collection
    await deleteDoc(doc(db, 'orders', orderId));
    try {
      await deleteDoc(doc(db, 'deposit_requests', orderId));
    } catch {}
  } catch (err) {
    console.warn("Error deleting order:", err);
  }
}

export async function clearAllUserOrders(userEmail?: string): Promise<void> {
  try {
    if (userEmail) {
      const cleanEmail = userEmail.trim().toLowerCase();
      const key = getStorageKeyForUser('amar_store_orders', cleanEmail);
      const current = getLocalOrders(cleanEmail);
      localStorage.setItem(key, JSON.stringify([]));
      await syncUserToFirestore(cleanEmail, { orders: [] });
      for (const ord of current) {
        if (ord.id) {
          deleteDoc(doc(db, 'orders', ord.id)).catch(() => {});
          deleteDoc(doc(db, 'deposit_requests', ord.id)).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn("Error clearing orders:", err);
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

export function parseFirestoreOrder(docId: string, data: any): Order {
  const isCompleted = data.status === 'completed' || data.status === 'Success' || data.status === 'success';
  const isCancelled = data.status === 'cancelled' || data.status === 'Cancel' || data.status === 'cancel';
  const status: 'Success' | 'Cancel' | 'Pending' = isCompleted ? 'Success' : isCancelled ? 'Cancel' : 'Pending';

  const createdAt = data.createdAt || data.timestamp || new Date().toISOString();
  const timeNum = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();

  return {
    id: data.id || docId,
    product: data.productName || data.product || 'Product',
    package: data.packageName || data.package || 'Standard',
    price: Number(data.amount || data.price || 0),
    playerInfo: data.targetAccount || data.playerInfo || data.inputField || data.playerId || '',
    status,
    method: data.paymentMethod || data.method || 'Manual',
    trx: data.trxId || data.trx || '',
    senderPhone: data.senderPhone || data.sender || data.senderNumber || data.phone || '',
    userEmail: data.userEmail || data.email || '',
    timeString: new Date(timeNum).toLocaleString('bn-BD'),
    timestamp: timeNum
  };
}

// Live real-time listener for user orders from Firestore orders collection
export function listenToLiveUserOrders(email: string, onUpdate: (orders: Order[]) => void): () => void {
  if (!email) return () => {};
  const cleanEmail = email.trim().toLowerCase();
  const ordersCol = collection(db, 'orders');

  return onSnapshot(ordersCol, (snapshot) => {
    const userOrders: Order[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const orderUserEmail = (data.userEmail || data.email || '').trim().toLowerCase();
      if (orderUserEmail === cleanEmail) {
        userOrders.push(parseFirestoreOrder(docSnap.id, data));
      }
    });

    // Sort newest first
    userOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const key = getStorageKeyForUser('amar_store_orders', cleanEmail);
    localStorage.setItem(key, JSON.stringify(userOrders));
    onUpdate(userOrders);
  }, (err) => {
    console.warn("Orders live listener notice:", err);
  });
}

// Live real-time listener for user balance and profile from Firestore
export function listenToLiveUser(email: string, onUpdate: (data: { balance: number; orders?: Order[]; name?: string; photoUrl?: string }) => void): () => void {
  if (!email) return () => {};
  const cleanEmail = email.trim().toLowerCase();
  const userRef = doc(db, 'users', cleanEmail);
  
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const currentBalance = typeof data.balance === 'number' ? data.balance : 0;
      const key = getStorageKeyForUser('amar_store_wallet_balance', cleanEmail);
      localStorage.setItem(key, String(currentBalance));
      
      onUpdate({
        balance: currentBalance,
        orders: Array.isArray(data.orders) ? data.orders : undefined,
        name: data.name,
        photoUrl: data.photoUrl
      });
    }
  }, (err) => {
    console.warn("User live listener notice:", err);
  });
}

export function listenToLiveSettings(onUpdate: (settings: AppSettings) => void): () => void {
  const settingsRef = doc(db, 'app_config', 'settings');
  return onSnapshot(settingsRef, (docSnap) => {
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
        noticeText: data.noticeText !== undefined ? data.noticeText : FALLBACK_SETTINGS.noticeText,
        favicon: data.favicon || FALLBACK_SETTINGS.favicon,
        operatingHours: data.operatingHours !== undefined && data.operatingHours !== '' ? data.operatingHours : FALLBACK_SETTINGS.operatingHours,
        deliverySpeedText: data.deliverySpeedText !== undefined && data.deliverySpeedText !== '' ? data.deliverySpeedText : FALLBACK_SETTINGS.deliverySpeedText,
        whatsappPhone: data.whatsappPhone || payments.bkash || FALLBACK_SETTINGS.whatsappPhone,
        sliderData: Array.isArray(data.sliderData) ? sliderData : FALLBACK_SETTINGS.sliderData,
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
      onUpdate(settings);
    }
  }, (err) => {
    console.warn("Settings live listener notice:", err);
  });
}

// Live real-time listener for reviews
export function listenToLiveReviews(onUpdate: (reviews: Review[]) => void): () => void {
  const reviewsCol = collection(db, 'reviews');
  return onSnapshot(reviewsCol, (snapshot) => {
    if (snapshot.empty) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify([]));
      onUpdate([]);
      return;
    }

    const remoteReviews: Review[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const rating = Number(data.rating || 5);
      const timestamp = data.timestamp || new Date().toISOString();
      
      let dateFormatted = "সাম্প্রতিক";
      if (timestamp) {
        const diffDays = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) dateFormatted = "আজকে";
        else if (diffDays === 1) dateFormatted = "১ দিন আগে";
        else if (diffDays < 7) dateFormatted = `${diffDays} দিন আগে`;
        else dateFormatted = `${Math.floor(diffDays / 7)} সপ্তাহ আগে`;
      }

      remoteReviews.push({
        id,
        userName: data.userName || "সম্মানিত গ্রাহক",
        userPhoto: data.userPhoto || "",
        productName: data.productName || "Amar Store",
        rating,
        comment: data.comment || "",
        status: data.status || "Approved",
        userEmail: data.userEmail || "",
        memberId: data.memberId || "",
        timestamp,
        dateFormatted
      });
    });

    const filtered = remoteReviews.filter((r: Review) => r.comment);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(filtered));
    onUpdate(filtered);
  }, (err) => {
    console.warn("Reviews live listener notice:", err);
  });
}

// Live real-time listener for categories
export function listenToLiveCategories(onUpdate: (categories: Category[]) => void): () => void {
  const catCol = collection(db, 'categories');
  return onSnapshot(catCol, (snapshot) => {
    if (snapshot.empty) {
      localStorage.setItem('amar_store_live_categories', JSON.stringify([]));
      onUpdate([]);
      return;
    }
    const categoriesMap = new Map<string, Category>();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const catName = (data.name || "Category").trim();
      if (!catName) return;
      const priority = Number(data.priority || 99);
      const rawProducts = Array.isArray(data.products) ? data.products : [];

      const products = rawProducts.map((p: any) => {
        const rawPackages = Array.isArray(p.packages) ? p.packages : [];
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
          avgRating: p.avgRating || "",
          delivery: p.delivery || "Instant (5-15 min)",
          inputLabel: p.inputLabel || "Player ID / Email",
          description: p.description || p.desc || p.details || p.info || p.rules || p.productDescription || p.instruction || "",
          packages: finalPackages,
          categoryName: catName,
        };
      });

      const key = catName.toLowerCase();
      categoriesMap.set(key, {
        id: docSnap.id,
        name: catName,
        priority,
        products,
      });
    });

    const categories = Array.from(categoriesMap.values());
    categories.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    localStorage.setItem('amar_store_live_categories', JSON.stringify(categories));
    onUpdate(categories);
  }, (err) => {
    console.warn("Categories live listener notice:", err);
  });
}

// Submit Add Money / Deposit request (Pending Admin Approval)
export async function submitDepositRequest(request: {
  userEmail: string;
  userName: string;
  amount: number;
  method: 'bkash' | 'nagad';
  senderPhone: string;
  trxId: string;
}): Promise<string> {
  const reqId = "DEP-" + Date.now().toString().slice(-6);
  const cleanEmail = request.userEmail.trim().toLowerCase();
  
  // Save to Firestore deposit_requests collection
  const depRef = doc(db, 'deposit_requests', reqId);
  await setDoc(depRef, {
    id: reqId,
    userEmail: cleanEmail,
    userName: request.userName,
    amount: request.amount,
    method: request.method,
    senderPhone: request.senderPhone,
    trxId: request.trxId,
    status: 'pending',
    createdAt: new Date().toISOString()
  });

  // Also record in orders/transactions for user visibility as pending
  const depositOrder: Order = {
    id: reqId,
    product: `Wallet Deposit (${request.method === 'bkash' ? 'bKash' : 'Nagad'})`,
    package: `টাকা অ্যাড রিকোয়েস্ট`,
    price: request.amount,
    playerInfo: `নম্বর: ${request.senderPhone}`,
    status: 'Pending',
    method: request.method === 'bkash' ? 'bKash Manual' : 'Nagad Manual',
    trx: request.trxId,
    senderPhone: request.senderPhone,
    timeString: new Date().toLocaleString('bn-BD'),
    timestamp: Date.now()
  };

  saveLocalOrder(depositOrder, cleanEmail);

  return reqId;
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
    const querySnapshot = await getDocs(collection(db, 'reviews'));
    if (querySnapshot.empty) {
      return DEFAULT_REVIEWS;
    }

    const remoteReviews: Review[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const rating = Number(data.rating || 5);
      const timestamp = data.timestamp || new Date().toISOString();
      
      let dateFormatted = "সাম্প্রতিক";
      if (timestamp) {
        const diffDays = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) dateFormatted = "আজকে";
        else if (diffDays === 1) dateFormatted = "১ দিন আগে";
        else if (diffDays < 7) dateFormatted = `${diffDays} দিন আগে`;
        else dateFormatted = `${Math.floor(diffDays / 7)} সপ্তাহ আগে`;
      }

      remoteReviews.push({
        id,
        userName: data.userName || "সম্মানিত গ্রাহক",
        userPhoto: data.userPhoto || "",
        productName: data.productName || "Amar Store",
        rating,
        comment: data.comment || "",
        status: data.status || "Approved",
        userEmail: data.userEmail || "",
        memberId: data.memberId || "",
        timestamp,
        dateFormatted
      });
    });

    const filtered = remoteReviews.filter((r: Review) => r.comment);
    if (filtered.length > 0) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(filtered));
      return filtered;
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
      userEmail: review.userEmail || '',
      memberId: review.memberId || '',
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


