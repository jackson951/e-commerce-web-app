"use client";

import { PaymentMethodForm } from "@/components/payment-method-form";
import { RequireAuth } from "@/components/route-guards";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { api } from "@/lib/api";
import { CheckoutSession, PaymentMethod } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  CreditCard,
  Lock,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBasket,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TermsModal } from "@/components/terms-modal";

function statusBadge(status?: string) {
  switch (status) {
    case "CONSUMED":
      return { label: "Order Placed", color: "bg-emerald-100 text-emerald-700" };
    case "APPROVED":
      return { label: "Approved", color: "bg-emerald-100 text-emerald-700" };
    case "FAILED":
      return { label: "Payment Failed", color: "bg-red-100 text-red-700" };
    case "EXPIRED":
      return { label: "Session Expired", color: "bg-slate-100 text-slate-600" };
    case "PAYMENT_PENDING":
      return { label: "Pending", color: "bg-amber-100 text-amber-700" };
    default:
      return { label: "In Progress", color: "bg-blue-100 text-blue-700" };
  }
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Review", "Payment", "Confirm"];
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-rose-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
              <span className={`mt-1 text-[10px] font-semibold ${active ? "text-rose-500" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 mb-4 h-px w-10 sm:w-16 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CheckoutPaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, effectiveCustomerId, canUseCustomerFeatures, hasAdminRole, viewMode } = useAuth();
  const { refreshCart, clearCart } = useCart();

  const sessionId = searchParams.get("sessionId") || "";
  const hasValidSessionId = /^[0-9a-fA-F-]{36}$/.test(sessionId);

  const [session, setSession]               = useState<CheckoutSession | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [cvv, setCvv]                       = useState("");
  const [loading, setLoading]               = useState(true);
  const [savingMethod, setSavingMethod]     = useState(false);
  const [processing, setProcessing]         = useState(false);
  const [showAddCard, setShowAddCard]       = useState(false);
  const [message, setMessage]               = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  // Terms modal state
  const [showTermsModal, setShowTermsModal] = useState(false);

  const defaultMethod = useMemo(
    () =>
      paymentMethods.find((m) => m.defaultMethod && m.enabled) ||
      paymentMethods.find((m) => m.enabled),
    [paymentMethods]
  );
  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId) || null;
  const itemCount = useMemo(
    () => session?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    [session?.items]
  );

  const loadData = useCallback(async () => {
    if (!token || !effectiveCustomerId || !sessionId || !hasValidSessionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [sessionData, methodsData] = await Promise.all([
        api.getCheckoutSession(token, sessionId),
        api.listPaymentMethods(token, effectiveCustomerId),
      ]);
      setSession(sessionData);
      setPaymentMethods(methodsData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, effectiveCustomerId, sessionId, hasValidSessionId]);

  useEffect(() => { loadData().catch(() => undefined); }, [loadData]);

  useEffect(() => {
    if (!selectedMethodId && defaultMethod) setSelectedMethodId(defaultMethod.id);
  }, [defaultMethod, selectedMethodId]);

  const canPay =
    session?.status === "INITIATED" ||
    session?.status === "PAYMENT_PENDING" ||
    session?.status === "FAILED";
  const cvvValid = /^\d{3,4}$/.test(cvv.trim());
  const badge = statusBadge(session?.status);

  // Validate payment details and show terms modal
  function handlePay() {
    if (!token || !selectedMethodId) { setError("Please choose a payment method."); return; }
    if (!cvvValid) { setError("Please enter a valid CVV (3 or 4 digits)."); return; }
    
    // Show terms modal instead of immediately processing payment
    setShowTermsModal(true);
  }

  // Handle terms acceptance and proceed with payment
  async function handleTermsAccepted() {
    // FIX: Add explicit null checks for TypeScript safety
    if (!token) {
      setError("Authentication required.");
      setShowTermsModal(false);
      return;
    }
    if (!selectedMethodId) {
      setError("Please choose a payment method.");
      setShowTermsModal(false);
      return;
    }
    if (!session?.checkoutSessionId) {
      setError("Invalid checkout session.");
      setShowTermsModal(false);
      return;
    }

    setProcessing(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.payCheckoutSession(
        token,
        session.checkoutSessionId, // Now TypeScript knows this is a string
        selectedMethodId,          // Now TypeScript knows this is a string
        cvv,
        idempotencyKey
      );
      if (result.status === "APPROVED") {
        refreshCart();
        const finalized = await api.finalizeCheckoutSession(token, session.checkoutSessionId, idempotencyKey);
        // Clear the cart after successful payment
        await clearCart();
        setMessage("Payment successful! Taking you to your order…");
        router.push(`/orders/${finalized.orderId}`);
      } else {
        setError(result.gatewayMessage || "Your payment was declined. Please try a different card.");
      }
      setSession(await api.getCheckoutSession(token, session.checkoutSessionId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
      setShowTermsModal(false);
    }
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* Logo + step indicator */}
        <div className="mb-8 flex flex-col items-center gap-5">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 shadow-lg shadow-rose-500/25">
              <ShoppingBasket className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              StreetLux<span className="text-rose-500">City</span>
            </span>
          </Link>
          <StepIndicator step={2} />
        </div>

        {/* Auth / session warnings */}
        {!canUseCustomerFeatures && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {hasAdminRole && viewMode === "ADMIN"
              ? "Switch to Customer View to complete your purchase."
              : "Only customer accounts can complete checkout."}
          </div>
        )}
        {(!sessionId || !hasValidSessionId) && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            This checkout link isn't valid. Please{" "}
            <Link href="/cart" className="font-semibold underline">go back to your cart</Link> and try again.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
            Loading your order…
          </div>
        )}

        {/* Error / success banners */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
          </div>
        )}

        {session && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            {/* ── LEFT: Payment ── */}
            <div className="space-y-5">

              {/* Saved cards */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <CreditCard className="h-5 w-5 text-rose-500" />
                  Choose a payment method
                </h2>

                {paymentMethods.length === 0 && !showAddCard && (
                  <p className="mb-4 text-sm text-slate-500">You have no saved cards. Add one below to continue.</p>
                )}

                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const selected = selectedMethodId === method.id;
                    return (
                      <label
                        key={method.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 px-4 py-3 transition-all ${
                          selected
                            ? "border-rose-400 bg-rose-50"
                            : method.enabled
                            ? "border-slate-200 bg-white hover:border-slate-300"
                            : "border-amber-200 bg-amber-50 opacity-60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          className="accent-rose-500"
                          checked={selected}
                          onChange={() => setSelectedMethodId(method.id)}
                          disabled={!method.enabled || !canPay}
                        />
                        {/* Card icon placeholder */}
                        <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                          {method.brand?.slice(0, 4) || "Card"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            •••• •••• •••• {method.last4}
                            {method.defaultMethod && (
                              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            Expires {String(method.expiryMonth).padStart(2, "0")}/{method.expiryYear}
                          </p>
                        </div>
                        {!method.enabled && (
                          <span className="text-xs font-semibold text-amber-600">Unavailable</span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* CVV field */}
                {selectedMethod && canPay && (
                  <div className="mt-4">
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-slate-700">
                        Security code (CVV)
                        <span className="ml-1 font-normal text-slate-400">— 3 or 4 digits on the back of your card</span>
                      </span>
                      <input
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                        className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                        placeholder="123"
                        inputMode="numeric"
                        maxLength={4}
                      />
                    </label>
                  </div>
                )}

                {/* Add new card toggle */}
                <button
                  type="button"
                  onClick={() => setShowAddCard((v) => !v)}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {showAddCard ? "Hide" : "Add a new card"}
                </button>

                {showAddCard && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <PaymentMethodForm
                      submitting={savingMethod}
                      buttonLabel="Save & use this card"
                      onSubmit={async (payload) => {
                        if (!token || !effectiveCustomerId) return;
                        setSavingMethod(true);
                        setError(null);
                        try {
                          const method = await api.createPaymentMethod(token, effectiveCustomerId, payload);
                          const updated = await api.listPaymentMethods(token, effectiveCustomerId);
                          setPaymentMethods(updated);
                          setSelectedMethodId(method.id);
                          setShowAddCard(false);
                          setMessage("Card saved! You can now complete your purchase.");
                        } finally {
                          setSavingMethod(false);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Pay button */}
              <button
                disabled={processing || !canPay || !selectedMethodId || !cvvValid}
                onClick={handlePay}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {processing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing your payment…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay {formatCurrency(session.amount)} securely
                  </>
                )}
              </button>

              {canPay && !cvvValid && selectedMethod && (
                <p className="text-center text-xs text-amber-600">Please enter your CVV to continue.</p>
              )}
              {!canPay && (
                <p className="text-center text-xs text-slate-500">This checkout session can no longer be paid.</p>
              )}

              {/* Trust line */}
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure payment</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-emerald-500" /> Encrypted checkout</span>
              </div>
            </div>

            {/* ── RIGHT: Order summary ── */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <Package className="h-5 w-5 text-rose-500" />
                  Order summary
                </h2>

                {/* Status pill */}
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${badge.color} mb-4`}>
                  {session.status === "CONSUMED" || session.status === "APPROVED"
                    ? <CheckCircle2 className="h-3 w-3" />
                    : <ShieldCheck className="h-3 w-3" />}
                  {badge.label}
                </span>

                {/* Items */}
                <ul className="space-y-3">
                  {session.items.map((item) => (
                    <li key={item.productId} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-slate-700 leading-snug">
                        {item.productName}
                        <span className="ml-1 text-slate-400">× {item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-500">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-xl font-extrabold text-slate-900">{formatCurrency(session.amount)}</p>
                  </div>
                </div>

                {session.createdAt && (
                  <p className="mt-3 text-xs text-slate-400">Order started: {formatDate(session.createdAt)}</p>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                <Link
                  href="/cart"
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ← Back to cart
                </Link>
                <Link
                  href="/orders"
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  My orders
                </Link>
              </div>

              {/* Terms link */}
              <p className="mt-4 text-center text-xs text-slate-400">
                By completing this purchase you agree to our{" "}
                <button 
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="underline hover:text-slate-600 cursor-pointer"
                >
                  Terms
                </button>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleTermsAccepted}
        title="Terms and Conditions"
        description="Please read and accept our terms and conditions to complete your purchase."
        buttonText="I Accept"
      />
    </RequireAuth>
  );
}