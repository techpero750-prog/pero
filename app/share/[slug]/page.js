"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function SharePage() {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState("desktop");
  const params = useParams();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", params.slug)
        .eq("is_public", true)
        .single();
      setProject(data);
      setLoading(false);
    }
    load();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">😕</span>
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p className="text-gray-500">This project may be private or deleted</p>
        <a href="/" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-sm font-semibold">
          Build your own →
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col">

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">P</div>
          <span className="font-bold text-sm bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Pero</span>
          <span className="text-gray-600">›</span>
          <span className="text-sm text-gray-400 truncate max-w-xs">{project.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button onClick={() => setPreviewMode("desktop")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${previewMode === "desktop" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>
              🖥 Desktop
            </button>
            <button onClick={() => setPreviewMode("mobile")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${previewMode === "mobile" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>
              📱 Mobile
            </button>
          </div>
          <button onClick={() => {
            const blob = new Blob([project.code], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `${project.title}.html`; a.click();
          }}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-xs font-semibold">
            📥 Download
          </button>
          <a href="/"
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition">
            Build your own ✨
          </a>
        </div>
      </nav>

      {/* Preview */}
      <div className={`flex-1 flex justify-center items-start p-4 ${previewMode === "mobile" ? "bg-black/20" : ""}`}>
        <iframe
          srcDoc={project.code}
          className={`bg-white rounded-xl border border-white/10 transition-all duration-300 ${
            previewMode === "mobile" ? "w-[390px] h-[700px]" : "w-full h-full min-h-[600px]"
          }`}
          sandbox="allow-scripts"
        />
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between text-xs text-gray-600">
        <span>Built with ✨ Pero AI App Builder</span>
        <a href="/" className="text-blue-400 hover:text-blue-300 transition">Create your own free →</a>
      </div>
    </div>
  );
}