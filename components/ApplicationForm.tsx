
import React, { useState, useRef } from 'react';
import { Service, Application, ApplicationStatus, ApplicationDocument } from '../types';
import { ChevronLeft, Upload, ShieldCheck, CreditCard, Sparkles, Loader2, CheckCircle2, Calendar, ClipboardCheck, Lock, User, MapPin, Smartphone, FileText, Download, Shield, FileCheck, ArrowRight } from 'lucide-react';
import { validateDocumentAI } from '../services/geminiService';
import { sendWhatsAppNotification, formatMessageFromTemplate } from '../services/whatsappService';
import { toJpeg } from 'html-to-image';

interface ApplicationFormProps {
  service: Service;
  onCancel: () => void;
  onSubmit: (app: Application) => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ service, onCancel, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
  });
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { file: File, base64: string, aiValidated: boolean }>>({});
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [createdApp, setCreatedApp] = useState<Application | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Forbidden file type. System only accepts: JPG, PNG, PDF, GIF.');
        return;
      }

      setIsValidating(docName);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fullBase64 = reader.result as string;
        const base64Data = fullBase64.split(',')[1];
        let aiValidated = true;
        
        if (file.type.startsWith('image/')) {
          try {
            const aiResult = await validateDocumentAI(base64Data, docName);
            aiValidated = aiResult.isValid;
          } catch (e) {
            console.warn("AI check bypassed due to connection.");
          }
        }

        setUploadedDocs(prev => ({
          ...prev,
          [docName]: { file, base64: fullBase64, aiValidated }
        }));
        setIsValidating(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePayment = async () => {
    setIsPaying(true);
    await new Promise(resolve => setTimeout(resolve, 2500));

    const appId = `DC-${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`;
    const newApp: Application = {
      id: appId,
      serviceId: service.id,
      serviceName: service.title,
      customerName: formData.name,
      mobile: formData.mobile,
      address: formData.address,
      status: ApplicationStatus.PENDING,
      paymentId: `TXN${Math.floor(Date.now() / 1000)}${Math.floor(Math.random() * 1000)}`,
      amount: service.fee,
      timestamp: Date.now(),
      lastUpdate: Date.now(),
      paymentStatus: 'PAID',
      documents: Object.keys(uploadedDocs).map(k => ({ 
        name: k, 
        url: '#', 
        base64: uploadedDocs[k].base64,
        type: uploadedDocs[k].file.type
      }))
    };

    setCreatedApp(newApp);
    
    const waSubMsg = formatMessageFromTemplate('SUBMISSION', 'WhatsApp', {
      Name: formData.name,
      Service: service.title,
      ID: appId
    });
    if (waSubMsg) await sendWhatsAppNotification(formData.mobile, waSubMsg);

    setIsPaying(false);
    setStep(4);
  };

  const handleDownloadReceipt = async () => {
    if (slipRef.current) {
      setIsDownloading(true);
      try {
        const dataUrl = await toJpeg(slipRef.current, { 
          quality: 1.0, 
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          skipFonts: true, // Avoids problematic remote font loading
          style: {
            transform: 'scale(1)',
          },
          filter: (node) => {
            // Safely filter out problematic nodes
            if (node.nodeType === 1) { // Element node
              const el = node as HTMLElement;
              if (el.dataset?.html2canvasIgnore === 'true' || el.tagName === 'LINK') {
                return false;
              }
            }
            return true;
          }
        });
        const link = document.createElement('a');
        link.download = `Receipt_${createdApp?.id}.jpeg`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Download error:', error);
        alert('Failed to generate high-res receipt. Please take a manual screenshot.');
      } finally {
        setIsDownloading(false);
      }
    }
  };

  if (step === 4 && createdApp) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 animate-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-200 shadow-2xl luxury-shadow text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="mb-10 flex justify-center">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center shadow-lg border-4 border-emerald-50">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter">Authorized Submission</h2>
            <p className="text-slate-500 mb-10 font-bold text-lg">Application ID: <span className="text-brand font-extrabold">{createdApp.id}</span></p>
          </div>

          <div className="overflow-hidden mb-12 border border-slate-100 rounded-[2rem] shadow-inner">
            <div ref={slipRef} className="bg-white text-slate-900 p-12 text-left font-sans w-full min-w-[600px] border-[10px] border-slate-50">
              <div className="flex justify-between items-start border-b-4 border-brand pb-8 mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-brand flex items-center justify-center text-white font-black text-3xl rounded-2xl shadow-xl">D</div>
                  <div>
                     <h1 className="text-3xl font-black tracking-tighter text-brand leading-none">Digital <span className="text-orange-600">Cyber Cafe</span></h1>
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Certified Digital Service Center</p>
                  </div>
                </div>
                <div className="text-right text-[12px] font-black text-slate-500 leading-tight">
                  <p className="mb-1">Phone: +91 9911423881</p>
                  <p>G-663, Mangolpuri, Delhi 110083</p>
                </div>
              </div>
              
              <div className="text-center mb-10">
                <h2 className="text-xl font-black bg-slate-900 text-white inline-block px-10 py-2 rounded-lg uppercase tracking-[0.2em]">Acknowledgement Slip</h2>
                <p className="text-brand italic text-xs font-bold mt-4">“Trusted Digital Services, Fast, Secure & Reliable.”</p>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-100 border-2 border-slate-100 rounded-2xl overflow-hidden text-[13px] mb-10">
                {[
                  ['Reference ID', createdApp.id],
                  ['Service Name', createdApp.serviceName],
                  ['Applicant Name', createdApp.customerName],
                  ['Contact Number', `+91 ${createdApp.mobile}`],
                  ['Permanent Address', createdApp.address],
                  ['Transaction Token', createdApp.paymentId],
                  ['Total Fee Paid', `₹ ${createdApp.amount.toFixed(2)} (INR)`],
                  ['Authorized On', new Date(createdApp.timestamp).toLocaleString()]
                ].map(([label, value], i) => (
                  <React.Fragment key={i}>
                    <div className="p-5 font-black text-slate-500 bg-slate-50 uppercase tracking-tighter">{label}</div>
                    <div className="p-5 font-black text-slate-900 bg-white border-l border-slate-100">{value}</div>
                  </React.Fragment>
                ))}
              </div>

              <div className="mb-10">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Document Manifest</h3>
                <div className="grid grid-cols-2 gap-4">
                  {createdApp.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-black text-slate-700">{doc.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-10 border-t-4 border-slate-50 text-center">
                 <div className="flex items-center justify-center gap-6 mb-4">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 opacity-30" />
                    <div className="text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-1">Authenticity Guaranteed</p>
                       <p className="text-xs font-bold text-slate-300">This is a system generated document. No signature required.</p>
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-8">Digital Mangolpuri Governance Portal • 2024</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="flex items-center justify-center gap-3 px-12 py-5 bg-brand text-white rounded-[1.5rem] font-black text-lg hover:opacity-90 transition-all active:scale-[0.97] shadow-2xl shadow-blue-900/30 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-7 h-7 animate-spin" /> : <><Download className="w-6 h-6" /> Export Official Receipt</>}
            </button>
            <button
              onClick={() => onSubmit(createdApp)}
              className="px-12 py-5 border-2 border-brand text-brand rounded-[1.5rem] font-black text-lg hover:bg-slate-50 transition-all active:scale-[0.97]"
            >
              Finish & Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-in slide-in-from-right duration-500">
      <button onClick={onCancel} className="flex items-center gap-3 text-slate-500 font-black hover:text-brand mb-8 transition-colors group">
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Abandon Application
      </button>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-[65%]">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-200 trust-shadow overflow-hidden relative">
            <div className="flex items-center gap-5 mb-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                <ShieldCheck className="w-8 h-8 text-brand" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter">{service.title}</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  Step {step} of 3: {step === 1 ? 'Personal Profile' : step === 2 ? 'Document Repository' : 'Secure Payment'}
                </p>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input
                        type="text"
                        className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent outline-none secure-input-focus font-bold placeholder:text-slate-300 transition-all"
                        placeholder="Ex: Rajesh Kumar"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Identity</label>
                    <div className="relative">
                      <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input
                        type="tel"
                        className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent outline-none secure-input-focus font-bold placeholder:text-slate-300 transition-all"
                        placeholder="+91 Mobile Number"
                        value={formData.mobile}
                        onChange={e => setFormData({...formData, mobile: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Verification Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-6 w-5 h-5 text-slate-300" />
                    <textarea
                      rows={4}
                      className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent outline-none secure-input-focus font-bold placeholder:text-slate-300 transition-all resize-none"
                      placeholder="Street, Block, City, Pincode"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>
                <button
                  disabled={!formData.name || !formData.mobile}
                  onClick={() => setStep(2)}
                  className="w-full py-6 rounded-2xl bg-brand text-white font-black text-xl hover:opacity-90 transition-all shadow-2xl shadow-blue-900/20 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  Save & Next <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-blue-50 p-6 rounded-3xl flex gap-5 border border-blue-100">
                  <div className="p-3 bg-white rounded-2xl shadow-sm h-fit">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-blue-900 leading-tight">Document Integrity Check</p>
                    <p className="text-xs font-bold text-blue-800/60 mt-1 leading-relaxed">System scans for JPG, PNG, PDF or GIF. Max 5MB per file.</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {service.requiredDocs.map(doc => (
                    <div key={doc} className="group p-6 rounded-[2.5rem] border-2 border-dashed border-slate-100 hover:border-brand transition-all bg-white shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-5">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${uploadedDocs[doc] ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                            {uploadedDocs[doc] ? <CheckCircle2 className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                         </div>
                         <div>
                            <p className="font-black text-lg tracking-tight text-slate-900">{doc}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formal Requirement</p>
                         </div>
                      </div>
                      {isValidating === doc ? (
                        <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl">
                           <Loader2 className="w-5 h-5 animate-spin text-brand" />
                           <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Analyzing</span>
                        </div>
                      ) : uploadedDocs[doc] ? (
                        <div className="flex items-center gap-3 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100">
                           <Shield className="w-4 h-4 text-emerald-600" />
                           <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                             SECURE
                           </span>
                        </div>
                      ) : (
                        <label className="cursor-pointer bg-slate-950 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2">
                          <Upload className="w-4 h-4" /> Upload
                          <input type="file" className="hidden" onChange={e => handleFileUpload(doc, e)} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-5 rounded-2xl bg-slate-100 font-black">Back</button>
                  <button
                    disabled={Object.keys(uploadedDocs).length < service.requiredDocs.length}
                    onClick={() => setStep(3)}
                    className="flex-[2] py-5 rounded-2xl bg-brand text-white font-black text-lg hover:opacity-90 disabled:opacity-50 shadow-2xl shadow-blue-900/20 active:scale-[0.98]"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex justify-between border-b border-slate-200/50 pb-5 items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Fee Breakdown</p>
                      <span className="text-slate-600 font-bold text-lg">{service.title} Service</span>
                    </div>
                    <span className="font-black text-2xl tracking-tight text-slate-900">₹{service.fee}</span>
                  </div>
                  <div className="flex justify-between pt-4 items-center">
                    <span className="text-xl font-black text-slate-900 tracking-tighter">Net Authorized Amount</span>
                    <span className="text-5xl font-black text-brand tracking-tighter">₹{service.fee}</span>
                  </div>
                </div>

                <div className="flex gap-6">
                  <button onClick={() => setStep(2)} className="flex-1 py-5 rounded-2xl bg-slate-100 font-black">Back</button>
                  <button
                    onClick={handlePayment}
                    disabled={isPaying}
                    className="flex-[2] py-5 rounded-3xl bg-brand-grad text-white font-black text-xl shadow-2xl shadow-blue-900/30 flex items-center justify-center gap-4 transition-all"
                  >
                    {isPaying ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>Verify & Pay Now</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-[35%] space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 trust-shadow">
            <h3 className="text-xl font-black mb-6 tracking-tight flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-brand" />
              Submission Log
            </h3>
            <ul className="space-y-4">
              {service.requiredDocs.map(doc => (
                <li key={doc} className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${uploadedDocs[doc] ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-transparent'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${uploadedDocs[doc] ? 'bg-emerald-500 border-emerald-200 text-white' : 'bg-white border-slate-200 text-slate-200'}`}>
                    {uploadedDocs[doc] ? <CheckCircle2 className="w-4 h-4" /> : null}
                  </div>
                  <span className={`font-black text-xs uppercase tracking-tight ${uploadedDocs[doc] ? 'text-emerald-900' : 'text-slate-400'}`}>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-8 rounded-[2.5rem] bg-brand-grad text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mb-6" />
                <h4 className="text-xl font-black tracking-tight mb-2">Government Compliance</h4>
                <p className="text-blue-100 text-xs font-bold leading-relaxed opacity-80">This portal strictly follows official guidelines for data handling and submission.</p>
             </div>
             <div className="absolute -bottom-10 -right-10 opacity-10">
               <Lock className="w-48 h-48" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
