export interface Package {
  name: string;
  price: number;
}

export interface Product {
  name: string;
  image: string;
  status: 'in' | 'out';
  avgRating?: string | number;
  delivery?: string;
  inputLabel?: string;
  description?: string;
  packages: Package[];
  categoryName?: string;
  regularPrice?: number;
  offerPrice?: number;
  duration?: string;
  subCategory?: string;
  priority?: number;
}

export interface Category {
  id?: string;
  name: string;
  priority?: number;
  products: Product[];
}

export interface Slide {
  img: string;
  link?: string;
}

export interface AppSettings {
  headerLogo: string;
  noticeText: string;
  favicon?: string;
  sliderData: Slide[];
  payments: {
    bkash: string;
    bkashImg: string;
    nagad: string;
    nagadImg: string;
  };
  walletPayImg?: string;
  manualPayImg?: string;
  popupIcon?: string;
  popupUrl?: string;
  operatingHours?: string;
  deliverySpeedText?: string;
  whatsappPhone?: string;
}

export interface Order {
  id: string;
  product: string;
  package: string;
  price: number;
  playerInfo: string;
  status: 'Pending' | 'Success' | 'Cancel';
  method: string;
  trx?: string;
  senderPhone?: string;
  userEmail?: string;
  timeString: string;
  timestamp?: number;
}

export interface Review {
  id: string;
  userName: string;
  userEmail?: string;
  memberId?: string;
  userPhoto?: string;
  productName: string;
  rating: number;
  comment: string;
  status?: string;
  timestamp?: string;
  dateFormatted?: string;
  helpfulCount?: number;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  isLoggedIn: boolean;
  memberId: string;
  joinDate?: string;
  photoUrl?: string;
}
