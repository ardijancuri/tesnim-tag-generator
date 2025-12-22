import { generatePDF } from '../backend/pdfGenerator.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productName, id1, id2, id3, size, price, currency, sku } = req.body;

    if (!productName || !sku) {
      return res.status(400).json({ error: 'Product name and SKU are required' });
    }

    const pdfBuffer = await generatePDF({
      productName,
      id1: id1 || '',
      id2: id2 || '',
      id3: id3 || '',
      size: size || '',
      price: price || '',
      currency: currency || 'den',
      sku: sku
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tesnim-tag-${sku}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

