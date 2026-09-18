import React, { useState, useRef } from 'react';
import { X, Camera, UploadCloud, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { uploadToImgBB, updateUserProfilePhoto } from '../services/storeService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdatePhoto: (newPhotoUrl: string) => void;
}

export const ProfilePhotoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onUpdatePhoto,
}) => {
  if (!isOpen) return null;

  const [previewUrl, setPreviewUrl] = useState<string>(user.photoUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('অনুগ্রহ করে একটি ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('ছবির সাইজ ১০ মেগাবাইটের কম হতে হবে');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsUploading(true);

    try {
      // Local instant preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Upload to ImgBB
      const uploadedUrl = await uploadToImgBB(file);
      
      updateUserProfilePhoto(uploadedUrl, user.email);
      onUpdatePhoto(uploadedUrl);
      setPreviewUrl(uploadedUrl);
      setSuccessMsg('প্রোফাইল ছবি সফলভাবে ImgBB-তে আপলোড ও সেভ হয়েছে!');

      setTimeout(() => {
        setIsUploading(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setIsUploading(false);
      setErrorMsg(err?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  const handleRemovePhoto = () => {
    updateUserProfilePhoto('', user.email);
    onUpdatePhoto('');
    setPreviewUrl('');
    setSuccessMsg('প্রোফাইল ছবি মুছে ফেলা হয়েছে');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">প্রোফাইল ছবি আপলোড</h3>
              <p className="text-[11px] text-gray-300">ImgBB ক্লাউড আপলোড</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">

          {/* Current Avatar Preview */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-neutral-900 text-white border-4 border-gray-100 shadow-md flex items-center justify-center overflow-hidden font-bold text-3xl uppercase">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt={user.name} 
                    className="w-full h-full object-cover" 
                    onError={() => setPreviewUrl('')}
                  />
                ) : (
                  <span>{user.name ? user.name.slice(0, 2) : "AS"}</span>
                )}
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-black/70 rounded-full flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-1" />
                  <span className="text-[10px] font-bold">আপলোড হচ্ছে</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 mt-2 font-semibold">
              {user.name}
            </p>
          </div>

          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* Direct File Selector / Upload Box */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-gray-300 hover:border-black rounded-2xl p-5 text-center cursor-pointer transition bg-gray-50/70 hover:bg-gray-50 flex flex-col items-center justify-center gap-2 group ${
              isUploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 group-hover:bg-amber-100 text-amber-600 flex items-center justify-center transition">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-800 block">
                গ্যালারি থেকে ছবি সিলেক্ট করুন
              </span>
              <span className="text-[11px] text-gray-500">
                ক্লিক করে ছবি নির্বাচন করুন (ImgBB-তে আপলোড হবে)
              </span>
            </div>
          </div>

          {/* Remove photo option if user has a photo */}
          {previewUrl && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isUploading}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 cursor-pointer transition py-1 px-3 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ছবি মুছে ফেলুন (Remove Photo)</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
