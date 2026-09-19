import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Sparkles, Clock, Phone, Zap, Wallet, Star, User, RefreshCw, MessageSquare } from 'lucide-react';
import { AppSettings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reviewsCount?: number;
  helplinePhone?: string;
  settings?: AppSettings;
  onOpenAddMoney?: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

interface CategoryGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  buttons: {
    label: string;
    answer: string;
  }[];
}

export const AiSupportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  reviewsCount = 15,
  helplinePhone,
  settings,
  onOpenAddMoney,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic values pulled directly from site settings or user request fallbacks
  const activePhone = settings?.payments?.bkash || helplinePhone || '01770931981';
  const activeHours = settings?.operatingHours || 'সকাল ১০:০০ টা থেকে রাত ১০:০০ টা (প্রতিদিন)';
  const activeDelivery = settings?.deliverySpeedText || 'স্বয়ংক্রিয় ও তাৎক্ষণিক ডেলিভারি (সাধারণত ৫ থেকে ১৫ মিনিটের মধ্যে)';

  const initialBotMsg: Message = {
    id: 'init-1',
    sender: 'bot',
    text: 'সালাম / নমস্কার! 👋 আমাদের স্টোর হেল্প সেন্টারে স্বাগতম।\n\nনিচের যেকোনো ক্যাটাগরির বাটনে টিপ দিলেই স্বয়ংক্রিয়ভাবে লাইভ সাইটের তথ্য পাবেন!',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<Message[]>([initialBotMsg]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  // Distinct category groups dynamically connected to live site settings (Bangla + Banglish)
  const categoryGroups: CategoryGroup[] = [
    {
      id: 'greetings',
      title: '🌸 সম্ভাষণ ও কুশল বিনিময়',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
      color: 'bg-amber-500/10 border-amber-200 dark:border-amber-800/50',
      buttons: [
        { label: 'আসসালামু আলাইকুম', answer: 'ওয়ালাইকুম আসসালাম! 🌸 আমাদের স্টোরে আপনাকে স্বাগতম। কীভাবে সাহায্য করতে পারি?' },
        { label: 'salam / slm', answer: 'ওয়ালাইকুম আসসালাম! 🌸 আমাদের স্টোরে আপনাকে স্বাগতম।' },
        { label: 'নমস্কার', answer: 'নমস্কার! 🙏 আমাদের স্টোরে আপনাকে স্বাগতম।' },
        { label: 'nomoskar / hi', answer: 'হ্যালো! 👋 আমি আপনার স্টোর চ্যাটবট। কীভাবে সাহায্য করব?' },
        { label: 'কেমন আছেন?', answer: 'আলহামদুলিল্লাহ্‌ / ভালো আছি! 😊 বলুন, কীভাবে সাহায্য করতে পারি?' },
        { label: 'kemon aso', answer: 'আলহামদুলিল্লাহ্‌ / ভালো আছি! 😊 বলুন, কী সাহায্য করতে পারি?' },
      ],
    },
    {
      id: 'timing',
      title: '⏰ খোলার ও বন্ধের সময়',
      icon: <Clock className="w-3.5 h-3.5 text-blue-500" />,
      color: 'bg-blue-500/10 border-blue-200 dark:border-blue-800/50',
      buttons: [
        { label: 'কয়টা পর্যন্ত খোলা থাকে?', answer: `⏰ **অপারেশন সময়:** ${activeHours}` },
        { label: 'koyta porjonto khola', answer: `⏰ **অপারেশন সময়:** ${activeHours}` },
        { label: 'কখন বন্ধ হয়?', answer: `⏰ **অপারেশন সময়:** ${activeHours}` },
        { label: 'time koto / bondho kobe', answer: `⏰ **কাস্টমার সাপোর্ট ও অপারেশন সময়:** ${activeHours}` },
      ],
    },
    {
      id: 'helpline',
      title: '📞 হেল্পলাইন ও পেমেন্ট নম্বর',
      icon: <Phone className="w-3.5 h-3.5 text-emerald-500" />,
      color: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/50',
      buttons: [
        { label: 'হেল্পলাইন নম্বর কত?', answer: `📞 **হেল্পলাইন ও পেমেন্ট নম্বর (bKash/Nagad/WhatsApp):** ${activePhone}` },
        { label: 'helpline number koto', answer: `📞 **হেল্পলাইন ও পেমেন্ট নম্বর:** ${activePhone}` },
        { label: 'হোয়াটসঅ্যাপ নম্বর কত?', answer: `💬 **হোয়াটসঅ্যাপ নম্বর:** ${activePhone}` },
        { label: 'whatsapp num / phone num', answer: `💬 **অফিশিয়াল যোগাযোগ নম্বর:** ${activePhone}` },
      ],
    },
    {
      id: 'delivery',
      title: '⚡ কত মিনিটে ডেলিভারি?',
      icon: <Zap className="w-3.5 h-3.5 text-purple-500" />,
      color: 'bg-purple-500/10 border-purple-200 dark:border-purple-800/50',
      buttons: [
        { label: 'কত মিনিটে ডেলিভারি পাব?', answer: `⚡ **ডেলিভারি তথ্য:** ${activeDelivery}` },
        { label: 'koto minethy delivery', answer: `⚡ **ডেলিভারি তথ্য:** ${activeDelivery}` },
        { label: 'কতক্ষণ সময় লাগে?', answer: `⚡ **ডেলিভারি তথ্য:** ${activeDelivery}` },
        { label: 'koto minit lagbe / delivery time', answer: `⚡ **ডেলিভারি তথ্য:** ${activeDelivery}` },
      ],
    },
    {
      id: 'add-money',
      title: '💳 টাকা অ্যাড করার নিয়ম',
      icon: <Wallet className="w-3.5 h-3.5 text-pink-500" />,
      color: 'bg-pink-500/10 border-pink-200 dark:border-pink-800/50',
      buttons: [
        { label: 'টাকা অ্যাড করার নিয়ম কী?', answer: `💳 **টাকা অ্যাড করার নিয়ম:**\n১. 'টাকা অ্যাড করুন' বাটনে চাপ দিন।\n২. আমাদের পার্সোনাল নম্বর (${activePhone}) কপি করে Send Money করুন।\n৩. আপনার নম্বর ও TrxID দিয়ে সাবমিট করুন।` },
        { label: 'taka add korbo kemne', answer: `💳 **টাকা অ্যাড করার নিয়ম:**\n১. 'টাকা অ্যাড করুন' বাটনে চাপ দিন।\n২. আমাদের পার্সোনাল নম্বর (${activePhone}) কপি করে Send Money করুন।\n৩. আপনার নম্বর ও TrxID দিয়ে সাবমিট করুন।` },
        { label: 'রিচার্জ করব কীভাবে?', answer: `💳 বিকাশ বা নগদে (${activePhone}) টাকা পাঠাইয়া নম্বর ও TrxID সাবমিট করলেই ব্যালেন্স অ্যাড হয়ে যাবে।` },
        { label: 'add money kivabe kore', answer: `💳 বিকাশ বা নগদে (${activePhone}) টাকা পাঠাইয়া নম্বর ও TrxID সাবমিট করলেই ব্যালেন্স অ্যাড হয়ে যাবে।` },
      ],
    },
    {
      id: 'reviews',
      title: '⭐ কাস্টমার রিভিউ ও রেটিং',
      icon: <Star className="w-3.5 h-3.5 text-amber-500" />,
      color: 'bg-amber-500/10 border-amber-200 dark:border-amber-800/50',
      buttons: [
        { label: 'কতজন রিভিউ দিয়েছেন?', answer: `⭐ আমাদের স্টোরে এখন পর্যন্ত ${reviewsCount > 0 ? reviewsCount : 15}+ জন সন্তুষ্ট কাস্টমার ৫-স্টার রিভিউ দিয়েছেন!` },
        { label: 'koyjon review dise', answer: `⭐ আমাদের স্টোরে এখন পর্যন্ত ${reviewsCount > 0 ? reviewsCount : 15}+ জন সন্তুষ্ট কাস্টমার ৫-স্টার রিভিউ দিয়েছেন!` },
        { label: 'কাস্টমার রেটিং কেমন?', answer: `⭐ ${reviewsCount > 0 ? reviewsCount : 15}+ জন কাস্টমার রেটিং ও মতামত দিয়েছেন।` },
      ],
    },
    {
      id: 'owner',
      title: '👤 স্টোর এডমিন ও মালিক',
      icon: <User className="w-3.5 h-3.5 text-indigo-500" />,
      color: 'bg-indigo-500/10 border-indigo-200 dark:border-indigo-800/50',
      buttons: [
        { label: 'স্টোরের মালিক কে?', answer: '👤 এই স্টোরটি আমাদের অফিশিয়াল স্টোর এডমিন কর্তৃপক্ষ পরিচালনা করে।' },
        { label: 'malik ke / owner ke', answer: '👤 এই স্টোরটি আমাদের অফিশিয়াল স্টোর এডমিন কর্তৃপক্ষ পরিচালনা করে।' },
        { label: 'এডমিন কে?', answer: `👤 অফিশিয়াল এডমিন। প্রয়োজনে হেল্পলাইন নম্বরে (${activePhone}) কল বা হোয়াটসঅ্যাপ করুন।` },
      ],
    },
  ];

  // Handle Button Click (Appends User Msg then Bot Answer Msg)
  const handleTapButton = (label: string, answerText: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: label,
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 200);
  };

  const handleResetChat = () => {
    setMessages([initialBotMsg]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#16181f] text-gray-900 dark:text-white rounded-2xl w-full max-w-md h-[620px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white p-3.5 flex items-center justify-between flex-shrink-0 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center relative">
              <Bot className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-neutral-900"></span>
            </div>
            <div>
              <h2 className="text-sm font-bold font-heading leading-tight">স্টোর চ্যাটবট</h2>
              <p className="text-[10px] text-gray-400">বাটনে টিপ দিলেই উত্তর পাবেন</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              title="চ্যাট ক্লিয়ার করুন"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Display Area */}
        <div className="h-[230px] flex-shrink-0 p-3.5 overflow-y-auto space-y-3 bg-gray-50/70 dark:bg-[#12141a] border-b border-gray-200/80 dark:border-gray-800">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                  msg.sender === 'user'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                    : 'bg-amber-500 text-black shadow-2xs'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-black rounded-tr-none font-semibold'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200/80 dark:border-gray-700 rounded-tl-none font-normal'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[8px] mt-0.5 text-right ${
                    msg.sender === 'user' ? 'text-gray-300 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Category Tap Buttons Container (Scrollable separated categories below) */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-white dark:bg-[#16181f]">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pb-0.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span>যেকোনো বাটনে টিপ দিন (Tap to Ask):</span>
          </div>

          {categoryGroups.map((group) => (
            <div
              key={group.id}
              className={`rounded-xl border p-2.5 transition ${group.color}`}
            >
              {/* Group Title */}
              <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-gray-900 dark:text-white">
                <span>{group.title}</span>
              </div>

              {/* Group Tap Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {group.buttons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTapButton(btn.label, btn.answer)}
                    className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-amber-400 dark:hover:text-black text-gray-800 dark:text-gray-200 border border-gray-300/80 dark:border-gray-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-95"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Optional Add Money Quick Action Bar */}
        {onOpenAddMoney && (
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
              টাকা অ্যাড করবেন?
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenAddMoney();
              }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black font-bold text-[11px] rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <Wallet className="w-3 h-3" />
              টাকা অ্যাড করুন
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
