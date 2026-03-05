"use client";

import { RequireAuth } from "@/components/route-guards";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getOrderStatusLabel } from "@/lib/order-tracking";
import { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
  PackageSearch,
  ShoppingBasket,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function statusStyle(status: string) {
  switch (status) {
    case "DELIVERED":
      return { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
    case "SHIPPED":
      return { color: "bg-blue-100 text-blue-700", icon: Truck };
    case "CANCELLED":
      return { color: "bg-red-100 text-red-700", icon: Clock3 };
    default:
      return { color: "bg-amber-100 text-amber-700", icon: Clock3 };
  }
}

function OrderCard({ order }: { order: Order }) {
  const { color, icon: Icon } = statusStyle(order.status);
  const label = getOrderStatusLabel(order.status);
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const preview = (order.items || []).slice(0, 2);
  const remaining = (order.items?.length || 0) - preview.length;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            Order
          </p>
          <p className="font-extrabold text-slate-900 tracking-tight">{order.orderNumber}</p>
          <p className="mt-0.5 text-xs text-slate-400">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${color}`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
          {order.isDelivery && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Truck className="h-3 w-3 text-rose-500" />
              Delivery
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-slate-100" />

      {/* Items preview */}
      <ul className="space-y-2">
        {preview.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-slate-700 truncate max-w-[60%]">
              {item.productName}
              <span className="ml-1.5 text-slate-400">× {item.quantity}</span>
            </span>
            <span className="font-semibold text-slate-900 shrink-0">{formatCurrency(item.subtotal)}</span>
          </li>
        ))}
        {remaining > 0 && (
          <li className="text-xs text-slate-400">+{remaining} more {remaining === 1 ? "item" : "items"}</li>
        )}
      </ul>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{itemCount} {itemCount === 1 ? "item" : "items"} · Total</p>
          <p className="text-lg font-extrabold text-rose-500">{formatCurrency(order.totalAmount)}</p>
        </div>
        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-all group-hover:border-rose-200"
        >
          View details <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export default function OrdersPage() {
  const { token, isAdmin, effectiveCustomerId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    if (!isAdmin && !effectiveCustomerId) { setOrders([]); setLoading(false); return; }

    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const data = isAdmin
          ? await api.adminListOrders(token)
          : await api.listOrders(token, effectiveCustomerId as string);
        setOrders(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, effectiveCustomerId, isAdmin]);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 shadow-lg shadow-rose-500/25">
            <ShoppingBasket className="h-4 w-4 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {isAdmin ? "All Orders" : "My Orders"}
            </h1>
            <p className="text-sm text-slate-500">
              {isAdmin ? "All customer purchases across the store." : "Track your purchases and deliveries."}
            </p>
          </div>
        </div>

        {/* Summary pill */}
        {!loading && !error && orders.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <Package className="h-4 w-4 text-rose-500" />
              {orders.length} {orders.length === 1 ? "order" : "orders"} total
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {orders.filter((o) => o.status === "DELIVERED").length} delivered
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              <Clock3 className="h-4 w-4" />
              {orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED").length} in progress
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
            Loading your orders…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Something went wrong loading your orders. Please try refreshing the page.
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <PackageSearch className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No orders yet</h2>
            <p className="mt-1 text-sm text-slate-500">When you place an order, it'll show up here.</p>
            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-colors"
            >
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Orders list */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

      </div>
    </RequireAuth>
  );
}