import express from 'express';
import cors from 'cors';
import { generatePDF } from './pdfGenerator.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/api/generate-pdf', async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

