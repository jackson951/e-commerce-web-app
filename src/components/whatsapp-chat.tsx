"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, Send, Phone, MapPin, Clock } from "lucide-react";
import Link from "next/link";

export function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Hide chat on mobile screens to avoid conflicts with mobile navigation
  useEffect(() => {
    const checkVisibility = () => {
      setIsVisible(window.innerWidth >= 768);
    };
    
    checkVisibility();
    window.addEventListener('resize', checkVisibility);
    return () => window.removeEventListener('resize', checkVisibility);
  }, []);

  const whatsappNumber = "+27661802747";
  const whatsappMessage = encodeURIComponent("Hello! I need help with my order.");

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Chat with us on WhatsApp"
        >
          {/* Animated ring effect */}
          <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping group-hover:animate-none"></div>
          
          {/* Main button */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
            <svg className="h-8 w-8 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.199 2.096 3.2 5.077 4.487.709.306 1.263.487 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
            </svg>
            
            {/* Floating message bubble */}
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <span className="text-xs font-bold text-green-500">?</span>
            </div>
          </div>
        </button>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className="w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-green-500 to-emerald-500 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                  <svg className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.199 2.096 3.2 5.077 4.487.709.306 1.263.487 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">StreetLuxCity Support</p>
                  <p className="text-xs text-green-100">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={whatsappUrl}
                  className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat Now
                </Link>
                <Link
                  href={`tel:${whatsappNumber}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call Us
                </Link>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Information</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-green-500" />
                    <span>South Africa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-green-500" />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>

              {/* Quick Questions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Questions</p>
                <div className="space-y-2">
                  <Link
                    href={`${whatsappUrl}&text=${encodeURIComponent("I need help with my order status.")}`}
                    className="block rounded-lg bg-slate-50 p-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Order Status
                  </Link>
                  <Link
                    href={`${whatsappUrl}&text=${encodeURIComponent("I want to return an item.")}`}
                    className="block rounded-lg bg-slate-50 p-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Returns & Refunds
                  </Link>
                  <Link
                    href={`${whatsappUrl}&text=${encodeURIComponent("I have a question about shipping.")}`}
                    className="block rounded-lg bg-slate-50 p-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Shipping Info
                  </Link>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex gap-2">
                <Link
                  href={whatsappUrl}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  Start Chat
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}