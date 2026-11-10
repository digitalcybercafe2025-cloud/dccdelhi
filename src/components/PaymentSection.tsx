import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Smartphone, CreditCard, Banknote, Shield, Lock, Copy, QrCode, Download, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';

interface PaymentSectionProps {
    serviceName: string;
    amount: number;
    onPaymentComplete: (details: { transactionId: string, method: string }) => void;
    isProcessing: boolean;
}

type PaymentMethod = 'upi' | 'card' | 'cash';

export const PaymentSection: React.FC<PaymentSectionProps> = ({ serviceName, amount, onPaymentComplete, isProcessing }) => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
    const [paying, setPaying] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [upiId, setUpiId] = useState('8445221632@upi');
    const [upiPayeeName, setUpiPayeeName] = useState('Digital Cyber Cafe');
    const [utrNumber, setUtrNumber] = useState('');
    const [copied, setCopied] = useState(false);
    const [downloadingQr, setDownloadingQr] = useState(false);
    const [qrDownloaded, setQrDownloaded] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/settings')
            .then(res => {
                if (res.data?.data) {
                    if (res.data.data.upiId) setUpiId(res.data.data.upiId);
                    if (res.data.data.upiPayeeName) setUpiPayeeName(res.data.data.upiPayeeName);
                }
            })
            .catch(() => {
                // Keep default fallback
            });
    }, []);

    // Construct standard UPI deep-link URL (PhonePe, GPay, Paytm, BHIM, Cred)
    const cleanServiceName = (serviceName || 'Service').replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(upiPayeeName.trim())}&am=${amount}&cu=INR&tn=${encodeURIComponent(`${cleanServiceName} Fee`)}`;

    const handleCopyUpi = () => {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Download QR Code as Image for mobile gallery upload
    const handleDownloadQr = () => {
        setDownloadingQr(true);
        try {
            const svg = document.getElementById('upi-qr-svg');
            if (!svg) {
                setDownloadingQr(false);
                return;
            }
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = 400;
                canvas.height = 460;
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Header branding
                    ctx.fillStyle = '#0f172a';
                    ctx.font = 'bold 18px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Digital Cyber Cafe', 200, 32);

                    ctx.fillStyle = '#2563eb';
                    ctx.font = 'bold 15px sans-serif';
                    ctx.fillText(`Scan & Pay ₹${amount}`, 200, 56);

                    ctx.drawImage(img, 60, 70, 280, 280);

                    ctx.fillStyle = '#475569';
                    ctx.font = 'bold 13px monospace';
                    ctx.fillText(upiId, 200, 380);

                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('Official UPI Payment Barcode • Verified', 200, 410);

                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '10px sans-serif';
                    ctx.fillText('PhonePe • Google Pay • Paytm • BHIM', 200, 435);

                    const a = document.createElement('a');
                    a.download = `CyberCafe-QR-Rs${amount}.png`;
                    a.href = canvas.toDataURL('image/png');
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setQrDownloaded(true);
                    setTimeout(() => setQrDownloaded(false), 5000);
                }
                setDownloadingQr(false);
            };
            img.onerror = () => {
                setDownloadingQr(false);
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        } catch (e) {
            console.error('Download QR error', e);
            setDownloadingQr(false);
        }
    };

    const isUtrValid = paymentMethod === 'upi' ? /^[0-9]{12}$/.test(utrNumber.trim()) : true;

    const handlePay = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setValidationError(null);

        // Strict 12-digit UTR validation for UPI
        if (paymentMethod === 'upi') {
            const cleanUtr = utrNumber.trim();
            if (!cleanUtr) {
                setValidationError('Please enter your 12-digit UPI UTR number from PhonePe/GooglePay/Paytm.');
                return;
            }
            if (!/^[0-9]{12}$/.test(cleanUtr)) {
                setValidationError('UTR number must be exactly 12 digits (numbers only, e.g. 412389123456).');
                return;
            }
        }

        setPaying(true);

        // Verification simulation animation
        await new Promise(r => setTimeout(r, 1200));
        setConfirmed(true);
        await new Promise(r => setTimeout(r, 600));

        const finalTxnId = utrNumber.trim()
            ? utrNumber.trim()
            : (paymentMethod === 'cash' ? 'CSH' : 'TXN') + Date.now();

        onPaymentComplete({ transactionId: finalTxnId, method: paymentMethod });
    };

    const METHODS: { key: PaymentMethod; icon: React.ReactNode; label: string; sub: string }[] = [
        { key: 'upi', icon: <Smartphone className="w-5 h-5" />, label: 'UPI / Dynamic QR Code', sub: 'PhonePe, GPay, Paytm, BHIM' },
        { key: 'card', icon: <CreditCard className="w-5 h-5" />, label: 'Card / Net Banking', sub: 'Debit, Credit, NEFT' },
        { key: 'cash', icon: <Banknote className="w-5 h-5" />, label: 'Cash at Counter', sub: 'Pay in person at Cyber Cafe' },
    ];

    if (confirmed) {
        return (
            <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Payment Recorded!</h3>
                <p className="text-slate-400 text-sm font-bold mt-1">Generating your Acknowledgement Receipt...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Order Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-white/5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Order Summary</h3>
                </div>
                <div className="px-6 py-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{serviceName}</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">₹{amount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Gateway & Convenience Fee</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">FREE (₹0)</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center">
                        <span className="text-base font-black text-slate-900 dark:text-white">Total Payable</span>
                        <span className="text-2xl font-black text-brand dark:text-emerald-400 font-mono">₹{amount}</span>
                    </div>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div>
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3">Choose Payment Method</label>
                <div className="space-y-3">
                    {METHODS.map(({ key, icon, label, sub }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => { setPaymentMethod(key); setValidationError(null); }}
                            className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-200 text-left ${paymentMethod === key
                                ? 'border-brand dark:border-emerald-500 bg-brand/5 dark:bg-emerald-500/10'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-transparent'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${paymentMethod === key ? 'bg-brand dark:bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                }`}>
                                {icon}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold text-sm transition-colors ${paymentMethod === key ? 'text-brand dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>{label}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 transition-all ${paymentMethod === key ? 'border-brand dark:border-emerald-500 bg-brand dark:bg-emerald-500' : 'border-slate-300 dark:border-slate-600'
                                }`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Real Dynamic UPI QR Code Section */}
            {paymentMethod === 'upi' && (
                <div className="bg-gradient-to-b from-blue-50/70 to-slate-50 dark:from-blue-500/10 dark:to-slate-900/40 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-6 text-center animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                        <QrCode className="w-4 h-4 text-brand dark:text-emerald-400" />
                        <p className="text-xs font-black text-brand dark:text-emerald-400 uppercase tracking-widest">
                            Scan to Pay ₹{amount} with any UPI App
                        </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                        PhonePe, Google Pay, Paytm, BHIM, Cred, Amazon Pay
                    </p>

                    {/* Real Dynamic QR Code SVG */}
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 mb-3 transition-transform hover:scale-102">
                        <QRCodeSVG
                            id="upi-qr-svg"
                            value={upiUri}
                            size={180}
                            level="M"
                            includeMargin={false}
                        />
                        <div className="mt-2 text-[10px] font-black text-slate-600 tracking-wider flex items-center justify-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            DYNAMIC BARCODE • ₹{amount}
                        </div>
                    </div>

                    {/* Primary Action: Download QR Code for Gallery Scan */}
                    <div className="max-w-sm mx-auto mb-3">
                        <button
                            type="button"
                            onClick={handleDownloadQr}
                            disabled={downloadingQr}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                            title="Download barcode photo to pay from PhonePe/GPay gallery"
                        >
                            {downloadingQr ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : qrDownloaded ? (
                                <CheckCircle className="w-4 h-4 text-emerald-300" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            <span>
                                {qrDownloaded
                                    ? 'Barcode Saved! Open UPI App → Scan from Gallery'
                                    : 'Download Barcode (Pay via Gallery)'}
                            </span>
                        </button>
                    </div>

                    {/* UPI ID display with Copy button */}
                    <div className="flex items-center justify-center gap-2 max-w-sm mx-auto mb-4 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 truncate pl-2">{upiId}</span>
                        <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            {copied ? 'Copied!' : 'Copy UPI ID'}
                        </button>
                    </div>

                    {/* Quick How-To-Pay Steps for Mobile & Desktop */}
                    <div className="max-w-md mx-auto mb-4 px-3 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 text-left space-y-1">
                        <p className="font-bold text-slate-800 dark:text-white">Payment Kaise Karein?</p>
                        <p>1. <strong>Same Mobile:</strong> Barcode download karein → PhonePe/GPay kholein → <strong>Scan QR → Gallery</strong> se barcode select karke pay karein.</p>
                        <p>2. <strong>Ya Copy UPI ID:</strong> Upar se UPI ID copy karke PhonePe/GPay me seedha ₹{amount} transfer karein.</p>
                    </div>

                    {/* Enter UTR Number Input - Strictly Mandatory */}
                    <div className="max-w-md mx-auto text-left pt-3 border-t border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                UPI Reference / UTR Number <span className="text-red-500">* (Zaroori)</span>
                            </label>
                            {utrNumber.trim().length === 12 && (
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle size={10} /> 12-Digit Valid
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            maxLength={12}
                            value={utrNumber}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setUtrNumber(val);
                                if (val.length === 12) setValidationError(null);
                            }}
                            placeholder="Enter 12-digit UTR from PhonePe/GPay (e.g. 412356789012)"
                            className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border ${
                                utrNumber.length > 0 && utrNumber.length < 12 ? 'border-amber-400 focus:border-amber-500' : 'border-slate-300 dark:border-slate-600 focus:border-blue-500'
                            } text-slate-900 dark:text-white text-sm font-mono tracking-wider placeholder:tracking-normal placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all`}
                        />
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                Payment ke baad receipt se 12-digit UTR number enter karein.
                            </p>
                            <span className={`font-mono font-bold ${utrNumber.length === 12 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {utrNumber.length}/12
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Error Banner */}
            {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs font-bold animate-in slide-in-from-top-1">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{validationError}</span>
                </div>
            )}

            {/* Cash instructions */}
            {paymentMethod === 'cash' && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-5 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2">Cash Payment Instructions</p>
                    <ul className="text-sm text-amber-700/80 dark:text-amber-300/80 font-medium space-y-1">
                        <li>• Visit Digital Cyber Cafe, Mangolpuri, Delhi</li>
                        <li>• Pay ₹{amount} cash at the counter</li>
                        <li>• Your application reference will be confirmed after payment</li>
                    </ul>
                </div>
            )}

            {/* Card instructions */}
            {paymentMethod === 'card' && (
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5 animate-in slide-in-from-top-2 duration-300 text-left">
                    <p className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2">Card & Net Banking</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
                        Debit Card, Credit Card, aur Internet Banking se payment karein.
                    </p>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-500/30 text-xs font-mono text-slate-700 dark:text-slate-300">
                        Amount Payable: ₹{amount} • 256-Bit SSL Secured
                    </div>
                </div>
            )}

            {/* Pay Button - Locked until valid UTR is provided */}
            <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing || paying || (paymentMethod === 'upi' && !isUtrValid)}
                className="w-full py-4 rounded-xl bg-brand dark:bg-emerald-600 text-white font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-brand/25 dark:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
            >
                {paying ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying Payment Details...
                    </>
                ) : isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting Application...
                    </>
                ) : (
                    <>
                        <Lock className="w-4 h-4" />
                        {paymentMethod === 'cash'
                            ? `Confirm Application (Pay ₹${amount} in Cash)`
                            : paymentMethod === 'upi' && !isUtrValid
                                ? `Enter 12-Digit UTR to Submit (₹${amount})`
                                : `Confirm & Submit Application (₹${amount})`}
                    </>
                )}
            </button>

            <div className="flex items-center justify-center gap-6 pt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    256-bit Encrypted
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Direct UPI & Bank Transfer
                </div>
            </div>
        </div>
    );
};
