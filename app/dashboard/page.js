"use client";

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {

  // ============================================================
  // STATE
  // ============================================================
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // ROUTER & SUPABASE
  // ============================================================
  const router = useRouter();
  const supabase = createClient();

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/landing"); return; }
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData);

      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (projectsData) setProjects(projectsData);

      setLoading(false);
    }
    init();
  }, []);

  // ============================================================
  // COMPUTED STATS
  // ============================================================
  const plan = profile?.plan || "free";
  const coins = profile?.coins || 0;
  const totalProjects = projects.length;
  const thisWeek = projects.filter(p => {
    const created = new Date(p.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  }).length;
  const thisMonth = projects.filter(p => {
    const created = new Date(p.created_at);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return created > monthAgo;
  }).length;
  const memberSince = user
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  // ============================================================
  // FUNCTION — DELETE PROJECT
  // ============================================================
  async function handleDelete(id) {
    if (!confirm("Delete this project?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  // ============================================================
  // FUNCTION — LOGOUT
  // ============================================================
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/landing");
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // SHARED NAVBAR
  // ============================================================
  const Navbar = ({ accent = "from-blue-500 to-purple-600" }) => (
    <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center text-sm font-bold`}>P</div>
        <span className="font-bold text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Pero</span>
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r ${accent} text-white capitalize`}>{plan}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/")}
          className={`px-4 py-2 bg-gradient-to-r ${accent} hover:opacity-90 rounded-lg text-sm font-semibold transition`}>
          ✨ Builder
        </button>
        <button onClick={handleLogout}
          className="px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-lg text-sm text-gray-400 hover:text-red-400 transition">
          Sign out
        </button>
      </div>
    </nav>
  );

  // ============================================================
  // SHARED PROJECTS GRID
  // ============================================================
  const ProjectsGrid = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">🗂️ All projects</h2>
        <p className="text-xs text-gray-600">{totalProjects} total</p>
      </div>
      {projects.length === 0 ? (
        <div className="bg-white/3 border border-white/5 rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
          <span className="text-4xl">✨</span>
          <div>
            <p className="font-semibold text-gray-300">No projects yet</p>
            <p className="text-sm text-gray-600 mt-1">Generate your first app to see it here</p>
          </div>
          <button onClick={() => router.push("/")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-sm font-semibold transition">
            Start building
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-white/3 border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col gap-3 transition group">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-gray-200 truncate">{p.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <span className="text-lg flex-shrink-0">🌐</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{p.prompt}</p>
              <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                <button onClick={() => router.push("/")}
                  className="flex-1 py-1.5 bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 rounded-lg text-xs text-gray-400 hover:text-blue-300 transition">
                  ✏️ Edit
                </button>
                <button onClick={() => {
                  const blob = new Blob([p.code], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `${p.title}.html`; a.click();
                }}
                  className="flex-1 py-1.5 bg-white/5 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 rounded-lg text-xs text-gray-400 hover:text-purple-300 transition">
                  📥 Download
                </button>
                <button onClick={() => handleDelete(p.id)}
                  className="py-1.5 px-3 bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 rounded-lg text-xs text-gray-400 hover:text-red-400 transition">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============================================================
  // SHARED ACTIVITY CHART
  // ============================================================
  const ActivityChart = () => (
    <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="font-bold text-lg">📊 Activity — last 7 days</h2>
      <div className="flex items-end gap-2 h-24">
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const count = projects.filter(p => new Date(p.created_at).toDateString() === date.toDateString()).length;
          const maxCount = Math.max(1, ...Array.from({ length: 7 }, (_, j) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - j));
            return projects.filter(p => new Date(p.created_at).toDateString() === d.toDateString()).length;
          }));
          const height = count === 0 ? 8 : Math.max(16, (count / maxCount) * 96);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-lg bg-gradient-to-t from-blue-600 to-purple-500 transition-all duration-500"
                style={{ height: `${height}px`, opacity: count === 0 ? 0.2 : 1 }} />
              <p className="text-xs text-gray-600">{date.toLocaleDateString("en-US", { weekday: "short" })}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ============================================================
  // FREE DASHBOARD
  // ============================================================
  if (plan === "free") {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Navbar accent="from-gray-500 to-gray-600" />
        <div className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">

          {/* Upgrade banner */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-lg">🚀 You're on the Free plan</h2>
              <p className="text-gray-400 text-sm mt-1">You have {coins} coins left · 5 generations/day · 3 projects max</p>
            </div>
            <button onClick={() => router.push("/pricing")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold text-sm transition whitespace-nowrap">
              ⚡ Upgrade now
            </button>
          </div>

          {/* Header */}
          <div>
            <h1 className="text-2xl font-black">Welcome, {user?.email?.split("@")[0]} 👋</h1>
            <p className="text-gray-500 text-sm">Member since {memberSince}</p>
          </div>

          {/* Basic stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Total projects", value: `${totalProjects}/3`, icon: "🗂️", color: "from-gray-500/20 to-gray-600/10", border: "border-gray-500/20" },
              { label: "This week", value: thisWeek, icon: "📅", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20" },
              { label: "Coins left", value: coins, icon: "🪙", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 flex flex-col gap-3`}>
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade nudge cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "∞", title: "Unlimited generations", desc: "Remove the 5/day limit", plan: "Pro" },
              { icon: "💾", title: "Unlimited projects", desc: "Save more than 3 apps", plan: "Starter" },
              { icon: "⚡", title: "Faster AI", desc: "Priority generation queue", plan: "Pro" },
            ].map(f => (
              <div key={f.title} className="bg-white/3 border border-white/5 rounded-2xl p-5 flex flex-col gap-3 opacity-60 hover:opacity-100 transition">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                </div>
                <button onClick={() => router.push("/pricing")}
                  className="text-xs text-blue-400 hover:text-blue-300 transition">
                  Unlock with {f.plan} ↗
                </button>
              </div>
            ))}
          </div>

          <ProjectsGrid />
        </div>
      </div>
    );
  }

  // ============================================================
  // STARTER DASHBOARD
  // ============================================================
  if (plan === "starter") {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Navbar accent="from-blue-500 to-cyan-500" />
        <div className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">

          <div>
            <h1 className="text-3xl font-black">Welcome back, {user?.email?.split("@")[0]} 👋</h1>
            <p className="text-gray-500 text-sm">Member since {memberSince} · Starter plan</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total projects", value: totalProjects, icon: "🗂️", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20" },
              { label: "This week", value: thisWeek, icon: "📅", color: "from-cyan-500/20 to-cyan-600/10", border: "border-cyan-500/20" },
              { label: "This month", value: thisMonth, icon: "📆", color: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-500/20" },
              { label: "Coins", value: coins, icon: "🪙", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 flex flex-col gap-3`}>
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <ActivityChart />

          {/* Pro upgrade teaser */}
          <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold">🟪 Unlock Pro features</h2>
              <p className="text-gray-400 text-sm mt-1">Get the full coding room, unlimited projects, AI Debugger and more</p>
            </div>
            <button onClick={() => router.push("/pricing")}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-semibold text-sm transition whitespace-nowrap">
              Upgrade to Pro
            </button>
          </div>

          <ProjectsGrid />
        </div>
      </div>
    );
  }

  // ============================================================
  // PRO DASHBOARD
  // ============================================================
  if (plan === "pro") {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Navbar accent="from-purple-500 to-indigo-600" />
        <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-8">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Pro Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">{user?.email} · Member since {memberSince}</p>
            </div>
            <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-bold">
              🟪 Pro Member
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total projects", value: totalProjects, icon: "🗂️", color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20" },
              { label: "This week", value: thisWeek, icon: "📅", color: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-500/20" },
              { label: "This month", value: thisMonth, icon: "📆", color: "from-violet-500/20 to-violet-600/10", border: "border-violet-500/20" },
              { label: "Coins", value: coins, icon: "🪙", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 flex flex-col gap-3`}>
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <ActivityChart />

          {/* Pro exclusive tools */}
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-lg">🔧 Pro Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: "💻", title: "Coding Room", desc: "Full in-browser editor with syntax highlighting, live preview and AI fixes", action: "Open →", available: true },
                { icon: "🐛", title: "AI Debugger", desc: "Automatically detect and fix errors in your generated code", action: "Coming soon", available: false },
                { icon: "🏗️", title: "Architecture Designer", desc: "AI-powered app structure designer for complex projects", action: "Coming soon", available: false },
              ].map(tool => (
                <div key={tool.title} className={`bg-white/3 border border-white/5 rounded-2xl p-5 flex flex-col gap-3 ${tool.available ? "hover:border-purple-500/30 transition" : "opacity-50"}`}>
                  <span className="text-2xl">{tool.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{tool.title}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tool.desc}</p>
                  </div>
                  <button
  onClick={() => tool.available && tool.title === "Coding Room" ? router.push("/coding-room") : null}
  disabled={!tool.available}
  className={`text-xs font-medium transition ${tool.available ? "text-purple-400 hover:text-purple-300" : "text-gray-600 cursor-not-allowed"}`}
>
  {tool.action}
</button>
                </div>
              ))}
            </div>
          </div>

          <ProjectsGrid />
        </div>
      </div>
    );
  }

  // ============================================================
  // PREMIUM DASHBOARD
  // ============================================================
  if (plan === "premium") {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Navbar accent="from-orange-500 to-amber-500" />
        <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-8">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Premium Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">{user?.email} · Member since {memberSince}</p>
            </div>
            <div className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-xl text-orange-400 text-sm font-bold">
              🟧 Premium Member
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total projects", value: totalProjects, icon: "🗂️", color: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/20" },
              { label: "This week", value: thisWeek, icon: "📅", color: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/20" },
              { label: "This month", value: thisMonth, icon: "📆", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20" },
              { label: "Coins", value: coins, icon: "🪙", color: "from-green-500/20 to-green-600/10", border: "border-green-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 flex flex-col gap-3`}>
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <ActivityChart />

          {/* Premium tools */}
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-lg">⚡ Premium Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: "🎨", title: "AI UI/UX Designer", desc: "Generate full design systems", available: false },
                { icon: "🔒", title: "AI Security Auditor", desc: "Scan code for vulnerabilities", available: false },
                { icon: "🧩", title: "Component Builder", desc: "Build custom reusable components", available: false },
                { icon: "🤝", title: "Client Handoff", desc: "Share projects with clients", available: false },
              ].map(tool => (
                <div key={tool.title} className="bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 opacity-60">
                  <span className="text-xl">{tool.icon}</span>
                  <p className="font-semibold text-xs">{tool.title}</p>
                  <p className="text-xs text-gray-600">{tool.desc}</p>
                  <span className="text-xs text-orange-400">Coming soon</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team seats */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-bold">👥 Team (5 seats)</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-bold">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-orange-400">Owner</p>
              </div>
            </div>
            <button className="text-xs text-gray-500 hover:text-white transition w-fit">+ Invite team members (coming soon)</button>
          </div>

          <ProjectsGrid />
        </div>
      </div>
    );
  }

  // ============================================================
  // BUSINESS DASHBOARD
  // ============================================================
  if (plan === "business") {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Navbar accent="from-yellow-500 to-green-500" />
        <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-8">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent">
                Business Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">{user?.email} · Member since {memberSince}</p>
            </div>
            <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm font-bold">
              🟨 Business Member
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total projects", value: totalProjects, icon: "🗂️", color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20" },
              { label: "This week", value: thisWeek, icon: "📅", color: "from-green-500/20 to-green-600/10", border: "border-green-500/20" },
              { label: "This month", value: thisMonth, icon: "📆", color: "from-teal-500/20 to-teal-600/10", border: "border-teal-500/20" },
              { label: "Team members", value: "1/15", icon: "👥", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20" },
              { label: "Coins", value: coins, icon: "🪙", color: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-4 flex flex-col gap-2`}>
                <span className="text-xl">{stat.icon}</span>
                <div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <ActivityChart />

          {/* Business features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Team workspace */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="font-bold">👥 Team Workspace</h2>
              <p className="text-gray-500 text-sm">Manage up to 15 team members with role-based access control.</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-green-500 flex items-center justify-center text-sm font-bold">
                  {user?.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-yellow-400">Admin · Owner</p>
                </div>
              </div>
              <button className="text-xs text-gray-500 hover:text-white transition w-fit border border-white/10 px-3 py-1.5 rounded-lg">
                + Invite members (coming soon)
              </button>
            </div>

            {/* Audit log */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="font-bold">📋 Audit Log</h2>
              <p className="text-gray-500 text-sm">Track all actions across your workspace.</p>
              <div className="flex flex-col gap-2">
                {[
                  { action: "App generated", time: "Just now", icon: "✨" },
                  { action: "Project saved", time: "2 min ago", icon: "💾" },
                  { action: "Account login", time: "Today", icon: "🔐" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{log.icon}</span>
                    <span className="flex-1">{log.action}</span>
                    <span className="text-gray-600">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ProjectsGrid />
        </div>
      </div>
    );
  }

  // ============================================================
  // LIFETIME SUPREME DASHBOARD
  // ============================================================
  return (
    <div className="min-h-screen text-white" style={{ background: "radial-gradient(ellipse at top, #1a0a00 0%, #030712 50%, #030712 100%)" }}>

      {/* Gold navbar */}
      <nav className="border-b border-yellow-500/10 bg-black/60 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-sm font-black text-black">P</div>
          <span className="font-bold text-lg bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">Pero Supreme</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black">💎 LIFETIME</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black rounded-lg text-sm font-bold transition">
            ✨ Supreme Builder
          </button>
          <button onClick={handleLogout}
            className="px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-red-400 transition">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-8">

        {/* Supreme header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-950/80 to-amber-950/60 border border-yellow-500/30 rounded-3xl p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">💎</span>
                <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-bold">SUPREME BUILDER</span>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Welcome, {user?.email?.split("@")[0]}
              </h1>
              <p className="text-yellow-700 text-sm mt-1">Supreme member since {memberSince} · Lifetime access</p>
            </div>
            <div className="hidden md:flex flex-col gap-2 text-right">
              <p className="text-yellow-400 font-bold text-2xl">{coins.toLocaleString()}</p>
              <p className="text-yellow-700 text-xs">Pero Coins</p>
              <p className="text-yellow-600 text-xs">♾️ Never expire</p>
            </div>
          </div>
        </div>

        {/* Supreme stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total projects", value: totalProjects, icon: "🗂️", color: "from-yellow-500/20 to-amber-600/10", border: "border-yellow-500/20" },
            { label: "This week", value: thisWeek, icon: "📅", color: "from-amber-500/20 to-orange-600/10", border: "border-amber-500/20" },
            { label: "This month", value: thisMonth, icon: "📆", color: "from-orange-500/20 to-red-600/10", border: "border-orange-500/20" },
            { label: "Coins", value: coins.toLocaleString(), icon: "🪙", color: "from-yellow-400/20 to-yellow-600/10", border: "border-yellow-400/30" },
            { label: "Coin multiplier", value: "3×", icon: "⚡", color: "from-green-500/20 to-teal-600/10", border: "border-green-500/20" },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-4 flex flex-col gap-2`}>
              <span className="text-xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Activity chart with gold bars */}
        <div className="bg-gradient-to-br from-yellow-950/40 to-amber-950/20 border border-yellow-500/10 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-bold text-lg text-yellow-400">📊 Supreme Activity</h2>
          <div className="flex items-end gap-2 h-24">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const count = projects.filter(p => new Date(p.created_at).toDateString() === date.toDateString()).length;
              const maxCount = Math.max(1, ...Array.from({ length: 7 }, (_, j) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - j));
                return projects.filter(p => new Date(p.created_at).toDateString() === d.toDateString()).length;
              }));
              const height = count === 0 ? 8 : Math.max(16, (count / maxCount) * 96);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-lg bg-gradient-to-t from-yellow-600 to-amber-400 transition-all duration-500"
                    style={{ height: `${height}px`, opacity: count === 0 ? 0.2 : 1 }} />
                  <p className="text-xs text-yellow-900">{date.toLocaleDateString("en-US", { weekday: "short" })}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supreme exclusive features */}
        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-lg text-yellow-400">✦ Supreme Exclusive Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: "👑", title: "Hall of Fame", desc: "Your profile is listed on Pero's Hall of Fame", available: true },
              { icon: "🗳️", title: "Governance Rights", desc: "Vote on Pero's next features", available: false },
              { icon: "🤖", title: "Custom AI Personality", desc: "Name and configure your own AI assistant", available: false },
              { icon: "🏪", title: "App Marketplace", desc: "Sell your generated apps + 10% revenue boost", available: false },
            ].map(tool => (
              <div key={tool.title} className={`bg-gradient-to-br from-yellow-950/60 to-amber-950/40 border border-yellow-500/20 rounded-2xl p-4 flex flex-col gap-2 ${!tool.available ? "opacity-60" : ""}`}>
                <span className="text-xl">{tool.icon}</span>
                <p className="font-semibold text-xs text-yellow-300">{tool.title}</p>
                <p className="text-xs text-yellow-800">{tool.desc}</p>
                <span className="text-xs text-yellow-600">{tool.available ? "Active ✓" : "Coming soon"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Supreme Chamber teaser */}
        <div className="bg-gradient-to-br from-yellow-950/80 to-amber-950/60 border-2 border-yellow-500/30 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-yellow-400">⚔️ Supreme Coding Chamber</h2>
            <p className="text-yellow-800 text-sm mt-1">Your exclusive coding environment with unlimited history, AI pair programmer and priority assistance.</p>
          </div>
          <button className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black rounded-xl font-bold text-sm transition whitespace-nowrap">
            Enter Chamber (soon)
          </button>
        </div>

        {/* Projects */}
        <ProjectsGrid />

      </div>
    </div>
  );
}