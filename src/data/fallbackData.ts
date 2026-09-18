import { AppSettings, Category } from '../types';

export const FALLBACK_SETTINGS: AppSettings = {
  headerLogo: "https://i.postimg.cc/prFhjX3v/20260514-210650.png",
  noticeText: "🌙 𝗘𝗶𝗱 𝗔𝗹-𝗔𝗱𝗵𝗮 𝗠𝘂𝗯𝗮𝗿𝗮𝗸 🔥 𝗦𝘁𝗼𝗿𝗲 𝗢𝗽𝗲𝗻 🕙 10 𝗔𝗠 - 10 𝗣𝗠",
  sliderData: [
    {
      img: "https://i.postimg.cc/14xVxvGg/6A6MX.jpg",
      link: ""
    },
    {
      img: "https://i.postimg.cc/1tncrdK2/Csuw-QP50U7c-HD.jpg",
      link: "https://i.postimg.cc/1tncrdK2/Csuw-QP50U7c-HD.jpg"
    },
    {
      img: "https://i.postimg.cc/9QXWwHWK/IMO6jnk-T9UI-HD.jpg",
      link: "https://i.postimg.cc/9QXWwHWK/IMO6jnk-T9UI-HD.jpg"
    }
  ],
  payments: {
    bkash: "01770931981",
    bkashImg: "https://image2url.com/r2/default/images/1771873681264-5007e02e-d0d0-441a-9408-84925b8a3df4.png",
    nagad: "01770931981",
    nagadImg: "https://image2url.com/r2/default/images/1771873719489-10dc2f9a-5961-4d22-a1c8-ef6805a3762f.png"
  },
  walletPayImg: "https://i.postimg.cc/kgfZVx8Y/20260514-212522.jpg",
  manualPayImg: "https://i.postimg.cc/4xDcQ0zN/20260514-212744.jpg"
};

export const FALLBACK_CATEGORIES: Category[] = [
  {
    name: "Special Offer ✨",
    priority: 1,
    products: [
      {
        name: "Crunchyroll",
        image: "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Crunchyroll Fan & Mega Fan subscription. Stream ad-free anime in ultra HD with offline viewing.",
        inputLabel: "Email or Crunchyroll Account ID",
        packages: [
          { name: "7 দিন 🔥", price: 45 },
          { name: "1 মাস 🔥", price: 160 },
          { name: "3 মাস 🔥", price: 450 }
        ]
      },
      {
        name: "WhatsApp 🇧🇩",
        image: "https://i.postimg.cc/ZKPbMfCR/20260525-224242.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Verified WhatsApp BD Number Account. Fast delivery and instant activation guarantee.",
        inputLabel: "WhatsApp / Contact Number",
        packages: [
          { name: "1 টি 🔥", price: 80 },
          { name: "5 টি 🔥", price: 380 }
        ]
      },
      {
        name: "Outlook",
        image: "https://i.postimg.cc/tg4jN492/20260525-224832.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Fresh Microsoft Outlook accounts with phone verification passed. Lifetime validity.",
        inputLabel: "Recipient Email / Telegram ID",
        packages: [
          { name: "1 টি 🔥", price: 3 },
          { name: "20 টি 🔥", price: 50 },
          { name: "50 টি 🔥", price: 120 }
        ]
      },
      {
        name: "Hotmail",
        image: "https://i.postimg.cc/tg4jN492/20260525-224832.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Fresh Hotmail accounts with IMAP/POP3 support.",
        inputLabel: "Recipient Email",
        packages: [
          { name: "1 টি 🔥", price: 3 },
          { name: "20 টি 🔥", price: 50 }
        ]
      },
      {
        name: "Park Account",
        image: "https://i.postimg.cc/50pQk0zy/20260525-225339.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Premium Gaming Park Verified Accounts.",
        inputLabel: "User Tag",
        packages: [
          { name: "1 টি 🔥", price: 150 }
        ]
      },
      {
        name: "FB ব্লু ব্যাচ",
        image: "https://i.postimg.cc/0jQRQf9t/20260515-103423.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Facebook Meta Verified Blue Tick Badge Setup & Service.",
        inputLabel: "Facebook Profile URL",
        packages: [
          { name: "1 মাস 🔥", price: 1250 }
        ]
      }
    ]
  },
  {
    name: "Movie 🎬",
    priority: 2,
    products: [
      {
        name: "Netflix",
        image: "https://i.postimg.cc/50pQk0zy/20260525-225339.jpg",
        status: "in",
        avgRating: "4.7",
        description: "Ultra 4K Ultra HD Netflix Shared & Private Profiles.",
        inputLabel: "Profile Name / Email",
        packages: [
          { name: "1 মাস (1 Screen) 🔥", price: 280 },
          { name: "1 মাস (Private) 🔥", price: 1150 }
        ]
      },
      {
        name: "Prime Video",
        image: "https://i.postimg.cc/0jQRQf9t/20260515-103423.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Amazon Prime Video full HD streaming account.",
        inputLabel: "Account Email",
        packages: [
          { name: "1 মাস 🔥", price: 130 },
          { name: "6 মাস 🔥", price: 650 }
        ]
      },
      {
        name: "Hulu",
        image: "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Hulu No-Ads Premium Subscription.",
        inputLabel: "Email Address",
        packages: [
          { name: "1 মাস 🔥", price: 180 }
        ]
      },
      {
        name: "HBO Max",
        image: "https://i.postimg.cc/ZKPbMfCR/20260525-224242.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Max (HBO) 4K Ultra HD streaming.",
        inputLabel: "Email Address",
        packages: [
          { name: "1 মাস 🔥", price: 210 }
        ]
      },
      {
        name: "Disney Plus",
        image: "https://i.postimg.cc/tg4jN492/20260525-224832.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Disney+ Premium 4K HDR account.",
        inputLabel: "Email Address",
        packages: [
          { name: "1 মাস 🔥", price: 220 }
        ]
      }
    ]
  },
  {
    name: "VPN 🛡",
    priority: 3,
    products: [
      {
        name: "Turbo VPN",
        image: "https://i.postimg.cc/50pQk0zy/20260525-225339.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Turbo VPN VIP account high-speed servers.",
        inputLabel: "Device Login Email",
        packages: [
          { name: "7 দিন 🔥", price: 35 },
          { name: "1 মাস 🔥", price: 120 }
        ]
      },
      {
        name: "Express VPN",
        image: "https://i.postimg.cc/0jQRQf9t/20260515-103423.jpg",
        status: "in",
        avgRating: "5.0",
        description: "ExpressVPN Unlimited speed and top security.",
        inputLabel: "Key Activation Email",
        packages: [
          { name: "1 মাস 🔥", price: 190 },
          { name: "3 মাস 🔥", price: 490 }
        ]
      },
      {
        name: "Surfshark",
        image: "https://i.postimg.cc/tg4jN492/20260525-224832.jpg",
        status: "in",
        avgRating: "5.0",
        description: "Surfshark VPN unlimited device logins.",
        inputLabel: "Account Email",
        packages: [
          { name: "1 মাস 🔥", price: 140 },
          { name: "1 বছর 🔥", price: 850 }
        ]
      },
      {
        name: "CyberGhost",
        image: "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg",
        status: "in",
        avgRating: "5.0",
        description: "CyberGhost VPN streaming optimized servers.",
        inputLabel: "Account Email",
        packages: [
          { name: "1 মাস 🔥", price: 140 }
        ]
      }
    ]
  },
  {
    name: "TopUp ⚡",
    priority: 4,
    products: [
      {
        name: "PUBG Mobile UC",
        image: "https://i.postimg.cc/50pQk0zy/20260525-225339.jpg",
        status: "in",
        avgRating: "5.0",
        description: "PUBG Global Instant Player ID TopUp. 100% safe direct reload.",
        inputLabel: "Player ID (UID)",
        packages: [
          { name: "60 UC 🔥", price: 115 },
          { name: "325 UC 🔥", price: 540 },
          { name: "660 UC 🔥", price: 1060 }
        ]
      },
      {
        name: "TikTok Coin",
        image: "https://i.postimg.cc/0jQRQf9t/20260515-103423.jpg",
        status: "in",
        avgRating: "5.0",
        description: "TikTok live recharge coins instant delivery.",
        inputLabel: "TikTok Username",
        packages: [
          { name: "70 Coins 🔥", price: 130 },
          { name: "350 Coins 🔥", price: 620 }
        ]
      }
    ]
  },
  {
    name: "Subscription 🔥",
    priority: 5,
    products: [
      {
        name: "CapCut Pro",
        image: "https://i.postimg.cc/LX3B21bG/20260515-103423.jpg",
        status: "in",
        avgRating: "5.0",
        description: "CapCut Pro license for Mobile and PC video editing.",
        inputLabel: "CapCut Email ID",
        packages: [
          { name: "1 মাস 🔥", price: 160 },
          { name: "1 বছর 🔥", price: 950 }
        ]
      }
    ]
  }
];
