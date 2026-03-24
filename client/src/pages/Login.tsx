import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, TrendingUp, Users, FileText, BarChart3, ShieldCheck, Clock } from "lucide-react";

const stats = [
  { icon: TrendingUp, label: "Revenue Tracked", value: "AED 2.4M+" },
  { icon: Users, label: "Active Clients", value: "142+" },
  { icon: FileText, label: "VAT Returns Filed", value: "600+" },
  { icon: Clock, label: "Hours Saved / Month", value: "1,200+" },
];

const features = [
  { icon: BarChart3, text: "Real-time financial dashboards" },
  { icon: ShieldCheck, text: "VAT & corporate tax compliance" },
  { icon: FileText, text: "Automated bookkeeping & payroll" },
  { icon: Users, text: "Multi-client management" },
];

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const success = await login(username, password);
    if (!success) {
      setError("Invalid credentials. Please try again.");
    } else {
      setLocation("/");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white login-page-enter">

      {/* Left Panel — Hero */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-[#1a2e1a]">
        {/* Background image via CSS */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80')",
          }}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2e1a]/95 via-[#1a3a1a]/90 to-[#0f2010]/95" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Top: Logo + name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#5a8a5a] flex items-center justify-center text-white font-bold text-sm tracking-wider flex-shrink-0">
              AS
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">
                Allianc Street Accounting
              </div>
              <div className="text-[#7ab87a] text-[10px] tracking-wide">
                Privet Limited
              </div>
            </div>
          </div>

          {/* Center: tagline + features */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="inline-block px-3 py-1 bg-[#5a8a5a]/20 border border-[#5a8a5a]/30 rounded text-[#7ab87a] text-xs tracking-widest uppercase">
                Enterprise ERP Platform
              </div>
              <h1 className="text-3xl xl:text-4xl font-bold text-white leading-snug">
                Smart Accounting &amp;<br />Bookkeeping Solutions
              </h1>
              <p className="text-[#a8c8a8] text-sm leading-relaxed max-w-sm">
                Streamline your financial operations with our all-in-one platform built for UAE &amp; UK compliance.
              </p>
            </div>

            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-[#5a8a5a]/20 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-3 h-3 text-[#7ab87a]" />
                  </div>
                  <span className="text-[#c0d8c0] text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <s.icon className="w-4 h-4 text-[#7ab87a] mb-1" />
                <div className="text-white font-semibold text-sm">{s.value}</div>
                <div className="text-[#7a9a7a] text-[10px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 w-full lg:max-w-[480px] flex flex-col items-center justify-between bg-[#f7f8f6] px-6 py-10 lg:px-12">

        {/* Mobile logo (hidden on desktop) */}
        <div className="lg:hidden flex flex-col items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#5a8a5a] flex items-center justify-center text-white font-bold text-base tracking-wider">
            AS
          </div>
          <div className="text-center">
            <div className="text-[#1a2e1a] font-semibold text-sm">Allianc Street Accounting</div>
            <div className="text-[#5a8a5a] text-xs">Privet Limited</div>
          </div>
        </div>

        {/* Form area */}
        <div className="w-full max-w-sm space-y-8 my-auto">
          {/* Heading */}
          <div className="space-y-1">
            <div className="hidden lg:flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-lg bg-[#5a8a5a] flex items-center justify-center text-white font-bold text-xs tracking-wider flex-shrink-0">
                AS
              </div>
              <div>
                <div className="text-[#1a2e1a] font-semibold text-sm leading-tight">
                  Allianc Street Accounting
                </div>
                <div className="text-[#5a8a5a] text-[10px] tracking-wide">Privet Limited</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#1a2e1a] tracking-tight">
              Welcome back
            </h2>
            <p className="text-[#6a7a6a] text-sm">
              Sign in to your ERP dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[#2a3a2a] text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-username"
                className="h-11 border-[#d0dcd0] bg-white text-[#1a2e1a] placeholder:text-[#a0b0a0] focus-visible:ring-[#5a8a5a] focus-visible:border-[#5a8a5a] rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#2a3a2a] text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
                className="h-11 border-[#d0dcd0] bg-white text-[#1a2e1a] placeholder:text-[#a0b0a0] focus-visible:ring-[#5a8a5a] focus-visible:border-[#5a8a5a] rounded-lg"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-[#5a8a5a] hover:bg-[#4a7a4a] text-white font-medium rounded-lg transition-colors duration-200"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
              ) : (
                <><Lock className="mr-2 h-4 w-4" /> Sign In</>
              )}
            </Button>
          </form>

          {/* Security note */}
          <div className="flex items-center gap-2 text-[#8a9a8a] text-xs">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-[#5a8a5a]" />
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[#9aaa9a] text-xs mt-8">
          © 2026 Allianc Street Accounting Privet Limited
        </div>
      </div>

      <style>{`
        .login-page-enter {
          animation: loginFadeIn 0.5s ease-out both;
        }
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
