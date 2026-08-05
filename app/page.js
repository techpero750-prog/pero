"use client";

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {

  // ============================================================
  // STATE
  // ============================================================
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [messages, setMessages] = useState([]);
  const [followUp, setFollowUp] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [theme, setTheme] = useState("dark");
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [chatPos, setChatPos] = useState({ x: null, y: null });
  const [profile, setProfile] = useState(null);
  const [todayUsage, setTodayUsage] = useState(0);
  const [userPlan, setUserPlan] = useState("free");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [settings, setSettings] = useState({
    font: "Inter",
    borderRadius: "rounded",
    density: "comfortable",
    iconStyle: "emoji",
    animationLevel: "moderate",
  });

  // ============================================================
  // REFS
  // ============================================================
  const chatEndRef = useRef(null);
  const chatRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const imageInputRef = useRef(null);

  // ============================================================
  // ROUTER & SUPABASE
  // ============================================================
  const router = useRouter();
  const supabase = createClient();

  // ============================================================
  // DATA — THEMES & SUGGESTIONS
  // ============================================================
  const themes = [
    { id: "dark", label: "🌙 Dark", desc: "dark background, light text, sleek modern feel" },
    { id: "light", label: "☀️ Light", desc: "clean white background, minimal, professional" },
    { id: "glass", label: "💎 Glass", desc: "glassmorphism, frosted glass cards, blurred backgrounds, vibrant gradients" },
    { id: "retro", label: "🕹️ Retro", desc: "retro 80s neon colors, pixel-inspired, dark background with neon accents" },
    { id: "minimal", label: "⬜ Minimal", desc: "ultra minimal, lots of whitespace, black and white, typographic focus" },
    { id: "luxury", label: "👑 Luxury", desc: "dark background, gold accents, elegant serif fonts, premium feel" },
  ];

  const suggestions = [
    "💼 SaaS landing page for a project management tool",
    "🏋️ Fitness app dashboard with workout tracker",
    "🛒 E-commerce store for handmade jewelry",
    "🍕 Restaurant website with menu and reservations",
    "📊 Analytics dashboard with charts and KPIs",
    "🎨 Portfolio website for a graphic designer",
  ];

// ============================================================
// FUNCTION — SHARE PROJECT
// ============================================================
async function handleShare() {
  if (!result || !user) return;

  // Generate a slug from the title
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Date.now().toString(36)}`;

  // Save as public project with slug
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: title || prompt.slice(0, 50),
      prompt,
      code: result,
      is_public: true,
      slug,
    })
    .select()
    .single();

  if (!error && data) {
    const shareUrl = `${window.location.origin}/share/${slug}`;
    await navigator.clipboard.writeText(shareUrl);
    alert(`✅ Share link copied!\n\n${shareUrl}`);
    loadProjects();
  }
}

  // ============================================================
  // EFFECTS — AUTH CHECK & SCROLL
  // ============================================================
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/landing"); return; }
      setUser(user);
      loadProjects();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profileData) {
        setProfile(profileData);
        setUserPlan(profileData.plan || "free");
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: usageData } = await supabase
        .from("usage")
        .select("generations")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();
      setTodayUsage(usageData?.generations || 0);
    }
    init();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================================
  // FUNCTION — LOAD SAVED PROJECTS
  // ============================================================
  async function loadProjects() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProjects(data);
  }

  // ============================================================
  // FUNCTION — GENERATE APP
  // ============================================================
  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult("");
    setMessages([{ role: "user", content: prompt }]);
    setTitle(prompt.slice(0, 50));

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        prompt,
        messages: [],
        theme: themes.find(t => t.id === theme)?.desc,
        settings,
        images: uploadedImages.map(img => img.url),
      }),
    });

    const data = await res.json();

    if (data.error === "INSUFFICIENT_COINS") {
      setLoading(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `🪙 Not enough coins! You need ${data.coinsNeeded} but have ${data.coinsAvailable}. Upgrade your plan for more coins.`
      }]);
      if (confirm("Not enough coins! Upgrade your plan for more?")) {
        router.push("/pricing");
      }
      return;
    }

    if (data.error === "LIMIT_REACHED") {
      setLoading(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Daily limit reached! Upgrade to Pro for unlimited generations."
      }]);
      if (confirm("Daily limit reached! Upgrade for unlimited generations?")) {
        router.push("/pricing");
      }
      return;
    }

    setResult(data.result);
    setMessages(prev => [...prev, { role: "assistant", content: "✅ App generated!" }]);
    setTodayUsage(prev => prev + 1);
    setProfile(prev => prev ? { ...prev, coins: Math.max(0, (prev.coins || 0) - 10) } : prev);
    setLoading(false);
  }

  // ============================================================
  // FUNCTION — FOLLOW UP / REFINE WITH CHAT
  // ============================================================
  async function handleFollowUp() {
    if (!followUp.trim() || !result) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: followUp }];
    setMessages(newMessages);
    setFollowUp("");

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        prompt: followUp,
        previousCode: result,
        messages: newMessages,
        theme: themes.find(t => t.id === theme)?.desc,
        settings,
        images: uploadedImages.map(img => img.url),
      }),
    });

    const data = await res.json();

    if (data.error === "INSUFFICIENT_COINS" || data.error === "LIMIT_REACHED") {
      setLoading(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.error === "INSUFFICIENT_COINS"
          ? `🪙 Not enough coins! Upgrade your plan for more.`
          : "⚠️ Daily limit reached! Upgrade for unlimited generations."
      }]);
      return;
    }

    setResult(data.result);
    setMessages(prev => [...prev, { role: "assistant", content: "✅ Updated!" }]);
    setLoading(false);
  }

  // ============================================================
  // FUNCTION — SAVE PROJECT TO SUPABASE
  // ============================================================
  async function handleSave() {
    if (!result || !user) return;
    setSaving(true);
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: title || prompt.slice(0, 50),
      prompt,
      code: result,
    });
    if (!error) { loadProjects(); alert("Project saved!"); }
    setSaving(false);
  }

  // ============================================================
  // FUNCTION — DOWNLOAD HTML FILE
  // ============================================================
  function handleDownload() {
    const blob = new Blob([result], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "my-app"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

<button onClick={handleShare}
  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition text-gray-400 hover:text-white">
  🔗 Share
</button>

  // ============================================================
  // FUNCTION — UPLOAD IMAGE FOR GENERATED APPS
  // ============================================================
  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file || !user) return;
    setUploadingImage(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("app-images").upload(fileName, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("app-images").getPublicUrl(fileName);
      setUploadedImages(prev => [...prev, { url: data.publicUrl, name: file.name }]);
    }
    setUploadingImage(false);
  }

  // ============================================================
  // FUNCTION — LOGOUT
  // ============================================================
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/landing");
  }

  // ============================================================
  // FUNCTION — LOAD PROJECT FROM SIDEBAR
  // ============================================================
  function loadProject(project) {
    setResult(project.code);
    setPrompt(project.prompt);
    setTitle(project.title);
    setMessages([
      { role: "user", content: project.prompt },
      { role: "assistant", content: "✅ Project loaded!" }
    ]);
  }

  // ============================================================
  // FUNCTION — DRAGGABLE CHAT PANEL
  // ============================================================
  function handleDragStart(e) {
    isDragging.current = true;
    const rect = chatRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  }

  function handleDragMove(e) {
    if (!isDragging.current) return;
    setChatPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
  }

  function handleDragEnd() {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  }

  // ============================================================
  // FUNCTION — RENDER SIDEBAR AVATAR
  // ============================================================
  function renderSidebarAvatar() {
    if (!profile?.avatar_url) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {user?.email?.[0]?.toUpperCase()}
        </div>
      );
    }
    if (profile.avatar_url.startsWith("default:")) {
      const parts = profile.avatar_url.split(":");
      const emoji = parts[2];
      const bg = parts[3];
      return (
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${bg} flex items-center justify-center text-sm flex-shrink-0`}>
          {emoji}
        </div>
      );
    }
    return <img src={profile.avatar_url} alt="Avatar" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />;
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#030712] text-white flex overflow-hidden">

      {/* ======================================================
          SIDEBAR — Logo, user info, projects list, logout
      ====================================================== */}
      <aside className="w-64 flex-shrink-0 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col">

        {/* Sidebar — Header: logo + user */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">P</div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Pero</h1>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
            {renderSidebarAvatar()}
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>

<button
  onClick={() => router.push("/refer")}
  className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
>
  🎁 Refer & Earn
</button>

        {/* Sidebar — Navigation buttons */}
        <div className="p-4 border-b border-white/5 flex flex-col gap-2">
          <button
            onClick={() => { setResult(""); setPrompt(""); setMessages([]); setTitle(""); setChatPos({ x: null, y: null }); }}
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <span>+</span> New project
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
          >
            👤 Profile
          </button>
          <button
            onClick={() => router.push("/pricing")}
            className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
          >
            💰 Pricing
          </button>
          <button
  onClick={() => router.push("/coding-room")}
  className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
>
  💻 Coding Room
</button>
        </div>

        {/* Sidebar — Projects list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Recent projects</p>
          {projects.length === 0 && (
            <p className="text-xs text-gray-700 text-center py-4">No projects yet</p>
          )}
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => loadProject(p)}
              className="text-left p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition group"
            >
              <p className="text-sm text-gray-300 truncate group-hover:text-white transition">{p.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
            </button>
          ))}
        </div>

        {/* Sidebar — Coins indicator */}
        <div className="px-4 pb-3 flex flex-col gap-2">
          <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">🪙 Pero Coins</span>
              <span className="text-xs font-bold text-yellow-400">{profile?.coins || 0}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all"
                style={{
                  width: `${Math.min(100, ((profile?.coins || 0) / (
                    { free: 50, starter: 300, pro: 1000, premium: 3000, business: 8000, lifetime: 100000 }[userPlan] || 50
                  )) * 100)}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 capitalize">{userPlan} plan</span>
              <button onClick={() => router.push("/pricing")} className="text-xs text-blue-400 hover:text-blue-300 transition">
                Upgrade ↗
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar — Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-lg text-sm text-gray-400 hover:text-red-400 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ======================================================
          MAIN CONTENT — Top bar + left panel + right panel
      ====================================================== */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOP BAR — Preview/Code tabs, Desktop/Mobile toggle, Save/Download */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {result && (
              <>
                {/* Preview / Code tab switcher */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                  <button onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === "preview" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>
                    👁 Preview
                  </button>
                  <button onClick={() => setActiveTab("code")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === "code" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>
                    {"<>"} Code
                  </button>
                </div>

                {/* Desktop / Mobile toggle */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                  <button onClick={() => setPreviewMode("desktop")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${previewMode === "desktop" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>
                    🖥 Desktop
                  </button>
                  <button onClick={() => setPreviewMode("mobile")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${previewMode === "mobile" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>
                    📱 Mobile
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Save & Download buttons */}
          {result && (
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saving}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition disabled:opacity-50">
                {saving ? "Saving..." : "💾 Save"}
              </button>
              <button onClick={handleDownload}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-xs font-medium transition">
                📥 Download
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 flex min-h-0">

          {/* ====================================================
              LEFT PANEL — Theme, Settings, Images, Suggestions, Prompt
          ==================================================== */}
          <div className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col bg-black/20">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

              {/* Theme switcher */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">🎨 Theme</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {themes.map((t) => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition border ${
                        theme === t.id
                          ? "bg-blue-600/30 border-blue-500/50 text-blue-300"
                          : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* App settings accordion */}
              <div className="flex flex-col gap-2">
                <button onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider hover:text-gray-300 transition">
                  <span>⚙️ Settings</span>
                  <span className={`transition-transform ${showSettings ? "rotate-180" : ""}`}>▾</span>
                </button>
                {showSettings && (
                  <div className="flex flex-col gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                    {[
                      { key: "font", label: "Font", options: ["Inter", "Poppins", "Playfair Display", "Roboto Mono", "Raleway", "Nunito"] },
                      { key: "borderRadius", label: "Corners", options: ["sharp", "rounded", "pill"] },
                      { key: "density", label: "Density", options: ["compact", "comfortable", "spacious"] },
                      { key: "iconStyle", label: "Icons", options: ["emoji", "fontawesome", "none"] },
                      { key: "animationLevel", label: "Animations", options: ["none", "subtle", "moderate", "rich"] },
                    ].map((s) => (
                      <div key={s.key} className="flex flex-col gap-1">
                        <p className="text-xs text-gray-600">{s.label}</p>
                        <select value={settings[s.key]}
                          onChange={(e) => setSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500">
                          {s.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image library */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">🖼️ Images</p>
                  <button onClick={() => imageInputRef.current.click()} disabled={uploadingImage}
                    className="text-xs text-blue-400 hover:text-blue-300 transition disabled:opacity-50">
                    {uploadingImage ? "Uploading..." : "+ Add"}
                  </button>
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {uploadedImages.length === 0 ? (
                  <div onClick={() => imageInputRef.current.click()}
                    className="border border-dashed border-white/10 hover:border-blue-500/30 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition hover:bg-blue-500/5">
                    <span className="text-xl">🖼️</span>
                    <p className="text-xs text-gray-600 text-center">Upload images to use in your generated apps</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img.url} alt={img.name} className="w-full h-16 object-cover rounded-lg border border-white/10" />
                        <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
                      </div>
                    ))}
                    <button onClick={() => imageInputRef.current.click()}
                      className="w-full h-16 border border-dashed border-white/10 hover:border-blue-500/30 rounded-lg flex items-center justify-center text-gray-600 hover:text-blue-400 transition text-xl">+</button>
                  </div>
                )}
              </div>

              {/* Quick start suggestions */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">✨ Quick start</p>
                <div className="flex flex-col gap-1">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => setPrompt(s.replace(/^.{2}\s/, ""))}
                      className="text-left text-xs px-3 py-2 bg-white/3 hover:bg-white/8 border border-white/5 hover:border-white/15 rounded-lg text-gray-500 hover:text-gray-300 transition truncate">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Prompt textarea + generate button */}
            <div className="p-4 border-t border-white/5 flex flex-col gap-3">
              <textarea
                className="w-full h-28 p-3 rounded-xl bg-white/5 text-white border border-white/10 focus:outline-none focus:border-blue-500/50 resize-none text-sm placeholder-gray-600 transition"
                placeholder="Describe your app..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.metaKey && handleGenerate()}
              />
              <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-semibold transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Building...
                  </>
                ) : <>✨ Generate App</>}
              </button>
              <p className="text-center text-xs text-gray-700">⌘ + Enter to generate</p>
            </div>
          </div>

          {/* ====================================================
              RIGHT PANEL — Empty state OR Preview/Code + Chat
          ==================================================== */}
          <div className="flex-1 flex flex-col min-w-0 relative">

            {/* Empty state — shown before first generation */}
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-4xl">✨</div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-300">Start building</h2>
                  <p className="text-gray-600 mt-2 max-w-sm">Describe your app on the left and Pero will generate it instantly</p>
                </div>
                <div className="grid grid-cols-3 gap-3 max-w-lg">
                  {["⚡ Instant generation", "💬 Chat to refine", "📥 Download HTML"].map(f => (
                    <div key={f} className="bg-white/3 border border-white/5 rounded-xl p-3 text-xs text-gray-600 text-center">{f}</div>
                  ))}
                </div>
              </div>
            ) : (
              /* Preview / Code view */
              <div className="flex-1 p-4 min-h-0">
                {activeTab === "preview" ? (
                  <div className={`h-full flex justify-center items-start ${previewMode === "mobile" ? "bg-black/20 rounded-2xl p-4" : ""}`}>
                    <iframe
                      srcDoc={result}
                      className={`rounded-xl border border-white/10 bg-white transition-all duration-300 ${
                        previewMode === "mobile" ? "w-[390px] h-[700px]" : "w-full h-full min-h-[600px]"
                      }`}
                      sandbox="allow-scripts"
                    />
                  </div>
                ) : (
                  /* Code view */
                  <pre className="h-full bg-black/40 border border-white/10 rounded-xl p-4 overflow-auto text-xs text-green-400 font-mono whitespace-pre-wrap min-h-[600px]">
                    {result}
                  </pre>
                )}
              </div>
            )}

            {/* ================================================
                FLOATING DRAGGABLE CHAT PANEL
                - Appears after first generation
                - Draggable anywhere on screen
                - Input stops drag when typing
            ================================================ */}
            {result && (
              <div
                ref={chatRef}
                onMouseDown={handleDragStart}
                style={
                  chatPos.x !== null
                    ? { position: "fixed", left: chatPos.x, top: chatPos.y, bottom: "auto", right: "auto", zIndex: 50 }
                    : { position: "absolute", bottom: "24px", right: "24px", zIndex: 50 }
                }
                className="w-80 flex flex-col rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden cursor-grab active:cursor-grabbing select-none"
              >
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-300">💬 Refine</h3>
                    <p className="text-xs text-gray-600">Drag me anywhere · Tell Pero what to change</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>

                {/* Chat messages */}
                <div className="overflow-y-auto p-3 flex flex-col gap-2 max-h-48">
                  {messages.map((m, i) => (
                    <div key={i} className={`text-xs px-3 py-2 rounded-xl max-w-[90%] ${
                      m.role === "user"
                        ? "bg-blue-600/30 border border-blue-500/20 self-end text-blue-200"
                        : "bg-white/5 border border-white/10 self-start text-gray-400"
                    }`}>
                      {m.content}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input — stopPropagation prevents drag when typing */}
                <div className="p-3 border-t border-white/5 flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
                    placeholder="e.g. make the button red..."
                    className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500/50 placeholder-gray-700 cursor-text"
                  />
                  <button onClick={handleFollowUp} disabled={loading}
                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 rounded-lg text-xs font-semibold transition cursor-pointer">
                    {loading ? "..." : "→"}
                  </button>
                </div>
              </div>
            )}

          </div>
          {/* END RIGHT PANEL */}

        </div>
      </div>
      {/* END MAIN CONTENT */}

    </div>
  );
}