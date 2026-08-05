"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ReferPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    }
    init();
  }, []);

  async function handleCopy() {
    const url = `${window.location.origin}/?ref=${profile.referral_code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const referralUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${profile?.referral_code}`;
  const coinsPerReferral = { free: 25, starter: 50, pro: 100, premium: 200, business: 500, lifetime: 1000 }[profile?.plan || "free"];

  return (
    <div className="min-h-screen bg-[#030712] text-white">

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">P</div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Pero</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition">
            Dashboard
          </button>
          <button onClick={() => router.push("/")}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-sm font-semibold">
            ✨ Builder
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-16 flex flex-col gap-10">

        {/* Header */}
        <div className="text-center flex flex-col gap-4">
          <div className="text-6xl">🎁</div>
          <h1 className="text-4xl font-black">Invite friends, earn coins</h1>
          <p className="text-gray-400 text-lg">Share your referral link. When a friend signs up and builds their first app, you both earn coins.</p>
        </div>

        {/* Referral link card */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-bold">Your referral link</h2>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 font-mono truncate">
              {referralUrl}
            </div>
            <button onClick={handleCopy}
              className={`px-4 py-3 rounded-xl text-sm font-semibold transition ${
                copied
                  ? "bg-green-500/20 border border-green-500/30 text-green-400"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              }`}>
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=I'm building stunning apps with Pero AI App Builder! Try it free 👉 ${referralUrl}`, "_blank")}
              className="flex-1 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl text-xs text-sky-400 transition">
              Share on X
            </button>
            <button onClick={() => window.open(`https://wa.me/?text=Check out Pero AI App Builder! ${referralUrl}`, "_blank")}
              className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-xs text-green-400 transition">
              Share on WhatsApp
            </button>
            <button onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${referralUrl}`, "_blank")}
              className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-xs text-blue-400 transition">
              Share on LinkedIn
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Friends referred", value: profile?.referral_count || 0, icon: "👥", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20" },
            { label: "Coins per referral", value: coinsPerReferral, icon: "🪙", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20" },
            { label: "Total earned", value: (profile?.referral_count || 0) * coinsPerReferral, icon: "✨", color: "from-green-500/20 to-green-600/10", border: "border-green-500/20" },
          ].map(stat => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 flex flex-col gap-3`}>
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-3xl font-black">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-bold">How it works</h2>
          <div className="flex flex-col gap-4">
            {[
              { step: "1", title: "Share your link", desc: "Copy your unique referral link and share it with friends, on social media or in your community." },
              { step: "2", title: "Friend signs up", desc: "When someone clicks your link and creates a Pero account, they are linked to your referral." },
              { step: "3", title: "Both earn coins", desc: `When your friend builds their first app, you earn ${coinsPerReferral} coins and they get a 20 coin welcome bonus.` },
            ].map(item => (
              <div key={item.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coins per tier */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-bold">🪙 Referral rewards by plan</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { plan: "Free", coins: 25, color: "text-gray-400" },
              { plan: "Starter", coins: 50, color: "text-blue-400" },
              { plan: "Pro", coins: 100, color: "text-purple-400" },
              { plan: "Premium", coins: 200, color: "text-orange-400" },
              { plan: "Business", coins: 500, color: "text-yellow-400" },
              { plan: "Lifetime", coins: 1000, color: "text-amber-400" },
            ].map(item => (
              <div key={item.plan} className={`bg-black/30 rounded-xl p-3 text-center border ${profile?.plan === item.plan.toLowerCase() ? "border-blue-500/30" : "border-white/5"}`}>
                <p className={`font-bold text-lg ${item.color}`}>{item.coins}</p>
                <p className="text-xs text-gray-600 mt-0.5">{item.plan}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600">Higher plans earn more coins per referral. Upgrade to earn more!</p>
        </div>

      </div>
    </div>
  );
}