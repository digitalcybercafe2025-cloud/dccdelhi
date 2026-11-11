export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    wasCompressed: boolean;
}

const TARGET_MAX_BYTES = 350 * 1024; // ~350 KB target for crisp legible document photos
const MAX_DIMENSION = 1800; // 1800px preserves every small text/letter clearly on Aadhaar, PAN, certificates

/**
 * Compresses image documents client-side on an HTML5 Canvas while preserving sharp text clarity.
 * Non-image files (PDF, GIF) pass through untouched.
 */
export const compressDocumentFile = async (inputFile: File): Promise<CompressionResult> => {
    const originalSize = inputFile.size;
    const isCompressibleImage =
        inputFile.type === 'image/jpeg' ||
        inputFile.type === 'image/jpg' ||
        inputFile.type === 'image/png' ||
        inputFile.type === 'image/webp';

    if (!isCompressibleImage || originalSize <= 180 * 1024) {
        return {
            file: inputFile,
            originalSize,
            compressedSize: originalSize,
            wasCompressed: false,
        };
    }

    try {
        const imageUrl = URL.createObjectURL(inputFile);
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = (err) => reject(err);
            el.src = imageUrl;
        });
        URL.revokeObjectURL(imageUrl);

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
            return { file: inputFile, originalSize, compressedSize: originalSize, wasCompressed: false };
        }

        // Scale down proportionally only if exceeding MAX_DIMENSION
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width >= height) {
                height = Math.round((height * MAX_DIMENSION) / width);
                width = MAX_DIMENSION;
            } else {
                width = Math.round((width * MAX_DIMENSION) / height);
                height = MAX_DIMENSION;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return { file: inputFile, originalSize, compressedSize: originalSize, wasCompressed: false };
        }

        // White background so PNGs with transparency don't render black areas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const toBlobAtQuality = (q: number): Promise<Blob | null> =>
            new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', q));

        const qualities = [0.85, 0.78, 0.72, 0.66];
        let bestBlob: Blob | null = null;

        for (const q of qualities) {
            const blob = await toBlobAtQuality(q);
            if (!blob) continue;
            bestBlob = blob;
            if (blob.size <= TARGET_MAX_BYTES) break;
        }

        if (!bestBlob || bestBlob.size >= originalSize) {
            return { file: inputFile, originalSize, compressedSize: originalSize, wasCompressed: false };
        }

        const baseName = inputFile.name.replace(/\.[^/.]+$/, '');
        const compressedFile = new File([bestBlob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });

        // Preserve docType if attached
        if ((inputFile as any).docType) {
            (compressedFile as any).docType = (inputFile as any).docType;
        }

        return {
            file: compressedFile,
            originalSize,
            compressedSize: compressedFile.size,
            wasCompressed: true,
        };
    } catch (err) {
        console.warn('Document compression skipped due to error:', err);
        return {
            file: inputFile,
            originalSize,
            compressedSize: originalSize,
            wasCompressed: false,
        };
    }
};
