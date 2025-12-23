import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
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
  try {
    // Generate barcode first (before creating PDF document)
    const skuString = String(data.sku);
    let barcodeBuffer;
    
    try {
      // Try to generate barcode - bwip-js.toBuffer returns a Promise
      barcodeBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: skuString,
        scale: 2,
        height: 40,
        includetext: false,
        textxalign: 'center',
      });
    } catch (barcodeError) {
      console.error('Barcode generation error:', barcodeError);
      // Fallback with different settings
      try {
        barcodeBuffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: skuString,
          scale: 1.5,
          height: 38,
          includetext: false,
        });
      } catch (fallbackError) {
        console.error('Barcode generation fallback error:', fallbackError);
        // Last resort - minimal settings
        try {
          barcodeBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: skuString,
            scale: 1,
            height: 35,
            includetext: false,
          });
        } catch (lastResortError) {
          console.error('Last resort barcode generation failed:', lastResortError);
          throw new Error(`Barcode generation failed: ${lastResortError.message}`);
        }
      }
    }
    
    if (!barcodeBuffer || !Buffer.isBuffer(barcodeBuffer)) {
      console.error('Barcode buffer validation failed:', {
        exists: !!barcodeBuffer,
        type: typeof barcodeBuffer,
        isBuffer: Buffer.isBuffer(barcodeBuffer),
        value: barcodeBuffer
      });
      throw new Error(`Failed to generate barcode buffer. Got: ${typeof barcodeBuffer}`);
    }
    
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

      // Product Name (bold, centered)
      doc.fontSize(14)
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

      // Use the pre-generated barcode buffer
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
  } catch (error) {
    return Promise.reject(error);
  }
}
