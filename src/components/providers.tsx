"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import ToasterProvider from "@/app/ToasterProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <ToasterProvider />
      </CartProvider>
    </AuthProvider>
  );
}
