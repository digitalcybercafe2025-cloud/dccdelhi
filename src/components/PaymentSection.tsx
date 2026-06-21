import React, { useState } from 'react';
import { Loader2, CheckCircle, Smartphone, CreditCard, Banknote, Shield, Lock } from 'lucide-react';

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

    const handlePay = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setPaying(true);
        // Simulate payment processing animation
        await new Promise(r => setTimeout(r, 1800));
        setConfirmed(true);
        await new Promise(r => setTimeout(r, 800));
        const txnId = 'TXN' + Date.now() + Math.floor(Math.random() * 9000 + 1000);
        onPaymentComplete({ transactionId: txnId, method: paymentMethod });
    };

    const METHODS: { key: PaymentMethod; icon: React.ReactNode; label: string; sub: string }[] = [
        { key: 'upi', icon: <Smartphone className="w-5 h-5" />, label: 'UPI / QR Code', sub: 'PhonePe, GPay, Paytm' },
        { key: 'card', icon: <CreditCard className="w-5 h-5" />, label: 'Card / Net Banking', sub: 'Debit, Credit, NEFT' },
        { key: 'cash', icon: <Banknote className="w-5 h-5" />, label: 'Cash at Counter', sub: 'Pay in person' },
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
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Platform Charge</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">FREE</span>
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

            {/* UPI QR Mockup */}
            {paymentMethod === 'upi' && (
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5 text-center animate-in slide-in-from-top-2 duration-300">
                    <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Scan & Pay via UPI</p>
                    {/* QR Pattern Mockup */}
                    <div className="w-36 h-36 mx-auto rounded-xl bg-white border-2 border-blue-200 dark:border-blue-500/30 flex flex-col items-center justify-center gap-1 mb-3 shadow-inner">
                        <div className="grid grid-cols-5 gap-0.5">
                            {[...Array(25)].map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-sm ${[0, 1, 3, 5, 7, 8, 10, 14, 16, 18, 20, 22, 24].includes(i) ? 'bg-slate-900 dark:bg-slate-100' : 'bg-transparent'}`} />
                            ))}
                        </div>
                        <p className="text-[8px] font-black text-slate-400 mt-1 tracking-wider">SCAN QR</p>
                    </div>
                    <p className="text-sm font-black text-slate-700 dark:text-white">digitalcybercafe@upi</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1">or click "Pay" to simulate payment</p>
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

            {/* Pay Button */}
            <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing || paying}
                className="w-full py-5 rounded-xl bg-brand dark:bg-emerald-600 text-white font-black text-base hover:opacity-90 transition-all shadow-xl shadow-brand/25 dark:shadow-emerald-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
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
                        {paymentMethod === 'cash' ? `Confirm Application` : `Pay ₹${amount} Securely`}
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
                    Govt. Authorized
                </div>
            </div>
        </div>
    );
};
