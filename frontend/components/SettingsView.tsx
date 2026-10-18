"use client";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Shield, Database, BellRing } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsView() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-background p-6 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-text-main">Settings</h2>
        <p className="text-sm text-text-muted mt-1">Manage platform preferences and AI configurations</p>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Appearance Settings */}
        <section>
          <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4" /> Appearance
          </h3>
          <div className="bg-panel border border-border-main rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-main">Theme Mode</p>
                <p className="text-xs text-text-muted mt-1">Switch between Light and Dark interface.</p>
              </div>
              <div className="flex items-center gap-2 bg-panel-hover p-1 rounded-lg border border-border-main">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    theme === "light" ? "bg-white text-slate-900 shadow-sm" : "text-text-muted hover:text-text-main"
                  }`}
                >
                  <Sun className="w-4 h-4" /> Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    theme === "dark" ? "bg-[#1a2540] text-white shadow-sm" : "text-text-muted hover:text-text-main"
                  }`}
                >
                  <Moon className="w-4 h-4" /> Dark
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    theme === "system" ? "bg-indigo-500 text-white shadow-sm" : "text-text-muted hover:text-text-main"
                  }`}
                >
                  <Monitor className="w-4 h-4" /> System
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* AI & Fraud Rules */}
        <section>
          <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> AI & Risk Parameters
          </h3>
          <div className="bg-panel border border-border-main rounded-xl divide-y divide-border-main">
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold text-text-main">Auto-Escalate Critical Risks</p>
                <p className="text-xs text-text-muted mt-1">Automatically send transactions with score &gt; 80 to Tier 2.</p>
              </div>
              <div className="w-10 h-6 bg-indigo-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold text-text-main">AI Model Selection</p>
                <p className="text-xs text-text-muted mt-1">Which LLM powers the Analyst Copilot.</p>
              </div>
              <select className="bg-panel-hover border border-border-main text-text-main text-sm rounded-lg px-3 py-1.5 outline-none">
                <option>Gemini 1.5 Flash (Fast)</option>
                <option>Gemini 1.5 Pro (Reasoning)</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
