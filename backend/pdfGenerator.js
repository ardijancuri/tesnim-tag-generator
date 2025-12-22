import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
import JsBarcode from 'jsbarcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Inter font if available, otherwise use Helvetica
function registerInterFont(doc) {
  // Try multiple possible font paths (for both local dev and serverless)
  const possibleFontPaths = [
    path.join(__dirname, 'fonts', 'Inter-Regular.ttf'), // Local backend/fonts
    path.join(process.cwd(), 'backend', 'fonts', 'Inter-Regular.ttf'), // Serverless from root
    path.join(process.cwd(), 'fonts', 'Inter-Regular.ttf') // Alternative serverless path
  ];
  
  const possibleBoldPaths = [
    path.join(__dirname, 'fonts', 'Inter-Bold.ttf'),
    path.join(process.cwd(), 'backend', 'fonts', 'Inter-Bold.ttf'),
    path.join(process.cwd(), 'fonts', 'Inter-Bold.ttf')
  ];
  
  let fontPath = null;
  let fontBoldPath = null;
  
  // Find the first existing font path
  for (const possiblePath of possibleFontPaths) {
    if (fs.existsSync(possiblePath)) {
      fontPath = possiblePath;
      break;
    }
  }
  
  for (const possiblePath of possibleBoldPaths) {
    if (fs.existsSync(possiblePath)) {
      fontBoldPath = possiblePath;
      break;
    }
  }
  
  if (!fontPath || !fontBoldPath) {
    return false;
  }
  
  try {
    if (fs.existsSync(fontPath) && fs.existsSync(fontBoldPath)) {
      doc.registerFont('Inter', fontPath);
      doc.registerFont('Inter-Bold', fontBoldPath);
      return true;
    }
  } catch (error) {
    console.warn('Inter font not found, using Helvetica fallback');
  }
  return false;
}

export async function generatePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      // Tag size: approximately 80mm x 116mm (226.77 x 330 points)
      const doc = new PDFDocument({
        size: [226.77, 330],
        margins: { top: 15, bottom: 15, left: 15, right: 15 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Register Inter font
      const hasInterFont = registerInterFont(doc);
      const regularFont = hasInterFont ? 'Inter' : 'Helvetica';
      const boldFont = hasInterFont ? 'Inter-Bold' : 'Helvetica-Bold';

      // Background color (light beige/white like in the image)
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fillColor('#FAFAFA')
         .fill();

      let yPos = 20;

      // Header - TESNIM HOME (bold, centered)
      doc.fillColor('#000000')
         .fontSize(22)
         .font(boldFont)
         .text('TESNIM HOME', 15, yPos, {
           align: 'center',
           width: doc.page.width - 30
         });

      yPos += 30;

      // Line break (separator line under title)
      doc.moveTo(15, yPos)
         .lineTo(doc.page.width - 15, yPos)
         .strokeColor('#000000')
         .lineWidth(0.5)
         .stroke();
      
      yPos += 15;

      // Product Name (bold, larger, centered)
      doc.fontSize(16)
         .font(boldFont)
         .fillColor('#000000')
         .text(data.productName || '', 15, yPos, {
           align: 'center',
           width: doc.page.width - 30
         });

      yPos += 28;

      // ID fields (smaller font, regular weight, centered)
      if (data.id1) {
        doc.fontSize(11)
           .font(regularFont)
           .fillColor('#333333')
           .text(data.id1, 15, yPos, {
             align: 'center',
             width: doc.page.width - 30
           });
        yPos += 14;
      }

      if (data.id2) {
        doc.fontSize(11)
           .font(regularFont)
           .fillColor('#333333')
           .text(data.id2, 15, yPos, {
             align: 'center',
             width: doc.page.width - 30
           });
        yPos += 14;
      }

      if (data.id3) {
        doc.fontSize(11)
           .font(regularFont)
           .fillColor('#333333')
           .text(data.id3, 15, yPos, {
             align: 'center',
             width: doc.page.width - 30
           });
        yPos += 14;
      }

      // Add space before size field
      if (data.size) {
        yPos += 8;
      }

      // Size (centered)
      if (data.size) {
        doc.fontSize(11)
           .font(regularFont)
           .fillColor('#333333')
           .text(data.size, 15, yPos, {
             align: 'center',
             width: doc.page.width - 30
           });
        yPos += 17;
      }

      // Add extra margin top before price
      yPos += 10;

      // Price (large, bold, centered)
      if (data.price) {
        // Format price to 2 decimal places
        let priceValue = parseFloat(data.price);
        if (isNaN(priceValue)) {
          priceValue = parseFloat(data.price.replace(/[^\d.]/g, '')) || 0;
        }
        const formattedPrice = priceValue.toFixed(2);
        
        let priceText;
        // Format price based on currency
        if (data.currency === 'euro') {
          priceText = `€${formattedPrice}`;
        } else {
          // Default to denar
          priceText = `${formattedPrice} den`;
        }
        
        doc.fontSize(28)
           .font(boldFont)
           .fillColor('#000000')
           .text(priceText, 15, yPos, {
             align: 'center',
             width: doc.page.width - 30
           });
        yPos += 36;
      }

      // Separator line
      doc.moveTo(15, yPos)
         .lineTo(doc.page.width - 15, yPos)
         .strokeColor('#000000')
         .lineWidth(0.5)
         .stroke();
      
      yPos += 12;

      // Generate barcode - Using CODE128 for better appearance with full height bars
      const canvas = createCanvas(400, 75);
      const skuString = String(data.sku);
      
      // Use CODE128 for cleaner appearance with full-height vertical lines
      // CODE128 is more flexible and produces better-looking barcodes
      try {
        JsBarcode(canvas, skuString, {
          format: 'CODE128',
          width: 2,
          height: 40,
          displayValue: false, // We'll add the number separately
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0
        });
      } catch (barcodeError) {
        // Fallback with slightly different settings if first attempt fails
        try {
          JsBarcode(canvas, skuString, {
            format: 'CODE128',
            width: 1.8,
            height: 40,
            displayValue: false,
            margin: 0,
            background: 'transparent',
            lineColor: '#000000'
          });
        } catch (fallbackError) {
          console.error('Barcode generation error:', fallbackError);
          // Last resort - try with minimal settings
          JsBarcode(canvas, skuString, {
            format: 'CODE128',
            width: 1.5,
            height: 38,
            displayValue: false
          });
        }
      }

      // Convert canvas to image buffer
      const barcodeBuffer = canvas.toBuffer('image/png');
      
      // Center the barcode with smaller sizing
      const barcodeWidth = 160;
      const barcodeHeight = 40;
      const barcodeX = (doc.page.width - barcodeWidth) / 2;
      
      // Add barcode image to PDF
      doc.image(barcodeBuffer, barcodeX, yPos, {
        width: barcodeWidth,
        height: barcodeHeight,
        align: 'center'
      });

      // Add space between barcode and number
      yPos += 50;

      // SKU number below barcode (centered)
      doc.fontSize(9)
         .font(regularFont)
         .fillColor('#000000')
         .text(skuString, 15, yPos, {
           align: 'center',
           width: doc.page.width - 30
         });

      // Footer (bottom of page, centered)
      doc.fontSize(7)
         .font(regularFont)
         .fillColor('#666666')
         .text('TESNIM • www.tesnim.mk', 15, doc.page.height - 25, {
           align: 'center',
           width: doc.page.width - 30
         });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
