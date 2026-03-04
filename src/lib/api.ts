import {
  AdminUser,
  AdminUserUpdatePayload,
  AuthResponse,
  Cart,
  Category,
  CheckoutSession,
  CheckoutSessionPayResponse,
  CustomerProfile,
  FinalizeCheckoutSessionResponse,
  Order,
  OrderStatus,
  OrderTracking,
  PaymentMethod,
  PaymentTransaction,
  Product
} from "@/lib/types";
import { httpClient } from "./web-api";

// Type definitions
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Cache invalidation prefixes for different resource types
const CACHE_INVALIDATION = {
  PRODUCTS: ["/products"],
  CATEGORIES: ["/categories", "/products"],
  ORDERS: ["/admin/orders", "/orders"],
  CUSTOMERS: ["/customers"],
  PAYMENT_METHODS: ["/customers/*/payment-methods"],
  CART: ["/customers/*/cart", "/customers/*/orders"],
} as const;

// API request wrapper using the new HTTP client
async function request<T>(
  path: string, 
  method: Method, 
  token?: string, 
  body?: unknown
): Promise<T> {
  return httpClient.request<T>(path, method, token, body);
}

// Cache invalidation wrapper
function invalidateGetCache(prefixes: string[]): void {
  httpClient.invalidateCache(prefixes);
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", "POST", undefined, { email, password }),
  register: (payload: { fullName: string; email: string; password: string; phone?: string; address?: string }) =>
    request<AuthResponse>("/auth/register", "POST", undefined, payload),
  me: (token: string) => request<AuthResponse["user"]>("/auth/me", "GET", token),
  getCustomer: (token: string, customerId: string) =>
    request<CustomerProfile>(`/customers/${customerId}`, "GET", token),
  updateCustomer: async (
    token: string,
    customerId: string,
    payload: { fullName: string; email: string; phone?: string; address?: string }
  ) => {
    const customer = await request<CustomerProfile>(`/customers/${customerId}`, "PUT", token, payload);
    invalidateGetCache([`/customers/${customerId}`]);
    return customer;
  },

  listProducts: () => request<Product[]>("/products", "GET"),
  getProduct: (id: string) => request<Product>(`/products/${id}`, "GET"),
  createProduct: async (token: string, payload: unknown) => {
    const created = await request<Product>("/products", "POST", token, payload);
    invalidateGetCache(["/products"]);
    return created;
  },
  updateProduct: async (token: string, productId: string, payload: unknown) => {
    const updated = await request<Product>(`/products/${productId}`, "PUT", token, payload);
    invalidateGetCache(["/products"]);
    return updated;
  },
  deleteProduct: async (token: string, productId: string) => {
    await request<void>(`/products/${productId}`, "DELETE", token);
    invalidateGetCache(["/products"]);
  },

  listCategories: () => request<Category[]>("/categories", "GET"),
  createCategory: async (token: string, payload: { name: string; description?: string }) => {
    const created = await request<Category>("/categories", "POST", token, payload);
    invalidateGetCache(["/categories", "/products"]);
    return created;
  },
  updateCategory: async (
    token: string,
    categoryId: string,
    payload: { name: string; description?: string }
  ) => {
    const updated = await request<Category>(`/categories/${categoryId}`, "PUT", token, payload);
    invalidateGetCache(["/categories", "/products"]);
    return updated;
  },
  deleteCategory: async (token: string, categoryId: string) => {
    await request<void>(`/categories/${categoryId}`, "DELETE", token);
    invalidateGetCache(["/categories", "/products"]);
  },
  adminListOrders: (token: string) => request<Order[]>("/admin/orders", "GET", token),
  adminGetOrderTracking: (token: string, orderId: string) =>
    request<OrderTracking>(`/admin/orders/${orderId}/tracking`, "GET", token),
  adminUpdateOrderStatus: async (token: string, orderId: string, status: OrderStatus) => {
    const updated = await request<Order>(`/admin/orders/${orderId}/status`, "PATCH", token, { status });
    invalidateGetCache(["/admin/orders", `/orders/${orderId}`, `/orders/${orderId}/tracking`, `/admin/orders/${orderId}/tracking`]);
    return updated;
  },
  adminListUsers: (token: string) => request<AdminUser[]>("/admin/users", "GET", token),
  adminSetUserAccess: async (token: string, userId: string, enabled: boolean) => {
    const updated = await request<AdminUser>(`/admin/users/${userId}/access?enabled=${enabled}`, "PATCH", token);
    invalidateGetCache(["/admin/users"]);
    return updated;
  },
  adminUpdateUser: async (token: string, userId: string, payload: AdminUserUpdatePayload) => {
    const updated = await request<AdminUser>(`/admin/users/${userId}`, "PUT", token, payload);
    invalidateGetCache(["/admin/users"]);
    return updated;
  },

  getCart: (token: string, customerId: string) => request<Cart>(`/customers/${customerId}/cart`, "GET", token),
  addToCart: async (token: string, customerId: string, productId: string, quantity: number) => {
    const cart = await request<Cart>(`/customers/${customerId}/cart/items`, "POST", token, { productId, quantity });
    invalidateGetCache([`/customers/${customerId}/cart`]);
    return cart;
  },
  updateCartItem: async (token: string, customerId: string, itemId: string, quantity: number) => {
    const cart = await request<Cart>(`/customers/${customerId}/cart/items/${itemId}`, "PATCH", token, { quantity });
    invalidateGetCache([`/customers/${customerId}/cart`]);
    return cart;
  },
  removeCartItem: async (token: string, customerId: string, itemId: string) => {
    const cart = await request<Cart>(`/customers/${customerId}/cart/items/${itemId}`, "DELETE", token);
    invalidateGetCache([`/customers/${customerId}/cart`]);
    return cart;
  },
  clearCart: async (token: string, customerId: string) => {
    const cart = await request<Cart>(`/customers/${customerId}/cart`, "DELETE", token);
    invalidateGetCache([`/customers/${customerId}/cart`]);
    return cart;
  },
  checkout: async (token: string, customerId: string) => {
    const session = await request<CheckoutSession>(`/customers/${customerId}/orders/checkout`, "POST", token);
    invalidateGetCache([`/customers/${customerId}/cart`, `/customers/${customerId}/orders`, "/admin/orders"]);
    return session;
  },
  createCheckoutSession: async (token: string) => {
    const data = await request<CheckoutSession & { sessionId?: string; checkoutSessionId?: string }>(
      "/checkout/sessions",
      "POST",
      token,
      {}
    );
    const resolvedId = data.id || data.sessionId || data.checkoutSessionId;
    if (!resolvedId) {
      throw new Error("Checkout session response is missing session ID.");
    }
    return {
      ...data,
      id: resolvedId
    } as CheckoutSession;
  },
  getCheckoutSession: (token: string, sessionId: string) => request<CheckoutSession>(`/checkout/sessions/${sessionId}`, "GET", token),
 payCheckoutSession: async (
  token: string,
  sessionId: string,
  paymentMethodId: string,
  cvv: string,
  idempotencyKey: string
) => {
  return request<CheckoutSessionPayResponse>(
    `/checkout/sessions/${sessionId}/pay`,
    "POST",
    token,
    {
      paymentMethodId,
      cvv,
      idempotencyKey // ← ADD THIS LINE
    }
  );
},
 finalizeCheckoutSession: async (token: string, sessionId: string, idempotencyKey: string) => {
  const finalized = await request<FinalizeCheckoutSessionResponse>(
    `/checkout/sessions/${sessionId}/finalize`,
    "POST",
    token,
    { idempotencyKey } // <- send the key
  );
  invalidateGetCache([
    "/admin/orders",
    `/orders/${finalized.orderId}`,
    `/orders/${finalized.orderId}/tracking`,
  ]);
  return finalized;
},
  listOrders: (token: string, customerId: string) => request<Order[]>(`/customers/${customerId}/orders`, "GET", token),
  getOrder: (token: string, orderId: string) => request<Order>(`/orders/${orderId}`, "GET", token),
  getOrderTracking: (token: string, orderId: string) => request<OrderTracking>(`/orders/${orderId}/tracking`, "GET", token),

  listPaymentMethods: (token: string, customerId: string) =>
    request<PaymentMethod[]>(`/customers/${customerId}/payment-methods`, "GET", token),
  createPaymentMethod: async (
    token: string,
    customerId: string,
    payload: {
      provider?: "CARD";
      cardHolderName: string;
      cardNumber: string;
      brand?: string;
      expiryMonth: number;
      expiryYear: number;
      billingAddress?: string;
      defaultMethod?: boolean;
    }
  ) => {
    const method = await request<PaymentMethod>(`/customers/${customerId}/payment-methods`, "POST", token, payload);
    invalidateGetCache([`/customers/${customerId}/payment-methods`]);
    return method;
  },
  setDefaultPaymentMethod: async (token: string, customerId: string, paymentMethodId: string) => {
    const method = await request<PaymentMethod>(
      `/customers/${customerId}/payment-methods/${paymentMethodId}/default`,
      "PATCH",
      token
    );
    invalidateGetCache([`/customers/${customerId}/payment-methods`]);
    return method;
  },
  setPaymentMethodEnabled: async (token: string, customerId: string, paymentMethodId: string, enabled: boolean) => {
    const method = await request<PaymentMethod>(
      `/customers/${customerId}/payment-methods/${paymentMethodId}/access?enabled=${enabled}`,
      "PATCH",
      token
    );
    invalidateGetCache([`/customers/${customerId}/payment-methods`]);
    return method;
  },
  processOrderPayment: async (token: string, orderId: string, paymentMethodId: string, cvv: string) => {
    const payment = await request<PaymentTransaction>(`/orders/${orderId}/payments`, "POST", token, {
      paymentMethodId,
      cvv
    });
    invalidateGetCache([`/orders/${orderId}/payments`, `/orders/${orderId}`, `/orders/${orderId}/tracking`, "/admin/orders"]);
    return payment;
  },
  listOrderPayments: (token: string, orderId: string) =>
    request<PaymentTransaction[]>(`/orders/${orderId}/payments`, "GET", token),
  listCustomerPayments: (token: string, customerId: string) =>
    request<PaymentTransaction[]>(`/customers/${customerId}/payments`, "GET", token),

  // OTP Endpoints
  forgotPassword: (email: string) =>
    request<void>("/auth/forgot-password", "POST", undefined, { email }),
  resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
    request<AuthResponse>("/auth/reset-password", "POST", undefined, payload),
  verifyOtp: (payload: { email: string; code: string; type: string }) =>
    request<{ valid: boolean }>("/auth/verify-otp", "POST", undefined, payload)
};
