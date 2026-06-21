const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

/**
 * Generates an Acknowledgement Receipt PDF
 * @param {Object} data - Application data
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateAcknowledgementReceipt = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // 1. HEADER SECTION
            // Ashoka Emblem
            try {
                const ashokaUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/150px-Emblem_of_India.svg.png';
                const response = await axios.get(ashokaUrl, { responseType: 'arraybuffer' });
                const emblemBuffer = Buffer.from(response.data);
                doc.image(emblemBuffer, 30, 30, { width: 50 });
            } catch (err) {
                console.error('Error loading Ashoka emblem:', err.message);
                // Fallback: draw a simple placeholder or just skip
            }

            // Branding: Digital Cyber Cafe
            doc.fillColor('#003366').fontSize(24).font('Helvetica-Bold');
            doc.text('Digital ', 350, 45, { continued: true });
            doc.fillColor('#FF6600').text('Cyber ', { continued: true });
            doc.fillColor('#17a050ff').text('Cafe');

            // Business Details
            doc.fillColor('#444444').fontSize(10).font('Helvetica');
            doc.text('Mobile: 9911423881  |  Address: G-663, Mangolpuri, Delhi 110083', 30, 80, { align: 'center' });
            doc.fillColor('#003366').fontSize(12).font('Helvetica-Oblique');
            doc.text('— Trusted Digital Services, Fast, Secure & Reliable. —', 30, 100, { align: 'center' });

            // Divider Line
            doc.moveTo(30, 120).lineTo(565, 120).strokeColor('#CCCCCC').stroke();

            // 2. TITLE SECTION
            doc.moveDown(1);
            doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold');
            doc.text('ACKNOWLEDGEMENT RECEIPT', { align: 'center', underline: true });
            doc.moveDown(1);

            // 3. APPLICATION DETAILS TABLE
            const table = {
                title: "",
                headers: [
                    { label: "Field", property: 'field', width: 250, renderer: null },
                    { label: "Value", property: 'value', width: 285, renderer: null }
                ],
                datas: [
                    { field: "Application ID:", value: data.trackingId },
                    { field: "Service Applied:", value: data.serviceName },
                    { field: "Applicant Name:", value: data.userDetails.fullName },
                    { field: "Mobile Number:", value: data.userDetails.mobile },
                    { field: "Address:", value: `${data.userDetails.address}, ${data.userDetails.city}, ${data.userDetails.state} - ${data.userDetails.pincode}` },
                    { field: "Payment Status:", value: data.paymentDetails.paymentStatus === 'Paid' ? 'Paid Successfully' : data.paymentDetails.paymentStatus },
                    { field: "Transaction ID:", value: data.paymentDetails.transactionId || 'N/A' },
                    { field: "Payment Amount:", value: `₹ ${data.paymentDetails.amount.toFixed(2)}` },
                    { field: "Date & Time:", value: new Date(data.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
                ],
                options: {
                    columnSpacing: 10,
                    padding: 5,
                    divider: {
                        header: { disabled: true },
                        horizontal: { disabled: false, width: 0.5, opacity: 0.5 },
                    },
                    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(12),
                    prepareRow: (row, index, column, rectRow, rectCell) => {
                        doc.font("Helvetica").fontSize(11).fillColor('#333333');
                    },
                }
            };

            doc.table(table, {
                x: 30,
                y: 160,
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(0), // Hide headers
            });

            // 4. ATTACHED DOCUMENTS & PHOTO
            const photoY = doc.y + 20;
            doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
            doc.text('Attached Documents:', 30, photoY);

            doc.fontSize(10).font('Helvetica').fillColor('#333333');
            const docsList = data.documents.map((d, i) => `${i + 1}. ${d.originalName || d.fileName || d.docType}`);

            if (docsList.length === 0) {
                doc.text('1. No documents attached', 30, photoY + 20);
            } else {
                docsList.forEach((d, i) => {
                    doc.text(d, 30, photoY + 20 + (i * 15));
                });
            }

            // Thumbnail Previews (Photo / Signature)
            const photoDoc = data.documents.find(d => d.docType && (d.docType.toLowerCase().includes('photo') || d.docType.toLowerCase() === 'profile photo' || d.docType.toLowerCase() === 'passport photo'));
            const signDoc = data.documents.find(d => d.docType && d.docType.toLowerCase().includes('signature'));

            let currentX = 400;
            if (photoDoc) {
                const photoPath = path.resolve(photoDoc.filePath);
                if (fs.existsSync(photoPath)) {
                    doc.rect(currentX, photoY, 70, 90).strokeColor('#CCCCCC').stroke();
                    doc.image(photoPath, currentX + 5, photoY + 5, { width: 60, height: 80 });
                    currentX += 80;
                }
            }
            if (signDoc) {
                const signPath = path.resolve(signDoc.filePath);
                if (fs.existsSync(signPath)) {
                    doc.rect(currentX, photoY + 50, 80, 40).strokeColor('#CCCCCC').stroke();
                    doc.image(signPath, currentX + 5, photoY + 55, { width: 70, height: 30 });
                }
            }

            // 5. FOOTER SECTION
            doc.moveTo(30, 720).lineTo(565, 720).strokeColor('#CCCCCC').stroke();
            doc.fillColor('#003366').fontSize(18).font('Helvetica-Bold');
            doc.text('Thank You!', 30, 735, { align: 'center' });
            doc.fontSize(10).font('Helvetica-Oblique').fillColor('#444444');
            doc.text('We appreciate your business.', { align: 'center' });

            doc.moveDown(0.5);
            doc.fillColor('#003366').fontSize(11).font('Helvetica-Bold');
            doc.text('Trusted Digital Services, Fast, Secure & Reliable.', { align: 'center' });

            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica').fillColor('#666666');
            doc.text('For any assistance, contact: 9911423881 | www.digitalcybercafe.in', { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generateAcknowledgementReceipt };
