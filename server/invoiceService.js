import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { runQuery, getQuery } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const s3Endpoint = process.env.S3_ENDPOINT || 'http://minio:9000';
const s3Client = new S3Client({
  endpoint: s3Endpoint,
  forcePathStyle: true,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minio_admin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minio_secure_password_local_123'
  }
});
const s3BucketMedia = process.env.S3_BUCKET_MEDIA || 'media';

export async function generateAndUploadInvoice(brandId, amount, vatAmount, status, description) {
  // 1. Resolve Biller and Brand details
  const defaultBiller = {
    displayName: 'Strictly Coffee',
    billingAddress: 'Strictly Coffee HQ, Brusselstraat 45, 1000 Brussels, Belgium',
    vatNumber: 'BE 0741.852.963',
    supportEmail: 'billing@stricktlycoffee.be'
  };

  let biller = { ...defaultBiller };
  const brand = await getQuery('SELECT name, contact_email, agency_id, billing_name, billing_address, billing_vat FROM brands WHERE id = $1', [brandId]);
  if (brand && brand.agency_id) {
    const agency = await getQuery('SELECT is_platform_biller, billing_name, billing_address, billing_vat, billing_support_email FROM agencies WHERE id = $1', [brand.agency_id]);
    if (agency && (agency.is_platform_biller === 1 || agency.is_platform_biller === true)) {
      biller = {
        displayName: agency.billing_name || agency.billing_display_name || 'Strictly Coffee Partner',
        billingAddress: agency.billing_address || 'Billing Partner Address',
        vatNumber: agency.billing_vat || 'N/A',
        supportEmail: agency.billing_support_email || 'billing@stricktlycoffee.be'
      };
    }
  }

  // 2. Generate INV ID (e.g. INV-YYYY-RANDOM)
  const dateObj = new Date();
  const year = dateObj.getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceId = `INV-${year}-${randomSuffix}`;

  // Ensure temp directory exists
  const tempDir = path.resolve(__dirname, './temp_pdfs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const localPdfPath = path.join(tempDir, `${invoiceId}.pdf`);

  // 3. Render PDF Invoice
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const writeStream = fs.createWriteStream(localPdfPath);
  doc.pipe(writeStream);

  // Logo / Header (Black / Gold Banner)
  doc.fillColor('#111111').rect(0, 0, 595.28, 120).fill();
  doc.fillColor('#c5a059').fontSize(22).font('Helvetica-Bold').text(biller.displayName.toUpperCase(), 50, 45, { tracking: 1 });
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica').text('INVOICE / RECEIPT STATEMENT', 50, 75);

  // Invoice Meta (top-right overlay)
  doc.fillColor('#c5a059').fontSize(14).font('Helvetica-Bold').text('INVOICE', 400, 35, { align: 'right' });
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica').text(`ID: ${invoiceId}`, 400, 55, { align: 'right' });
  doc.text(`Date: ${dateObj.toISOString().split('T')[0]}`, 400, 70, { align: 'right' });
  doc.text(`Status: ${status.toUpperCase()}`, 400, 85, { align: 'right' });

  // Grid Divider
  doc.fillColor('#c5a059').rect(50, 150, 495, 3).fill();

  // Biller details (Left column)
  doc.fillColor('#111111').fontSize(10).font('Helvetica-Bold').text('FROM:', 50, 170);
  doc.font('Helvetica').text(biller.displayName, 50, 185);
  doc.fontSize(9).fillColor('#444444').text(biller.billingAddress, 50, 200, { width: 220, lineGap: 3 });
  doc.text(`VAT: ${biller.vatNumber}`, 50, 240);
  doc.text(`Contact: ${biller.supportEmail}`, 50, 255);

  // Brand client details (Right column)
  doc.fillColor('#111111').fontSize(10).font('Helvetica-Bold').text('BILL TO:', 320, 170);
  const brandBillingName = (brand && brand.billing_name) ? brand.billing_name : (brand ? brand.name : brandId);
  doc.font('Helvetica').text(brandBillingName, 320, 185);
  
  let addressY = 200;
  if (brand && brand.billing_address) {
    doc.fontSize(9).fillColor('#444444').text(brand.billing_address, 320, addressY, { width: 220, lineGap: 3 });
    addressY += 35;
  } else {
    doc.fontSize(9).fillColor('#444444').text(`Account ID: ${brandId}`, 320, addressY);
    addressY += 15;
  }
  
  if (brand && brand.billing_vat) {
    doc.text(`VAT: ${brand.billing_vat}`, 320, addressY);
    addressY += 15;
  }
  if (brand && brand.contact_email) {
    doc.text(`Email: ${brand.contact_email}`, 320, addressY);
  }

  // Items table header
  let y = 300;
  doc.fillColor('#111111').rect(50, y, 495, 20).fill();
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('DESCRIPTION', 60, y + 6);
  doc.text('NET RATE', 340, y + 6, { width: 80, align: 'right' });
  doc.text('VAT', 430, y + 6, { width: 50, align: 'right' });
  doc.text('TOTAL', 490, y + 6, { width: 50, align: 'right' });

  // Items table row
  y += 20;
  doc.fillColor('#f9f9f9').rect(50, y, 495, 35).fill();
  doc.fillColor('#111111').fontSize(9).font('Helvetica').text(description || 'Platform Subscription Service', 60, y + 12, { width: 260 });
  
  const totalAmount = parseFloat(amount) || 0;
  const vatValue = parseFloat(vatAmount) || 0;
  const subtotal = totalAmount - vatValue;

  doc.text(`€${subtotal.toFixed(2)}`, 340, y + 12, { width: 80, align: 'right' });
  doc.text(`€${vatValue.toFixed(2)}`, 430, y + 12, { width: 50, align: 'right' });
  doc.text(`€${totalAmount.toFixed(2)}`, 490, y + 12, { width: 50, align: 'right' });

  // Totals calculations box
  y += 55;
  doc.fillColor('#444444').fontSize(9).font('Helvetica').text('Subtotal:', 380, y);
  doc.fillColor('#111111').text(`€${subtotal.toFixed(2)}`, 480, y, { align: 'right', width: 60 });

  y += 15;
  doc.fillColor('#444444').text('VAT (Estimated):', 380, y);
  doc.fillColor('#111111').text(`€${vatValue.toFixed(2)}`, 480, y, { align: 'right', width: 60 });

  y += 20;
  doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text('Grand Total:', 380, y);
  doc.text(`€${totalAmount.toFixed(2)}`, 480, y, { align: 'right', width: 60 });

  // Footer / Terms
  y = 650;
  doc.fillColor('#c5a059').rect(50, y, 495, 1).fill();
  doc.fillColor('#888888').fontSize(8).font('Helvetica').text('Thank you for choosing Strictly Coffee platform.', 50, y + 15, { align: 'center', width: 495 });
  doc.text(`This statement is officially white-labeled by ${biller.displayName}. For billing support, write to ${biller.supportEmail}`, 50, y + 30, { align: 'center', width: 495 });

  doc.end();

  // 4. Wait for write stream to finish
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  // 5. Upload to S3
  const targetS3Key = `invoices/${invoiceId}.pdf`;
  const fileStream = fs.createReadStream(localPdfPath);
  
  await s3Client.send(new PutObjectCommand({
    Bucket: s3BucketMedia,
    Key: targetS3Key,
    Body: fileStream,
    ContentType: 'application/pdf'
  }));

  // Clean up temp file
  try {
    fs.unlinkSync(localPdfPath);
  } catch (err) {
    console.error('[Invoice S3 Clean Temp Error]', err.message);
  }

  // 6. Save invoice in database
  const s3Url = `/media/${targetS3Key}`; // MinIO media proxy path prefix
  await runQuery(`
    INSERT INTO invoices (id, brand_id, amount, vat_amount, status, pdf_url, description, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `, [invoiceId, brandId, totalAmount, vatValue, status, s3Url, description]);

  console.log(`[Invoice Generator] Created S3 invoice successfully: ${invoiceId} for brand ${brandId}. URL: ${s3Url}`);

  // 7. Send invoice statement notice email to the client
  try {
    const subject = `📄 New Billing Statement Available: ${invoiceId}`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #c5a059; margin-top: 0; border-bottom: 2px solid #c5a059; padding-bottom: 10px; font-family: sans-serif;">Billing Statement Issued</h2>
        <p>Hello team,</p>
        <p>A new billing statement has been issued for your storefront account:</p>
        <div style="background: #f9f9f9; padding: 12px; margin: 16px 0; border-radius: 4px; border: 1px solid #eee;">
          <strong>Statement ID:</strong> ${invoiceId}<br/>
          <strong>Description:</strong> ${description || 'Platform Subscription Service'}<br/>
          <strong>Total Amount:</strong> €${totalAmount.toFixed(2)}<br/>
          <strong>Payment Status:</strong> <strong style="color: ${status === 'paid' ? '#10b981' : '#f59e0b'};">${status.toUpperCase()}</strong>
        </div>
        <p>You can view and inspect the official invoice statement PDF by clicking the button below:</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="https://dash.stricktlycoffee.be" style="background: #c5a059; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Go to Settings & Billing</a>
        </div>
        <p style="color: #777; font-size: 0.85rem;">If you have any questions or require assistance, please contact support at <strong>${biller.supportEmail}</strong>.</p>
      </div>
    `;
    await sendPlatformBillingEmail(brandId, subject, emailHtml);
  } catch (mailErr) {
    console.error('[Invoice Service] Failed to send email notification:', mailErr.message);
  }

  return { invoiceId, pdfUrl: s3Url };
}

async function sendPlatformBillingEmail(brandId, subject, bodyHtml) {
  // 1. Resolve biller
  const defaultBiller = {
    displayName: 'Strictly Coffee',
    billingAddress: 'Strictly Coffee HQ, Brusselstraat 45, 1000 Brussels, Belgium',
    vatNumber: 'BE 0741.852.963',
    supportEmail: 'billing@stricktlycoffee.be'
  };

  let biller = { ...defaultBiller };
  const brand = await getQuery('SELECT name, contact_email, agency_id FROM brands WHERE id = $1', [brandId]);
  let toEmail = brand && brand.contact_email ? brand.contact_email : 'billing@stricktlycoffee.be';

  if (brand && brand.agency_id) {
    const agency = await getQuery('SELECT is_platform_biller, billing_name, billing_address, billing_vat, billing_support_email FROM agencies WHERE id = $1', [brand.agency_id]);
    if (agency && (agency.is_platform_biller === 1 || agency.is_platform_biller === true)) {
      biller = {
        displayName: agency.billing_name || agency.billing_display_name || 'Strictly Coffee Partner',
        billingAddress: agency.billing_address || 'Billing Partner Address',
        vatNumber: agency.billing_vat || 'N/A',
        supportEmail: agency.billing_support_email || 'billing@stricktlycoffee.be'
      };
    }
  }

  // 2. Append footer
  const footerHtml = `
    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 0.8rem; color: #666; font-family: sans-serif;">
      <p style="margin: 0 0 5px 0;"><strong>Billing Agent:</strong> ${biller.displayName}</p>
      ${biller.billingAddress ? `<p style="margin: 0 0 5px 0;"><strong>Address:</strong> ${biller.billingAddress.replace(/\n/g, '<br/>')}</p>` : ''}
      ${biller.vatNumber ? `<p style="margin: 0 0 5px 0;"><strong>VAT / TAX ID:</strong> ${biller.vatNumber}</p>` : ''}
      <p style="margin: 0;">For support adjustments, contact: <a href="mailto:${biller.supportEmail}">${biller.supportEmail}</a></p>
    </div>
  `;

  if (bodyHtml.includes('</div>')) {
    const lastIndex = bodyHtml.lastIndexOf('</div>');
    bodyHtml = bodyHtml.substring(0, lastIndex) + footerHtml + bodyHtml.substring(lastIndex);
  } else {
    bodyHtml += footerHtml;
  }

  // 3. Send SMTP
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  const fromHeader = `"${biller.displayName}" <${biller.supportEmail}>`;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from: fromHeader,
        replyTo: biller.supportEmail,
        to: toEmail,
        subject,
        html: bodyHtml
      });
      console.log(`[Invoice Mailer] Email sent successfully to ${toEmail}`);
    } catch (err) {
      console.error(`[Invoice Mailer] Failed to deliver email to ${toEmail}:`, err.message);
    }
  } else {
    console.log(`[Invoice Mailer Simulator] SMTP unconfigured. Simulated email to ${toEmail}:
    From: "${fromHeader}"
    Subject: "${subject}"`);
  }
}
