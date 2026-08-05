"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  const plans = [
    {
      id: "free", name: "Free", emoji: "🟩", price: "€0", period: "forever",
      desc: "Perfect for getting started",
      color: "from-gray-500/10 to-gray-600/5", border: "border-gray-500/20", highlight: false,
      coins: 50, rollover: "None", stackLimit: 20, coinsPerApp: 1, chatDiscount: "0%", withdrawal: "Cannot withdraw",
      features: [
        { text: "50 coins/month", included: true },
        { text: "3 saved projects", included: true },
        { text: "5 AI requests/day", included: true },
        { text: "Basic UI components", included: true },
        { text: "HTML/CSS export only", included: true },
        { text: "Community support", included: true },
        { text: "Coin rollover", included: false },
        { text: "React/Next.js export", included: false },
        { text: "Priority AI", included: false },
        { text: "Coding room", included: false },
      ],
      cta: "Get started free",
    },
    {
      id: "starter", name: "Starter", emoji: "🟦", price: "€9.99", period: "per month",
      desc: "For regular builders",
      color: "from-blue-500/10 to-cyan-500/5", border: "border-blue-500/20", highlight: false,
      coins: 300, rollover: "None", stackLimit: 50, coinsPerApp: 2, chatDiscount: "5%", withdrawal: "100 coins min",
      features: [
        { text: "300 coins/month", included: true },
        { text: "20 saved projects", included: true },
        { text: "200 AI requests/day", included: true },
        { text: "Full UI component library", included: true },
        { text: "React, Next.js, Flutter export", included: true },
        { text: "Basic backend generator", included: true },
        { text: "Faster AI responses", included: true },
        { text: "Email support", included: true },
        { text: "Coin rollover", included: false },
        { text: "Coding room", included: false },
      ],
      cta: "Start Starter",
    },
    {
      id: "pro", name: "Pro", emoji: "🟪", price: "€24.99", period: "per month",
      desc: "For serious builders",
      color: "from-purple-500/20 to-indigo-500/10", border: "border-purple-500/30", highlight: true,
      coins: 1000, rollover: "20%", stackLimit: 200, coinsPerApp: 5, chatDiscount: "10%", withdrawal: "100 coins min",
      features: [
        { text: "1,000 coins/month", included: true },
        { text: "Unlimited projects", included: true },
        { text: "Unlimited AI requests", included: true },
        { text: "AI Debugger + Auto-Fix", included: true },
        { text: "AI Architecture Designer", included: true },
        { text: "API Connector", included: true },
        { text: "Database Generator", included: true },
        { text: "2 team seats", included: true },
        { text: "20% coin rollover", included: true },
        { text: "Full coding room", included: true },
      ],
      cta: "Start Pro",
    },
    {
      id: "premium", name: "Premium", emoji: "🟧", price: "€49.99", period: "per month",
      desc: "For power users",
      color: "from-orange-500/10 to-amber-500/5", border: "border-orange-500/20", highlight: false,
      coins: 3000, rollover: "40%", stackLimit: 500, coinsPerApp: 10, chatDiscount: "20%", withdrawal: "100 coins min",
      features: [
        { text: "3,000 coins/month", included: true },
        { text: "5 team seats", included: true },
        { text: "Real-time collaboration", included: true },
        { text: "AI UI/UX Designer", included: true },
        { text: "AI Security Auditor", included: true },
        { text: "Custom Component Builder", included: true },
        { text: "Version control + rollback", included: true },
        { text: "Client handoff mode", included: true },
        { text: "40% coin rollover", included: true },
        { text: "Advanced coding room", included: true },
      ],
      cta: "Start Premium",
    },
    {
      id: "business", name: "Business", emoji: "🟨", price: "€99.99", period: "per month",
      desc: "For teams and agencies",
      color: "from-yellow-500/10 to-green-500/5", border: "border-yellow-500/20", highlight: false,
      coins: 8000, rollover: "60%", stackLimit: 1000, coinsPerApp: 20, chatDiscount: "30%", withdrawal: "100 coins min",
      features: [
        { text: "8,000 coins/month", included: true },
        { text: "15 team seats", included: true },
        { text: "Team Workspace", included: true },
        { text: "Role-Based Access Control", included: true },
        { text: "Audit Logs", included: true },
        { text: "Private Cloud Hosting", included: true },
        { text: "Custom AI Model Tuning", included: true },
        { text: "SLA uptime guarantee", included: true },
        { text: "60% coin rollover", included: true },
        { text: "Team coding rooms", included: true },
      ],
      cta: "Start Business",
    },
  ];

  const lifetimePlan = {
    id: "lifetime",
    features: [
      "100,000 coins/month",
      "Unlimited coin rollover forever",
      "500 lifetime seats — then gone forever",
      "Supreme Builder badge on all projects",
      "Pero Hall of Fame listing",
      "Governance rights — vote on features",
      "Direct line to founders",
      "Private Discord with Pero team",
      "3× permanent coin multiplier",
      "2× permanent AI speed",
      "Custom AI personality",
      "Early access to every feature forever",
      "Private dedicated AI model",
      "Unlimited projects + generations",
      "Unlimited team seats",
      "App Marketplace listing",
      "+10% revenue boost on marketplace sales",
      "White label mode",
      "Custom domain workspace",
      "Supreme Coding Chamber",
      "Unlimited code history + rollback",
      "AI pair programmer",
      "One-click deploy anywhere",
      "Dedicated account manager",
      "1-on-1 onboarding call",
      "24/7 priority support — 1hr response",
      "Feature request priority",
    ],
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleUpgrade(planId) {
    if (!user) { router.push("/login"); return; }
    setUpgrading(planId);
    const plan = [...plans, { id: "lifetime", coins: 100000 }].find(p => p.id === planId);
    await supabase.from("profiles").upsert({
      id: user.id, plan: planId, coins: plan.coins, lifetime_member: planId === "lifetime",
    });
    setProfile(prev => ({ ...prev, plan: planId, coins: plan.coins }));
    setUpgrading(null);
    alert(`✅ Upgraded to ${planId}! (Demo mode)`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = profile?.plan || "free";

  return (
    <div className="min-h-screen bg-[#030712] text-white">

      {/* NAVBAR */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">P</div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Pero</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition">Dashboard</button>
              <button onClick={() => router.push("/")} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-semibold transition">✨ Builder</button>
            </>
          ) : (
            <button onClick={() => router.push("/login")} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-semibold transition">Get started free</button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col gap-16">

        {/* HEADER */}
        <div className="text-center flex flex-col gap-4">
          <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mx-auto">Pricing</div>
          <h1 className="text-5xl md:text-6xl font-black">Simple, honest pricing</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">Start free. Upgrade when you need more power. Earn coins as you build.</p>
          {profile && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm mx-auto">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              You are on the <strong className="capitalize ml-1">{currentPlan}</strong> plan · <strong className="ml-1">{profile.coins || 0} coins</strong> remaining
            </div>
          )}
        </div>

        {/* COIN EXPLAINER */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">🪙 How Pero Coins work</h2>
              <p className="text-gray-400 text-sm leading-relaxed">Every plan comes with monthly coins. Spend them on AI generations and chat. <strong className="text-white">Earn coins back</strong> every time you successfully build an app. Higher tiers earn more coins per build and keep more unused coins each month.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              {[
                { icon: "⚡", label: "Simple chat", cost: "10 coins" },
                { icon: "🔧", label: "Medium chat", cost: "25 coins" },
                { icon: "🚀", label: "Advanced chat", cost: "50 coins" },
                { icon: "💥", label: "Heavy chat", cost: "100 coins" },
              ].map(item => (
                <div key={item.label} className="bg-black/30 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{item.icon}</div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-bold text-yellow-400">{item.cost}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PLANS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div key={plan.id} className={`bg-gradient-to-br ${plan.color} border ${plan.border} rounded-2xl p-5 flex flex-col gap-4 relative ${plan.highlight ? "ring-2 ring-purple-500/50 shadow-2xl shadow-purple-500/20" : ""}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-xs font-bold whitespace-nowrap">Most Popular</div>
                )}
                <div>
                  <div className="text-2xl mb-1">{plan.emoji}</div>
                  <h2 className="font-bold text-lg">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black">{plan.price}</span>
                    <span className="text-gray-500 text-xs">/{plan.period}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{plan.desc}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Monthly coins</span><span className="text-yellow-400 font-bold">{plan.coins.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Per app built</span><span className="text-green-400 font-bold">+{plan.coinsPerApp}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Chat discount</span><span className="text-blue-400 font-bold">{plan.chatDiscount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Rollover</span><span className={`font-bold ${plan.rollover === "None" ? "text-red-400" : "text-green-400"}`}>{plan.rollover === "None" ? "❌ None" : plan.rollover}</span></div>
                </div>
                <ul className="flex flex-col gap-1.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className={`flex items-start gap-1.5 text-xs ${f.included ? "text-gray-300" : "text-gray-700"}`}>
                      <span className={`mt-0.5 flex-shrink-0 ${f.included ? "text-green-400" : "text-gray-700"}`}>{f.included ? "✓" : "✗"}</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => isCurrent ? null : handleUpgrade(plan.id)}
                  disabled={isCurrent || upgrading === plan.id}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${isCurrent ? "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed" : plan.highlight ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg" : "bg-white/10 hover:bg-white/20 border border-white/10"}`}
                >
                  {isCurrent ? "✓ Current plan" : upgrading === plan.id ? "Upgrading..." : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* LIFETIME SUPREME */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-3xl blur-xl" />
          <div className="relative bg-gradient-to-br from-yellow-950/80 via-amber-950/60 to-yellow-950/80 border-2 border-yellow-500/40 rounded-3xl p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-bold animate-pulse">🔥 Only 500 seats ever — limited forever</div>
              <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-bold">💎 Supreme Edition</div>
            </div>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-6">
                <div>
                  <div className="text-5xl mb-3">💎</div>
                  <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">Lifetime Supreme</h2>
                  <p className="text-gray-400 mt-2">Own Pero forever. Never pay again. Join an exclusive group of 500 supreme builders.</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white">€999</span>
                  <span className="text-gray-400">one-time payment</span>
                </div>
                <div className="text-sm text-gray-400">That's less than <strong className="text-white">€0.10/day</strong> over 30 years of use. No subscriptions. Ever.</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Monthly coins", value: "100,000", color: "text-yellow-400" },
                    { label: "Per app built", value: "+50 coins", color: "text-green-400" },
                    { label: "Chat discount", value: "40% off", color: "text-blue-400" },
                    { label: "Coin rollover", value: "♾️ Forever", color: "text-purple-400" },
                    { label: "Stack limit", value: "5,000", color: "text-orange-400" },
                    { label: "Withdraw min", value: "25 coins", color: "text-pink-400" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-black/30 rounded-xl p-3">
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className={`font-bold text-sm ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => currentPlan === "lifetime" ? null : handleUpgrade("lifetime")}
                  disabled={currentPlan === "lifetime" || upgrading === "lifetime"}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition ${currentPlan === "lifetime" ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 cursor-not-allowed" : "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black shadow-2xl shadow-yellow-500/30"}`}
                >
                  {currentPlan === "lifetime" ? "✓ You are Supreme" : upgrading === "lifetime" ? "Processing..." : "💎 Get Lifetime Supreme — €999"}
                </button>
                <p className="text-xs text-gray-600 text-center">One-time payment · No recurring charges · Seats are non-refundable</p>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-yellow-400 text-sm uppercase tracking-wider">Everything included:</h3>
                <div className="flex flex-col gap-2 overflow-y-auto max-h-96">
                  {lifetimePlan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 flex-shrink-0">✦</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-bold text-center">Compare all plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Feature</th>
                  {[...plans, { name: "Lifetime", emoji: "💎" }].map(p => (
                    <th key={p.name} className="text-center py-3 px-4 text-gray-300 font-medium">{p.emoji} {p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Monthly coins", values: ["50", "300", "1,000", "3,000", "8,000", "100,000"] },
                  { feature: "Coin rollover", values: ["❌", "❌", "20%", "40%", "60%", "♾️"] },
                  { feature: "Coins per app", values: ["1", "2", "5", "10", "20", "50"] },
                  { feature: "Daily AI requests", values: ["5", "200", "∞", "∞", "∞", "∞"] },
                  { feature: "Saved projects", values: ["3", "20", "∞", "∞", "∞", "∞"] },
                  { feature: "Team seats", values: ["1", "1", "2", "5", "15", "∞"] },
                  { feature: "Coding room", values: ["❌", "❌", "✓", "✓", "✓", "✓"] },
                  { feature: "White label", values: ["❌", "❌", "❌", "❌", "❌", "✓"] },
                  { feature: "Chat discount", values: ["0%", "5%", "10%", "20%", "30%", "40%"] },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-white/5 hover:bg-white/2 transition">
                    <td className="py-3 px-4 text-gray-400">{row.feature}</td>
                    {row.values.map((val, i) => (
                      <td key={i} className={`py-3 px-4 text-center font-medium ${val === "❌" ? "text-gray-700" : val === "✓" || val === "♾️" ? "text-green-400" : i === 5 ? "text-yellow-400" : "text-gray-300"}`}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
          <h2 className="text-3xl font-bold text-center mb-4">Frequently asked questions</h2>
          {[
            { q: "What happens to unused coins?", a: "Free and Starter users lose all unused coins at month end. Pro keeps 20%, Premium 40%, Business 60%. Only Lifetime Supreme members keep 100% of coins forever." },
            { q: "Can I cancel anytime?", a: "Yes for monthly plans. Lifetime is a one-time payment — once you buy it, it's yours forever. No refunds on lifetime seats." },
            { q: "What counts as a generation?", a: "Every 'Generate App' click or follow-up chat message costs coins based on complexity." },
            { q: "Do I own the code I generate?", a: "Yes, 100%. All generated code belongs to you. Download and use it commercially however you like." },
            { q: "Is there a student discount?", a: "Yes! Students get 50% off any paid plan. Email us with your .edu address to claim it." },
            { q: "How do I withdraw Pero Coins?", a: "Coins can be withdrawn via the coin marketplace (coming soon). Free users cannot withdraw coins." },
            { q: "Will the Lifetime price increase?", a: "Yes. As Pero grows the lifetime price will only go up. Once 500 seats are sold, lifetime access is gone forever." },
          ].map((item) => (
            <div key={item.q} className="bg-white/3 border border-white/5 rounded-xl p-5 flex flex-col gap-2 hover:border-white/10 transition">
              <p className="font-semibold text-sm text-white">{item.q}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}