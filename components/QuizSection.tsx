import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { QuizData, UserAnswers } from '../types';
import { 
  Timer, ZoomIn, ZoomOut, Maximize2, X, Grid, Menu, ImageOff, RefreshCw
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import gsap from 'gsap';

// Set worker source for PDF.js - MUST MATCH the version in index.html import map
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

interface QuizSectionProps {
  quizData: QuizData;
  pdfBase64: string | null;
  onComplete: (answers: UserAnswers) => void;
  onCancel: () => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_and_marked';

const QuizSection: React.FC<QuizSectionProps> = ({ quizData, pdfBase64, onComplete, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [seconds, setSeconds] = useState(0);
  
  // Visual Control States
  const [diagramScale, setDiagramScale] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true); 
  const [hasDiagram, setHasDiagram] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightboxCanvasRef = useRef<HTMLCanvasElement>(null);
  const questionContentRef = useRef<HTMLDivElement>(null);

  // Animate Question Transition
  useEffect(() => {
    if (questionContentRef.current) {
        gsap.fromTo(questionContentRef.current, 
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
        );
    }
  }, [currentIndex]);

  // Initialize PDF
  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfBase64) return;
      try {
        const loadingTask = pdfjsLib.getDocument({ data: atob(pdfBase64) });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
      } catch (error) {
        console.error("Error loading PDF", error);
      }
    };
    loadPdf();
  }, [pdfBase64]);

  // PDF Rendering Logic
  const renderPageOnCanvas = async (canvas: HTMLCanvasElement, scaleMultiplier: number = 1.0) => {
    if (!pdfDoc || !quizData.questions[currentIndex]) return;

    const question = quizData.questions[currentIndex];
    const pageNum = question.pageNumber || 1;
    // Default to 0,0,0,0 if missing, which means we handle "no diagram" check below
    const bbox = question.boundingBox || [0, 0, 0, 0]; 

    // Check if bbox is effectively empty (AI didn't find a diagram)
    if (bbox.every(v => v === 0)) {
        setHasDiagram(false);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0,0, canvas.width, canvas.height);
        return;
    }
    setHasDiagram(true);

    try {
      const page = await pdfDoc.getPage(pageNum);
      // Higher base scale for better resolution on canvas
      const viewport = page.getViewport({ scale: 2.0 }); 
      
      const [ymin, xmin, ymax, xmax] = bbox;
      
      // Add a small padding (50 units on 1000 scale) to the bounding box
      const pad = 20;
      const x = Math.max(0, (xmin - pad) / 1000 * viewport.width);
      const y = Math.max(0, (ymin - pad) / 1000 * viewport.height);
      const w = Math.min(viewport.width - x, ((xmax + pad) - (xmin - pad)) / 1000 * viewport.width);
      const h = Math.min(viewport.height - y, ((ymax + pad) - (ymin - pad)) / 1000 * viewport.height);

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = w;
      canvas.height = h;

      context.clearRect(0, 0, canvas.width, canvas.height);
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        transform: [1, 0, 0, 1, -x, -y] 
      };

      await page.render(renderContext as any).promise;
    } catch (err) {
      console.error("Render error", err);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
        // Reset scale when question changes
        setDiagramScale(1);
        renderPageOnCanvas(canvasRef.current, 1.0);
    }
  }, [pdfDoc, currentIndex, quizData]);

  useEffect(() => {
    if (isLightboxOpen && lightboxCanvasRef.current) renderPageOnCanvas(lightboxCanvasRef.current, 1.5);
  }, [isLightboxOpen, pdfDoc, currentIndex]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Navigation & State
  const question = quizData.questions[currentIndex];
  const totalQuestions = quizData.questions.length;

  const navigateTo = (index: number) => {
    setVisited(prev => new Set(prev).add(index));
    setCurrentIndex(index);
    if (window.innerWidth < 1024) setIsPaletteOpen(false); // Close palette on mobile
  };

  const handleOptionSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: optionId }));
  };

  const handleClearResponse = () => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[question.id];
      return newAnswers;
    });
  };

  const handleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(question.id)) newSet.delete(question.id);
      else newSet.add(question.id);
      return newSet;
    });
    if (currentIndex < totalQuestions - 1) navigateTo(currentIndex + 1);
  };

  const handleSaveAndNext = () => {
    if (currentIndex < totalQuestions - 1) navigateTo(currentIndex + 1);
  };

  const getQuestionStatus = (qIndex: number, qId: number): QuestionStatus => {
    const isAnswered = !!answers[qId];
    const isMarked = markedForReview.has(qId);
    const isVisited = visited.has(qIndex);

    if (isAnswered && isMarked) return 'answered_and_marked';
    if (isMarked) return 'marked_for_review';
    if (isAnswered) return 'answered';
    if (isVisited) return 'not_answered';
    return 'not_visited';
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'answered': return 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20';
      case 'not_answered': return 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/20';
      case 'marked_for_review': return 'bg-purple-500 text-white border-purple-600 shadow-sm shadow-purple-500/20';
      case 'answered_and_marked': return 'bg-purple-500 text-white border-purple-600 shadow-sm shadow-purple-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700';
    }
  };

  // Diagram Zoom Handlers
  const handleZoomIn = () => setDiagramScale(prev => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setDiagramScale(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setDiagramScale(1);

  return (
    <div className="flex flex-col h-screen w-full bg-[#f3f4f6] dark:bg-[#0f172a] overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
          <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <button onClick={() => setIsLightboxOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-white z-10 hover:bg-slate-700 transition-colors">
               <X className="w-6 h-6" />
             </button>
             <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
                 <canvas ref={lightboxCanvasRef} className="rounded-lg shadow-2xl bg-white" />
             </div>
          </div>
        </div>
      )}

      {/* CBT Header */}
      <header className="h-16 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-20 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Online</div>
          <h1 className="font-bold text-lg hidden sm:block tracking-tight">Rankify CBT</h1>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2 hidden sm:block"></div>
          <h2 className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px] sm:max-w-md">
            {quizData.title}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 bg-slate-900 dark:bg-black text-white px-3 py-1.5 rounded-md font-mono text-sm shadow-sm border border-slate-800">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className={seconds > 3600 ? "" : "text-emerald-50"}>{formatTime(seconds)}</span>
          </div>

          {/* Menu Toggle for Mobile */}
          <button 
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
          >
            {isPaletteOpen ? <X className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Info Bar */}
      <div className="h-8 bg-emerald-600/10 dark:bg-emerald-950/30 border-b border-emerald-600/20 flex items-center justify-between px-4 text-xs font-medium text-emerald-800 dark:text-emerald-400 flex-shrink-0">
        <span>Type: <span className="font-bold">MCQ</span></span>
        <span>Marking: <span className="font-bold text-emerald-600 dark:text-emerald-400">+4</span> / <span className="font-bold text-rose-600 dark:text-rose-400">-1</span></span>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Question Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Question Top Bar */}
          <div className="h-10 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] flex items-center justify-between px-4 flex-shrink-0">
             <span className="font-bold text-slate-700 dark:text-slate-200">Question {currentIndex + 1}</span>
             <span className="text-xs text-slate-500">Single Correct Option</span>
          </div>

          {/* Question Content (Split View) */}
          <div className="flex-1 overflow-hidden">
             <div className="flex flex-col lg:flex-row h-full">
                
                {/* Visual Panel (PDF Diagram) - Scrollable & Zoomable */}
                <div className="w-full lg:w-1/2 h-64 lg:h-full bg-slate-100 dark:bg-[#0B1120] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 relative flex flex-col transition-all duration-300">
                   <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-white dark:bg-slate-800 rounded-md shadow-md border border-slate-200 dark:border-slate-700 p-1">
                      <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors" title="Zoom In">
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors" title="Zoom Out">
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button onClick={handleResetZoom} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors" title="Reset">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {hasDiagram && (
                        <button onClick={() => setIsLightboxOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors" title="Fullscreen">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                      )}
                   </div>

                   <div className="flex-1 overflow-auto flex items-center justify-center p-4 custom-scrollbar">
                     <div 
                        style={{ 
                            transform: `scale(${diagramScale})`, 
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease-out'
                        }}
                        className="flex items-center justify-center min-w-min min-h-min"
                     >
                        {pdfDoc ? (
                            <div className={`${!hasDiagram ? 'hidden' : 'block'} bg-white shadow-lg`}>
                                <canvas ref={canvasRef} />
                            </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 text-sm">Loading Diagram...</div>
                        )}

                        {!hasDiagram && pdfDoc && (
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50 select-none">
                                <ImageOff className="w-12 h-12" />
                                <span className="text-sm font-medium">No Diagram Detected</span>
                            </div>
                        )}
                     </div>
                   </div>
                   <div className="h-6 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 flex-shrink-0 uppercase tracking-wider font-semibold">
                       Figure Area
                   </div>
                </div>

                {/* Text & Options Panel - Scrollable */}
                <div className="w-full lg:w-1/2 h-full overflow-y-auto p-4 md:p-8 custom-scrollbar bg-white dark:bg-[#1e293b]">
                   <div ref={questionContentRef} className="max-w-3xl mx-auto flex flex-col gap-8">
                        <div className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium select-text math-content">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {question.text}
                            </ReactMarkdown>
                        </div>

                        <div className="flex flex-col gap-3">
                            {question.options.map((option) => {
                            const isSelected = answers[question.id] === option.id;
                            return (
                                <label 
                                key={option.id}
                                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200
                                    ${isSelected 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500 shadow-md' 
                                    : 'bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-500'}
                                `}
                                >
                                <div className={`mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors
                                    ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-400'}
                                `}>
                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                </div>
                                <input 
                                    type="radio" 
                                    name={`question-${question.id}`} 
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={() => handleOptionSelect(option.id)}
                                />
                                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 w-full">
                                    <div className="flex gap-2">
                                        <span className="font-bold opacity-70">({option.id})</span>
                                        <div className="math-content">
                                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                {option.text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                                </label>
                            );
                            })}
                        </div>
                   </div>
                </div>

             </div>
          </div>

          {/* Footer Controls */}
          <div className="h-16 bg-white dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-700 px-4 flex items-center justify-between flex-shrink-0 z-10">
             <div className="flex gap-2">
               <button 
                 onClick={handleMarkForReview}
                 className="hidden sm:flex px-4 py-2 rounded-md border border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-semibold transition-colors"
               >
                 Mark for Review & Next
               </button>
               <button 
                 onClick={handleClearResponse}
                 className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
               >
                 Clear Response
               </button>
             </div>

             <div className="flex gap-2">
               <button 
                 onClick={handleSaveAndNext}
                 className="px-6 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-900/20 transition-all hover:scale-105"
               >
                 Save & Next
               </button>
             </div>
          </div>
        </div>

        {/* Right Sidebar: Question Palette */}
        <div 
          className={`absolute lg:relative top-0 right-0 h-full w-[280px] bg-white dark:bg-[#1e293b] border-l border-slate-200 dark:border-slate-700 flex flex-col transform transition-transform duration-300 z-30 shadow-xl lg:shadow-none
          ${isPaletteOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-[280px]'}
          `}
        >
          {/* User Info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50">
             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
               <Menu className="w-5 h-5" />
             </div>
             <div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Candidate</div>
                <div className="text-xs text-slate-500">Rankify User</div>
             </div>
          </div>

          {/* Legend */}
          <div className="p-4 grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b]">
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-500 text-white flex items-center justify-center rounded-sm text-[8px]"></div> Answered</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-rose-500 text-white flex items-center justify-center rounded-sm text-[8px]"></div> Not Answered</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-700 text-slate-500 flex items-center justify-center rounded-sm text-[8px]"></div> Not Visited</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-purple-500 text-white flex items-center justify-center rounded-sm text-[8px]"></div> Marked</div>
             <div className="col-span-2 flex items-center gap-2"><div className="w-4 h-4 bg-purple-500 text-white flex items-center justify-center rounded-sm text-[8px] relative"><div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full"></div></div> Marked & Answered</div>
          </div>

          {/* Palette Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-[#0f172a]/50">
             <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Questions</div>
             <div className="grid grid-cols-4 gap-2">
                {quizData.questions.map((q, idx) => {
                  const status = getQuestionStatus(idx, q.id);
                  const colorClass = getStatusColor(status);
                  return (
                    <button
                      key={q.id}
                      onClick={() => navigateTo(idx)}
                      className={`h-9 w-9 flex items-center justify-center rounded-md text-sm font-bold border transition-all duration-200 hover:scale-105 relative
                        ${currentIndex === idx ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 z-10' : ''}
                        ${colorClass}
                      `}
                    >
                      {idx + 1}
                      {status === 'answered_and_marked' && (
                        <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-purple-600"></div>
                      )}
                    </button>
                  );
                })}
             </div>
          </div>

          {/* Submit Button Area */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b]">
             <button 
               onClick={onComplete.bind(null, answers)}
               className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
             >
               Submit Test
             </button>
          </div>

        </div>

        {/* Mobile Overlay for Palette */}
        {isPaletteOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setIsPaletteOpen(false)}
          />
        )}

      </div>
    </div>
  );
};

export default QuizSection;