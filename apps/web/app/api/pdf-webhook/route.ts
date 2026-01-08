/**
 * Example: PDF Generation from Webhook Data
 *
 * This is a reference implementation showing how to generate PDFs
 * from your survey responses.
 *
 * To use this in production:
 * 1. Install a PDF library: pnpm add pdf-lib
 * 2. Replace the test-webhook route with this implementation
 * 3. Add your document templates
 */
import { NextResponse } from "next/server";

// import { PDFDocument, rgb } from 'pdf-lib'; // Uncomment when you install pdf-lib

interface SurveyResponse {
  webhookId?: string;
  event?: string;
  data?: {
    id: string;
    surveyId: string;
    finished: boolean;
    data: Record<string, any>;
    variables: Record<string, any>;
    survey?: {
      title: string;
      type: string;
      status: string;
    };
  };
}

/**
 * Generate PDF based on survey response
 */
async function generatePDF(responseData: Record<string, any>, variables: Record<string, any>) {
  // EXAMPLE: Simple PDF generation logic
  // In production, you'd use pdf-lib, pdfkit, or puppeteer

  console.log("\n🎨 Generating PDF...");
  console.log("Response Data:", responseData);
  console.log("Variables:", variables);

  // Example: Select template based on survey data
  let templateName = "default-template";

  if (responseData.document_type === "lease") {
    templateName = "lease-agreement-template";
  } else if (responseData.document_type === "employment") {
    templateName = "employment-contract-template";
  }

  console.log(`📄 Using template: ${templateName}`);

  // Example: Map data to template fields
  const documentData = {
    // Direct form responses (from data)
    employeeName: responseData.employee_name || "N/A",
    jobTitle: responseData.job_title || "N/A",
    startDate: responseData.start_date || "N/A",
    rentOwed: responseData.rent_owed || "N/A",
    propertyAddress: responseData.property_address || "N/A",

    // Calculated values (from variables)
    totalCompensation: variables.total_compensation || 0,
    lateFees: variables.late_fees || 0,

    // Metadata
    generatedAt: new Date().toISOString(),
    documentId: `DOC-${Date.now()}`,
  };

  console.log("\n📋 Document Data:", documentData);

  /*
  // UNCOMMENT THIS WHEN YOU INSTALL pdf-lib
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  
  page.drawText(`Employee Name: ${documentData.employeeName}`, {
    x: 50,
    y: 750,
    size: 12,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Job Title: ${documentData.jobTitle}`, {
    x: 50,
    y: 730,
    size: 12,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Total Compensation: $${documentData.totalCompensation}`, {
    x: 50,
    y: 710,
    size: 12,
    color: rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdfDoc.save();
  
  return pdfBytes;
  */

  // For now, return mock PDF data
  return Buffer.from("Mock PDF data - install pdf-lib to generate real PDFs");
}

/**
 * HTML Template approach (alternative to PDF library)
 */
function generateHTMLDocument(responseData: Record<string, any>, variables: Record<string, any>): string {
  // Simple HTML template with placeholders
  const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Generated Document</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .field {
      margin: 15px 0;
      padding: 10px;
      background: #f5f5f5;
      border-left: 4px solid #007bff;
    }
    .label {
      font-weight: bold;
      color: #333;
    }
    .value {
      color: #666;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Document Generated from Survey Response</h1>
    <p>Generated on: ${new Date().toLocaleDateString()}</p>
  </div>
  
  <div class="field">
    <span class="label">Employee Name:</span>
    <span class="value">{{employee_name}}</span>
  </div>
  
  <div class="field">
    <span class="label">Job Title:</span>
    <span class="value">{{job_title}}</span>
  </div>
  
  <div class="field">
    <span class="label">Rent Owed:</span>
    <span class="value">${{ rent_owed }}</span>
  </div>
  
  <div class="field">
    <span class="label">Total Compensation:</span>
    <span class="value">${{ total_compensation }}</span>
  </div>
  
  <div class="field">
    <span class="label">Late Fees:</span>
    <span class="value">${{ late_fees }}</span>
  </div>
</body>
</html>
  `;

  // Replace placeholders with actual values
  let filledTemplate = htmlTemplate;

  // Replace data fields
  Object.entries(responseData).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    filledTemplate = filledTemplate.replace(placeholder, String(value || "N/A"));
  });

  // Replace variable fields
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    filledTemplate = filledTemplate.replace(placeholder, String(value || "N/A"));
  });

  return filledTemplate;
}

export async function POST(request: Request) {
  try {
    const payload: SurveyResponse = await request.json();

    console.log("\n==============================================");
    console.log("📥 WEBHOOK RECEIVED - PDF GENERATION MODE");
    console.log("==============================================");
    console.log("Timestamp:", new Date().toISOString());

    const { data } = payload;

    if (!data) {
      return NextResponse.json({ success: false, error: "No data in webhook payload" }, { status: 400 });
    }

    // Only generate PDF if response is finished
    if (!data.finished) {
      console.log("⏸️  Response not finished yet, skipping PDF generation");
      return NextResponse.json({
        success: true,
        message: "Response not finished, PDF generation skipped",
      });
    }

    console.log("\n📝 Survey Response Data:");
    console.log("Response ID:", data.id);
    console.log("Survey ID:", data.surveyId);
    console.log("\nForm Data:", JSON.stringify(data.data, null, 2));
    console.log("\nVariables:", JSON.stringify(data.variables, null, 2));

    // Generate PDF
    const pdfBuffer = await generatePDF(data.data, data.variables);

    // Generate HTML (alternative)
    const htmlDocument = generateHTMLDocument(data.data, data.variables);

    console.log("\n✅ PDF generated successfully!");
    console.log("PDF size:", pdfBuffer.length, "bytes");

    console.log("\n📄 HTML Document Preview (first 500 chars):");
    console.log(htmlDocument.substring(0, 500) + "...");

    console.log("\n==============================================\n");

    // Return options:

    // Option 1: Return PDF as download
    // return new NextResponse(pdfBuffer, {
    //   headers: {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': `attachment; filename="document-${data.id}.pdf"`,
    //   },
    // });

    // Option 2: Return HTML
    // return new NextResponse(htmlDocument, {
    //   headers: { 'Content-Type': 'text/html' },
    // });

    // Option 3: Return JSON confirmation (for testing)
    return NextResponse.json({
      success: true,
      message: "PDF generated successfully!",
      documentInfo: {
        responseId: data.id,
        surveyId: data.surveyId,
        pdfSize: pdfBuffer.length,
        htmlSize: htmlDocument.length,
        generatedAt: new Date().toISOString(),
      },
      // You could also save to S3, send via email, etc.
      nextSteps: [
        "Save PDF to file system",
        "Upload to S3/cloud storage",
        "Send via email",
        "Store in database",
      ],
    });
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PDF Generation Webhook Endpoint",
    instructions: [
      "This endpoint receives survey responses and generates PDFs",
      "To use: Configure webhook in Formbricks with URL: http://localhost:3000/api/pdf-webhook",
      "The PDF will be generated when a response is finished",
    ],
    libraries: {
      recommended: [
        "pdf-lib - Create and modify PDFs",
        "pdfkit - Generate PDFs from scratch",
        "@react-pdf/renderer - React components to PDF",
        "puppeteer - HTML/CSS to PDF (requires Chrome)",
      ],
      install: "pnpm add pdf-lib",
    },
  });
}
