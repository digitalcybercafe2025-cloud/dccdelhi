import api from '../api/axios';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Downloads the legacy Acknowledgement Receipt from the backend (fallback).
 */
export const generateReceipt = async (data: any): Promise<void> => {
    try {
        const id = data._id || data.trackingId;
        if (!id) throw new Error('No Application ID or Tracking ID provided');

        const response = await api.get(`/applications/${id}/receipt`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Receipt-${data.trackingId || 'Application'}.pdf`);
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            link.remove();
            window.URL.revokeObjectURL(url);
        }, 100);
    } catch (error: any) {
        console.error('Download Receipt Error:', error);
        alert('Failed to download receipt. Please try again.');
    }
};

/**
 * Generates an A4 PDF directly from the AcknowledgementReceipt DOM element
 * so the PDF Receipt matches the exact visual format of the JPEG Slip.
 */
export const generateReceiptFromElement = async (
    element: HTMLElement | null,
    trackingId: string,
    fallbackData?: any
): Promise<void> => {
    if (!element) {
        if (fallbackData) {
            await generateReceipt(fallbackData);
        }
        return;
    }

    try {
        const imgData = await toPng(element, {
            quality: 0.98,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
        });

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (err) => reject(err);
            img.src = imgData;
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;

        const imgRatio = img.width / img.height;
        let renderWidth = maxWidth;
        let renderHeight = renderWidth / imgRatio;

        if (renderHeight > maxHeight) {
            renderHeight = maxHeight;
            renderWidth = renderHeight * imgRatio;
        }

        const x = (pageWidth - renderWidth) / 2;
        const y = margin;

        pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST');
        pdf.save(`Receipt-${trackingId || 'Application'}.pdf`);
    } catch (error) {
        console.error('Unified PDF generation failed, falling back to backend PDF:', error);
        if (fallbackData) {
            await generateReceipt(fallbackData);
        } else {
            alert('Could not generate PDF receipt. Please try again.');
        }
    }
};
