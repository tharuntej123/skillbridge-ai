"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Sparkles, Calendar, BookOpen, ExternalLink, ArrowRight, Loader2, RefreshCw } from "lucide-react";

export default function RoadmapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [goal, setGoal] = useState("");
  const [roadmapData, setRoadmapData] = useState<any | null>(null);
  const [stepText, setStepText] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    const role = localStorage.getItem("role");
    if (role !== "student") {
      router.push("/dashboard");
      return;
    }

    loadSavedRoadmap();
  }, []);

  const loadSavedRoadmap = async () => {
    try {
      setLoading(true);
      const data = await api.getSavedLearningRoadmap();
      setRoadmapData(data);
      setGoal(data.goal || "");
    } catch (err) {
      // It's fine if no roadmap is found initially
      console.log("No saved roadmap found.");
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setGenerating(true);
    setRoadmapData(null);
    
    // Simulate RAG step text transitions to wow the user!
    const steps = [
      "Vectorizing target career goal...",
      "Analyzing student profile skills and experience...",
      "Searching local vector database for relevant learning materials...",
      "Retrieving matched resources (AWS, React, Python, Java)...",
      "Compiling context package for Google Gemini...",
      "Synthesizing customized week-by-week learning roadmap..."
    ];

    let currentStep = 0;
    setStepText(steps[currentStep]);
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setStepText(steps[currentStep]);
      } else {
        clearInterval(stepInterval);
      }
    }, 2500);

    try {
      const data = await api.generateLearningRoadmap(goal);
      clearInterval(stepInterval);
      setRoadmapData(data);
    } catch (err: any) {
      alert(err.message || "Failed to generate roadmap. Please check API settings.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl w-full py-12 px-4 md:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-accent animate-pulse" />
          RAG Learning Roadmap
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bridge your skill gaps with an AI roadmap generated using verified local documentation
        </p>
      </div>

      {/* Generator Form */}
      {(!roadmapData && !generating) && (
        <div className="glass-card p-8 rounded-3xl space-y-6 max-w-2xl mx-auto text-center">
          <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gradient">
            <BookOpen className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Choose Your Career Goal</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Enter the software engineering role you want to achieve, and our system will design a path from your current skills.
            </p>
          </div>

          <form onSubmit={generateRoadmap} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-slate-950/30 py-3.5 px-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              placeholder="e.g. Backend Engineer, React Developer, AWS Solutions Architect"
            />
            <button
              type="submit"
              className="rounded-xl btn-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-lg"
            >
              Generate AI Roadmap
            </button>
          </form>
        </div>
      )}

      {/* RAG Loading Animation screen */}
      {generating && (
        <div className="glass-card p-12 rounded-3xl text-center space-y-6 max-w-md mx-auto my-12 animate-pulse border border-primary/20">
          <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Running RAG pipeline</h3>
            <p className="text-xs text-muted-foreground font-mono bg-slate-950/50 p-3 rounded-lg border border-white/5">
              {stepText}
            </p>
          </div>
        </div>
      )}

      {/* Timeline view */}
      {roadmapData && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Target Objective</span>
              <h2 className="text-2xl font-bold text-white mt-0.5">{roadmapData.goal}</h2>
            </div>
            <button
              onClick={() => setRoadmapData(null)}
              className="flex items-center gap-1.5 rounded-xl border border-white/5 hover:border-white/15 bg-white/5 px-4 py-2 text-xs text-muted-foreground hover:text-white transition-all font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Re-target Goal
            </button>
          </div>

          <div className="relative pl-6 md:pl-8 border-l border-white/10 space-y-8 mt-12 ml-4">
            {roadmapData.roadmap.map((week: any, idx: number) => (
              <div key={idx} className="relative">
                {/* Timeline node circle */}
                <span className="absolute -left-[31px] md:-left-[39px] top-1.5 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-slate-950 border-2 border-primary glow-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>

                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 text-white">
                    <Calendar className="h-4 w-4 text-accent" />
                    <h3 className="text-base font-bold">{week.week}</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Topics Sub-list */}
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Syllabus / Key Topics</span>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground list-disc pl-4">
                        {week.topics.map((topic: string, tIdx: number) => (
                          <li key={tIdx} className="leading-relaxed">
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Resources Sub-list */}
                    {week.resources && week.resources.length > 0 && (
                      <div className="border-t border-white/5 pt-4">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Verified RAG Learning Resources</span>
                        <div className="space-y-2">
                          {week.resources.map((res: string, rIdx: number) => {
                            // Extract URLs if formatted as 'Title (URL)'
                            const urlRegex = /(https?:\/\/[^\s)]+)/;
                            const match = res.match(urlRegex);
                            const url = match ? match[0] : null;
                            const text = url ? res.replace(`(${url})`, "").replace(url, "").trim() : res;

                            return url ? (
                              <a
                                key={rIdx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/30 px-4 py-2.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-white/5 transition-all group"
                              >
                                <span className="font-medium truncate max-w-[500px]">{text || url}</span>
                                <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </a>
                            ) : (
                              <div key={rIdx} className="rounded-xl border border-white/5 bg-slate-950/30 px-4 py-2.5 text-xs text-muted-foreground">
                                {res}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
