"use client";

import { useAuth } from "@/contexts/auth-context";
import { getFirstValidationError, registerSchema } from "@/lib/validation";
import { ArrowRight, Eye, EyeOff, ShoppingBasket, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { TermsModal } from "@/components/terms-modal";

// Reusable Field component
function Field({
  label,
  hint,
  children,
  error,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700 flex items-center justify-between">
        {label}
        {hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100 disabled:opacity-50 disabled:cursor-not-allowed";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  // Form state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // UI state
  const [view, setView] = useState<"form" | "success">("form");
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Terms modal state
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Form field handlers
  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (formErrors[field]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };
  }

  // Validate and submit registration form
  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setRegistrationError(null);

    const parsed = registerSchema.safeParse({
      fullName: form.fullName,
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
    });

    if (!parsed.success) {
      const error = getFirstValidationError(parsed.error);
      setFormErrors({ email: error });
      return;
    }

    // Show terms modal instead of immediately submitting
    setShowTermsModal(true);
  }

  // Handle terms acceptance and proceed with registration
  async function handleTermsAccepted() {
    setShowTermsModal(false);
    setSubmitLoading(true);
    
    try {
      // Register user directly without OTP
      await register({
        fullName: form.fullName,
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      
      // Show success view
      setView("success");
      
      // Redirect after brief animation
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setRegistrationError(message);
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25 transition-transform group-hover:scale-105">
            <ShoppingBasket className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            StreetLux<span className="text-rose-500">City</span>
          </span>
        </Link>
        
        {view === "form" && (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-2 text-sm text-slate-500">Join thousands of happy shoppers across South Africa.</p>
          </>
        )}
        
        {view === "success" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25 animate-bounce">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">You're all set! 🎉</h1>
            <p className="mt-2 text-sm text-slate-500">Redirecting you to your new account...</p>
          </>
        )}
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm sm:shadow-md relative">
        
        {/* Registration Form View */}
        {view === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
            {/* Registration Error Alert */}
            {registrationError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-red-800">Registration failed</p>
                  <p className="text-red-700 mt-0.5">{registrationError}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={formErrors.fullName}>
                <input
                  className={inputClass}
                  placeholder="Jane Doe"
                  required
                  value={form.fullName}
                  onChange={update("fullName")}
                  disabled={submitLoading}
                  autoComplete="name"
                />
              </Field>
              <Field label="Email address" error={formErrors.email}>
                <input
                  className={inputClass}
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  disabled={submitLoading}
                />
              </Field>
            </div>

            <Field label="Password" error={formErrors.password}>
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  placeholder="At least 8 characters"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={update("password")}
                  disabled={submitLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone number" hint="optional" error={formErrors.phone}>
                <input
                  className={inputClass}
                  placeholder="+27 82 123 4567"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  disabled={submitLoading}
                />
              </Field>
              <Field label="Delivery address" hint="optional" error={formErrors.address}>
                <input
                  className={inputClass}
                  placeholder="Cape Town, South Africa"
                  value={form.address}
                  onChange={update("address")}
                  disabled={submitLoading}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none"
            >
              {submitLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Success View */}
        {view === "success" && (
          <div className="py-8 text-center">
            <div className="space-y-2">
              <p className="text-slate-600">Welcome, <span className="font-semibold text-slate-900">{form.fullName.split(" ")[0]}!</span></p>
              <p className="text-sm text-slate-400">Setting up your experience...</p>
            </div>
            <div className="mt-6 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full animate-pulse" style={{ width: "100%" }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer Links */}
      {view !== "success" && (
        <>
          <div className="mt-5 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-rose-500 hover:text-rose-600 transition-colors">
              Sign in
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By creating an account you agree to our{" "}
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
        </>
      )}

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleTermsAccepted}
        title="Terms and Conditions"
        description="Please read and accept our terms and conditions to continue with registration."
        buttonText="I Accept"
      />
    </div>
  );
}