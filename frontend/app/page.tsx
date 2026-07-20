"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, ArrowRight, Zap, Target, BookOpen, FileText, Search } from "lucide-react";

export default function LandingPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const features = [
    {
      icon: Target,
      title: "Sentence-BERT Match",
      desc: "Instantly compare your skills against job specifications with deep-learning embeddings, obtaining an exact match percentage.",
    },
    {
      icon: Search,
      title: "FAISS Semantic Search",
      desc: "Search jobs by intent, not just exact keywords. Search for 'AI Developer' and discover relevant jobs with vector similarity.",
    },
    {
      icon: BookOpen,
      title: "RAG Learning Roadmaps",
      desc: "Bridges your skills gaps by pulling actual learning resources and running them through Gemini for a custom weekly study plan.",
    },
    {
      icon: Zap,
      title: "Career Guidance",
      desc: "Run a full profile evaluation through Gemini to analyze missing skills, suitable career paths, and tailored interview prep.",
    },
    {
      icon: FileText,
      title: "ATS Resume Feedback",
      desc: "Upload your resume file and get constructive recruitment reviews covering strengths, weaknesses, and ATS improvements.",
    },
    {
      icon: Briefcase,
      title: "Freelancing Portal",
      desc: "For freelancers and project owners to post jobs, manage contracts, and review applicants sorted by AI suitability.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 md:px-8">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mt-8 md:mt-16 flex flex-col items-center">
        <div className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-accent mb-6 animate-pulse">
          <Zap className="h-3 w-3" />
          <span>Next-Generation Freelance Matchmaking</span>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white font-sans leading-tight">
          Bridge the Skill Gap with <br />
          <span className="text-gradient">AI-Powered Placement</span>
        </h1>
        
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          SkillBridge AI matches students and freelancers to ideal projects using vector similarity, analyzes profile deficits, and curates Gemini RAG-driven learning paths.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          {token ? (
            <Link href="/dashboard" className="flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-2xl btn-gradient text-sm font-semibold text-white shadow-lg shadow-indigo-500/20">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/register" className="flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-2xl btn-gradient text-sm font-semibold text-white shadow-lg shadow-indigo-500/20">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/login" className="flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-sm font-semibold text-white transition-all">
                Explore Jobs
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Section */}
      <div className="mt-32 max-w-7xl w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Engineered with Production-Grade AI
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Combining state-of-the-art sentence embeddings, vector search indexes, and generative AI pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="glass-card rounded-3xl p-8 flex flex-col space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary-foreground text-gradient">
                  <Icon className="h-6 w-6 stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* RAG Showcase Banner */}
      <div className="mt-32 max-w-6xl w-full rounded-3xl border border-white/5 bg-gradient-to-r from-indigo-950/20 via-slate-900/40 to-cyan-950/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 glow-primary">
        <div className="max-w-xl space-y-4">
          <h3 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">Ready to Level Up Your Career?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our RAG (Retrieval-Augmented Generation) pipeline scans real courses, tutorials, and documentations to assemble a week-by-week program specifically targeting the skills you need for your dream job.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <Link href="/register" className="flex items-center justify-center w-full px-6 py-4 rounded-xl btn-gradient text-sm font-semibold text-white">
            Generate Your First Roadmap
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
