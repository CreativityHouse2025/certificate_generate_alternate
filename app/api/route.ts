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
  const namePosition = centerText(fullName, 36, baseY + lineSpacing+65);
  page.drawText(fullName, {
    ...namePosition,
    font,
    color: rgb(0, 0, 0),
  });

  // Date (centered below name)
  const date = new Date().toLocaleDateString();
  const datePosition = centerText(date, 24, baseY - lineSpacing - 220);
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

    // Save to Neon Database
    await prisma.certificate.create({
      data: {
        fullName,
        email,
        date: new Date(),
      },
    });

    // Return PDF
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=certificate.pdf'
      }
    });

  } catch (error:  Error | unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error && 'code' in error && error.code === 'P2002'
      ? 'Email already exists in our database'
      : 'Failed to generate certificate';
      
    return new NextResponse(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}