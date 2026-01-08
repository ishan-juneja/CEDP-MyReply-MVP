import * as fs from "fs";
import { NextResponse } from "next/server";
import * as path from "path";

/**
 * Webhook Endpoint with PDF Generation
 *
 * This endpoint receives webhook data from Formbricks surveys, logs it,
 * and automatically generates a legal PDF document.
 *
 * To use:
 * 1. Run your dev server: pnpm dev
 * 2. In Formbricks, go to Survey Summary → Settings → Webhooks
 * 3. Add webhook URL: http://localhost:3000/api/test-webhook
 * 4. Select trigger: "Response Finished"
 * 5. Complete your survey to test
 *
 * For testing with external tools (like ngrok):
 * 1. Install ngrok: https://ngrok.com/
 * 2. Run: ngrok http 3000
 * 3. Use the ngrok URL + /api/test-webhook as your webhook
 */

/**
 * Map survey field IDs to meaningful names
 * Based on actual legal document survey questions
 *
 * ⚠️  UPDATE THESE MAPPINGS FOR YOUR NEW SURVEY!
 * The webhook will log all field IDs - update this mapping accordingly
 */
const FIELD_MAPPING = {
  // Q1: Colorado residency
  q8hh9qo5haoqb77rzaz39tlx: "colorado_resident",

  // Q2: Did you get a document?
  g0rznhregilhqyvdoql0lwch: "received_document",

  // Q3: Does document say how much rent you owe?
  lheuvt5sqf2ve7ecje5j1y75: "document_shows_rent",

  // Q4: How much rent does it say you owe? ($)
  mc1hy9spsn94biuli05mjyqm: "rent_amount",

  // Q5: Does it include fees or charges other than rent?
  bnk4m5hoymnccbomi87xoqx9: "includes_additional_fees",

  // Q6: What kind of fees or charges?
  j4iq8dup6oeicfuy46gkend9: "fee_types",

  // Q7: How much does it say you owe in late fees?
  cwn6dn914d0yy73vlzj5yme5: "late_fee_amount",

  // Additional Yes/No questions
  d9y72qc9dk9xofy9f2ss7reo: "question_field_1",
  lol3pt9swr4hacc7pa84hqmt: "question_field_2",
  sg2fkh9pt91whlue7k5jrvpb: "question_field_3",
  tys8w6kwvph8bptjla9m1ezp: "question_field_4",
  v6ttj561jhguopmn3icohlcc: "question_field_5",
  vouisdfu0gnbg5y56br38t3a: "question_field_6",
  zbahv56ehoblvzs8s5ssud80: "question_field_7",
};

/**
 * Process webhook data and generate document data
 */
function processWebhookData(webhookPayload: any) {
  const responseData = webhookPayload.data?.data || {};
  const meta = webhookPayload.data?.meta || {};
  const survey = webhookPayload.data?.survey || {};

  // Log raw response data to see actual field IDs
  console.log("\n🔍 Raw Response Data:");
  console.log(JSON.stringify(responseData, null, 2));

  // Map raw field IDs to meaningful names
  const mappedData: Record<string, any> = {};
  Object.entries(responseData).forEach(([fieldId, value]) => {
    const mappedName = FIELD_MAPPING[fieldId as keyof typeof FIELD_MAPPING] || fieldId;
    mappedData[mappedName] = value;
    console.log(`📌 Mapped: ${fieldId} -> ${mappedName} = ${value}`);
  });

  // Parse dollar amounts
  const rentAmount = mappedData.rent_amount ? parseFloat(String(mappedData.rent_amount)) : null;
  const lateFeeAmount = mappedData.late_fee_amount ? parseFloat(String(mappedData.late_fee_amount)) : null;
  const totalAmount = (rentAmount || 0) + (lateFeeAmount || 0);

  // Format currency
  const formatCurrency = (amount: number | null) =>
    amount !== null
      ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "N/A";

  // Generate document data
  const documentData = {
    // Document metadata
    document_id: webhookPayload.data?.id?.substring(0, 12).toUpperCase() || "UNKNOWN",
    generated_date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    generated_time: new Date().toLocaleTimeString("en-US"),
    response_id: webhookPayload.data?.id || "N/A",

    // Tenant information
    tenant_status: mappedData.colorado_resident === "Yes" ? "Colorado Resident" : "Out-of-State Resident",
    residency_confirmed: mappedData.colorado_resident === "Yes" ? "✓ Confirmed" : "Not Confirmed",

    // Document received status
    received_document: mappedData.received_document === "Yes" ? "Yes" : "No",
    document_shows_rent: mappedData.document_shows_rent === "Yes" ? "Yes" : "No",

    // Financial information
    rent_amount: formatCurrency(rentAmount),
    late_fee_amount: formatCurrency(lateFeeAmount),
    total_amount_owed: formatCurrency(totalAmount),

    // Fees information
    includes_additional_fees: mappedData.includes_additional_fees === "Yes" ? "Yes" : "No",
    fee_types: mappedData.fee_types || "None specified",

    // Survey responses as checkboxes (for display purposes)
    checkbox_1: mappedData.question_field_1 === "Yes" ? "checked" : "",
    checkbox_2: mappedData.question_field_2 === "Yes" ? "checked" : "",
    checkbox_3: mappedData.question_field_3 === "Yes" ? "checked" : "",
    checkbox_4: mappedData.question_field_4 === "Yes" ? "checked" : "",
    checkbox_5: mappedData.question_field_5 === "Yes" ? "checked" : "",
    checkbox_6: mappedData.question_field_6 === "Yes" ? "checked" : "",
    checkbox_7: mappedData.question_field_7 === "Yes" ? "checked" : "",

    // Count of acknowledgments
    acknowledgments_count: Object.values(mappedData).filter((v) => v === "Yes").length,
    acknowledgments_total: Object.keys(FIELD_MAPPING).length,

    // Special conditions paragraph
    special_conditions: generateSpecialConditions(mappedData),

    // All responses - formatted for display
    all_responses: JSON.stringify(responseData, null, 2),

    // Survey metadata
    survey_title: survey.title || "Unknown Survey",
    survey_type: survey.type || "N/A",
    survey_status: survey.status || "N/A",
    device_info: meta.userAgent
      ? `${meta.userAgent.browser} on ${meta.userAgent.os} (${meta.userAgent.device})`
      : "Unknown",
    completion_url: meta.url || "N/A",
  };

  return documentData;
}

/**
 * Generate special conditions text based on survey responses
 */
function generateSpecialConditions(mappedData: Record<string, any>): string {
  const conditions: string[] = [];

  // Document receipt status
  if (mappedData.received_document === "Yes") {
    conditions.push(`The respondent has confirmed receipt of a legal document.`);
  } else {
    conditions.push(`The respondent has not received a legal document.`);
  }

  // Financial information
  const rentAmount = mappedData.rent_amount ? parseFloat(String(mappedData.rent_amount)) : null;
  const lateFeeAmount = mappedData.late_fee_amount ? parseFloat(String(mappedData.late_fee_amount)) : null;

  if (mappedData.document_shows_rent === "Yes" && rentAmount !== null) {
    conditions.push(`The document indicates a rent amount of $${rentAmount.toFixed(2)}.`);
  }

  if (mappedData.includes_additional_fees === "Yes") {
    conditions.push(`Additional fees and charges are indicated in the document.`);
    if (mappedData.fee_types) {
      conditions.push(`Fee type(s): ${mappedData.fee_types}.`);
    }
    if (lateFeeAmount !== null) {
      conditions.push(`Late fees totaling $${lateFeeAmount.toFixed(2)} are specified.`);
    }
  }

  // Total amount calculation
  if (rentAmount !== null || lateFeeAmount !== null) {
    const total = (rentAmount || 0) + (lateFeeAmount || 0);
    conditions.push(`Total amount claimed in document: $${total.toFixed(2)}.`);
  }

  // Residency status
  if (mappedData.colorado_resident === "Yes") {
    conditions.push(`Respondent is a Colorado resident.`);
  } else if (mappedData.colorado_resident === "No") {
    conditions.push(`Respondent is not a Colorado resident.`);
  }

  return conditions.join(" ");
}

/**
 * Populate HTML template with data
 */
function populateTemplate(templateHtml: string, data: Record<string, any>): string {
  let populated = templateHtml;

  // Replace all {{placeholder}} with actual values
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    populated = populated.replace(placeholder, String(value || "N/A"));
  });

  return populated;
}

export async function POST(request: Request) {
  try {
    // Parse the incoming webhook payload
    const payload = await request.json();

    // Handle test endpoint ping from Formbricks
    if (payload.event === "testEndpoint") {
      console.log("\n🔔 Test ping received from Formbricks");
      console.log("✅ Endpoint is reachable!");
      return NextResponse.json(
        {
          success: true,
          message: "Webhook endpoint is working correctly",
        },
        { status: 200 }
      );
    }

    // Extract key information
    const { webhookId, event, data } = payload;

    // Log the entire payload to console
    console.log("\n==============================================");
    console.log("📥 WEBHOOK RECEIVED - NEW SURVEY TEST");
    console.log("==============================================");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Event:", event);
    console.log("Response ID:", data?.id);
    console.log("Survey ID:", data?.surveyId);
    console.log("Finished:", data?.finished);
    console.log("\n📋 Full Payload:");
    console.log(JSON.stringify(payload, null, 2));

    console.log("\n🔑 Key Information:");
    console.log("- Webhook ID:", webhookId);
    console.log("- Event Type:", event);
    console.log("- Response ID:", data?.id);
    console.log("- Survey ID:", data?.surveyId);
    console.log("- Finished:", data?.finished);

    // Log the actual form responses (data field)
    if (data?.data) {
      console.log("\n📝 Form Responses (data):");
      console.log(JSON.stringify(data.data, null, 2));

      // Log each field individually for clarity
      console.log("\n📊 Individual Fields:");
      Object.entries(data.data).forEach(([key, value]) => {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
      });
    }

    // Log calculated variables
    if (data?.variables) {
      console.log("\n🔢 Calculated Variables:");
      console.log(JSON.stringify(data.variables, null, 2));

      // Log each variable individually
      console.log("\n📈 Individual Variables:");
      Object.entries(data.variables).forEach(([key, value]) => {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
      });
    }

    // Log survey metadata
    if (data?.survey) {
      console.log("\n📋 Survey Info:");
      console.log(`  Title: ${data.survey.title}`);
      console.log(`  Type: ${data.survey.type}`);
      console.log(`  Status: ${data.survey.status}`);
    }

    // Log metadata
    if (data?.meta) {
      console.log("\n📍 Metadata:");
      console.log(JSON.stringify(data.meta, null, 2));
    }

    console.log("\n==============================================\n");

    // Generate PDF if response is finished
    let pdfGenerated = false;
    let pdfPath = "";

    if (data?.finished) {
      try {
        console.log("🎨 Generating PDF document...");

        // Process webhook data
        const documentData = processWebhookData(payload);

        console.log("\n📊 Mapped Document Data:");
        console.log(JSON.stringify(documentData, null, 2));

        // Read template - use absolute path from project root
        const projectRoot = process.cwd().replace(/\/apps\/web$/, ""); // Remove /apps/web if present
        const templatePath = path.join(projectRoot, "pdf-generator", "template.html");
        const outputDir = path.join(projectRoot, "pdf-generator", "output");

        console.log(`📁 Template path: ${templatePath}`);
        console.log(`📁 Output directory: ${outputDir}`);

        if (fs.existsSync(templatePath)) {
          const templateHtml = fs.readFileSync(templatePath, "utf-8");

          // Populate template
          const populatedHtml = populateTemplate(templateHtml, documentData);

          // Save HTML document (use the outputDir we already defined)
          fs.mkdirSync(outputDir, { recursive: true });

          const timestamp = Date.now();
          const htmlFilename = `legal-document-${data.id}-${timestamp}.html`;
          const htmlPath = path.join(outputDir, htmlFilename);

          fs.writeFileSync(htmlPath, populatedHtml);
          pdfPath = htmlPath;
          pdfGenerated = true;

          console.log(`✅ PDF document generated: ${htmlFilename}`);
          console.log(`📁 Location: ${htmlPath}`);
          console.log(`\n💡 Open in browser and print to PDF (⌘+P or Ctrl+P)`);
        } else {
          console.warn(`⚠️ Template not found at: ${templatePath}`);
          console.log("Skipping PDF generation.");
        }
      } catch (error) {
        console.error("❌ Error generating PDF:", error);
      }
    }

    // Return success response with the data
    return NextResponse.json(
      {
        success: true,
        message: "Webhook received successfully! Check your console for details.",
        receivedAt: new Date().toISOString(),
        pdfGenerated,
        pdfPath: pdfGenerated ? pdfPath : undefined,
        summary: {
          webhookId,
          event,
          responseId: data?.id,
          surveyId: data?.surveyId,
          finished: data?.finished,
          formDataKeys: data?.data ? Object.keys(data.data) : [],
          variableKeys: data?.variables ? Object.keys(data.variables) : [],
        },
        // Echo back the data for inspection
        receivedData: payload,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "field-discovery") {
    return NextResponse.json({
      message: "🕵️ Field Discovery Mode - Complete your survey to see field mappings!",
      instructions: [
        "1. Set up webhook in Formbricks with ngrok URL",
        "2. Complete your survey",
        "3. Check console for field IDs",
        "4. Update FIELD_MAPPING object with new IDs",
      ],
      current_mapping: FIELD_MAPPING,
      ngrok_url: "https://f326104964f2.ngrok-free.app/api/test-webhook",
    });
  }

  return NextResponse.json({
    message: "Test Webhook Endpoint is running!",
    status: "ready_for_new_survey_testing",
    ngrok_url: "https://f326104964f2.ngrok-free.app/api/test-webhook",
    instructions: [
      "🎯 NEW SURVEY TESTING:",
      "1. Go to your survey in Formbricks",
      "2. Settings → Webhooks → Add Webhook",
      "3. URL: https://f326104964f2.ngrok-free.app/api/test-webhook",
      "4. Triggers: Response Finished (and Response Updated for real-time)",
      "5. Complete survey at: http://localhost:3000/s/cmjeorso6000eurmsdvrw1g1o",
      "6. Watch console output for field mappings!",
      "",
      "📊 FIELD DISCOVERY:",
      "Visit: http://localhost:3000/api/test-webhook?action=field-discovery",
    ],
    survey_url: "http://localhost:3000/s/cmjeorso6000eurmsdvrw1g1o",
    webhook_url: "https://f326104964f2.ngrok-free.app/api/test-webhook",
    current_mapping: FIELD_MAPPING,
  });
}
