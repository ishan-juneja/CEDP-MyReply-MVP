// apps/web/app/api/myreply-webhook/route.ts
import { NextResponse } from "next/server";

// Field mapping from your survey
const FIELD_MAPPING = {
  q8hh9qo5haoqb77rzaz39tlx: "colorado_resident",
  g0rznhregilhqyvdoql0lwch: "payment_status",
  qf9u4fbpr78dqhvxb1ujpmuo: "eviction_notice",
};

// Payment option IDs
const PAYMENT_OPTION_IDS = {
  PAID_FULL: "tjif4flki2vwxeonh887bp90",
  TRIED_REFUSED: "q2toaeyigl5nig5spw5d07id",
  NOT_PAID: "ow1jvz3lby4gziww6cde3koj",
};

// UP codes for legal defenses
const UP_CODES = {
  UP003: "UP003", // < 10 days notice
  UP001: "UP001", // Paid full amount
  UP013: "UP013", // Tried but refused
};

// CORS headers with security
const corsHeaders = {
  "Access-Control-Allow-Origin":
    process.env.NODE_ENV === "production" ? "https://yourdomain.com" : "http://localhost:3000",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Helper function to map field IDs to readable names
function mapAnswers(raw: Record<string, any>) {
  const mapped: Record<string, any> = {};
  for (const [qid, val] of Object.entries(raw || {})) {
    const readable = FIELD_MAPPING[qid] ?? qid;
    mapped[readable] = val;
  }
  return mapped;
}

// Safe JSON parsing helper
async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return { ok: true, json: JSON.parse(text), raw: text };
  } catch {
    return { ok: false, json: null, raw: text };
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  const stamp = new Date().toISOString();

  console.log("\n🚨 LEGAL DOCUMENT WEBHOOK TRIGGERED");
  console.log("🕒", stamp);
  console.log("➡️ method: POST");
  console.log("🔗 URL:", request.url);
  console.log("📨 Headers:", Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.json();
    console.log("📦 Raw payload:", JSON.stringify(body, null, 2));

    const event = body?.event;
    console.log("🎯 event:", event);

    if (event !== "responseFinished") {
      console.log("ℹ️ Not responseFinished; ignoring.");
      return NextResponse.json({ ok: true, ignored: true, event });
    }

    const responseId = body?.data?.id;
    const surveyId = body?.data?.surveyId;

    // FIX: Correct data structure access
    const answers = body?.data?.data;
    if (!answers) {
      console.log("❌ No survey data found");
      return NextResponse.json({ ok: false, error: "No survey data" }, { status: 400 });
    }

    console.log("🆔 responseId:", responseId);
    console.log("📋 surveyId:", surveyId);

    // Map field IDs to readable names
    const mapped = mapAnswers(answers);
    console.log("✅ Mapped answers:", JSON.stringify(mapped, null, 2));

    // VALIDATION GATES
    console.log("🔍 VALIDATION STATUS:");

    // Gate 1: Must be in Colorado
    const inCO = mapped.colorado_resident;
    console.log("🏔️ Colorado resident:", inCO, inCO === "Yes" ? "✅ PASS" : "❌ FAIL");
    if (inCO !== "Yes") {
      console.log("🛑 STOPPED: Not renting in Colorado");
      return NextResponse.json({ ok: true, generated: false, reason: "Not renting in Colorado" });
    }

    // Gate 2: Payment validation
    const payOpt = mapped.payment_status;
    console.log("💵 Payment option:", payOpt);
    if (!payOpt) {
      console.log("🛑 STOPPED: Missing payment answer");
      return NextResponse.json({ ok: true, generated: false, reason: "Missing payment answer" });
    }

    console.log("   Payment validation:", payOpt !== PAYMENT_OPTION_IDS.NOT_PAID ? "✅ PASS" : "❌ FAIL");
    if (payOpt === PAYMENT_OPTION_IDS.NOT_PAID) {
      console.log("🛑 STOPPED: User did not try to pay");
      return NextResponse.json({ ok: true, generated: false, reason: "User did not try to pay" });
    }

    // Gate 3: File upload validation
    const uploadVal = mapped.eviction_notice;
    console.log("📎 Eviction notice:", uploadVal ? "✅ PRESENT" : "❌ MISSING");
    if (!uploadVal) {
      console.log("🛑 STOPPED: No eviction notice uploaded");
      return NextResponse.json({ ok: true, generated: false, reason: "No eviction notice uploaded" });
    }

    // PROCESSING PIPELINE - Single API Call
    console.log("🚀 Calling Python API for document generation...");

    // Determine UP codes for legal arguments
    const upCodes: string[] = [];
    upCodes.push(UP_CODES.UP003); // < 10 days notice

    if (payOpt === PAYMENT_OPTION_IDS.PAID_FULL) upCodes.push(UP_CODES.UP001);
    if (payOpt === PAYMENT_OPTION_IDS.TRIED_REFUSED) upCodes.push(UP_CODES.UP013);

    console.log("🏷️ UP codes selected:", upCodes);

    // Prepare data for Python API
    const pythonPayload = {
      tenant_name: "Tenant", // Could be extracted from survey if available
      tenant_address: "Address not provided",
      eviction_notice_url: uploadVal,
      payment_status:
        payOpt === PAYMENT_OPTION_IDS.PAID_FULL
          ? "Paid full amount"
          : payOpt === PAYMENT_OPTION_IDS.TRIED_REFUSED
            ? "Tried but refused"
            : "Unknown",
      state: "Colorado",
      up_codes: upCodes,
      response_id: responseId,
    };

    console.log("📤 Sending to Python API:", JSON.stringify(pythonPayload, null, 2));

    const apiResp = await fetch("http://localhost:8000/generate-defense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pythonPayload),
    });

    const apiParsed = await safeJson(apiResp);
    console.log("🧾 Python API status:", apiResp.status);

    if (!apiResp.ok || !apiParsed.ok || !apiParsed.json?.pdf_url) {
      console.log("🛑 Document generation failed");
      return NextResponse.json({
        ok: true,
        generated: false,
        reason: "Document generation failed",
        status: apiResp.status,
        detail: apiParsed.raw,
      });
    }

    const result = apiParsed.json;
    const pdfUrl = result.pdf_url;
    console.log("✅ Document generated:", pdfUrl);
    console.log("📊 Analysis:", JSON.stringify(result.analysis, null, 2));

    return NextResponse.json({
      ok: true,
      generated: true,
      pdf_url: `http://localhost:8000${pdfUrl}`,
      analysis: result.analysis,
      up_codes_used: upCodes,
      message: "Legal document generated successfully",
    });
  } catch (error) {
    console.error("💥 Webhook error:", error);
    return NextResponse.json(
      {
        ok: false,
        generated: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get("test");

  if (test === "sample") {
    // Test with sample data
    const testRequest = new Request("http://localhost:3000/api/myreply-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "responseFinished",
        data: {
          id: "test_" + Date.now(),
          surveyId: "test_survey",
          finished: true,
          data: {
            q8hh9qo5haoqb77rzaz39tlx: "Yes", // Colorado resident
            g0rznhregilhqyvdoql0lwch: "tjif4flki2vwxeonh887bp90", // Paid full
            qf9u4fbpr78dqhvxb1ujpmuo: "test_image_url", // File upload
          },
        },
      }),
    });

    const response = await POST(testRequest);
    const result = await response.json();

    return NextResponse.json({
      message: "Test webhook processing completed",
      result: result,
      instructions: "Check the console logs above for detailed processing information",
    });
  }

  return NextResponse.json({
    message: "Legal Document Webhook Status",
    status: "ready",
    ngrok_url: "https://f326104964f2.ngrok-free.app/api/myreply-webhook",
    test_url: "http://localhost:3000/api/myreply-webhook?test=sample",
    instructions: [
      "This webhook processes survey responses and generates legal documents",
      "Configure in Formbricks: https://f326104964f2.ngrok-free.app/api/myreply-webhook",
      "Test manually: /api/myreply-webhook?test=sample",
    ],
  });
}
