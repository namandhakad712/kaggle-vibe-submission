import React, { useCallback, useState, useLayoutEffect, useRef, useEffect } from 'react';
import { Upload, FileText, AlertCircle, ScanLine, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import gsap from 'gsap';

interface UploadSectionProps {
  onFileSelect: (base64: string) => void;
  isProcessing: boolean;
  error?: string | null;
}

const STATUS_MESSAGES = [
  "Uploading document...",
  "Scanning PDF layout...",
  "Identifying questions & diagrams...",
  "Analyzing mathematical content...",
  "Solving problems...",
  "Generating explanations...",
  "Finalizing quiz structure..."
];

const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect, isProcessing, error }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(STATUS_MESSAGES[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Progress Simulation Logic
  useEffect(() => {
    if (isProcessing) {
      setUploadProgress(0);
      setStatusMessage(STATUS_MESSAGES[0]);

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          // Asymptotic progress: slows down as it gets higher
          // This prevents the "stuck at 90%" feeling by keeping it moving slowly
          // Target is 95% until complete
          if (prev >= 95) return prev;
          
          const remaining = 95 - prev;
          // Jump size depends on remaining distance, making it slower over time
          // Randomness adds realism
          const jump = Math.max(0.2, Math.random() * (remaining / 15)); 
          
          return Math.min(95, prev + jump);
        });
      }, 600); // Slower update interval (600ms)

      return () => clearInterval(interval);
    } else {
      setUploadProgress(0);
    }
  }, [isProcessing]);

  // Update status message based on progress thresholds
  useEffect(() => {
    if (!isProcessing) return;

    let messageIndex = 0;
    if (uploadProgress < 15) messageIndex = 0;
    else if (uploadProgress < 30) messageIndex = 1;
    else if (uploadProgress < 45) messageIndex = 2;
    else if (uploadProgress < 60) messageIndex = 3;
    else if (uploadProgress < 80) messageIndex = 4;
    else if (uploadProgress < 90) messageIndex = 5;
    else messageIndex = 6;

    setStatusMessage(STATUS_MESSAGES[messageIndex]);
  }, [uploadProgress, isProcessing]);

  // GSAP Intro Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animate text elements
      gsap.from(".hero-text", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out"
      });
      
      // Animate badges
      gsap.from(".feature-badge", {
        opacity: 0,
        y: 10,
        stagger: 0.1,
        delay: 0.4
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = (file: File) => {
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        onFileSelect(base64);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div ref={containerRef} className="w-full px-6 flex flex-col items-center">
      
      {/* Hero Section */}
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <div className="hero-text inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6 uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          <span>AI-Powered Exam Analysis</span>
        </div>
        
        <h1 className="hero-text text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
          Rankify <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Your Prep</span>
        </h1>
        
        <p className="hero-text text-slate-400 text-lg font-light leading-relaxed">
          Transform static PDF mock tests into interactive quizzes. 
          <br className="hidden md:block"/>
          Powered by next-gen multimodal AI for instant diagrams & solutions.
        </p>
      </div>

      {/* Upload Card */}
      <div className="relative w-full max-w-xl group perspective-1000">
        {/* Glow Effect behind card */}
        <div className={`absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[2rem] blur opacity-20 transition duration-1000 group-hover:opacity-40 ${isProcessing ? 'animate-pulse opacity-40' : ''}`}></div>
        
        <div
            className={`relative rounded-[1.8rem] bg-[#0B1120] border transition-all duration-300 overflow-hidden
            ${dragActive 
                ? 'border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.15)] scale-[1.01]' 
                : 'border-white/10 hover:border-white/20 shadow-2xl shadow-black/50'
            }
            ${isProcessing ? 'pointer-events-none' : 'cursor-pointer'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept=".pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={handleChange}
                disabled={isProcessing}
            />

            <div className="px-8 py-16 md:px-12 md:py-20 flex flex-col items-center text-center">
                
                {isProcessing ? (
                    <div className="flex flex-col items-center animate-in fade-in duration-500 w-full max-w-xs mx-auto">
                        <div className="relative w-40 h-40 mb-8">
                             {/* HUD Circles */}
                             <div className="absolute inset-0 rounded-full border border-slate-700"></div>
                             <div className="absolute inset-2 rounded-full border border-slate-800 border-dashed animate-[spin-slow_10s_linear_infinite]"></div>
                             
                             <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                                <circle 
                                    cx="50" cy="50" r="45" 
                                    fill="none" 
                                    stroke="#1e293b" 
                                    strokeWidth="2" 
                                />
                                <circle
                                    cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray="283" 
                                    strokeDashoffset={283 - (283 * uploadProgress) / 100}
                                    className="transition-all duration-300 ease-out"
                                />
                             </svg>
                             
                             <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                <span className="text-4xl font-bold text-white tracking-tighter">{Math.floor(uploadProgress)}%</span>
                             </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 text-center w-full">
                            <h3 className="text-xl font-medium text-emerald-400 flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing
                            </h3>
                            <p className="text-slate-400 text-sm h-5 font-mono animate-pulse">
                              {statusMessage}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className={`mb-8 p-6 rounded-3xl bg-slate-900 border border-slate-700 transition-transform duration-500 ${dragActive ? 'scale-110 rotate-3' : 'group-hover:scale-105 group-hover:rotate-3 shadow-lg shadow-emerald-500/10'}`}>
                            <Upload className={`w-10 h-10 ${dragActive ? 'text-emerald-400' : 'text-slate-300'}`} />
                        </div>
                        
                        <h3 className="text-2xl font-semibold text-white mb-3">
                            {dragActive ? "Drop PDF to Scan" : "Upload Mock Test"}
                        </h3>
                        
                        <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                            Drag & drop your PDF here, or click to browse. 
                            <span className="block mt-1 text-slate-500 text-xs">Supports handwritten notes & diagrams.</span>
                        </p>

                        <button className="px-6 py-3 rounded-xl bg-white text-slate-950 font-semibold text-sm hover:bg-emerald-400 hover:text-emerald-950 transition-all flex items-center gap-2 group/btn shadow-lg shadow-white/5">
                            Select File
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
            
            {/* Scan Line Animation */}
            {isProcessing && (
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-[scan_2s_linear_infinite]"></div>
            )}
        </div>
      </div>

      {/* Feature Badges */}
      <div className="mt-12 flex flex-wrap justify-center gap-4">
          <div className="feature-badge flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-400">
             <ScanLine className="w-3.5 h-3.5 text-emerald-500" />
             <span>Diagram Recognition</span>
          </div>
          <div className="feature-badge flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-400">
             <FileText className="w-3.5 h-3.5 text-blue-500" />
             <span>Step-by-step Solutions</span>
          </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-in slide-in-from-bottom-2 backdrop-blur-md max-w-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <style>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default UploadSection;