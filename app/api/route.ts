import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCertificate(fullName: string) {
  const templatePath = path.join(process.cwd(), 'public', 'Certification.png');
  const templateBytes = fs.readFileSync(templatePath);
  
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(templateBytes);
  const page = pdfDoc.addPage([pngImage.width, pngImage.height]);

  // Draw template image
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: pngImage.width,
    height: pngImage.height,
  });

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  // Center text function
  const centerText = (text: string, fontSize: number, yPosition: number) => {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    return {
      x: (pageWidth - textWidth) / 2,
      y: yPosition,
      size: fontSize,
    };
  };

  // Calculate vertical positions
  const baseY = pageHeight / 2;
  const lineSpacing = 40;

  // Full Name (centered)
  const namePosition = centerText(fullName, 52, baseY + lineSpacing+68);
  page.drawText(fullName, {
    ...namePosition,
    font,
    color: rgb(0, 0, 0),
  });

  // Date (centered below name)
  const date = new Date().toLocaleDateString();
  const datePosition = centerText(date, 34, baseY - lineSpacing - 220);
  page.drawText(date, {
    ...datePosition,
    font,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fullName = formData.get('fullName')?.toString() || '';
    const email = formData.get('email')?.toString() || '';

    // Validate input
    if (!fullName || !email) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate PDF
    const pdfBytes = await createCertificate(fullName);

    try {
      // Always create a new record, ignoring uniqueness constraints
      await prisma.certificate.create({
        data: {
          fullName,
          email,
          date: new Date(),
        },
      });
    } catch (dbError) {
      // Log database error but continue with PDF generation
      console.error('Database error (continuing anyway):', dbError);
    }

    // Return PDF regardless of database operation success
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=certificate.pdf'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate certificate' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}