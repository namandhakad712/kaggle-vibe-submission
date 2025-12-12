import React, { useState } from 'react';
import { AppState, QuizData, UserAnswers } from './types';
import { parsePdfToQuiz } from './services/geminiService';
import UploadSection from './components/UploadSection';
import QuizSection from './components/QuizSection';
import ResultSection from './components/ResultSection';
import { BrainCircuit, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (base64: string) => {
    setPdfBase64(base64); // Store raw PDF for rendering diagrams
    setAppState(AppState.PROCESSING);
    setError(null);
    try {
      const data = await parsePdfToQuiz(base64);
      if (data && data.questions && data.questions.length > 0) {
        setQuizData(data);
        setAppState(AppState.QUIZ);
      } else {
        throw new Error("Could not extract any questions from the PDF. Ensure it's a valid mock test.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process PDF. Please try again.");
      setAppState(AppState.UPLOAD);
    }
  };

  const handleQuizComplete = (answers: UserAnswers) => {
    setUserAnswers(answers);
    setAppState(AppState.RESULTS);
  };

  const handleRetry = () => {
    setAppState(AppState.UPLOAD);
    setQuizData(null);
    setPdfBase64(null);
    setUserAnswers({});
    setError(null);
  };

  const isQuizMode = appState === AppState.QUIZ;

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col relative`}>
      
      {/* Background Pattern for Non-Quiz Pages */}
      {!isQuizMode && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-grid-pattern opacity-60"></div>
          {/* Ambient Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"></div>
        </div>
      )}

      {/* Navbar */}
      {!isQuizMode && (
        <nav className="relative z-50 w-full backdrop-blur-sm border-b border-white/5 bg-[#020617]/50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleRetry}>
              {appState === AppState.RESULTS && (
                <div className="mr-2 p-2 rounded-full hover:bg-white/5 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </div>
              )}
              <div className="bg-emerald-600/20 p-2.5 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <BrainCircuit className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Rank<span className="text-emerald-400">ify</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
               {appState === AppState.RESULTS && (
                 <button onClick={handleRetry} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                   Scan New
                 </button>
               )}
               <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                 Beta v2.0
               </span>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className={`relative z-10 flex-1 flex flex-col w-full ${!isQuizMode ? 'max-w-7xl mx-auto' : ''}`}>
        
        {appState === AppState.UPLOAD && (
          <div className="flex-1 flex flex-col justify-center py-10">
            <UploadSection 
              onFileSelect={handleFileSelect} 
              isProcessing={false} 
              error={error} 
            />
          </div>
        )}

        {appState === AppState.PROCESSING && (
           <div className="flex-1 flex flex-col justify-center py-10">
              <UploadSection 
                onFileSelect={() => {}} 
                isProcessing={true}
                error={null} 
              />
           </div>
        )}

        {appState === AppState.QUIZ && (
          quizData ? (
             <QuizSection 
               quizData={quizData} 
               pdfBase64={pdfBase64}
               onComplete={handleQuizComplete}
               onCancel={handleRetry}
             />
          ) : (
            // Fallback if quizData is null but state is QUIZ (should not happen, but prevents black screen)
            <div className="flex-1 flex items-center justify-center text-rose-500">
               Error: Quiz data missing. <button onClick={handleRetry} className="underline ml-2">Retry</button>
            </div>
          )
        )}

        {appState === AppState.RESULTS && quizData && (
          <ResultSection 
            quizData={quizData} 
            userAnswers={userAnswers} 
            onRetry={handleRetry} 
          />
        )}

      </main>

      {/* Footer */}
      {!isQuizMode && (
        <footer className="relative z-10 w-full py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">
              Powered by <span className="text-emerald-400/80 font-bold">gemini-3.0-preview</span>
            </p>
            <p className="text-[10px] text-slate-700">Rankify AI © 2025</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;