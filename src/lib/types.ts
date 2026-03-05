export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  active: boolean;
  imageUrls: string[];
  category: Category;
};

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Cart = {
  id: string;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
};

export type CustomerProfile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type OrderStatus =
  | "ORDER_RECEIVED"
  | "PROCESSING_PACKING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee?: number;
  isDelivery?: boolean;
  shippingAddress?: string;
  createdAt: string;
  customerId: string;
  items: OrderItem[];
  customerName?: string;
  customerEmail?: string;
  customer?: {
    id: string;
    fullName?: string;
    email?: string;
  };
};

export type OrderTrackingStage = {
  step: number;
  status: OrderStatus;
  label: string;
  completed: boolean;
  current: boolean;
};

export type OrderTracking = {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  deliveryFee?: number;
  isDelivery?: boolean;
  shippingAddress?: string;
  createdAt: string;
  stages: OrderTrackingStage[];
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  customerId: string | null;
};

export type AuthResponse = {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  user: AuthUser;
};

export type PaymentProvider = "CARD";
export type PaymentStatus = "APPROVED" | "DECLINED";

export type PaymentMethod = {
  id: string;
  provider: PaymentProvider;
  cardHolderName: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  billingAddress?: string;
  defaultMethod: boolean;
  enabled: boolean;
  createdAt: string;
};

export type PaymentTransaction = {
  id: string;
  orderId?: string;
  checkoutSessionId?: string;
  customerId: string;
  paymentMethodId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gatewayResponseCode?: string;
  gatewayMessage?: string;
  processedAt: string;
};

export type CheckoutSessionStatus =
  | "INITIATED"
  | "PAYMENT_PENDING"
  | "APPROVED"
  | "FAILED"
  | "EXPIRED"
  | "CONSUMED";

export type CheckoutSessionItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type CheckoutSession = {
  id: string;
  checkoutSessionId: string;
  customerId?: string;
  status: CheckoutSessionStatus;
  amount: number;
  currency?: string;
  createdAt?: string;
  expiresAt?: string;
  items: CheckoutSessionItem[];
  isDelivery?: boolean;
  shippingAddress?: string;
};

export type CheckoutSessionPayResponse = {
  status: PaymentStatus;
  gatewayResponseCode?: string;
  gatewayMessage?: string;
  paymentTransactionId?: string;
};

export type FinalizeCheckoutSessionResponse = {
  orderId: string;
  orderNumber?: string;
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  phone?: string;
  address?: string;
  enabled?: boolean;
  accountNonLocked?: boolean;
  accountNonExpired?: boolean;
  credentialsNonExpired?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUserUpdatePayload = {
  email: string;
  fullName: string;
  password?: string;
  roles: string[];
  enabled: boolean;
  phone?: string;
  address?: string;
};

// OTP Types
export type OtpType = "REGISTRATION" | "FORGOT_PASSWORD";

export type OtpResponse = {
  email: string;
  code: string;
  expiresAt: string;
  type: OtpType;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyOtpRequest = {
  email: string;
  code: string;
  type: OtpType;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  newPassword: string;
};
