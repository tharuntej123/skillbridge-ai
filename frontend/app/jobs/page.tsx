"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Search, Briefcase, DollarSign, Target, Plus, Edit2, Trash2, Loader2, Sparkles, X, Check } from "lucide-react";

export default function JobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Dashboard application tracking state
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  
  // Modal states for creating/editing jobs
  const [showModal, setShowModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalSkills, setModalSkills] = useState("");
  const [modalBudget, setModalBudget] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Tabs for freelancer
  const [jobTab, setJobTab] = useState<"all" | "posted">("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    const userRole = localStorage.getItem("role");
    setRole(userRole);
    loadData(userRole);
  }, [jobTab]);

  const loadData = async (userRole: string | null) => {
    try {
      setLoading(true);
      
      // Load jobs
      let jobList = [];
      if (userRole === "freelancer" && jobTab === "posted") {
        jobList = await api.getPostedJobs();
      } else {
        jobList = await api.getJobs();
      }
      setJobs(jobList);

      // Load applications if student to mark active buttons
      if (userRole === "student") {
        const myApps = await api.getAppliedJobs();
        setAppliedJobIds(myApps.map((a: any) => a.job_id));
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadData(role);
      setIsSearching(false);
      return;
    }

    try {
      setLoading(true);
      setIsSearching(true);
      const searchResults = await api.searchJobs(searchQuery);
      setJobs(searchResults);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    try {
      await api.applyToJob(jobId);
      setAppliedJobIds((prev) => [...prev, jobId]);
      alert("Application submitted successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to submit application");
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    
    try {
      await api.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err: any) {
      alert(err.message || "Failed to delete job");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingJobId(null);
    setModalTitle("");
    setModalDesc("");
    setModalSkills("");
    setModalBudget("");
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (job: any) => {
    setEditingJobId(job.id);
    setModalTitle(job.title);
    setModalDesc(job.description);
    setModalSkills(job.skills_required);
    setModalBudget(job.budget.toString());
    setModalError(null);
    setShowModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    const budgetNum = parseFloat(modalBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setModalError("Please enter a valid budget amount");
      setModalLoading(false);
      return;
    }

    try {
      const payload = {
        title: modalTitle,
        description: modalDesc,
        skills_required: modalSkills,
        budget: budgetNum,
      };

      if (editingJobId) {
        await api.updateJob(editingJobId, payload);
      } else {
        await api.createJob(payload);
      }
      
      setShowModal(false);
      loadData(role);
    } catch (err: any) {
      setModalError(err.message || "Failed to save job");
    } finally {
      setModalLoading(false);
    }
  };

  const getMatchColorClass = (pct: number | undefined) => {
    if (pct === undefined) return "bg-white/5 border-white/10 text-white";
    if (pct >= 85) return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
    if (pct >= 60) return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
    return "bg-slate-500/10 border-slate-500/20 text-slate-400";
  };

  return (
    <div className="mx-auto max-w-6xl w-full py-12 px-4 md:px-8 space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Jobs Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover contract opportunities using semantic searches and neural matching
          </p>
        </div>

        <div className="flex items-center gap-3">
          {role === "freelancer" && (
            <>
              <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setJobTab("all")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    jobTab === "all" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  All Postings
                </button>
                <button
                  onClick={() => setJobTab("posted")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    jobTab === "posted" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  My Postings
                </button>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center justify-center rounded-xl btn-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Post a Job</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Semantic Search Box */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
            <Search className="h-5 w-5 stroke-[1.5]" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/30 py-3.5 pl-10 pr-4 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            placeholder="Search matching projects (e.g. 'React Developer', 'Python AI internship')"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-white/10 hover:border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition-all"
        >
          Search
        </button>
        {isSearching && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setIsSearching(false);
              loadData(role);
            }}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all"
          >
            Clear
          </button>
        )}
      </form>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto stroke-[1.2] mb-4 text-muted-foreground" />
          <p className="text-base font-semibold text-white">No jobs discovered</p>
          <p className="text-sm mt-1">Try broadening your search query or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold text-white tracking-tight">{job.title}</h3>
                  {role === "student" && (
                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${getMatchColorClass(job.match_percentage)}`}>
                      <Sparkles className="h-3 w-3" />
                      {job.match_percentage || 0}% Match
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1 font-semibold text-emerald-400">
                    <DollarSign className="h-3.5 w-3.5" />
                    Budget: ${parseFloat(job.budget).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mt-4 line-clamp-3">
                  {job.description}
                </p>

                <div className="mt-4">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Required Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills_required.split(",").map((skill: string, sIdx: number) => (
                      <span key={sIdx} className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[11px] text-white">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                <div>
                  {role === "freelancer" && jobTab === "posted" && (
                    <button
                      onClick={() => router.push(`/dashboard?job=${job.id}`)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View Applicants
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  {role === "student" ? (
                    appliedJobIds.includes(job.id) ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                        <Check className="h-4 w-4" /> Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(job.id)}
                        className="rounded-xl btn-gradient px-5 py-2 text-xs font-semibold text-white shadow-lg"
                      >
                        Apply Now
                      </button>
                    )
                  ) : role === "freelancer" && job.owner_id === localStorage.getItem("user_id") ? (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(job)}
                        className="rounded-xl border border-white/5 hover:border-white/15 p-2 bg-white/5 text-muted-foreground hover:text-white transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="rounded-xl border border-red-500/15 p-2 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post/Edit Job Dialog (Modal) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full glass-card p-6 md:p-8 rounded-3xl relative space-y-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {editingJobId ? "Edit Job Posting" : "Post a New Job"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Describe the requirements and target budget for freelancers.
              </p>
            </div>

            {modalError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 px-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Next.js Frontend Developer"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Job Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 px-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                  placeholder="Summarize the project responsibilities, target deliverables, and duration..."
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Skills Required (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={modalSkills}
                  onChange={(e) => setModalSkills(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 px-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. React, Next.js, CSS, TypeScript"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Project Budget ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    required
                    value={modalBudget}
                    onChange={(e) => setModalBudget(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-9 pr-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. 1500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/10 hover:bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center justify-center rounded-xl btn-gradient px-6 py-2.5 text-xs font-semibold text-white shadow-lg disabled:opacity-50"
                >
                  {modalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <span>{editingJobId ? "Save Changes" : "Post Job"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
