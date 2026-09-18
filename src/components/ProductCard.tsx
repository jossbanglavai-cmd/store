import React from 'react';
import { Star, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface Props {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<Props> = ({ product, onSelect }) => {
  const isOut = product.status === 'out';
  const minPrice = product.packages && product.packages.length > 0 
    ? Math.min(...product.packages.map(p => p.price))
    : null;

  return (
    <div
      onClick={() => !isOut && onSelect(product)}
      className={`group relative bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col text-center transition-all duration-200 ${
        isOut ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-black/30'
      }`}
    >
      {/* Badges Overlay */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
        {isOut ? (
          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Stock Out
          </span>
        ) : (
          <span className="bg-amber-400/90 backdrop-blur-xs text-black text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
            <Star className="w-3 h-3 fill-black text-black" />
            {product.avgRating || "5.0"}
          </span>
        )}
      </div>

      {/* 
        RESPONSIVE IMAGE FIX:
        Instead of aspect-ratio: 1/1.2 expanding to 700px height on desktop,
        we constrain the image container to a clean square with max-height!
      */}
      <div className="w-full aspect-square max-h-[140px] sm:max-h-[160px] md:max-h-[180px] bg-gradient-to-b from-gray-50/80 to-white flex items-center justify-center p-3 sm:p-4 overflow-hidden border-b border-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg";
          }}
        />
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3 flex flex-col flex-1 justify-between gap-1">
        <h3 
          className="font-bold text-xs sm:text-sm text-gray-800 tracking-wide line-clamp-1 group-hover:text-black transition"
          title={product.name}
        >
          {product.name}
        </h3>

        {minPrice !== null && (
          <div className="flex items-center justify-center gap-1 text-[11px] sm:text-xs text-emerald-700 font-semibold">
            <span>৳{minPrice}</span>
            <span className="text-[10px] text-gray-500 font-normal">থেকে</span>
          </div>
        )}

        <button 
          disabled={isOut}
          className={`w-full mt-1 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase transition ${
            isOut 
              ? 'bg-gray-100 text-gray-400' 
              : 'bg-black text-white group-hover:bg-neutral-800'
          }`}
        >
          {isOut ? 'স্টক নেই' : 'কিনুন'}
        </button>
      </div>

    </div>
  );
};
