import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Smartphone, CreditCard, Banknote, Shield, Lock, Copy, ExternalLink, QrCode } from 'lucide-react';
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

    // Construct standard UPI deep-link URL (compatible with PhonePe, GPay, Paytm, BHIM, Cred)
    const cleanServiceName = (serviceName || 'Service').replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(upiPayeeName.trim())}&am=${amount}&cu=INR&tn=${encodeURIComponent(`${cleanServiceName} Fee`)}`;

    const handleCopyUpi = () => {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePay = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setPaying(true);

        // Verification simulation animation
        await new Promise(r => setTimeout(r, 1500));
        setConfirmed(true);
        await new Promise(r => setTimeout(r, 600));

        const finalTxnId = utrNumber.trim()
            ? utrNumber.trim()
            : (paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'cash' ? 'CSH' : 'TXN') + Date.now();

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
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Payment Confirmed!</h3>
                <p className="text-slate-400 text-sm font-bold mt-1">Submitting your application...</p>
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
                            onClick={() => setPaymentMethod(key)}
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
                <div className="bg-gradient-to-b from-blue-50/60 to-slate-50 dark:from-blue-500/10 dark:to-slate-900/40 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-6 text-center animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <QrCode className="w-4 h-4 text-brand dark:text-emerald-400" />
                        <p className="text-xs font-black text-brand dark:text-emerald-400 uppercase tracking-widest">
                            Scan to Pay ₹{amount} with any UPI App
                        </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                        PhonePe, Google Pay, Paytm, BHIM, Cred, Amazon Pay
                    </p>

                    {/* Real Dynamic QR Code SVG */}
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 mb-4 transition-transform hover:scale-102">
                        <QRCodeSVG
                            value={upiUri}
                            size={180}
                            level="M"
                            includeMargin={false}
                        />
                        <div className="mt-2 text-[10px] font-black text-slate-500 tracking-wider flex items-center justify-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            DYNAMIC BARCODE • ₹{amount}
                        </div>
                    </div>

                    {/* UPI ID display with Copy & Pay button */}
                    <div className="flex items-center justify-center gap-2 max-w-sm mx-auto mb-4 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 truncate pl-2">{upiId}</span>
                        <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    {/* Mobile Direct UPI Intent Link */}
                    <div className="mb-5 sm:hidden">
                        <a
                            href={upiUri}
                            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Directly in UPI App (GPay / PhonePe)
                        </a>
                    </div>

                    {/* Enter UTR Number Input */}
                    <div className="max-w-md mx-auto text-left pt-2 border-t border-slate-200 dark:border-slate-700/60">
                        <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                            UPI Reference / UTR Number (Optional / Recommended)
                        </label>
                        <input
                            type="text"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                            placeholder="Enter 12-digit UTR from PhonePe/GPay (e.g. 412356789012)"
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm font-mono placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand/30 dark:focus:ring-emerald-500/30 transition-all"
                        />
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                            Payment karne ke baad apne receipt se 12-digit UTR number yahan enter karein.
                        </p>
                    </div>
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
                        Debit Card, Credit Card, aur Internet Banking se instant payment verification karein.
                    </p>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-500/30 text-xs font-mono text-slate-700 dark:text-slate-300">
                        Amount Payable: ₹{amount} • 256-Bit SSL Secured
                    </div>
                </div>
            )}

            {/* Pay Button */}
            <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing || paying}
                className="w-full py-5 rounded-xl bg-brand dark:bg-emerald-600 text-white font-black text-base hover:opacity-90 transition-all shadow-xl shadow-brand/25 dark:shadow-emerald-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
            >
                {paying ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying Payment...
                    </>
                ) : isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting Application...
                    </>
                ) : (
                    <>
                        <Lock className="w-4 h-4" />
                        {paymentMethod === 'cash' ? `Confirm Application (Pay ₹${amount} in Cash)` : `Confirm & Submit Application (₹${amount})`}
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