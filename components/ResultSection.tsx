import React, { useMemo, useState } from 'react';
import { QuizData, UserAnswers } from '../types';
import { 
  CheckCircle, XCircle, Award, RotateCcw, ChevronDown, ChevronUp, 
  AlertTriangle, Sparkles, Loader2, PieChart as PieIcon, BarChart2,
  Clock, Target
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import { getDetailedSolution } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ResultSectionProps {
  quizData: QuizData;
  userAnswers: UserAnswers;
  onRetry: () => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({ quizData, userAnswers, onRetry }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [detailedSolutions, setDetailedSolutions] = useState<Record<number, string>>({});
  const [loadingSolutions, setLoadingSolutions] = useState<Record<number, boolean>>({});

  const results = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    quizData.questions.forEach(q => {
      const userAnswer = userAnswers[q.id];
      if (!userAnswer) {
        skipped++;
      } else if (userAnswer === q.correctOptionId) {
        correct++;
      } else {
        incorrect++;
      }
    });

    return { correct, incorrect, skipped, total: quizData.questions.length };
  }, [quizData, userAnswers]);

  const percentage = Math.round((results.correct / results.total) * 100);

  const chartData = [
    { name: 'Correct', value: results.correct, color: '#10b981' },
    { name: 'Incorrect', value: results.incorrect, color: '#f43f5e' },
    { name: 'Skipped', value: results.skipped, color: '#64748b' },
  ];

  const toggleExpand = (id: number) => {
    setExpandedQuestion(expandedQuestion === id ? null : id);
  };

  const handleSolveWithAI = async (e: React.MouseEvent, qId: number, qText: string, options: any[]) => {
    e.stopPropagation(); 
    if (detailedSolutions[qId]) return;

    setLoadingSolutions(prev => ({ ...prev, [qId]: true }));
    try {
      const solution = await getDetailedSolution(qText, options);
      setDetailedSolutions(prev => ({ ...prev, [qId]: solution }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSolutions(prev => ({ ...prev, [qId]: false }));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 pb-32">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
        <div>
           <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest mb-2">
              <BarChart2 className="w-4 h-4" />
              <span>Performance Report</span>
           </div>
           <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
             {quizData.title}
           </h2>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Score</p>
              <p className={`text-3xl font-bold font-mono ${percentage >= 70 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {percentage}%
              </p>
           </div>
           <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${percentage >= 70 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-800'}`}>
              <Award className={`w-6 h-6 ${percentage >= 70 ? 'text-emerald-400' : 'text-slate-400'}`} />
           </div>
        </div>
      </div>

      {/* Analytics Grid (Bento Box Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12 animate-in slide-in-from-bottom-6 duration-700 fade-in fill-mode-both delay-100">
        
        {/* Main Score Chart - Large Card */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1 bg-[#0B1120] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
             <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
             <div className="h-40 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-3xl font-bold text-white">{results.total}</span>
                   <span className="text-[10px] text-slate-500 uppercase tracking-widest">Questions</span>
                </div>
             </div>
        </div>

        {/* Correct Metric */}
        <div className="bg-[#0B1120] border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-colors group">
            <div className="flex justify-between items-start">
               <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <CheckCircle className="w-6 h-6" />
               </div>
               <span className="text-xs font-mono text-slate-500">ACCURACY</span>
            </div>
            <div>
               <span className="text-4xl font-bold text-white">{results.correct}</span>
               <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(results.correct / results.total) * 100}%` }}></div>
               </div>
            </div>
        </div>

        {/* Incorrect Metric */}
        <div className="bg-[#0B1120] border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-rose-500/30 transition-colors group">
            <div className="flex justify-between items-start">
               <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                  <XCircle className="w-6 h-6" />
               </div>
               <span className="text-xs font-mono text-slate-500">MISTAKES</span>
            </div>
            <div>
               <span className="text-4xl font-bold text-white">{results.incorrect}</span>
               <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(results.incorrect / results.total) * 100}%` }}></div>
               </div>
            </div>
        </div>

        {/* Skipped Metric */}
        <div className="bg-[#0B1120] border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-500/30 transition-colors group">
            <div className="flex justify-between items-start">
               <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 group-hover:bg-slate-700 transition-colors">
                  <AlertTriangle className="w-6 h-6" />
               </div>
               <span className="text-xs font-mono text-slate-500">SKIPPED</span>
            </div>
            <div>
               <span className="text-4xl font-bold text-white">{results.skipped}</span>
               <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: `${(results.skipped / results.total) * 100}%` }}></div>
               </div>
            </div>
        </div>
      </div>

      {/* Question List Section */}
      <div className="animate-in slide-in-from-bottom-8 duration-700 fade-in fill-mode-both delay-200">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Detailed Breakdown
           </h3>
           <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              Generated by Gemini 3.0
           </div>
        </div>
        
        <div className="space-y-4">
          {quizData.questions.map((q, index) => {
            const userAnswer = userAnswers[q.id];
            const isCorrect = userAnswer === q.correctOptionId;
            const isSkipped = !userAnswer;
            const isExpanded = expandedQuestion === q.id;
            const detailedSolution = detailedSolutions[q.id];
            const isLoading = loadingSolutions[q.id];

            // Card Styling Logic
            let borderClass = "border-slate-800 hover:border-slate-700";
            let icon = <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500">-</div>;
            
            if (isCorrect) {
                borderClass = "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30";
                icon = <CheckCircle className="w-6 h-6 text-emerald-500" />;
            } else if (!isSkipped) {
                borderClass = "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/30";
                icon = <XCircle className="w-6 h-6 text-rose-500" />;
            }

            return (
              <div 
                key={q.id} 
                className={`rounded-2xl border bg-[#0B1120]/50 backdrop-blur-sm transition-all duration-300 overflow-hidden ${borderClass}`}
              >
                <div 
                  onClick={() => toggleExpand(q.id)}
                  className="p-5 flex items-start gap-5 cursor-pointer"
                >
                  <div className="flex-shrink-0 pt-1">{icon}</div>
                  
                  <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start text-slate-200 text-sm md:text-base leading-relaxed font-medium math-content w-full">
                              <span className="text-slate-500 mr-3 font-mono text-xs flex-shrink-0 mt-0.5">#{index + 1}</span>
                              <div className="flex-1 min-w-0">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkMath]} 
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {q.text}
                                </ReactMarkdown>
                              </div>
                          </div>
                          <div className={`p-1 rounded-lg transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-white/5' : ''}`}>
                             <ChevronDown className="w-4 h-4 text-slate-500" />
                          </div>
                      </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-6 pl-[3.25rem] animate-in slide-in-from-top-2 fade-in duration-200">
                      {/* Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                          {q.options.map(opt => {
                              const isSelected = userAnswer === opt.id;
                              const isActuallyCorrect = q.correctOptionId === opt.id;
                              
                              let optStyle = "border-slate-800 bg-slate-900/50 text-slate-500";
                              if (isActuallyCorrect) optStyle = "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
                              else if (isSelected) optStyle = "border-rose-500/40 bg-rose-500/10 text-rose-200";

                              return (
                                  <div key={opt.id} className={`p-3 rounded-lg border text-sm flex items-center gap-3 ${optStyle}`}>
                                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border ${isActuallyCorrect ? 'border-emerald-500/50 text-emerald-400' : 'border-slate-700 text-slate-500'}`}>
                                          {opt.id}
                                      </span>
                                      <div className="math-content line-clamp-1">
                                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                              {opt.text}
                                          </ReactMarkdown>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>

                      {/* Solution Area */}
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#020617]">
                           {/* Quick Explanation */}
                           {!detailedSolution && q.explanation && (
                               <div className="p-4 border-b border-slate-800 bg-slate-900/30">
                                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Summary</p>
                                   <div className="text-slate-300 text-sm math-content">
                                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                          {q.explanation}
                                      </ReactMarkdown>
                                   </div>
                               </div>
                           )}

                           {/* Detailed Solution */}
                           {detailedSolution && (
                               <div className="p-6 bg-slate-900/20 relative group/sol animate-in fade-in zoom-in-95 duration-300">
                                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-50"></div>
                                   <div className="flex items-center gap-2 mb-4">
                                       <Sparkles className="w-4 h-4 text-emerald-400" />
                                       <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">AI Solution</span>
                                   </div>
                                   <div className="prose prose-invert prose-sm max-w-none prose-headings:text-emerald-300 prose-p:text-slate-300 prose-strong:text-white math-content">
                                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                          {detailedSolution}
                                      </ReactMarkdown>
                                   </div>
                               </div>
                           )}

                           {/* Action Bar */}
                           {!detailedSolution && (
                               <div className="p-2 bg-slate-900/50 flex justify-end">
                                  <button
                                      onClick={(e) => handleSolveWithAI(e, q.id, q.text, q.options)}
                                      disabled={isLoading}
                                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wide transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                  >
                                      {isLoading ? (
                                          <>
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                              Solving...
                                          </>
                                      ) : (
                                          <>
                                              <Sparkles className="w-3 h-3" />
                                              Generate Full Solution
                                          </>
                                      )}
                                  </button>
                               </div>
                           )}
                      </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultSection;