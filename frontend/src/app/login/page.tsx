"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Building, ArrowRight, Shield, UserCheck, Calculator } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await login(email, password);
      showToast({
        type: "success",
        title: "Welcome Back",
        message: "Successfully signed in to Luxury Realty Portal.",
      });
      router.push("/");
    } catch (err: any) {
      const friendlyMsg =
        err?.status === 401
          ? "Invalid email or password. Please verify your credentials and try again."
          : err?.message || "Unable to connect to the authentication server.";
      setErrorMessage(friendlyMsg);
      showToast({
        type: "error",
        title: "Authentication Failed",
        message: friendlyMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-[#070D1E] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-950/40 mb-3 border border-amber-300/40">
          MH
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          MY HOUSE
        </h1>
        <p className="text-xs uppercase tracking-widest font-semibold text-amber-400 mt-0.5">
          Real Estate Management System
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <Card variant="glass" className="border border-slate-800/90 shadow-2xl">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-lg">Staff Portal Access</CardTitle>
              <CardDescription>
                Sign in with your authorized agency credentials to access listings, deals, and records.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-2 space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Staff Email / Username"
                type="email"
                placeholder="staff@myhouse.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                autoComplete="current-password"
              />

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="gold"
                size="md"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full mt-2"
              >
                Sign In to Dashboard
              </Button>
            </form>

            {/* Quick-Demo Role Presets */}
            <div className="pt-4 border-t border-slate-800/80">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 text-center mb-2.5">
                Quick Demo Login Presets
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill("admin.paytest@luxuryrealty.com", "AdminPass2026!")
                  }
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex flex-col gap-0.5"
                >
                  <span className="flex items-center gap-1 text-[11px] font-bold text-purple-300">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">Full Agency</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill("accountant.paytest@luxuryrealty.com", "AccountantPass2026!")
                  }
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex flex-col gap-0.5"
                >
                  <span className="flex items-center gap-1 text-[11px] font-bold text-teal-300">
                    <Calculator className="w-3 h-3" /> Accountant
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">Payment Ledger</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-slate-500 text-center mt-8 relative z-10">
        &copy; 2026 My House Real Estate Management System. All rights reserved.
      </p>
    </div>
  );
}
