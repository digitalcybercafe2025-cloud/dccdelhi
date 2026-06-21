import React, { useState } from 'react';
import { 
  Search, Loader2, CheckCircle2, Clock, FileWarning, ArrowLeft, 
  Send, Download, FileText, ShieldCheck, Trophy, XCircle, 
  SearchCode, AlertCircle, FileCheck, Lock, ChevronDown, Check,
  ExternalLink
} from 'lucide-react';
import { Application, ApplicationStatus } from '../types';

interface TrackingSystemProps {
  onSearch: (id: string) => Application | null;
  onBack: () => void;
}

export const TrackingSystem: React.FC<TrackingSystemProps> = ({ onSearch, onBack }) => {
  const [appId, setAppId] = useState('');
  const [result, setResult] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = () => {
    const cleanId = appId.trim();
    if (!cleanId) return;
    setLoading(true);
    // Mimic verified database synchronization latency
    setTimeout(() => {
      const app = onSearch(cleanId);
      setResult(app);
      setLoading(false);
      setSearched(true);
    }, 1500);
  };

  const handleDownloadCert = () => {
    if (result?.certificateUrl) {
      const link = document.createElement('a');
      link.href = result.certificateUrl;
      link.download = `Issued_Certificate_${result.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Verification in progress. Document artifact not yet available for secure download.");
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Submitted',
      description: 'Dossier successfully registered in official queue.',
      icon: Send,
      color: 'text-blue-500',
      activeStatus: [ApplicationStatus.PENDING, ApplicationStatus.REVIEWING, ApplicationStatus.VERIFYING, ApplicationStatus.COMPLETED, ApplicationStatus.REJECTED]
    },
    {
      id: 2,
      title: 'Reviewing',
      description: 'Artifact specialists evaluating submitted proofs.',
      icon: SearchCode,
      color: 'text-amber-500',
      activeStatus: [ApplicationStatus.REVIEWING, ApplicationStatus.VERIFYING, ApplicationStatus.COMPLETED, ApplicationStatus.REJECTED]
    },
    {
      id: 3,
      title: 'Verifying',
      description: 'Cross-verification with department records in progress.',
      icon: ShieldCheck,
      color: 'text-indigo-500',
      activeStatus: [ApplicationStatus.VERIFYING, ApplicationStatus.COMPLETED, ApplicationStatus.REJECTED]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 animate-in fade-in duration-700">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-slate-400 font-bold hover:text-[#003380] dark:hover:text-emerald-400 mb-10 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Official Portal
      </button>

      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black text-[#003380] dark:text-white mb-4 tracking-tighter">Application Pulse</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-base max-w-2xl mx-auto">
          Synchronize with official servers to monitor your document lifecycle. Enter the <span className="text-[#003380] dark:text-emerald-400 font-black">Acknowledgement ID</span>.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-20">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-[2.5rem] blur opacity-15 group-hover:opacity-30 transition duration-1000"></div>
          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-full p-2 border border-slate-200 dark:border-white/10 shadow-xl luxury-shadow">
            <div className="pl-6 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="e.g. DC-2026102030"
              className="flex-1 px-4 py-4 bg-transparent outline-none font-black text-lg text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 uppercase"
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            />
            <button
              onClick={handleTrack}
              disabled={loading}
              className="bg-gradient-to-r from-[#003380] to-blue-700 dark:from-emerald-600 dark:to-teal-700 text-white font-black px-10 py-4 rounded-full transition-all flex items-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Terminal <Search className="w-5 h-5" /></>}
            </button>
          </div>
        </div>
      </div>

      {searched && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {result ? (
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              <div className="flex-1 w-full space-y-0 relative">
                <div className="absolute left-[1.45rem] top-8 bottom-8 w-0.5 bg-slate-100 dark:bg-white/5 rounded-full" />
                
                {steps.map((step, idx) => {
                  const isCompleted = step.activeStatus.includes(result.status);
                  return (
                    <div key={step.id} className="flex gap-8 pb-12 relative group last:pb-8">
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700 border-4 ${
                          isCompleted ? 'bg-white dark:bg-slate-800 border-slate-50 dark:border-white/10 shadow-md' : 'bg-slate-50 dark:bg-white/5 border-white dark:border-transparent shadow-sm'
                        }`}>
                          {isCompleted ? <Check className={`w-5 h-5 ${step.color}`} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />}
                        </div>
                      </div>
                      <div className="pt-2">
                        <h4 className={`text-xl font-black tracking-tight mb-1 transition-colors duration-700 ${isCompleted ? 'text-[#003380] dark:text-white' : 'text-slate-300 dark:text-slate-800'}`}>
                          {step.title}
                        </h4>
                        <p className={`text-sm font-bold leading-relaxed transition-colors duration-700 ${isCompleted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-800'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="flex gap-8">
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700 border-4 ${
                      result.status === ApplicationStatus.COMPLETED ? 'bg-emerald-500 border-emerald-100 shadow-lg shadow-emerald-500/20' : 
                      result.status === ApplicationStatus.REJECTED ? 'bg-rose-500 border-rose-100 shadow-lg shadow-rose-500/20' : 
                      'bg-slate-50 dark:bg-white/5 border-white dark:border-transparent'
                    }`}>
                      {result.status === ApplicationStatus.COMPLETED ? (
                        <Trophy className="w-5 h-5 text-white" />
                      ) : result.status === ApplicationStatus.REJECTED ? (
                        <XCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-300 dark:text-slate-800" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    {result.status === ApplicationStatus.COMPLETED ? (
                      <div className="p-8 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-[2.5rem] shadow-sm animate-in zoom-in-95 duration-700">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                           </div>
                           <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-400 tracking-tight">Dossier Completed</h3>
                        </div>
                        <p className="text-emerald-800/70 dark:text-emerald-400/60 font-bold mb-6 italic leading-relaxed">"{result.remarks || 'Authentication protocols successful. Your document is ready for secure delivery.'}"</p>
                        {result.certificateUrl && (
                          <button 
                            onClick={handleDownloadCert}
                            className="flex items-center gap-3 px-8 py-4 bg-[#003380] dark:bg-emerald-600 text-white rounded-2xl font-black text-sm hover:scale-[1.02] transition-all shadow-xl active:scale-95 group"
                          >
                            <Download className="w-4 h-4 group-hover:bounce" /> Secure Certificate Download
                          </button>
                        )}
                      </div>
                    ) : result.status === ApplicationStatus.REJECTED ? (
                      <div className="p-8 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-[2.5rem] shadow-sm animate-in zoom-in-95 duration-700">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shadow-lg">
                              <AlertCircle className="w-5 h-5 text-white" />
                           </div>
                           <h3 className="text-2xl font-black text-rose-900 dark:text-rose-400 tracking-tight">Authorization Denied</h3>
                        </div>
                        <p className="text-rose-800/70 dark:text-rose-400/60 font-bold mb-4">The application was rejected by the auditing specialist due to artifact discrepancies.</p>
                        {result.remarks && (
                          <div className="bg-white/60 dark:bg-black/20 p-6 rounded-[2rem] mb-6 border border-rose-100 dark:border-rose-500/20 shadow-inner">
                             <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Administrative Statement</p>
                             <p className="text-sm font-bold text-rose-700 dark:text-rose-300/80 leading-relaxed italic">"{result.remarks}"</p>
                          </div>
                        )}
                        <button onClick={onBack} className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-widest hover:underline transition-all">
                           Re-Initiate Dossier Application <ArrowLeft className="w-3 h-3 rotate-180" />
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <h4 className="text-xl font-black tracking-tight text-slate-300 dark:text-slate-800 mb-1">Final Issuance Pending</h4>
                        <p className="text-sm font-bold text-slate-300 dark:text-slate-800 leading-relaxed italic">"{result.remarks || 'Case integrity currently being evaluated by department gateways.'}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex flex-1 flex-col gap-6 w-full max-w-sm sticky top-24">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm luxury-shadow">
                   <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Verification Artifacts</h4>
                   <div className="space-y-5">
                      <div className="flex justify-between">
                         <span className="text-[11px] font-bold text-slate-400 uppercase">Case Reference</span>
                         <span className="text-xs font-black text-slate-900 dark:text-white">#{result.id}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-[11px] font-bold text-slate-400 uppercase">Applicant</span>
                         <span className="text-xs font-black text-slate-900 dark:text-white">{result.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-[11px] font-bold text-slate-400 uppercase">Service Stream</span>
                         <span className="text-xs font-black text-[#003380] dark:text-emerald-400">{result.serviceName}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-white/5">
                         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gateway Health</span>
                         <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[9px] font-black uppercase">Authorized Sync</span>
                      </div>
                   </div>
                </div>
                
                <div className="p-8 rounded-[3rem] bg-gradient-to-br from-[#003380] to-[#001a40] dark:from-emerald-600 dark:to-teal-800 text-white relative overflow-hidden shadow-2xl">
                   <div className="relative z-10">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Cipher Active
                      </p>
                      <h5 className="text-lg font-black tracking-tight mb-2 leading-tight">Live Registry Pulse</h5>
                      <p className="text-[11px] font-bold text-blue-100/60 dark:text-white/60 leading-relaxed">This view is synchronized with official Digital India gateways for real-time document integrity verification.</p>
                   </div>
                   <div className="absolute -bottom-8 -right-8 opacity-5">
                      <Lock className="w-40 h-40" />
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-20 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-2xl luxury-shadow max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/5 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner border border-rose-100/50 dark:border-rose-500/20">
                <FileWarning className="w-12 h-12 text-rose-500" />
              </div>
              <h3 className="text-3xl font-black text-[#003380] dark:text-white mb-4 tracking-tighter">Synchronization Failed</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg max-w-sm mx-auto leading-relaxed">
                ID <span className="text-rose-600 font-black">"{appId}"</span> was not found in our active registry. Please check your digital acknowledgement slip.
              </p>
              <button onClick={() => setSearched(false)} className="mt-12 px-12 py-5 border-2 border-[#003380] dark:border-emerald-500 text-[#003380] dark:text-emerald-500 rounded-3xl font-black text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95 uppercase tracking-widest">Re-attempt Terminal Link</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};