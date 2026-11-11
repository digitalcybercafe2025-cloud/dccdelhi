export interface StoredDraftFile {
    name: string;
    type: string;
    docType: string;
    lastModified: number;
    blob: Blob;
    originalSize?: number;
}

export interface ApplicationDraft {
    serviceId: string;
    step: 'form' | 'payment';
    formSubStep?: 'details' | 'documents';
    userDetails: any;
    specificFields: Record<string, string>;
    files: File[];
    updatedAt: number;
}

const DB_NAME = 'dcc_application_drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const META_PREFIX = 'dcc_apply_draft_meta_';

const openDraftDb = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'serviceId' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    });
};

export const saveApplicationDraft = async (draft: ApplicationDraft): Promise<void> => {
    if (!draft.serviceId) return;

    const now = Date.now();
    // Always save text metadata synchronously to localStorage as immediate backup
    try {
        localStorage.setItem(
            `${META_PREFIX}${draft.serviceId}`,
            JSON.stringify({
                serviceId: draft.serviceId,
                step: draft.step,
                formSubStep: draft.formSubStep || 'details',
                userDetails: draft.userDetails,
                specificFields: draft.specificFields,
                updatedAt: now,
            })
        );
    } catch {
        // Ignore quota error on localStorage
    }

    // Save binary File blobs in IndexedDB
    try {
        const db = await openDraftDb();
        const serializedFiles: StoredDraftFile[] = (draft.files || []).map((f) => ({
            name: f.name,
            type: f.type || 'application/octet-stream',
            docType: (f as any).docType || f.name,
            lastModified: f.lastModified || now,
            blob: f,
            originalSize: (f as any).originalSize,
        }));

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put({
                serviceId: draft.serviceId,
                step: draft.step,
                formSubStep: draft.formSubStep || 'details',
                userDetails: draft.userDetails,
                specificFields: draft.specificFields,
                files: serializedFiles,
                updatedAt: now,
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
    } catch (err) {
        console.warn('IndexedDB draft save skipped:', err);
    }
};

export const loadApplicationDraft = async (serviceId: string): Promise<ApplicationDraft | null> => {
    if (!serviceId) return null;

    try {
        const db = await openDraftDb();
        const record: any = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(serviceId);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
        db.close();

        if (record && Date.now() - (record.updatedAt || 0) < DRAFT_TTL_MS) {
            const restoredFiles: File[] = (record.files || []).map((item: StoredDraftFile) => {
                const f = new File([item.blob], item.name, {
                    type: item.type,
                    lastModified: item.lastModified || Date.now(),
                });
                (f as any).docType = item.docType;
                if (item.originalSize) (f as any).originalSize = item.originalSize;
                return f;
            });

            return {
                serviceId: record.serviceId,
                step: record.step || 'form',
                formSubStep: record.formSubStep,
                userDetails: record.userDetails || null,
                specificFields: record.specificFields || {},
                files: restoredFiles,
                updatedAt: record.updatedAt,
            };
        }
    } catch (err) {
        console.warn('IndexedDB draft load skipped:', err);
    }

    // Fallback to localStorage text draft if IndexedDB unavailable
    try {
        const raw = localStorage.getItem(`${META_PREFIX}${serviceId}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - (parsed.updatedAt || 0) < DRAFT_TTL_MS) {
            return {
                serviceId: parsed.serviceId,
                step: 'form', // Without files in fallback, revert cleanly to form so user doesn't submit empty docs
                formSubStep: parsed.formSubStep,
                userDetails: parsed.userDetails || null,
                specificFields: parsed.specificFields || {},
                files: [],
                updatedAt: parsed.updatedAt,
            };
        }
    } catch {
        // Ignore parse error
    }

    return null;
};

export const clearApplicationDraft = async (serviceId: string): Promise<void> => {
    if (!serviceId) return;
    try {
        localStorage.removeItem(`${META_PREFIX}${serviceId}`);
    } catch {
        // Ignore
    }
    try {
        const db = await openDraftDb();
        await new Promise<void>((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(serviceId);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
        db.close();
    } catch {
        // Ignore
    }
};
