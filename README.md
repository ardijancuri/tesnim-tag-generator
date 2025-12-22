# TESNIM Tag Generator

A web application for generating price tags with barcodes for TESNIM products.

## Features

- React frontend with Tailwind CSS
- Express backend for PDF generation
- Barcode generation (supports EAN13, EAN12, EAN8, CODE128)
- Professional tag design matching TESNIM branding

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

**Note for Windows users:** The `canvas` package requires native dependencies. You may need:
- Python 3.x
- Visual Studio Build Tools (or Visual Studio with C++ workload)
- Run PowerShell as Administrator if you encounter permission issues

Alternatively, you can try installing canvas with:
```bash
npm install --global windows-build-tools
```

## Setup

1. Install all dependencies:
```bash
npm run install:all
```

If you encounter issues with the canvas package on Windows, you can install it separately:
```bash
cd backend
npm install canvas --build-from-source
```

2. Download Inter font files (optional but recommended):
```bash
cd backend
npm run download-fonts
```

If the automatic download doesn't work, you can manually download Inter font from:
- https://fonts.google.com/specimen/Inter
- Or https://github.com/rsms/inter/releases

Place `Inter-Regular.ttf` and `Inter-Bold.ttf` in the `backend/fonts/` directory.
The app will fall back to Helvetica if Inter fonts are not available.

3. Start the development servers:
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

## Usage

1. Fill in the form fields:
   - **Product Name** (required) - e.g., "Pasqyrë 'Aurora'"
   - **ID 1, ID 2, ID 3** (optional) - Product identifiers
   - **Size** (optional) - e.g., "40×60 cm"
   - **Price** (optional) - e.g., "6250.00"
   - **Currency** - Choose between "Denar (den)" or "Euro (€)"
   - **SKU** (required) - For barcode generation, e.g., "5312345678901"

2. Click "Generate PDF Tag" to download the PDF

The generated PDF will match the TESNIM tag design with:
- TESNIM HOME header (centered, with line break below)
- All text content centered horizontally
- Product information
- Large price display (with selected currency: € for Euro, "den" for Denar)
- Barcode with SKU number
- TESNIM footer
- Inter font (or Helvetica fallback if Inter not available)

## Technologies

- React 18
- Vite
- Tailwind CSS
- Express.js
- PDFKit
- JsBarcode
- Canvas (for barcode rendering)

