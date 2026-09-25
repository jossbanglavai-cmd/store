import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Lock, LogOut, Package, ShoppingBag, Plus, Trash2, Edit3, Check, AlertCircle, RefreshCw, CheckCircle, XCircle, ChevronUp, ChevronDown 
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Category, Order, Product, AppSettings, UserProfile } from '../types';
import { saveLiveCategories, uploadToImgBB, parseFirestoreOrder, isUserAdmin } from '../services/storeService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  standalone?: boolean;
  user?: UserProfile;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
  settings,
  onUpdateSettings,
  standalone = false,
  user,
}) => {
  const isAdmin = Boolean(user?.isLoggedIn && isUserAdmin(user?.email));

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return isAdmin || sessionStorage.getItem('amar_store_admin_auth') === 'true';
  });

  useEffect(() => {
    if (isAdmin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('amar_store_admin_auth', 'true');
    }
  }, [isAdmin]);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'orders'>('products');

  // Real-time Firestore orders state
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState<string | null>(null);

  // Category Edit State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryData, setEditingCategoryData] = useState<{ index: number; name: string; priority: number } | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', priority: 1 });

  // Product Edit State
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number>(0);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [originalCategoryIndex, setOriginalCategoryIndex] = useState<number | null>(null);
  const [originalProductIndex, setOriginalProductIndex] = useState<number | null>(null);

  const [productForm, setProductForm] = useState<Product>({
    name: '',
    image: '',
    status: 'in',
    description: '',
    inputLabel: 'Player ID / Account Email',
    packages: [{ name: '১ মাস', price: 100 }],
    subCategory: '',
    regularPrice: 0,
    offerPrice: 0,
    duration: '৩০ দিন',
    priority: 1
  });
  const [packagesString, setPackagesString] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch orders from Firestore in real time
  useEffect(() => {
    if ((isOpen || standalone) && isAuthenticated) {
      const ordersCol = collection(db, 'orders');
      const unsubscribe = onSnapshot(ordersCol, (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((docSnap) => {
          ordersList.push(parseFirestoreOrder(docSnap.id, docSnap.data()));
        });
        // Sort newest first
        ordersList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setAllOrders(ordersList);
      }, (err) => {
        console.error("Error listening to Firestore orders", err);
      });
      return () => unsubscribe();
    }
  }, [isOpen, standalone, isAuthenticated]);

  if (!isOpen && !standalone) return null;
  // Strictly prevent normal visitors, hackers, and non-admin users from viewing any admin UI or portal
  if (!isAdmin && !isAuthenticated) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin123' || passwordInput === 'nuhu1234') {
      setIsAuthenticated(true);
      sessionStorage.setItem('amar_store_admin_auth', 'true');
      setErrorMsg('');
      setPasswordInput('');
    } else {
      setErrorMsg('ভুল পাসওয়ার্ড! সঠিক অ্যাডমিন পাসওয়ার্ড দিন।');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('amar_store_admin_auth');
  };

  // PNG/JPG upload directly to ImgBB and populating image field
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('অনুগ্রহ করে শুধুমাত্র ইমেজ ফাইল (.png, .jpg) সিলেক্ট করুন।');
        return;
      }
      
      setIsUploading(true);
      setErrorMsg('');
      try {
        const uploadedUrl = await uploadToImgBB(file);
        setProductForm(prev => ({
          ...prev,
          image: uploadedUrl
        }));
        setSuccessMsg('ইমেজ সফলভাবে আপলোড ও লিঙ্ক স্বয়ংক্রিয়ভাবে বসেছে!');
        setTimeout(() => setSuccessMsg(''), 3500);
      } catch (err) {
        console.error("Image upload failed", err);
        setErrorMsg("ইমেজ আপলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Category Manager: Create or Update Category
  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) {
      setErrorMsg('ক্যাটেগরির নাম আবশ্যক।');
      return;
    }

    const updatedCategories = [...categories];

    if (isAddingCategory) {
      const priority = Number(categoryForm.priority || updatedCategories.length + 1);
      updatedCategories.push({
        name: categoryForm.name.trim(),
        priority,
        products: []
      });
    } else if (editingCategoryData !== null) {
      const cat = updatedCategories[editingCategoryData.index];
      if (cat) {
        cat.name = categoryForm.name.trim();
        cat.priority = Number(categoryForm.priority || cat.priority || editingCategoryData.index + 1);
      }
    }

    // Sort categories by Priority
    updatedCategories.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    onUpdateCategories(updatedCategories);
    saveLiveCategories(updatedCategories);

    setSuccessMsg(isAddingCategory ? 'নতুন ক্যাটেগরি সফলভাবে তৈরি হয়েছে!' : 'ক্যাটেগরি সফলভাবে আপডেট করা হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 3000);
    setIsAddingCategory(false);
    setEditingCategoryData(null);
    setCategoryForm({ name: '', priority: 1 });
  };

  const handleDeleteCategory = (idx: number) => {
    const cat = categories[idx];
    if (!cat) return;
    if (confirm(`আপনি কি নিশ্চিতভাবে "${cat.name}" ক্যাটেগরিটি এবং এর মধ্যকার সকল প্রোডাক্ট মুছে ফেলতে চান?`)) {
      const updatedCategories = categories.filter((_, i) => i !== idx);
      onUpdateCategories(updatedCategories);
      saveLiveCategories(updatedCategories);
      setSuccessMsg('ক্যাটেগরি মুছে ফেলা হয়েছে।');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Product Manager: Create or Update Product
  const handleSaveProduct = () => {
    if (!productForm.name.trim()) {
      setErrorMsg('প্রোডাক্টের নাম আবশ্যক।');
      return;
    }

    const updatedCategories = [...categories];

    // Parse packagesString to a Package[]
    let pkgs: { name: string; price: number }[] = [];
    if (packagesString.trim()) {
      pkgs = packagesString.split(',').map(item => {
        const parts = item.split(':');
        const name = parts[0] ? parts[0].trim() : '';
        const price = parts[1] ? Number(parts[1].trim()) : 0;
        return { name, price };
      }).filter(p => p.name && !isNaN(p.price));
    }

    if (pkgs.length === 0) {
      if (productForm.offerPrice && productForm.offerPrice > 0) {
        pkgs = [{
          name: productForm.duration || 'Standard',
          price: Number(productForm.offerPrice)
        }];
      }
    }

    const finalProduct: Product = {
      ...productForm,
      packages: pkgs,
      regularPrice: productForm.regularPrice ? Number(productForm.regularPrice) : undefined,
      offerPrice: productForm.offerPrice ? Number(productForm.offerPrice) : undefined,
      priority: productForm.priority !== undefined ? Number(productForm.priority) : 1
    };

    if (isAddingNew || editingProductIndex === null || originalCategoryIndex === null || originalProductIndex === null) {
      // Adding a new product to selected category
      const targetCat = updatedCategories[editingCategoryIndex];
      if (targetCat) {
        targetCat.products.push(finalProduct);
      }
    } else {
      // Editing existing product
      if (editingCategoryIndex === originalCategoryIndex) {
        const targetCat = updatedCategories[editingCategoryIndex];
        if (targetCat) {
          targetCat.products[editingProductIndex] = finalProduct;
        }
      } else {
        // Category changed: delete from old, add to new
        const originalCat = updatedCategories[originalCategoryIndex];
        if (originalCat) {
          originalCat.products.splice(originalProductIndex, 1);
        }
        const targetCat = updatedCategories[editingCategoryIndex];
        if (targetCat) {
          targetCat.products.push(finalProduct);
        }
      }
    }

    // Sort products inside target category by priority
    const targetCat = updatedCategories[editingCategoryIndex];
    if (targetCat && targetCat.products) {
      targetCat.products.sort((a, b) => {
        const pA = a.priority !== undefined ? Number(a.priority) : 99;
        const pB = b.priority !== undefined ? Number(b.priority) : 99;
        return pA - pB;
      });
    }

    // Sort original category as well (if category was changed)
    if (originalCategoryIndex !== null && originalCategoryIndex !== editingCategoryIndex) {
      const origCat = updatedCategories[originalCategoryIndex];
      if (origCat && origCat.products) {
        origCat.products.sort((a, b) => {
          const pA = a.priority !== undefined ? Number(a.priority) : 99;
          const pB = b.priority !== undefined ? Number(b.priority) : 99;
          return pA - pB;
        });
      }
    }

    onUpdateCategories(updatedCategories);
    saveLiveCategories(updatedCategories);
    
    setSuccessMsg('প্রোডাক্ট সফলভাবে সংরক্ষণ করা হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 3000);
    setIsAddingNew(false);
    setEditingProductIndex(null);
    setOriginalCategoryIndex(null);
    setOriginalProductIndex(null);
  };

  const handleMoveCategory = (idx: number, direction: 'up' | 'down') => {
    const updatedCategories = [...categories];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updatedCategories.length) return;
    
    // Swap positions
    const temp = updatedCategories[idx];
    updatedCategories[idx] = updatedCategories[targetIdx];
    updatedCategories[targetIdx] = temp;

    // Reset priorities to match the new indices
    updatedCategories.forEach((cat, index) => {
      cat.priority = index + 1;
    });

    onUpdateCategories(updatedCategories);
    saveLiveCategories(updatedCategories);
    setSuccessMsg('ক্যাটেগরি ক্রম সফলভাবে পরিবর্তন করা হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleMoveProduct = (catIdx: number, idx: number, direction: 'up' | 'down') => {
    const updatedCategories = [...categories];
    const cat = updatedCategories[catIdx];
    if (!cat) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cat.products.length) return;

    // Swap positions
    const temp = cat.products[idx];
    cat.products[idx] = cat.products[targetIdx];
    cat.products[targetIdx] = temp;

    // Reset product priorities
    cat.products.forEach((prod, index) => {
      prod.priority = index + 1;
    });

    onUpdateCategories(updatedCategories);
    saveLiveCategories(updatedCategories);
    setSuccessMsg('প্রোডাক্ট ক্রম সফলভাবে পরিবর্তন করা হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteProduct = (catIdx: number, prodIdx: number) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই প্রোডাক্টটি মুছে ফেলতে চান?')) {
      const updatedCategories = [...categories];
      updatedCategories[catIdx].products.splice(prodIdx, 1);
      onUpdateCategories(updatedCategories);
      saveLiveCategories(updatedCategories);
      setSuccessMsg('প্রোডাক্ট মুছে ফেলা হয়েছে।');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleToggleStock = (catIdx: number, prodIdx: number) => {
    const updatedCategories = [...categories];
    const prod = updatedCategories[catIdx].products[prodIdx];
    prod.status = prod.status === 'in' ? 'out' : 'in';
    onUpdateCategories(updatedCategories);
    saveLiveCategories(updatedCategories);
  };

  // Orders and Ledger Status Updates
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'Success' | 'Cancel') => {
    setIsProcessingOrder(orderId);
    setErrorMsg('');
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        setErrorMsg('অর্ডারটি ডাটাবেজে পাওয়া যায়নি।');
        return;
      }

      const orderData = orderSnap.data();
      const userEmail = (orderData.userEmail || orderData.email || '').trim().toLowerCase();
      const amount = Number(orderData.amount || orderData.price || 0);
      const productName = orderData.productName || '';

      const isDeposit = orderId.startsWith('DEP-') || productName.toLowerCase().includes('wallet deposit');

      const dbStatus = newStatus === 'Success' ? 'completed' : 'cancelled';
      await setDoc(orderRef, { status: dbStatus }, { merge: true });

      if (isDeposit) {
        const depRef = doc(db, 'deposit_requests', orderId);
        await setDoc(depRef, { status: dbStatus }, { merge: true }).catch(() => {});

        // If approved, deposit wallet money to user
        if (newStatus === 'Success' && userEmail) {
          const userRef = doc(db, 'users', userEmail);
          const userSnap = await getDoc(userRef);
          let currentBalance = 0;
          if (userSnap.exists()) {
            currentBalance = Number(userSnap.data().balance || 0);
          }
          const newBalance = currentBalance + amount;
          await setDoc(userRef, { balance: newBalance, updatedAt: new Date().toISOString() }, { merge: true });
          setSuccessMsg(`গ্রাহক (${userEmail}) এর ওয়ালেটে সফলভাবে ৳${amount} যোগ করা হয়েছে!`);
          setTimeout(() => setSuccessMsg(''), 4500);
        }
      } else {
        // Standard digital product order refund logic
        const paymentMethod = (orderData.paymentMethod || orderData.method || '').trim().toLowerCase();
        if (newStatus === 'Cancel' && (paymentMethod === 'wallet pay' || paymentMethod === 'walletpay') && userEmail) {
          const isAlreadyRefunded = orderData.refunded === true;
          if (!isAlreadyRefunded) {
            const userRef = doc(db, 'users', userEmail);
            const userSnap = await getDoc(userRef);
            let currentBalance = 0;
            if (userSnap.exists()) {
              currentBalance = Number(userSnap.data().balance || 0);
            }
            const newBalance = currentBalance + amount;
            await setDoc(userRef, { balance: newBalance, updatedAt: new Date().toISOString() }, { merge: true });
            
            // Mark as refunded to prevent double refund
            await setDoc(orderRef, { refunded: true }, { merge: true });
            
            setSuccessMsg(`অর্ডারটি বাতিল করা হয়েছে এবং গ্রাহক (${userEmail}) কে ৳${amount} রিফান্ড দেওয়া হয়েছে!`);
            setTimeout(() => setSuccessMsg(''), 5000);
          }
        }
      }

      setSuccessMsg('অর্ডারের স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Error updating status:", err);
      setErrorMsg("স্ট্যাটাস আপডেট করতে ত্রুটি হয়েছে।");
    } finally {
      setIsProcessingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই অর্ডারটি মুছে ফেলতে চান?')) {
      setIsProcessingOrder(orderId);
      setErrorMsg('');
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        await deleteDoc(doc(db, 'deposit_requests', orderId)).catch(() => {});
        setSuccessMsg('অর্ডারটি সফলভাবে মুছে ফেলা হয়েছে।');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        console.error("Error deleting order:", err);
        setErrorMsg("অর্ডার মুছতে সমস্যা হয়েছে।");
      } finally {
        setIsProcessingOrder(null);
      }
    }
  };

  const handleDeleteAllOrders = async () => {
    if (confirm('⚠️ অত্যন্ত সতর্কবার্তা: আপনি কি নিশ্চিতভাবে ডাটাবেজের সকল কাস্টমার অর্ডার মুছে ফেলতে চান? এটি আর ফেরত আনা যাবে না!')) {
      setErrorMsg('');
      setSuccessMsg('ডাটাবেজের সকল অর্ডার মোছা হচ্ছে...');
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const deletePromises: Promise<void>[] = [];
        querySnapshot.forEach((docSnap) => {
          deletePromises.push(deleteDoc(doc(db, 'orders', docSnap.id)));
          deletePromises.push(deleteDoc(doc(db, 'deposit_requests', docSnap.id)).catch(() => {}));
        });
        await Promise.all(deletePromises);
        setSuccessMsg('ডাটাবেজের সকল অর্ডার সফলভাবে মুছে ফেলা হয়েছে!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        console.error("Error deleting all orders:", err);
        setErrorMsg("ডাটাবেজের সকল অর্ডার মুছতে সমস্যা হয়েছে।");
      }
    }
  };

  const triggerManualRefresh = async () => {
    setIsRefreshingOrders(true);
    try {
      const ordersCol = collection(db, 'orders');
      const snap = await getDocs(ordersCol);
      const ordersList: Order[] = [];
      snap.forEach((docSnap) => {
        ordersList.push(parseFirestoreOrder(docSnap.id, docSnap.data()));
      });
      ordersList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setAllOrders(ordersList);
      setSuccessMsg('অর্ডার তালিকা রিফ্রেশ করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      console.error("Manual refresh error", err);
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  return (
    <div className={standalone 
      ? "w-full min-h-screen bg-gray-50 dark:bg-[#0f111a] flex justify-center p-2 sm:p-4 md:p-6"
      : "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    }>
      <div className={`bg-white dark:bg-[#16181f] w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col ${
        standalone ? "min-h-[90vh]" : "max-h-[92vh]"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1f222e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-heading">সিকিউরড অ্যাডমিন প্যানেল (Amar Store)</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">ক্যাটেগরি, প্রোডাক্ট এবং অর্ডার কন্ট্রোল সেন্টার</p>
            </div>
          </div>
          {standalone ? (
            <button
              onClick={() => {
                window.location.hash = '';
                window.location.pathname = '/';
              }}
              className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="ইউজার হোম পেজে ফিরে যান"
            >
              <span>ইউজার হোম পেজ</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Area */}
        {!isAuthenticated ? (
          <div className="p-8 flex flex-col items-center justify-center my-auto min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">অ্যাডমিন পাসওয়ার্ড দিয়ে লগইন করুন</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 text-center max-w-xs">
              স্টোর কনফিগারেশন পরিবর্তন করতে আপনার অ্যাডমিন অ্যাক্সেস নিশ্চিত করুন।
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-3">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <input
                type="password"
                placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition text-xs cursor-pointer"
              >
                লগইন করুন
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Sub Tabs */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-gray-100/40 dark:bg-[#1a1d26]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubTab('products')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeSubTab === 'products'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  ক্যাটেগরি ও প্রোডাক্ট
                </button>
                <button
                  onClick={() => setActiveSubTab('orders')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeSubTab === 'orders'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  অর্ডার তালিকা ({allOrders.length})
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                লগআউট
              </button>
            </div>

            {/* Notification Messages Banner */}
            {successMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 px-5 py-2.5 text-xs flex items-center gap-2 border-b border-emerald-100 dark:border-emerald-900/30">
                <Check className="w-4 h-4" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 px-5 py-2.5 text-xs flex items-center gap-2 border-b border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {activeSubTab === 'products' && (
                <div className="space-y-6">
                  
                  {/* Category & Product Creation / Management buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-[#1a1d26] p-4 rounded-xl border border-gray-150 dark:border-gray-800">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">ইনভেন্টরি কন্ট্রোল প্যানেল</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">ক্যাটেগরি সিরিয়াল ও প্রোডাক্ট প্রাইস কনফিগার করুন</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setIsAddingCategory(true);
                          setEditingCategoryData(null);
                          setCategoryForm({ name: '', priority: categories.length + 1 });
                        }}
                        className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-400" />
                        নতুন ক্যাটেগরি
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingNew(true);
                          setEditingProductIndex(null);
                          setOriginalCategoryIndex(null);
                          setOriginalProductIndex(null);
                          setProductForm({
                            name: '',
                            image: '',
                            status: 'in',
                            description: '',
                            inputLabel: 'Player ID / Account Email',
                            packages: [],
                            subCategory: '',
                            regularPrice: 0,
                            offerPrice: 0,
                            duration: '৩০ দিন',
                            priority: 1
                          });
                          setPackagesString('');
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        নতুন প্রোডাক্ট
                      </button>
                    </div>
                  </div>

                  {/* Category Editor / Form popup modal style inside */}
                  {(isAddingCategory || editingCategoryData !== null) && (
                    <div className="bg-[#f0f4ff] dark:bg-[#1f273d] p-4 rounded-xl border border-blue-300 dark:border-blue-900/50 space-y-3.5 animate-in slide-in-from-top duration-150">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span>{isAddingCategory ? 'নতুন ক্যাটেগরি যোগ করুন' : 'ক্যাটেগরি এডিট করুন'}</span>
                        </h4>
                        <button
                          onClick={() => {
                            setIsAddingCategory(false);
                            setEditingCategoryData(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 text-xs font-semibold underline cursor-pointer"
                        >
                          বাতিল
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">ক্যাটেগরি নাম *</label>
                          <input
                            type="text"
                            placeholder="যেমন: Premium Accounts / Gaming Top-Up"
                            value={categoryForm.name}
                            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white outline-hidden focus:border-blue-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">সিরিয়াল নম্বর / অগ্রাধিকার (Priority Serial)</label>
                          <input
                            type="number"
                            placeholder="যেমন: 1, 2, 3"
                            value={categoryForm.priority}
                            onChange={e => setCategoryForm({ ...categoryForm, priority: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white outline-hidden focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1.5 border-t border-blue-200 dark:border-blue-900/30">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCategory(false);
                            setEditingCategoryData(null);
                          }}
                          className="px-3.5 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCategory}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                        >
                          ক্যাটেগরি সেভ করুন
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Product Editor Form */}
                  {(isAddingNew || editingProductIndex !== null) && (
                    <div className="bg-gray-50 dark:bg-[#1a1d26] p-4 sm:p-5 rounded-xl border border-blue-500/20 space-y-4 animate-in slide-in-from-top duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span>{isAddingNew ? 'নতুন প্রোডাক্ট যোগ করুন' : 'প্রোডাক্ট বিবরণী এডিট করুন'}</span>
                        </h4>
                        <button
                          onClick={() => {
                            setIsAddingNew(false);
                            setEditingProductIndex(null);
                            setOriginalCategoryIndex(null);
                            setOriginalProductIndex(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 text-xs font-bold underline cursor-pointer"
                        >
                          বাতিল করুন
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        
                        {/* 1. Category Dropdown Selector */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">ক্যাটেগরি নির্বাচন করুন *</label>
                          <select
                            value={editingCategoryIndex}
                            onChange={e => setEditingCategoryIndex(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-bold outline-hidden focus:border-blue-500"
                          >
                            {categories.map((c, idx) => (
                              <option key={idx} value={idx}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Sub Category */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">সাব-ক্যাটেগরি (যেমন: Netflix, Prime, Canva)</label>
                          <input
                            type="text"
                            placeholder="যেমন: Prime Video"
                            value={productForm.subCategory || ''}
                            onChange={e => setProductForm({ ...productForm, subCategory: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-hidden focus:border-blue-500 font-semibold"
                          />
                        </div>

                        {/* 3. Product Name */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">প্রোডাক্টের নাম *</label>
                          <input
                            type="text"
                            placeholder="যেমন: Netflix 1 Month Screen"
                            value={productForm.name}
                            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-bold outline-hidden focus:border-blue-500"
                          />
                        </div>

                        {/* 4. Product Image Upload with PNG view logic */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                            ছবি URL (Image Link)
                          </label>
                          <div className="flex items-center gap-3">
                            {productForm.image ? (
                              <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                <img 
                                  src={productForm.image} 
                                  alt="Preview" 
                                  className="w-full h-full object-contain" 
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-[9px] text-gray-400 font-bold flex-shrink-0">
                                NO PNG
                              </div>
                            )}
                            <div className="flex-1 flex flex-col gap-1.5">
                              <input
                                type="text"
                                placeholder="ছবির ডিরেক্ট লিংক (https://...)"
                                value={productForm.image}
                                onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-hidden focus:border-blue-500 font-mono"
                              />
                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-[10px] font-bold transition border border-blue-200 dark:border-blue-800/40 flex-1 text-center select-none">
                                  {isUploading ? "Uploading..." : "📁 কম্পিউটার থেকে PNG / JPG আপলোড"}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                    className="hidden"
                                  />
                                </label>
                                {productForm.image && (
                                  <button
                                    type="button"
                                    onClick={() => setProductForm({ ...productForm, image: '' })}
                                    className="text-red-500 hover:text-red-600 text-[10px] font-bold px-2"
                                  >
                                    মুছুন
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 block">টুলস দিয়ে ইমেজ আপলোড করলে লিঙ্ক স্বয়ংক্রিয়ভাবে বসে যাবে।</span>
                        </div>

                        {/* 5. Regular Price */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">রেগুলার প্রাইস (৳)</label>
                          <input
                            type="number"
                            placeholder="যেমন: 400"
                            value={productForm.regularPrice || ''}
                            onChange={e => setProductForm({ ...productForm, regularPrice: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono font-bold"
                          />
                        </div>

                        {/* 6. Offer Price */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">অফার প্রাইস / বেস প্রাইস (৳) *</label>
                          <input
                            type="number"
                            placeholder="যেমন: 250"
                            value={productForm.offerPrice || ''}
                            onChange={e => setProductForm({ ...productForm, offerPrice: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono font-bold"
                          />
                        </div>

                        {/* 7. Duration */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">মেয়াদ / ডুরেশন (যেমন: ৩০ দিন / ১ মাস)</label>
                          <input
                            type="text"
                            placeholder="যেমন: ৩০ দিন / ১ মাস"
                            value={productForm.duration || ''}
                            onChange={e => setProductForm({ ...productForm, duration: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
                          />
                        </div>

                        {/* 8. Input Label */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">অর্ডার ইনপুট লেবেল (যা কাস্টমার থেকে নিতে চান)</label>
                          <input
                            type="text"
                            placeholder="যেমন: Player ID / Account Email"
                            value={productForm.inputLabel || ''}
                            onChange={e => setProductForm({ ...productForm, inputLabel: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
                          />
                        </div>

                        {/* 9. Stock status */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">স্টক স্ট্যাটাস</label>
                          <select
                            value={productForm.status}
                            onChange={e => setProductForm({ ...productForm, status: e.target.value as 'in' | 'out' })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-semibold"
                          >
                            <option value="in">ইন স্টক (সক্রিয়)</option>
                            <option value="out">স্টক শেষ (আউট অব স্টক)</option>
                          </select>
                        </div>

                        {/* 10. Serial / Priority Order */}
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                            সিরিয়াল / প্রায়োরিটি (Priority Order)
                          </label>
                          <input
                            type="number"
                            placeholder="যেমন: 1, 2, 3"
                            value={productForm.priority !== undefined ? productForm.priority : ''}
                            onChange={e => setProductForm({ ...productForm, priority: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono font-bold"
                          />
                          <span className="text-[10px] text-gray-400 mt-1 block">১ দিলে সবার প্রথমে থাকবে, ২ দিলে দ্বিতীয় অবস্থানে।</span>
                        </div>
                      </div>

                      {/* Brief description */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">সংক্ষিপ্ত বিবরণ</label>
                        <textarea
                          rows={2}
                          placeholder="পণ্য সম্পর্কে ছোট ও আকর্ষণীয় বর্ণনা লিখুন..."
                          value={productForm.description || ''}
                          onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-hidden"
                        />
                      </div>

                      {/* Comma-separated Packages Textarea Option */}
                      <div className="bg-[#fcfdfd] dark:bg-[#1f222d] p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                        <div>
                          <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                            প্যাকেজ এবং প্রাইস তালিকা (ঐচ্ছিক) <span className="text-blue-500 font-semibold">কমা দিয়ে আলাদা করুন</span>
                          </label>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            বিন্যাস: প্যাকেজ নাম:মূল্য, প্যাকেজ নাম:মূল্য (যেমন: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">1 Screen:160, 2 Screen:300, Full Account:1200</code>)। ফাকা রাখলে মূল অফার প্রাইস ও মেয়াদ দিয়ে একটি ডিফল্ট প্যাকেজ তৈরি হবে।
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="যেমন: 1 Screen:160, 2 Screen:300, Full Account:1200"
                          value={packagesString}
                          onChange={e => setPackagesString(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-hidden font-mono"
                        />
                      </div>

                      {/* Product form action buttons */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNew(false);
                            setEditingProductIndex(null);
                            setOriginalCategoryIndex(null);
                            setOriginalProductIndex(null);
                          }}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveProduct}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                        >
                          প্রোডাক্ট সেভ করুন
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Categories & Products Visual List with action icons */}
                  <div className="space-y-4">
                    {categories.map((cat, catIdx) => (
                      <div key={catIdx} className="bg-white dark:bg-[#191b24] rounded-xl p-4 border border-gray-200/90 dark:border-gray-800 shadow-xs">
                        
                        {/* Category Heading & Controls */}
                        <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white mb-3.5 flex items-center justify-between bg-gray-50 dark:bg-[#1e2230] p-2.5 rounded-lg border border-gray-150 dark:border-gray-800/80">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              সিরিয়াল: {cat.priority || catIdx + 1}
                            </span>
                            <span className="text-gray-900 dark:text-white text-xs sm:text-sm font-bold tracking-wide">{cat.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Movement Buttons */}
                            <div className="flex items-center bg-gray-100 dark:bg-[#151821] rounded-lg p-0.5 border border-gray-200/40 dark:border-gray-800/60">
                              <button
                                onClick={() => handleMoveCategory(catIdx, 'up')}
                                disabled={catIdx === 0}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-20 transition rounded-md"
                                title="উপরে সরান"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveCategory(catIdx, 'down')}
                                disabled={catIdx === categories.length - 1}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-20 transition rounded-md"
                                title="নিচে সরান"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => {
                                setEditingCategoryData({ index: catIdx, name: cat.name, priority: cat.priority || catIdx + 1 });
                                setCategoryForm({ name: cat.name, priority: cat.priority || catIdx + 1 });
                                setIsAddingCategory(false);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition"
                              title="ক্যাটেগরি সিরিয়াল বা নাম এডিট করুন"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(catIdx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition"
                              title="ক্যাটেগরি মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1.5 rounded-full font-bold">
                              {cat.products.length} প্রোডাক্ট
                            </span>
                          </div>
                        </div>

                        {/* Products list inside category */}
                        {cat.products.length === 0 ? (
                          <div className="text-center py-5 text-gray-400 text-xs border border-dashed border-gray-250 dark:border-gray-800 rounded-lg">
                            এই ক্যাটেগরিতে কোনো প্রোডাক্ট নেই। "নতুন প্রোডাক্ট" বাটনে ক্লিক করে যোগ করুন।
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cat.products.map((prod, prodIdx) => (
                              <div key={prodIdx} className="bg-gray-50/80 dark:bg-[#14151b] p-3 rounded-xl border border-gray-150 dark:border-gray-850 flex items-center justify-between gap-3 hover:border-blue-500/20 dark:hover:border-blue-500/10 transition">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-11 h-11 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                    <img 
                                      src={prod.image} 
                                      alt={prod.name} 
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg";
                                      }}
                                    />
                                  </div>
                                  <div className="overflow-hidden">
                                    <h5 className="font-bold text-xs text-gray-900 dark:text-white truncate" title={prod.name}>
                                      {prod.name}
                                    </h5>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-medium">
                                      {prod.packages.length} টি প্যাকেজ • ৳{prod.packages[0]?.price || 0} থেকে শুরু
                                    </p>
                                  </div>
                                </div>

                                 <div className="flex items-center gap-1">
                                  {/* Product Movement Buttons */}
                                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200/40 dark:border-gray-700/60">
                                    <button
                                      onClick={() => handleMoveProduct(catIdx, prodIdx, 'up')}
                                      disabled={prodIdx === 0}
                                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-25 transition rounded"
                                      title="উপরে সরান"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveProduct(catIdx, prodIdx, 'down')}
                                      disabled={prodIdx === cat.products.length - 1}
                                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-25 transition rounded"
                                      title="নিচে সরান"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => handleToggleStock(catIdx, prodIdx)}
                                    title="স্টক ইন / আউট পরিবর্তন করুন"
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition select-none cursor-pointer ${
                                      prod.status === 'in'
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
                                        : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/30'
                                    }`}
                                  >
                                    {prod.status === 'in' ? 'স্টক আছে' : 'আউট'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCategoryIndex(catIdx);
                                      setOriginalCategoryIndex(catIdx);
                                      setEditingProductIndex(prodIdx);
                                      setOriginalProductIndex(prodIdx);
                                      setProductForm({ ...prod });
                                      const pkgsString = prod.packages ? prod.packages.map(p => `${p.name}:${p.price}`).join(', ') : '';
                                      setPackagesString(pkgsString);
                                      setIsAddingNew(false);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                                    title="প্রোডাক্ট তথ্য এডিট করুন"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(catIdx, prodIdx)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                                    title="প্রোডাক্ট ডিলিট করুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {activeSubTab === 'orders' && (
                <div className="space-y-4">
                  
                  {/* Order controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-[#1a1d26] p-4 rounded-xl border border-gray-150 dark:border-gray-800">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">সকল কাস্টমার অর্ডার তালিকা (A to Z)</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">স্ট্যাটাস অনুমোদন, রিফ্রেশ ও ডিলিট অপশন</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={triggerManualRefresh}
                        disabled={isRefreshingOrders}
                        className="px-3.5 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                        রিফ্রেশ
                      </button>
                      <button
                        onClick={handleDeleteAllOrders}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        সব অর্ডার মুছুন
                      </button>
                    </div>
                  </div>

                  {/* Orders Visual Card List */}
                  {allOrders.length === 0 ? (
                    <div className="bg-white dark:bg-[#191b24] text-center py-16 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-800 rounded-xl font-semibold text-xs">
                      স্টোরে বর্তমানে কোনো কাস্টমার অর্ডার ডাটাবেজে পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allOrders.map((ord, idx) => {
                        const isSuccess = ord.status === 'Success';
                        const isCancel = ord.status === 'Cancel';
                        const isPending = ord.status === 'Pending';
                        const isProcessingThis = isProcessingOrder === ord.id;
                        
                        const isWalletDeposit = ord.id.startsWith('DEP-') || ord.product.toLowerCase().includes('wallet deposit');

                        return (
                          <div 
                            key={idx} 
                            className="bg-white dark:bg-[#191b24] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 hover:shadow-xs transition"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 px-2.5 py-0.5 rounded text-[10px] font-bold">
                                  #{ord.id}
                                </span>
                                {isWalletDeposit && (
                                  <span className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide">
                                    💰 টাকা অ্যাড রিকোয়েস্ট
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-500 font-medium">
                                  • {ord.timeString}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                {ord.product} <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">({ord.package})</span>
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-4 text-[11px] text-gray-600 dark:text-gray-300">
                                <div>
                                  <span className="text-gray-400">গ্রাহক মেইল:</span> <span className="font-semibold text-gray-800 dark:text-gray-200 select-all font-mono">{ord.userEmail || (ord.playerInfo.includes('@') ? ord.playerInfo : 'Customer')}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">মূল্য:</span> <span className="font-extrabold text-emerald-600 dark:text-emerald-400">৳{ord.price}</span>
                                </div>
                                <div className="sm:col-span-2 md:col-span-3">
                                  <span className="text-gray-400">গ্রাহক আইডি/তথ্য:</span> <span className="font-mono font-bold text-black dark:text-amber-400 select-all bg-gray-100 dark:bg-gray-800/80 px-1.5 py-0.5 rounded">{ord.playerInfo}</span>
                                </div>
                                <div className="sm:col-span-2 md:col-span-3 bg-neutral-50 dark:bg-[#1d202b] p-2 rounded-lg border border-gray-150 dark:border-gray-800 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <div>
                                    <span className="text-gray-400 font-semibold">পেমেন্ট পদ্ধতি:</span> <span className="font-bold text-gray-900 dark:text-white">{ord.method}</span>
                                  </div>
                                  {ord.trx && (
                                    <div>
                                      <span className="text-gray-400 font-semibold">TrxID:</span> <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-800 select-all">{ord.trx}</span>
                                    </div>
                                  )}
                                  {ord.senderPhone && (
                                    <div>
                                      <span className="text-gray-400 font-semibold">Sender Number:</span> <span className="font-mono font-bold text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-800 select-all">{ord.senderPhone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-row md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-800">
                              
                              {/* Current status display */}
                              <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide select-none ${
                                isSuccess
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : isCancel
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                              }`}>
                                {isSuccess ? 'সফল (Approved)' : isCancel ? 'বাতিল (Cancelled)' : 'পেন্ডিং / চলমান'}
                              </span>

                              {/* Action controls */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'Success')}
                                  disabled={isSuccess || isProcessingThis}
                                  className={`p-1.5 rounded-lg border flex items-center justify-center transition cursor-pointer select-none ${
                                    isSuccess
                                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-850 dark:border-gray-800'
                                      : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                  }`}
                                  title="অনুমোদন করুন (Approve)"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'Cancel')}
                                  disabled={isCancel || isProcessingThis}
                                  className={`p-1.5 rounded-lg border flex items-center justify-center transition cursor-pointer select-none ${
                                    isCancel
                                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-850 dark:border-gray-800'
                                      : 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600 shadow-xs'
                                  }`}
                                  title="অর্ডার বাতিল করুন (Cancel)"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(ord.id)}
                                  disabled={isProcessingThis}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg flex items-center justify-center transition cursor-pointer"
                                  title="অর্ডার রেকর্ড মুছে ফেলুন (Delete)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {isProcessingThis && (
                                <span className="text-[10px] text-gray-400 font-bold animate-pulse">প্রসেসিং হচ্ছে...</span>
                              )}

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
