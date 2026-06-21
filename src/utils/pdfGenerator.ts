import api from '../api/axios';

// ── Interface ────────────────────────────────────────────────────────────────
interface ReceiptData {
    _id?: string;
    trackingId: string;
    // ... other fields not strictly needed if we use the backend ID
}

/**
 * Downloads the Acknowledgement Receipt from the backend
 * @param data - Application data containing at least the _id or trackingId
 */
export const generateReceipt = async (data: any): Promise<void> => {
    try {
        const id = data._id || data.trackingId;
        if (!id) throw new Error('No Application ID or Tracking ID provided');

        // Fetch the PDF from the backend as a blob
        const response = await api.get(`/applications/${id}/receipt`, {
            responseType: 'blob'
        });

        // Create a URL for the blob
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Receipt-${data.trackingId || 'Application'}.pdf`);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            link.remove();
            window.URL.revokeObjectURL(url);
        }, 100);
    } catch (error: any) {
        console.error('Download Receipt Error:', error);
        alert('Failed to download receipt. Please try again.');
    }
};

