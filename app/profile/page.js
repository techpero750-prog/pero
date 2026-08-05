"use client";

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Profile() {

  // ============================================================
  // STATE
  // ============================================================
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("default");
  const fileRef = useRef(null);

  // ============================================================
  // ROUTER & SUPABASE
  // ============================================================
  const router = useRouter();
  const supabase = createClient();

  // ============================================================
  // DEFAULT AVATARS
  // ============================================================
  const defaultAvatars = [
    { id: "dev", emoji: "👨‍💻", label: "Developer", bg: "from-blue-500 to-cyan-500" },
    { id: "designer", emoji: "🎨", label: "Designer", bg: "from-pink-500 to-rose-500" },
    { id: "founder", emoji: "🚀", label: "Founder", bg: "from-purple-500 to-indigo-500" },
    { id: "student", emoji: "🎓", label: "Student", bg: "from-green-500 to-teal-500" },
    { id: "agency", emoji: "🏢", label: "Agency", bg: "from-orange-500 to-amber-500" },
    { id: "creator", emoji: "✨", label: "Creator", bg: "from-yellow-500 to-orange-500" },
    { id: "hacker", emoji: "🤖", label: "Hacker", bg: "from-gray-500 to-slate-500" },
    { id: "ninja", emoji: "🥷", label: "Ninja", bg: "from-red-500 to-pink-500" },
    { id: "wizard", emoji: "🧙", label: "Wizard", bg: "from-violet-500 to-purple-500" },
    { id: "astronaut", emoji: "👨‍🚀", label: "Astronaut", bg: "from-blue-600 to-indigo-600" },
    { id: "artist", emoji: "🧑‍🎤", label: "Artist", bg: "from-fuchsia-500 to-pink-500" },
    { id: "chef", emoji: "🧑‍🍳", label: "Chef", bg: "from-amber-500 to-yellow-500" },
  ];

  // ============================================================
  // EFFECTS — LOAD PROFILE
  // ============================================================
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/landing"); return; }
      setUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }
      setLoading(false);
    }
    init();
  }, []);

  // ============================================================
  // FUNCTION — SELECT DEFAULT AVATAR
  // ============================================================
  function selectDefaultAvatar(avatar) {
    setAvatarUrl(`default:${avatar.id}:${avatar.emoji}:${avatar.bg}`);
  }

  // ============================================================
  // FUNCTION — RENDER AVATAR PREVIEW
  // ============================================================
  function renderAvatar(size = "w-24 h-24", textSize = "text-3xl") {
    if (!avatarUrl) {
      return (
        <div className={`${size} rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${textSize} font-bold border-2 border-white/10`}>
          {user?.email?.[0]?.toUpperCase()}
        </div>
      );
    }
    if (avatarUrl.startsWith("default:")) {
      const parts = avatarUrl.split(":");
      const emoji = parts[2];
      const bg = parts[3];
      return (
        <div className={`${size} rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center ${textSize} border-2 border-white/10`}>
          {emoji}
        </div>
      );
    }
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        className={`${size} rounded-2xl object-cover border-2 border-white/10`}
      />
    );
  }

  // ============================================================
  // FUNCTION — UPLOAD CUSTOM AVATAR
  // ============================================================
  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      setActiveTab("upload");
    }
    setUploading(false);
  }

  // ============================================================
  // FUNCTION — SAVE PROFILE
  // ============================================================
  async function handleSave() {
    if (!user) return;
    setSaving(true);

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      bio,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#030712] text-white">

      {/* ======================================================
          NAVBAR
      ====================================================== */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">P</div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Pero</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition">
            📊 Dashboard
          </button>
          <button onClick={() => router.push("/")}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-semibold transition">
            ✨ Builder
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10 flex flex-col gap-8">

        {/* ======================================================
            HEADER
        ====================================================== */}
        <div>
          <h1 className="text-3xl font-black">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account details and avatar</p>
        </div>

        {/* ======================================================
            AVATAR SECTION
        ====================================================== */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="font-bold">Profile picture</h2>

          {/* Current avatar preview */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {renderAvatar()}
              {uploading && (
                <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-200">
                {avatarUrl?.startsWith("default:") ? `${avatarUrl.split(":")[2]} Avatar selected` : avatarUrl ? "Custom photo uploaded" : "No avatar set"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">Choose a default avatar or upload your own photo</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab("default")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${activeTab === "default" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              🎭 Default avatars
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${activeTab === "upload" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              📷 Upload photo
            </button>
          </div>

          {/* Default avatars grid */}
          {activeTab === "default" && (
            <div className="grid grid-cols-4 gap-3">
              {defaultAvatars.map((avatar) => {
                const isSelected = avatarUrl === `default:${avatar.id}:${avatar.emoji}:${avatar.bg}`;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => selectDefaultAvatar(avatar)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${
                      isSelected
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-white/5 bg-white/3 hover:border-white/20 hover:bg-white/8"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-2xl`}>
                      {avatar.emoji}
                    </div>
                    <p className="text-xs text-gray-400">{avatar.label}</p>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-xs">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Upload custom photo */}
          {activeTab === "upload" && (
            <div className="flex flex-col gap-4">
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-white/10 hover:border-blue-500/30 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition hover:bg-blue-500/5"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
                  {uploading ? "⏳" : "📷"}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300">
                    {uploading ? "Uploading..." : "Click to upload photo"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">JPG, PNG or GIF — max 2MB</p>
                </div>
              </div>

              {avatarUrl && !avatarUrl.startsWith("default:") && (
                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <img src={avatarUrl} alt="Uploaded" className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <p className="text-xs font-medium text-green-400">Photo uploaded successfully!</p>
                    <p className="text-xs text-gray-600 mt-0.5">Your custom photo is set</p>
                  </div>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* ======================================================
            PROFILE DETAILS FORM
        ====================================================== */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="font-bold">Profile details</h2>

          {/* Email — read only */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
            <input
              type="text"
              value={user?.email || ""}
              disabled
              className="w-full p-3 rounded-xl bg-white/3 border border-white/5 text-gray-500 text-sm cursor-not-allowed"
            />
          </div>

          {/* Full name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-700 transition"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              rows={3}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-700 resize-none transition"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            {saved ? "✅ Saved!" : saving ? "Saving..." : "Save profile"}
          </button>
        </div>

        {/* ======================================================
            DANGER ZONE
        ====================================================== */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-bold text-red-400">Danger zone</h2>
          <p className="text-sm text-gray-500">Once you delete your account all your projects will be permanently removed.</p>
          <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 text-sm transition">
            🗑️ Delete account
          </button>
        </div>
      </div>
    </div>
  );
}