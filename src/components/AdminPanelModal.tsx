import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, LogOut, Package, ShoppingBag, Settings, Plus, Trash2, Edit3, Check, AlertCircle } from 'lucide-react';
import { Category, Order, Product, AppSettings } from '../types';
import { saveLiveCategories, saveLiveSettings } from '../services/storeService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
  settings,
  onUpdateSettings,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('amar_store_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'orders' | 'settings'>('products');

  // Orders state
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  // Product edit state
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number>(0);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<Product>({
    name: '',
    image: '',
    status: 'in',
    description: '',
    inputLabel: '',
    packages: [{ name: '1 মাস', price: 100 }]
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load all orders from localStorage
      try {
        const keys = Object.keys(localStorage);
        const ordersList: Order[] = [];
        keys.forEach(key => {
          if (key.startsWith('amar_store_orders_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                ordersList.push(...parsed);
              }
            }
          }
        });
        // Sort newest first
        ordersList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setAllOrders(ordersList);
      } catch (e) {
        console.error("Error loading orders", e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin password or custom
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

  const handleSaveProduct = () => {
    if (!productForm.name.trim()) {
      setErrorMsg('প্রোডাক্টের নাম আবশ্যক।');
      return;
    }

    const updatedCategories = [...categories];
    const cat = updatedCategories[editingCategoryIndex];
    if (!cat) return;

    if (isAddingNew || editingProductIndex === null) {
      cat.products.push({ ...productForm });
    } else {
      cat.products[editingProductIndex] = { ...productForm };
    }

    onUpdateCategories(updatedCategories);
    saveLiveCategories(updatedCategories);
    
    setSuccessMsg('প্রোডাক্ট সফলভাবে সংরক্ষণ করা হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 3000);
    setIsAddingNew(false);
    setEditingProductIndex(null);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#16181f] w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1f222e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">সিকিউরড অ্যাডমিন প্যানেল</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">সম্পূর্ণ কন্ট্রোল ও ম্যানেজমেন্ট সিস্টেম</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <div className="p-8 flex flex-col items-center justify-center my-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">অ্যাডমিন লগইন করুন</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
              নিরাপত্তার জন্য আপনার সিক্রেট অ্যাডমিন পাসওয়ার্ড প্রদান করুন। (ডিফল্ট: admin123)
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <input
                type="password"
                placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition text-sm"
              >
                লগইন করুন
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Sub Nav */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-[#1a1d26]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubTab('products')}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                    activeSubTab === 'products'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  প্রোডাক্ট ম্যানেজমেন্ট
                </button>
                <button
                  onClick={() => setActiveSubTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                    activeSubTab === 'orders'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  অর্ডার তালিকা ({allOrders.length})
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                লগআউট
              </button>
            </div>

            {/* Success Message Banner */}
            {successMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-6 py-2.5 text-xs flex items-center gap-2 border-b border-emerald-100 dark:border-emerald-800">
                <Check className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeSubTab === 'products' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">সকল ক্যাটেগরি ও প্রোডাক্ট</h3>
                      <p className="text-xs text-gray-500">প্রোডাক্টের স্টক (ইন/আউট) এবং প্রাইস পরিবর্তন করুন</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsAddingNew(true);
                        setEditingProductIndex(null);
                        setProductForm({
                          name: '',
                          image: '',
                          status: 'in',
                          description: '',
                          inputLabel: '',
                          packages: [{ name: '1 মাস', price: 100 }]
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow transition"
                    >
                      <Plus className="w-4 h-4" />
                      নতুন প্রোডাক্ট যোগ করুন
                    </button>
                  </div>

                  {/* Add / Edit Form Modal inside */}
                  {(isAddingNew || editingProductIndex !== null) && (
                    <div className="bg-gray-50 dark:bg-[#1f222e] p-5 rounded-2xl border border-blue-500/30 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {isAddingNew ? 'নতুন প্রোডাক্ট যোগ করুন' : 'প্রোডাক্ট এডিট করুন'}
                        </h4>
                        <button
                          onClick={() => {
                            setIsAddingNew(false);
                            setEditingProductIndex(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          বাতিল
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">ক্যাটেগরি সিলেক্ট করুন</label>
                          <select
                            value={editingCategoryIndex}
                            onChange={e => setEditingCategoryIndex(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                          >
                            {categories.map((c, idx) => (
                              <option key={idx} value={idx}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">প্রোডাক্টের নাম</label>
                          <input
                            type="text"
                            placeholder="যেমন: Netflix"
                            value={productForm.name}
                            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">ছবির লিংক (Image URL)</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={productForm.image}
                            onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">স্টক স্ট্যাটাস</label>
                          <select
                            value={productForm.status}
                            onChange={e => setProductForm({ ...productForm, status: e.target.value as 'in' | 'out' })}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                          >
                            <option value="in">ইন স্টক (সক্রিয়)</option>
                            <option value="out">স্টক শেষ (আউট অব স্টক)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">বর্ণনা (Description)</label>
                        <textarea
                          rows={2}
                          placeholder="প্রোডাক্ট সম্পর্কে বিবরণ..."
                          value={productForm.description || ''}
                          onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Package manager */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">প্যাকেজ ও দাম (Packages)</label>
                          <button
                            type="button"
                            onClick={() => {
                              setProductForm({
                                ...productForm,
                                packages: [...productForm.packages, { name: 'নতুন প্যাকেজ', price: 100 }]
                              });
                            }}
                            className="text-blue-600 text-xs hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> প্যাকেজ যোগ করুন
                          </button>
                        </div>

                        <div className="flex flex-col gap-2">
                          {productForm.packages.map((pkg, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="প্যাকেজের নাম (যেমন: ১ মাস)"
                                value={pkg.name}
                                onChange={e => {
                                  const pkgs = [...productForm.packages];
                                  pkgs[pIdx].name = e.target.value;
                                  setProductForm({ ...productForm, packages: pkgs });
                                }}
                                className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white"
                              />
                              <input
                                type="number"
                                placeholder="দাম (টাকা)"
                                value={pkg.price}
                                onChange={e => {
                                  const pkgs = [...productForm.packages];
                                  pkgs[pIdx].price = Number(e.target.value);
                                  setProductForm({ ...productForm, packages: pkgs });
                                }}
                                className="w-28 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const pkgs = productForm.packages.filter((_, i) => i !== pIdx);
                                  setProductForm({ ...productForm, packages: pkgs });
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNew(false);
                            setEditingProductIndex(null);
                          }}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveProduct}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow"
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Categories & Products list */}
                  <div className="flex flex-col gap-6">
                    {categories.map((cat, catIdx) => (
                      <div key={catIdx} className="bg-gray-50 dark:bg-[#1f222e] rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                          <span>{cat.name}</span>
                          <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2.5 py-1 rounded-full text-gray-600 dark:text-gray-400">
                            {cat.products.length} টি প্রোডাক্ট
                          </span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {cat.products.map((prod, prodIdx) => (
                            <div key={prodIdx} className="bg-white dark:bg-[#16181f] p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-lg object-cover" />
                                <div>
                                  <h5 className="font-bold text-xs text-gray-900 dark:text-white">{prod.name}</h5>
                                  <p className="text-[11px] text-gray-500">
                                    {prod.packages.length} টি প্যাকেজ • {prod.status === 'in' ? '🟢 ইন স্টক' : '🔴 স্টক শেষ'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleStock(catIdx, prodIdx)}
                                  title="স্টক পরিবর্তন করুন"
                                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                                    prod.status === 'in'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                                      : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                                  }`}
                                >
                                  {prod.status === 'in' ? 'স্টক আছে' : 'শেষ'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCategoryIndex(catIdx);
                                    setEditingProductIndex(prodIdx);
                                    setProductForm({ ...prod });
                                    setIsAddingNew(false);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(catIdx, prodIdx)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSubTab === 'orders' && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">কাস্টমার অর্ডারসমূহ</h3>
                  {allOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">কোনো অর্ডার পাওয়া যায়নি।</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {allOrders.map((ord, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-[#1f222e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-xs text-gray-900 dark:text-white">#{ord.id}</span>
                              <span className="text-[11px] text-gray-500">• {ord.timeString}</span>
                            </div>
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                              {ord.product} ({ord.package}) - ৳{ord.price}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              গ্রাহক তথ্য: {ord.playerInfo} | পেমেন্ট: {ord.method} (Trx: {ord.trx || 'N/A'})
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            ord.status === 'Success'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : ord.status === 'Cancel'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}>
                            {ord.status === 'Success' ? 'সফল' : ord.status === 'Cancel' ? 'বাতিল' : 'পেন্ডিং'}
                          </span>
                        </div>
                      ))}
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
