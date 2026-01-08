import { NextResponse } from "next/server";

/**
 * Survey Results Display Webhook
 *
 * This webhook simply displays survey results in a clean, readable format
 * without generating PDFs. Perfect for testing and seeing what data your survey collects.
 *
 * Usage:
 * 1. Set webhook URL to: https://your-ngrok-url.ngrok-free.app/api/survey-results
 * 2. Select triggers: Response Finished
 * 3. Complete your survey
 * 4. Results will be logged and displayed
 */

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { webhookId, event, data } = payload;

    console.log("\n" + "=".repeat(80));
    console.log("📊 SURVEY RESULTS WEBHOOK");
    console.log("=".repeat(80));
    console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 Event: ${event}`);
    console.log(`🆔 Response ID: ${data?.id}`);
    console.log(`📋 Survey ID: ${data?.surveyId}`);
    console.log(`✅ Completed: ${data?.finished}`);
    console.log("=".repeat(80));

    if (data?.data) {
      console.log("\n📝 SURVEY RESPONSES:");
      console.log("-".repeat(50));

      Object.entries(data.data).forEach(([fieldId, value], index) => {
        console.log(`${index + 1}. ${fieldId}:`);
        console.log(`   ${JSON.stringify(value, null, 2)}`);
        console.log("");
      });
    }

    if (data?.variables) {
      console.log("\n🔢 CALCULATED VARIABLES:");
      console.log("-".repeat(50));

      Object.entries(data.variables).forEach(([varName, value], index) => {
        console.log(`${index + 1}. ${varName}: ${JSON.stringify(value)}`);
      });
    }

    if (data?.meta) {
      console.log("\n📍 METADATA:");
      console.log("-".repeat(50));
      console.log(`User Agent: ${data.meta.userAgent || "N/A"}`);
      console.log(`URL: ${data.meta.url || "N/A"}`);
      console.log(`Source: ${data.meta.source || "N/A"}`);
    }

    console.log("=".repeat(80));
    console.log("✅ Survey results processed successfully!");
    console.log("=".repeat(80) + "\n");

    // Return a simple success response
    return NextResponse.json({
      success: true,
      message: "Survey results received and logged!",
      timestamp: new Date().toISOString(),
      responseId: data?.id,
      surveyId: data?.surveyId,
      fieldCount: data?.data ? Object.keys(data.data).length : 0,
      variablesCount: data?.variables ? Object.keys(data.variables).length : 0,
    });
  } catch (error) {
    console.error("❌ Error processing survey results:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const responseId = searchParams.get("responseId");

  if (format === "html") {
    // Return HTML page showing webhook status
    return new Response(
      `
<!DOCTYPE html>
<html>
<head>
    <title>Survey Results Webhook</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .status { padding: 10px; background: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; margin: 10px 0; }
        code { background: #f0f0f0; padding: 2px 4px; border-radius: 2px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Survey Results Webhook</h1>
        <div class="status">
            ✅ <strong>Status:</strong> Active and ready to receive survey results
        </div>
        <p><strong>Webhook URL:</strong> <code>https://f326104964f2.ngrok-free.app/api/survey-results</code></p>
        <p><strong>Triggers:</strong> Response Finished</p>
        <p><strong>Survey URL:</strong> <code>http://localhost:3000/s/gk0t2ak59ww11l58uaefsnyq</code></p>
        <p><strong>Legal Document Webhook:</strong> <code>https://f326104964f2.ngrok-free.app/api/myreply-webhook</code></p>

        <h3>📋 What this webhook does:</h3>
        <ul>
            <li>Receives survey completion events</li>
            <li>Logs all form responses to console</li>
            <li>Displays field IDs and values clearly</li>
            <li>Shows calculated variables</li>
            <li>Includes metadata (user agent, URL, etc.)</li>
        </ul>

        <h3>🧪 Testing:</h3>
        <ol>
            <li>Complete your survey at the URL above</li>
            <li>Check your terminal console for detailed results</li>
            <li>Use the logged field IDs to update your FIELD_MAPPING</li>
        </ol>
    </div>
</body>
</html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  return NextResponse.json({
    message: "Survey Results Webhook is running!",
    status: "active",
    webhook_url: "https://f326104964f2.ngrok-free.app/api/survey-results",
    survey_url: "http://localhost:3000/s/gk0t2ak59ww11l58uaefsnyq",
    instructions: [
      "This webhook displays survey results in a clean format",
      "Set webhook URL to: https://f326104964f2.ngrok-free.app/api/survey-results",
      "Select trigger: Response Finished",
      "Complete survey to see results logged to console",
      "View HTML status page: /api/survey-results?format=html",
    ],
  });
}
