"use client";

// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
// Alias the import to avoid collision with Next.js route segment config
import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

// Load Monaco editor dynamically (client-side only)
const MonacoEditor = dynamicImport(() => import("@monaco-editor/react"), { ssr: false });

export default function CodingRoom() {

  // ============================================================
  // STATE
  // ============================================================
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [layout, setLayout] = useState("split"); // split | editor | preview
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [saved, setSaved] = useState(false);
  const aiEndRef = useRef(null);

  // ============================================================
  // ROUTER & SUPABASE
  // ============================================================
  const router = useRouter();
  const supabase = createClient();

  // ============================================================
  // PLAN ACCESS LEVELS
  // ============================================================
  const PRO_PLANS = ["pro", "premium", "business", "lifetime"];

  // ============================================================
  // EFFECTS — AUTH + PLAN CHECK
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

      if (!profileData || !PRO_PLANS.includes(profileData.plan)) {
        router.push("/pricing");
        return;
      }

      setProfile(profileData);

      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsData) setProjects(projectsData);
      if (projectsData?.length > 0) {
        setSelectedProject(projectsData[0]);
        setCode(projectsData[0].code || "");
      }

      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // ============================================================
  // FUNCTION — SELECT PROJECT
  // ============================================================
  function handleSelectProject(project) {
    setSelectedProject(project);
    setCode(project.code || "");
    setAiMessages([]);
    setSaved(false);
  }

  // ============================================================
  // FUNCTION — SAVE CODE
  // ============================================================
  async function handleSave() {
    if (!selectedProject) return;
    setSaving(true);
    await supabase
      .from("projects")
      .update({ code })
      .eq("id", selectedProject.id);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, code } : p));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ============================================================
  // FUNCTION — DOWNLOAD HTML
  // ============================================================
  function handleDownload() {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedProject?.title || "pero-app"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // FUNCTION — AI FIX / EDIT VIA CHAT
  // ============================================================
  async function handleAiEdit() {
    if (!aiPrompt.trim() || !code) return;
    setAiLoading(true);
    const newMessages = [...aiMessages, { role: "user", content: aiPrompt }];
    setAiMessages(newMessages);
    setAiPrompt("");

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        prompt: aiPrompt,
        previousCode: code,
        messages: newMessages,
      }),
    });

    const data = await res.json();

    if (data.result) {
      setCode(data.result);
      setAiMessages(prev => [...prev, { role: "assistant", content: "✅ Code updated! Check the preview." }]);
    } else {
      setAiMessages(prev => [...prev, { role: "assistant", content: `❌ ${data.message || "Something went wrong"}` }]);
    }

    setAiLoading(false);
  }

  // ============================================================
  // FUNCTION — FORMAT CODE (basic)
  // ============================================================
  function handleFormat() {
    try {
      const formatted = code
        .replace(/></g, ">\n<")
        .split("\n")
        .map(line => line.trim())
        .join("\n");
      setCode(formatted);
    } catch (e) {
      console.error("Format error:", e);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading coding room...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PLAN BADGE COLOR
  // ============================================================
  const planAccents = {
    pro: "from-purple-500 to-indigo-600",
    premium: "from-orange-500 to-amber-500",
    business: "from-yellow-500 to-green-500",
    lifetime: "from-yellow-400 to-amber-500",
  };
  const accent = planAccents[profile?.plan] || "from-purple-500 to-indigo-600";

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="h-screen bg-[#1e1e1e] text-white flex flex-col overflow-hidden">

      {/* ======================================================
          TOP BAR
      ====================================================== */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-white/5 flex-shrink-0">

        {/* Left — Logo + project name */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition">
            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${accent} flex items-center justify-center text-xs font-bold`}>P</div>
            <span className="text-sm font-bold text-gray-300">Pero</span>
          </button>
          <span className="text-gray-600">›</span>
          <span className="text-sm text-gray-400 font-medium truncate max-w-48">
            {selectedProject?.title || "No project selected"}
          </span>
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r ${accent} text-white capitalize`}>
            {profile?.plan}
          </span>
        </div>

        {/* Center — Layout switcher */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {[
            { id: "editor", label: "📝 Editor" },
            { id: "split", label: "⚡ Split" },
            { id: "preview", label: "👁 Preview" },
          ].map(l => (
            <button key={l.id} onClick={() => setLayout(l.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                layout === l.id ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"
              }`}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2">
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-400 focus:outline-none"
          >
            {[12, 13, 14, 15, 16, 18, 20].map(s => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
          <button onClick={handleFormat}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition">
            ✨ Format
          </button>
          <button onClick={handleDownload}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition">
            📥 Download
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`px-3 py-1.5 bg-gradient-to-r ${accent} hover:opacity-90 rounded-lg text-xs font-semibold transition disabled:opacity-50`}>
            {saved ? "✅ Saved!" : saving ? "Saving..." : "💾 Save"}
          </button>
          <button onClick={() => setShowAiPanel(!showAiPanel)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              showAiPanel ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-white/5 border-white/10 text-gray-400"
            }`}>
            🤖 AI
          </button>
        </div>
      </header>

      {/* ======================================================
          MAIN AREA
      ====================================================== */}
      <div className="flex-1 flex overflow-hidden">

        {/* ====================================================
            SIDEBAR — Project list
        ==================================================== */}
        <aside className="w-52 flex-shrink-0 bg-[#252526] border-r border-white/5 flex flex-col">
          <div className="p-3 border-b border-white/5">
            <p className="text-xs text-gray-600 uppercase tracking-wider">Projects</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-600">No projects yet</p>
                <button onClick={() => router.push("/")}
                  className="text-xs text-purple-400 hover:text-purple-300 transition mt-2">
                  Generate one →
                </button>
              </div>
            ) : (
              projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className={`w-full text-left px-3 py-2.5 text-xs transition border-l-2 ${
                    selectedProject?.id === p.id
                      ? "bg-white/5 border-purple-500 text-white"
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/3"
                  }`}
                >
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-gray-700 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </button>
              ))
            )}
          </div>
          <div className="p-3 border-t border-white/5">
            <button onClick={() => router.push("/")}
              className={`w-full py-2 bg-gradient-to-r ${accent} hover:opacity-90 rounded-lg text-xs font-semibold transition`}>
              + New app
            </button>
          </div>
        </aside>

        {/* ====================================================
            EDITOR + PREVIEW AREA
        ==================================================== */}
        <div className="flex-1 flex overflow-hidden">

          {/* Code editor */}
          {(layout === "editor" || layout === "split") && (
            <div className={`flex flex-col ${layout === "split" ? "w-1/2" : "flex-1"} border-r border-white/5`}>

              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-600">
                  {selectedProject?.title || "untitled"}.html
                </span>
                <span className="text-xs text-gray-700">{code.length} chars</span>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 overflow-hidden">
                {selectedProject ? (
                  <MonacoEditor
                    height="100%"
                    language="html"
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{
                      fontSize,
                      minimap: { enabled: layout === "editor" },
                      wordWrap: "on",
                      formatOnPaste: true,
                      formatOnType: true,
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: 2,
                      lineNumbers: "on",
                      renderLineHighlight: "all",
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                      padding: { top: 12 },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-600 text-sm">Select a project to start editing</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live preview */}
          {(layout === "preview" || layout === "split") && (
            <div className={`flex flex-col ${layout === "split" ? "w-1/2" : "flex-1"}`}>

              {/* Preview toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-white/5">
                <span className="text-xs text-gray-600">Live Preview</span>
                <div className="flex items-center gap-1 bg-white/5 rounded-md p-0.5">
                  <button onClick={() => setPreviewMode("desktop")}
                    className={`px-2 py-0.5 rounded text-xs transition ${previewMode === "desktop" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
                    🖥
                  </button>
                  <button onClick={() => setPreviewMode("mobile")}
                    className={`px-2 py-0.5 rounded text-xs transition ${previewMode === "mobile" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
                    📱
                  </button>
                </div>
              </div>

              {/* Preview iframe */}
              <div className={`flex-1 bg-[#1a1a1a] flex justify-center items-start overflow-auto ${previewMode === "mobile" ? "p-4" : ""}`}>
                {code ? (
                  <iframe
                    srcDoc={code}
                    className={`bg-white transition-all duration-300 ${
                      previewMode === "mobile"
                        ? "w-[390px] h-[700px] rounded-xl border border-white/10"
                        : "w-full h-full"
                    }`}
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-600 text-sm">No code to preview</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ====================================================
            AI ASSISTANT PANEL
        ==================================================== */}
        {showAiPanel && (
          <div className="w-72 flex-shrink-0 bg-[#252526] border-l border-white/5 flex flex-col">

            <div className="p-3 border-b border-white/5">
              <h3 className="text-xs font-semibold text-gray-300">🤖 AI Assistant</h3>
              <p className="text-xs text-gray-600 mt-0.5">Ask AI to edit your code</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {aiMessages.length === 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <p className="text-xs text-gray-600 text-center">Try asking:</p>
                  {[
                    "Make the button larger",
                    "Change the color to blue",
                    "Add a footer section",
                    "Fix any errors",
                    "Make it mobile responsive",
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setAiPrompt(suggestion)}
                      className="text-left text-xs px-3 py-2 bg-white/3 hover:bg-white/8 border border-white/5 hover:border-purple-500/30 rounded-lg text-gray-500 hover:text-gray-300 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`text-xs px-3 py-2 rounded-xl max-w-[95%] ${
                  m.role === "user"
                    ? "bg-purple-600/30 border border-purple-500/20 self-end text-purple-200"
                    : "bg-white/5 border border-white/10 self-start text-gray-400"
                }`}>
                  {m.content}
                </div>
              ))}
              {aiLoading && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 self-start flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce delay-200" />
                  </div>
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              )}
              <div ref={aiEndRef} />
            </div>

            {/* AI input */}
            <div className="p-3 border-t border-white/5 flex flex-col gap-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleAiEdit())}
                placeholder="Ask AI to edit your code..."
                rows={3}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/50 resize-none"
              />
              <button
                onClick={handleAiEdit}
                disabled={aiLoading || !aiPrompt.trim()}
                className={`w-full py-2 bg-gradient-to-r ${accent} hover:opacity-90 disabled:opacity-50 rounded-lg text-xs font-semibold transition`}
              >
                {aiLoading ? "Editing..." : "✨ Apply AI Edit"}
              </button>
              <p className="text-xs text-gray-700 text-center">Enter to send · Shift+Enter for new line</p>
            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          STATUS BAR
      ====================================================== */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#007acc] text-white text-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>🟢 Ready</span>
          <span>HTML</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{code.split("\n").length} lines</span>
          <span>Font size: {fontSize}px</span>
          <span className="capitalize">{profile?.plan} plan</span>
        </div>
      </div>

    </div>
  );
}