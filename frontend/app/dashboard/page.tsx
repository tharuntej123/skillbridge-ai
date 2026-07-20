"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Sparkles, Briefcase, ChevronRight, User as UserIcon, 
  Target, GraduationCap, Award, Compass, FileText, CheckCircle, 
  XCircle, Clock, Loader2, ArrowRight
} from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  
  // Student Dashboard State
  const [profile, setProfile] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [guidance, setGuidance] = useState<any | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [resumeFeedback, setResumeFeedback] = useState<any | null>(null);
  const [resumeFeedbackLoading, setResumeFeedbackLoading] = useState(false);

  // Freelancer Dashboard State
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    const userRole = localStorage.getItem("role");
    setRole(userRole);
    
    // Check if query parameter has job ID to display applicants
    const queryJobId = searchParams.get("job");
    if (queryJobId) {
      setSelectedJobId(queryJobId);
    }
    
    loadDashboardData(userRole, queryJobId);
  }, [searchParams]);

  const loadDashboardData = async (userRole: string | null, queryJobId?: string | null) => {
    try {
      setLoading(true);
      const profileData = await api.getProfile();
      setProfile(profileData);
      
      if (userRole === "student") {
        // Run skill matches
        const matchResults = await api.matchJobs();
        setMatches(matchResults.slice(0, 4)); // Show top 4 matches
      } else if (userRole === "freelancer") {
        const jobs = await api.getPostedJobs();
        setPostedJobs(jobs);
        
        // Load applicants for selected job or first job if exists
        const jobIdToLoad = queryJobId || (jobs.length > 0 ? jobs[0].id : null);
        if (jobIdToLoad) {
          setSelectedJobId(jobIdToLoad);
          loadApplicants(jobIdToLoad);
        }
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (jobId: string) => {
    try {
      setApplicantsLoading(true);
      const apps = await api.getJobApplicants(jobId);
      setApplicants(apps);
    } catch (err) {
      console.error("Failed to load applicants:", err);
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    loadApplicants(jobId);
    router.replace(`/dashboard?job=${jobId}`);
  };

  const handleUpdateStatus = async (appId: string, newStatus: "shortlisted" | "rejected") => {
    try {
      const updatedApp = await api.updateApplicationStatus(appId, newStatus);
      // Update local applicants list
      setApplicants((prev) => 
        prev.map((app) => (app.id === appId ? { ...app, status: updatedApp.status } : app))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update applicant status");
    }
  };

  const handleGetGuidance = async () => {
    setGuidanceLoading(true);
    setGuidance(null);
    try {
      const result = await api.getCareerGuidance();
      setGuidance(result);
    } catch (err: any) {
      alert(err.message || "Failed to retrieve guidance");
    } finally {
      setGuidanceLoading(false);
    }
  };

  const handleGetResumeFeedback = async () => {
    if (!profile?.resume_filename) {
      alert("Please upload a resume in the Profile section first!");
      return;
    }
    
    setResumeFeedbackLoading(true);
    setResumeFeedback(null);
    try {
      const result = await api.getResumeFeedback();
      setResumeFeedback(result);
    } catch (err: any) {
      alert(err.message || "Failed to evaluate resume");
    } finally {
      setResumeFeedbackLoading(false);
    }
  };

  const getMatchPercentColor = (pct: number) => {
    if (pct >= 85) return "text-cyan-400 border-cyan-500/20 bg-cyan-500/5";
    if (pct >= 60) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/5";
    return "text-slate-400 border-slate-500/20 bg-slate-500/5";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ----------------- STUDENT LAYOUT -----------------
  if (role === "student") {
    return (
      <div className="mx-auto max-w-7xl w-full py-12 px-4 md:px-8 space-y-10">
        {/* Welcome Banner */}
        <div className="rounded-3xl border border-white/5 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {profile?.name || "Student"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your profile is verified. Check out your neural matched jobs and learning roadmaps below.
            </p>
          </div>
          <Link href="/profile" className="rounded-xl border border-white/10 hover:border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition-all text-center">
            Edit Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Recommended Jobs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Target className="h-5 w-5 text-gradient" />
                Recommended Matches
              </h2>
              <Link href="/jobs" className="text-xs font-semibold text-primary hover:underline flex items-center">
                All Jobs <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>

            {matches.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
                <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-semibold text-white">No active recommendations</p>
                <p className="text-xs mt-1">Please add skills to your profile to get matches.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.job.id} className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white leading-snug">{match.job.title}</h3>
                        <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold ${getMatchPercentColor(match.match_percentage)}`}>
                          {match.match_percentage}% Match
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {match.job.description}
                      </p>
                      {match.skill_gap && match.skill_gap.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          <span className="text-[10px] font-semibold text-red-400">Gaps:</span>
                          {match.skill_gap.map((gap: string, gIdx: number) => (
                            <span key={gIdx} className="rounded-md bg-red-500/5 border border-red-500/10 text-red-400 px-1.5 py-0.5 text-[9px]">
                              {gap}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link href="/jobs" className="rounded-xl border border-white/10 hover:border-white/20 bg-white/5 p-2.5 text-xs font-semibold text-white transition-all text-center self-stretch sm:self-auto flex items-center justify-center">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* AI Career Assistant Panel */}
            <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center space-x-2.5">
                  <Compass className="h-5 w-5 text-gradient" />
                  <h3 className="text-lg font-bold text-white">AI Career Assistant</h3>
                </div>
                <button
                  onClick={handleGetGuidance}
                  disabled={guidanceLoading}
                  className="rounded-xl btn-gradient px-4 py-2.5 text-xs font-semibold text-white shadow-lg disabled:opacity-50 flex items-center"
                >
                  {guidanceLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  <span>Get Career Guidance</span>
                </button>
              </div>

              {guidance && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm animate-fade-in">
                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 space-y-3">
                    <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Compass className="h-4 w-4" /> Recommended Paths
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5">
                      {guidance.career_paths.map((p: string, idx: number) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 space-y-3">
                    <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Target className="h-4 w-4" /> Missing Skillsets
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5">
                      {guidance.missing_skills.map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 space-y-3">
                    <h4 className="font-bold text-violet-300 flex items-center gap-1.5">
                      <Award className="h-4 w-4" /> Interview Prep
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5">
                      {guidance.interview_prep.map((ip: string, idx: number) => (
                        <li key={idx}>{ip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: ATS Feedback & Roadmaps */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-gradient" />
              Document Evaluations
            </h2>

            {/* Resume Feedback Card */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white">
                  <FileText className="h-5 w-5 text-accent" />
                  <h3 className="text-base font-bold">ATS Resume Feedback</h3>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground leading-relaxed">
                {profile?.resume_filename ? (
                  <>Uploaded resume: <span className="font-semibold text-white">{profile.resume_filename}</span>. Evaluate ATS layout and content scores via Gemini.</>
                ) : (
                  "No resume uploaded yet. Go to your Profile page and upload a resume to unlock ATS feedback."
                )}
              </p>

              {profile?.resume_filename && (
                <button
                  onClick={handleGetResumeFeedback}
                  disabled={resumeFeedbackLoading}
                  className="w-full flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {resumeFeedbackLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1.5 text-accent animate-pulse" />
                  )}
                  Evaluate Resume
                </button>
              )}

              {resumeFeedback && (
                <div className="space-y-4 pt-4 border-t border-white/5 text-xs animate-fade-in">
                  <div className="space-y-1.5">
                    <span className="font-bold text-emerald-400 block">Strengths</span>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                      {resumeFeedback.strengths.slice(0, 2).map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold text-red-400 block">Weaknesses</span>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                      {resumeFeedback.weaknesses.slice(0, 2).map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold text-indigo-400 block">ATS Suggestions</span>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                      {resumeFeedback.ats_suggestions.slice(0, 2).map((a: string, idx: number) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Links Card */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-white">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold">Quick Integrations</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate tailored roadmaps matching your missing skills, or review details on jobs board.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/roadmap" className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 hover:bg-white/5 p-3 text-xs text-white transition-all">
                  <span>AI Learning Roadmaps</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link href="/jobs" className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 hover:bg-white/5 p-3 text-xs text-white transition-all">
                  <span>Explore Jobs Board</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- FREELANCER LAYOUT -----------------
  if (role === "freelancer") {
    return (
      <div className="mx-auto max-w-7xl w-full py-12 px-4 md:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Employer Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review contracts you posted and select jobs to manage incoming candidates
          </p>
        </div>

        {postedJobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground max-w-xl mx-auto my-8">
            <Briefcase className="h-12 w-12 mx-auto stroke-[1.2] mb-4 text-muted-foreground" />
            <h2 className="text-lg font-bold text-white">No jobs posted yet</h2>
            <p className="text-sm mt-1">Create your first contract assignment on the jobs board to view candidates.</p>
            <button
              onClick={() => router.push("/jobs")}
              className="mt-6 rounded-xl btn-gradient px-5 py-2.5 text-xs font-semibold text-white shadow-lg"
            >
              Go to Jobs Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Posted Jobs list */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-base font-semibold text-white uppercase tracking-wider block">My Job Postings</h2>
              <div className="space-y-3">
                {postedJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                      selectedJobId === job.id
                        ? "border-primary bg-primary/10 text-white"
                        : "border-white/5 bg-slate-900/40 text-muted-foreground hover:border-white/10 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white line-clamp-1">{job.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">Budget: ${parseFloat(job.budget).toLocaleString()}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Applicants lists */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white uppercase tracking-wider block">
                  Candidates ({applicants.length})
                </h2>
              </div>

              {applicantsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : applicants.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
                  <UserIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-semibold text-white">No applicants yet</p>
                  <p className="text-xs mt-1">Students will appear here once they apply to this job posting.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicants.map((app) => (
                    <div key={app.id} className="glass-card rounded-2xl p-5 space-y-4 border border-white/5 bg-slate-900/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-white">{app.student_name}</h3>
                          <span className="text-[11px] text-muted-foreground mt-0.5 block">Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Status Label */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Status:</span>
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                            app.status === "shortlisted"
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : app.status === "rejected"
                              ? "bg-red-500/10 border border-red-500/20 text-red-400"
                              : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                          }`}>
                            {app.status === "shortlisted" && <CheckCircle className="h-3 w-3" />}
                            {app.status === "rejected" && <XCircle className="h-3 w-3" />}
                            {app.status === "applied" && <Clock className="h-3 w-3" />}
                            <span className="capitalize">{app.status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Operations to change status */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-xs text-muted-foreground">
                          Select options to shortlist for interview or reject candidates.
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleUpdateStatus(app.id, "shortlisted")}
                            className="flex-1 sm:flex-initial rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 text-xs font-semibold transition-all"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.id, "rejected")}
                            className="flex-1 sm:flex-initial rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-4 py-2 text-xs font-semibold transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

