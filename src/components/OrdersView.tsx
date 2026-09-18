import React from 'react';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Order } from '../types';

interface Props {
  orders: Order[];
  onBackToHome: () => void;
}

export const OrdersView: React.FC<Props> = ({ orders, onBackToHome }) => {
  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-800" />
            <span>অর্ডার হিস্টোরি (My Orders)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">আপনার সাম্প্রতিক সব অর্ডারের স্ট্যাটাস দেখুন</p>
        </div>
        <button
          onClick={onBackToHome}
          className="text-xs font-semibold text-black hover:underline flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          দোকানে ফিরুন
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 sm:p-14 text-center border border-gray-200 shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <ShoppingBag className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="font-bold text-gray-800 text-base mb-1">কোনো অর্ডার পাওয়া যায়নি</h3>
          <p className="text-xs text-gray-500 max-w-sm mb-4">
            আপনি এখনো কোনো ডিজিটাল প্রোডাক্ট বা সাবস্ক্রিপশন অর্ডার করেননি।
          </p>
          <button
            onClick={onBackToHome}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            প্রোডাক্ট দেখুন ও অর্ডার করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => {
            const isSuccess = order.status === 'Success';
            const isPending = order.status === 'Pending';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-dashed border-gray-200">
                    <div>
                      <div className="text-xs font-mono text-gray-400 font-medium">#{order.id}</div>
                      <h4 className="font-bold text-base text-gray-900">{order.product}</h4>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isSuccess
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isSuccess && <CheckCircle className="w-3.5 h-3.5" />}
                      {isPending && <Clock className="w-3.5 h-3.5" />}
                      {!isSuccess && !isPending && <XCircle className="w-3.5 h-3.5" />}
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-gray-500">প্যাকেজ:</span>
                      <span className="font-semibold text-gray-900">{order.package}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-gray-500">মূল্য:</span>
                      <span className="font-bold text-emerald-700 text-sm sm:text-base">৳{order.price}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-gray-500">আইডি / তথ্য:</span>
                      <span className="font-mono text-gray-900 font-medium truncate max-w-[220px] sm:max-w-none">{order.playerInfo}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-gray-500">পদ্ধতি:</span>
                      <span className="text-gray-800 font-medium">{order.method}</span>
                    </div>
                    {order.trx && (
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500">TrxID:</span>
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{order.trx}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>{order.timeString}</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> স্বয়ংক্রিয় প্রসেসিং
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
