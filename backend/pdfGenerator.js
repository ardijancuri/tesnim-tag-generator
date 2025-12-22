import { PDFDocument, rgb } from 'pdf-lib';
import * as fontkit from 'fontkit';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find template PDF path
function findTemplatePath() {
  const possiblePaths = [
    path.join(__dirname, 'template.pdf'),
    path.join(process.cwd(), 'template.pdf'),
    path.join(process.cwd(), 'backend', 'template.pdf')
  ];
  
  for (const templatePath of possiblePaths) {
    if (fs.existsSync(templatePath)) {
      return templatePath;
    }
  }
  return null;
}

// Find font paths
function findFontPaths() {
  const possibleTextPaths = [
    path.join(__dirname, 'fonts', 'Fontspring-DEMO-allroundgothic-text.otf'),
    path.join(process.cwd(), 'backend', 'fonts', 'Fontspring-DEMO-allroundgothic-text.otf'),
    path.join(process.cwd(), 'fonts', 'Fontspring-DEMO-allroundgothic-text.otf')
  ];
  
  const possibleDemiPaths = [
    path.join(__dirname, 'fonts', 'Fontspring-DEMO-allroundgothic-demi.otf'),
    path.join(process.cwd(), 'backend', 'fonts', 'Fontspring-DEMO-allroundgothic-demi.otf'),
    path.join(process.cwd(), 'fonts', 'Fontspring-DEMO-allroundgothic-demi.otf')
  ];
  
  let textFontPath = null;
  let demiFontPath = null;
  
  for (const possiblePath of possibleTextPaths) {
    if (fs.existsSync(possiblePath)) {
      textFontPath = possiblePath;
      break;
    }
  }
  
  for (const possiblePath of possibleDemiPaths) {
    if (fs.existsSync(possiblePath)) {
      demiFontPath = possiblePath;
      break;
    }
  }
  
  return { textFontPath, demiFontPath };
}

export async function generatePDF(data) {
  try {
    // Find template PDF
    const templatePath = findTemplatePath();
    if (!templatePath) {
      throw new Error('Template PDF not found');
    }
    
    // Load template PDF
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Register fontkit for custom font embedding
    pdfDoc.registerFontkit(fontkit);
    
    // Get the first page (template should have one page)
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { width, height } = page.getSize();
    
    // Find and embed fonts
    const { textFontPath, demiFontPath } = findFontPaths();
    let textFont, demiFont;
    
    if (textFontPath && demiFontPath) {
      const textFontBytes = fs.readFileSync(textFontPath);
      const demiFontBytes = fs.readFileSync(demiFontPath);
      textFont = await pdfDoc.embedFont(textFontBytes);
      demiFont = await pdfDoc.embedFont(demiFontBytes);
    }
    
    // Generate barcode
    const skuString = String(data.sku);
    let barcodeBuffer;
    
    try {
      const bufferResult = bwipjs.toBuffer({
        bcid: 'code128',
        text: skuString,
        scale: 2,
        height: 40,
        includetext: false,
        textxalign: 'center',
      });
      barcodeBuffer = bufferResult instanceof Promise ? await bufferResult : bufferResult;
    } catch (barcodeError) {
      console.error('Barcode generation error:', barcodeError);
      try {
        const fallbackResult = bwipjs.toBuffer({
          bcid: 'code128',
          text: skuString,
          scale: 1.5,
          height: 38,
          includetext: false,
        });
        barcodeBuffer = fallbackResult instanceof Promise ? await fallbackResult : fallbackResult;
      } catch (fallbackError) {
        console.error('Barcode generation fallback error:', fallbackError);
        const lastResortResult = bwipjs.toBuffer({
          bcid: 'code128',
          text: skuString,
          scale: 1,
          height: 35,
          includetext: false,
        });
        barcodeBuffer = lastResortResult instanceof Promise ? await lastResortResult : lastResortResult;
      }
    }
    
    if (!barcodeBuffer || !Buffer.isBuffer(barcodeBuffer)) {
      throw new Error('Failed to generate barcode buffer');
    }
    
    // Embed barcode image
    const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);
    
    // Use fonts or fallback to Helvetica
    const regularFont = textFont || (await pdfDoc.embedFont('Helvetica'));
    const boldFont = demiFont || (await pdfDoc.embedFont('Helvetica-Bold'));
    
    // Overlay content on template
    // Position content based on template layout
    // PDF coordinates start from bottom-left, so we work from top down
    // Start much lower on the page
    let yPos = height - 150; // Start much lower from top
    
    // Left margin for left-aligned content (moved a bit to the left)
    const leftMargin = 20;
    
    // Product Name at the top (left-aligned)
    if (data.productName) {
      page.drawText(data.productName, {
        x: leftMargin,
        y: yPos,
        size: 18,
        font: regularFont, // Changed from boldFont to regularFont
        color: rgb(0, 0, 0),
      });
      yPos -= 45; // Increased spacing before price (from 30 to 45)
    }
    
    // Price (right after product name, left-aligned)
    if (data.price) {
      let priceValue = parseFloat(data.price);
      if (isNaN(priceValue)) {
        priceValue = parseFloat(data.price.replace(/[^\d.]/g, '')) || 0;
      }
      const formattedPrice = priceValue.toFixed(2);
      
      let priceText;
      if (data.currency === 'euro') {
        priceText = `€${formattedPrice}`;
      } else {
        priceText = `${formattedPrice} den`;
      }
      
      page.drawText(priceText, {
        x: leftMargin,
        y: yPos,
        size: 36, // Increased from 28
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPos -= 40;
    }
    
    // Size (before ID fields, no top spacing)
    if (data.size) {
      page.drawText(data.size, {
        x: leftMargin,
        y: yPos,
        size: 12, // Increased from 11
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 17;
    }
    
    // ID fields (after size, left-aligned)
    if (data.id1) {
      page.drawText(data.id1, {
        x: leftMargin,
        y: yPos,
        size: 12, // Increased from 11
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 14;
    }
    
    if (data.id2) {
      page.drawText(data.id2, {
        x: leftMargin,
        y: yPos,
        size: 12, // Increased from 11
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 14;
    }
    
    if (data.id3) {
      page.drawText(data.id3, {
        x: leftMargin,
        y: yPos,
        size: 12, // Increased from 11
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 14;
    }
    
    // Barcode (smaller size, positioned even lower and more to the right)
    yPos -= 55; // Move barcode even lower (increased from 30)
    const barcodeWidth = 120; // Reduced from 160
    const barcodeHeight = 30; // Reduced from 40
    const barcodeX = width - barcodeWidth - 20; // Position more to the right (20px from right edge)
    
    page.drawImage(barcodeImage, {
      x: barcodeX,
      y: yPos - barcodeHeight,
      width: barcodeWidth,
      height: barcodeHeight,
    });
    
    // SKU number below barcode (right-aligned to match barcode)
    yPos -= 45; // Increased spacing above SKU (from 40 to 45)
    const skuTextWidth = regularFont.widthOfTextAtSize(skuString, 11); // Increased from 9 to 11
    page.drawText(skuString, {
      x: barcodeX + (barcodeWidth - skuTextWidth) / 2, // Center under barcode
      y: yPos,
      size: 11, // Increased from 9 to 11
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
