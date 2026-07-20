"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User as UserIcon, BookOpen, Briefcase, FileText, Upload, Save, Loader2, Sparkles } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    setRole(localStorage.getItem("role"));
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setName(data.name || "");
      setSkills(data.skills || "");
      setEducation(data.education || "");
      setExperience(data.experience || "");
      setResumeFilename(data.resume_filename || null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    
    try {
      const updated = await api.updateProfile({ name, skills, education, experience });
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const file = fileList[0];
    setUploading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    
    try {
      const updated = await api.uploadResume(file);
      setResumeFilename(updated.resume_filename);
      setSuccessMsg("Resume uploaded and scanned successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  // Convert comma-separated skills to tag list
  const skillTags = skills
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl w-full py-12 px-4 md:px-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your credentials and resume settings for AI placements
          </p>
        </div>
        
        {role === "student" && (
          <button
            onClick={() => router.push("/roadmap")}
            className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
          >
            <Sparkles className="h-4 w-4 mr-2 text-accent" />
            <span>Generate RAG Roadmap</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card - Quick Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-gradient">
              <UserIcon className="h-10 w-10 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-bold text-white">{name || "User"}</h2>
            <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-accent mt-2 uppercase tracking-wide">
              {role}
            </span>

            {skillTags.length > 0 && (
              <div className="w-full mt-6 text-left border-t border-white/5 pt-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Skills Identified</h3>
                <div className="flex flex-wrap gap-2">
                  {skillTags.map((tag, idx) => (
                    <span key={idx} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-white">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resume Upload Card (Students Only) */}
          {role === "student" && (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-white">
                <FileText className="h-5 w-5 text-gradient" />
                <h3 className="text-base font-bold">Resume Upload</h3>
              </div>
              
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload your resume in PDF, Word, or Text format to enable AI Resume Feedback and keyword-matching integrations.
              </p>
              
              {resumeFilename && (
                <div className="rounded-xl bg-white/5 border border-white/5 p-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[150px]">{resumeFilename}</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
              )}

              <div className="relative mt-2">
                <input
                  type="file"
                  id="resume-file"
                  accept=".txt,.pdf,.docx,.doc"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="resume-file"
                  className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-primary/50 transition-all text-center p-4"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <span className="text-xs font-semibold text-white">Select File</span>
                      <span className="text-[10px] text-muted-foreground mt-1">PDF, TXT, DOCX up to 10MB</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Right Card - Form Editor */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 md:p-8 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Edit Profile details</h3>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/30 py-3 px-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. Alex Johnson"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Skills (Comma separated list)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/30 py-3 px-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. Python, SQL, React, Node.js"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Education details
                  </label>
                  <textarea
                    rows={3}
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/30 py-3 px-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                    placeholder="e.g. BS in Computer Science - Stanford University (2025)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Experience profile
                  </label>
                  <textarea
                    rows={4}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/30 py-3 px-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                    placeholder="e.g. Software Engineering Intern at TechCorp (3 months). Built responsive dashboards using Next.js."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center justify-center rounded-xl btn-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
