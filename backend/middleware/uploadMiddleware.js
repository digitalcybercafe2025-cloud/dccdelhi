const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize original filename
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${file.fieldname}-${Date.now()}-${safeName}`);
    }
});

const ALLOWED_EXTENSIONS = /jpg|jpeg|png|gif|pdf/;
const ALLOWED_MIMETYPES = /image\/jpeg|image\/png|image\/gif|application\/pdf/;

const checkFileType = (file, cb) => {
    const extname = ALLOWED_EXTENSIONS.test(path.extname(file.originalname).toLowerCase());
    const mimetype = ALLOWED_MIMETYPES.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG, PNG, GIF, and PDF files are allowed!'));
    }
};

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
