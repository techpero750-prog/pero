"use client";

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminPanel() {

  // ============================================================
  // STATE
  // ============================================================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalCoinsSpent: 0,
    totalCoinsEarned: 0,
    planCounts: {},
  });

  // ============================================================
  // ROUTER & SUPABASE
  // ============================================================
  const router = useRouter();
  const supabase = createClient();

  // ============================================================
  // EFFECTS — AUTH + ADMIN CHECK
  // ============================================================
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/landing"); return; }

      // Check admin access
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        router.push("/");
        return;
      }

      setUser(user);
      await loadAllData();
      setLoading(false);
    }
    init();
  }, []);

  // ============================================================
  // FUNCTION — LOAD ALL DATA
  // ============================================================
  async function loadAllData() {
    // Load all profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (profilesData) {
      setUsers(profilesData);

      // Compute plan counts
      const planCounts = profilesData.reduce((acc, p) => {
        const plan = p.plan || "free";
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {});

      const totalCoins = profilesData.reduce((acc, p) => acc + (p.coins || 0), 0);

      setStats(prev => ({
        ...prev,
        totalUsers: profilesData.length,
        planCounts,
        totalCoins,
      }));
    }

    // Load all projects
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (projectsData) {
      setProjects(projectsData);
      setStats(prev => ({ ...prev, totalProjects: projectsData.length }));
    }

    // Load transactions
    const { data: txData } = await supabase
      .from("coin_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (txData) {
      setTransactions(txData);
      const spent = txData.filter(t => t.type === "spent").reduce((a, t) => a + Math.abs(t.amount), 0);
      const earned = txData.filter(t => t.type === "earned").reduce((a, t) => a + t.amount, 0);
      setStats(prev => ({ ...prev, totalCoinsSpent: spent, totalCoinsEarned: earned }));
    }
  }

  // ============================================================
  // FUNCTION — UPDATE USER PLAN
  // ============================================================
  async function handleUpdatePlan(userId, newPlan) {
    const planCoins = { free: 50, starter: 300, pro: 1000, premium: 3000, business: 8000, lifetime: 100000 };
    await supabase.from("profiles").update({
      plan: newPlan,
      coins: planCoins[newPlan] || 50,
      lifetime_member: newPlan === "lifetime",
    }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan, coins: planCoins[newPlan] || 50 } : u));
    setEditingUser(null);
  }

  // ============================================================
  // FUNCTION — UPDATE USER COINS
  // ============================================================
  async function handleUpdateCoins(userId, newCoins) {
    await supabase.from("profiles").update({ coins: parseInt(newCoins) }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, coins: parseInt(newCoins) } : u));
  }

  // ============================================================
  // FUNCTION — TOGGLE ADMIN
  // ============================================================
  async function handleToggleAdmin(userId, currentValue) {
    await supabase.from("profiles").update({ is_admin: !currentValue }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentValue } : u));
  }

  // ============================================================
  // FUNCTION — DELETE PROJECT
  // ============================================================
  async function handleDeleteProject(id) {
    if (!confirm("Delete this project permanently?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setStats(prev => ({ ...prev, totalProjects: prev.totalProjects - 1 }));
  }

  // ============================================================
  // FILTERED USERS
  // ============================================================
  const filteredUsers = users.filter(u =>
    u.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.plan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============================================================
  // PLAN COLORS
  // ============================================================
  const planColors = {
    free: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    starter: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    pro: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    premium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    business: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    lifetime: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#030712] text-white">

      {/* ======================================================
          ADMIN NAVBAR
      ====================================================== */}
      <nav className="border-b border-red-500/10 bg-black/60 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-sm font-black">⚡</div>
          <span className="font-bold text-lg text-white">Pero Admin</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500/20 border border-red-500/30 text-red-400">GOD MODE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">{user?.email}</span>
          <button onClick={() => router.push("/")}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition">
            ← Back to app
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col gap-8">

        {/* ======================================================
            HEADER
        ====================================================== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Admin Control Panel
            </h1>
            <p className="text-gray-500 text-sm mt-1">Full access to all users, projects and system data</p>
          </div>
          <button onClick={loadAllData}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition">
            🔄 Refresh
          </button>
        </div>

        {/* ======================================================
            OVERVIEW STATS
        ====================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total users", value: stats.totalUsers, icon: "👥", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20" },
            { label: "Total projects", value: stats.totalProjects, icon: "🗂️", color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20" },
            { label: "Coins spent", value: stats.totalCoinsSpent, icon: "🪙", color: "from-red-500/20 to-red-600/10", border: "border-red-500/20" },
            { label: "Coins earned", value: stats.totalCoinsEarned, icon: "✨", color: "from-green-500/20 to-green-600/10", border: "border-green-500/20" },
          ].map(stat => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5 flex flex-col gap-3`}>
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-3xl font-black">{stat.value?.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Plan distribution */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-bold">📊 Plan Distribution</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {["free", "starter", "pro", "premium", "business", "lifetime"].map(plan => (
              <div key={plan} className={`border rounded-xl p-3 text-center ${planColors[plan]}`}>
                <p className="text-2xl font-black">{stats.planCounts?.[plan] || 0}</p>
                <p className="text-xs capitalize mt-0.5">{plan}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================
            TABS
        ====================================================== */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit">
          {[
            { id: "overview", label: "👥 Users" },
            { id: "projects", label: "🗂️ Projects" },
            { id: "transactions", label: "🪙 Transactions" },
            { id: "settings", label: "⚙️ Settings" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======================================================
            USERS TAB
        ====================================================== */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-bold text-lg">All Users ({users.length})</h2>
              <input
                type="text"
                placeholder="Search by name, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">User ID</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Plan</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Coins</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Admin</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition">
                      <td className="py-3 px-4 text-gray-600 text-xs font-mono">{u.id?.slice(0, 12)}...</td>
                      <td className="py-3 px-4 text-gray-300">{u.full_name || "—"}</td>
                      <td className="py-3 px-4">
                        {editingUser === u.id ? (
                          <select
                            defaultValue={u.plan || "free"}
                            onChange={(e) => handleUpdatePlan(u.id, e.target.value)}
                            className="bg-black border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          >
                            {["free", "starter", "pro", "premium", "business", "lifetime"].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border capitalize ${planColors[u.plan || "free"]}`}>
                            {u.plan || "free"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          defaultValue={u.coins || 0}
                          onBlur={(e) => handleUpdateCoins(u.id, e.target.value)}
                          className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-yellow-400 focus:outline-none focus:border-yellow-500/50"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          className={`px-2 py-1 rounded-full text-xs font-bold border transition ${
                            u.is_admin
                              ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                              : "bg-gray-500/20 text-gray-500 border-gray-500/30 hover:bg-gray-500/30"
                          }`}
                        >
                          {u.is_admin ? "✓ Admin" : "User"}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition mr-3"
                        >
                          ✏️ Edit plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================
            PROJECTS TAB
        ====================================================== */}
        {activeTab === "projects" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-lg">All Projects ({projects.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Title</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">User ID</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Prompt</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Created</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/2 transition">
                      <td className="py-3 px-4 text-gray-300 font-medium max-w-xs truncate">{p.title}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs font-mono">{p.user_id?.slice(0, 12)}...</td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-xs truncate">{p.prompt}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        <button onClick={() => {
                          const blob = new Blob([p.code], { type: "text/html" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = `${p.title}.html`; a.click();
                        }} className="text-xs text-purple-400 hover:text-purple-300 transition">📥</button>
                        <button onClick={() => handleDeleteProject(p.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================
            TRANSACTIONS TAB
        ====================================================== */}
        {activeTab === "transactions" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-lg">Coin Transactions (last 100)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">User ID</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Description</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/2 transition">
                      <td className="py-3 px-4 text-gray-600 text-xs font-mono">{t.user_id?.slice(0, 12)}...</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                          t.type === "earned" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          t.type === "spent" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-bold ${t.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {t.amount > 0 ? "+" : ""}{t.amount}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-xs truncate">{t.description}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================
            SETTINGS TAB
        ====================================================== */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-6">
            <h2 className="font-bold text-lg">⚙️ System Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Coin config */}
              <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="font-bold text-yellow-400">🪙 Coin Configuration</h3>
                <div className="flex flex-col gap-3 text-sm">
                  {[
                    { plan: "Free", coins: 50, color: "text-gray-400" },
                    { plan: "Starter", coins: 300, color: "text-blue-400" },
                    { plan: "Pro", coins: 1000, color: "text-purple-400" },
                    { plan: "Premium", coins: 3000, color: "text-orange-400" },
                    { plan: "Business", coins: 8000, color: "text-yellow-400" },
                    { plan: "Lifetime", coins: 100000, color: "text-amber-400" },
                  ].map(item => (
                    <div key={item.plan} className="flex items-center justify-between">
                      <span className={`${item.color} capitalize`}>{item.plan}</span>
                      <span className="text-gray-400">{item.coins.toLocaleString()} coins/month</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="font-bold text-red-400">⚡ Quick Actions</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Reset all free user coins", desc: "Give 50 coins to all free users", color: "text-blue-400 hover:text-blue-300" },
                    { label: "Send system announcement", desc: "Notify all users of updates", color: "text-yellow-400 hover:text-yellow-300" },
                    { label: "Export all user data", desc: "Download CSV of all users", color: "text-green-400 hover:text-green-300" },
                    { label: "Clear coin transactions", desc: "Archive old transactions", color: "text-orange-400 hover:text-orange-300" },
                  ].map(action => (
                    <div key={action.label} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
                      <div>
                        <p className="text-xs font-medium text-gray-300">{action.label}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{action.desc}</p>
                      </div>
                      <button className={`text-xs transition ${action.color}`}>Run →</button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* System info */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="font-bold">📋 System Info</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { label: "App name", value: "Pero AI Builder" },
                  { label: "Version", value: "1.0.0" },
                  { label: "Framework", value: "Next.js 16" },
                  { label: "AI Model", value: "Gemini 2.5 Flash" },
                  { label: "Database", value: "Supabase" },
                  { label: "Storage", value: "Supabase Storage" },
                  { label: "Admin", value: user?.email },
                  { label: "Environment", value: "Development" },
                ].map(info => (
                  <div key={info.label}>
                    <p className="text-xs text-gray-600">{info.label}</p>
                    <p className="text-xs text-gray-300 font-medium mt-0.5 truncate">{info.value}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}