const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanBase64(value: string) {
  const s = String(value || "");
  return s.includes(",") ? s.split(",").pop() || "" : s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const GEMINI_API_KEY = (Deno.env.get("GEMINI_API_KEY") || "").trim();
    const GEMINI_MODEL = (Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash").trim();

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      return json({
        error: "Gemini API key is not configured. Add GEMINI_API_KEY in Supabase Edge Function Secrets.",
        code: "GEMINI_KEY_MISSING"
      }, 500);
    }

    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch {
      return json({ error: "Invalid JSON request body.", code: "INVALID_REQUEST" }, 400);
    }

    const { base64, mimeType, fileName } = requestBody || {};
    const documentData = cleanBase64(base64);

    if (!documentData || !mimeType) {
      return json({ error: "Document data is missing.", code: "DOCUMENT_MISSING" }, 400);
    }

    const prompt = `
You are the AI document analysis engine for DocHub.
Analyse the attached document carefully. Do not guess unreadable values.
Return ONLY valid JSON and no markdown.
Return exactly:
{
  "person_name": string | null,
  "document_type": string,
  "document_number": string | null,
  "issue_date": "YYYY-MM-DD" | null,
  "renewal_date": "YYYY-MM-DD" | null,
  "scope": "Personal" | "Employee" | "Company",
  "confidence": number,
  "ocr_text": string,
  "summary": string
}
Rules:
- Never fabricate names, numbers or dates.
- Dates must use YYYY-MM-DD.
- document_number = the main Aadhaar/PAN/passport/DL/invoice/GST/certificate/policy/registration number when clearly visible.
- issue_date = actual issue/document date only.
- renewal_date = actual expiry/valid-until/renewal date only. Do not use DOB.
- confidence = integer 0-100.
- ocr_text = useful readable text from the entire document, including important names/numbers.
- For identity documents use the person's full name.
- For company documents use the company/organisation/department name when appropriate.
- If type is uncertain use "Other Document".
- Uploaded file name: ${String(fileName || "document")}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: String(mimeType), data: documentData } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    let payload: any = null;
    const raw = await response.text();
    try { payload = raw ? JSON.parse(raw) : {}; }
    catch { payload = { raw }; }

    if (!response.ok) {
      const providerMessage = payload?.error?.message || payload?.message || raw || "Gemini request failed.";
      console.error("Gemini API error:", {
        status: response.status,
        statusText: response.statusText,
        message: providerMessage,
      });

      let code = "GEMINI_API_ERROR";
      if (response.status === 401 || response.status === 403) code = "GEMINI_AUTH_ERROR";
      else if (response.status === 429) code = "GEMINI_QUOTA_ERROR";
      else if (response.status === 404) code = "GEMINI_MODEL_ERROR";

      return json({
        error: providerMessage,
        code,
        provider_status: response.status,
      }, response.status);
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text || "")
      .join("")
      .trim();

    if (!text) {
      return json({ error: "Gemini returned no analysis.", code: "EMPTY_AI_RESPONSE" }, 502);
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      try {
        result = JSON.parse(
          text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .trim()
        );
      } catch {
        return json({ error: "Gemini returned invalid JSON.", code: "INVALID_AI_JSON" }, 502);
      }
    }

    return json({
      result: {
        person_name: result?.person_name ?? null,
        document_type: result?.document_type || "Other Document",
        document_number: result?.document_number ?? null,
        issue_date: result?.issue_date ?? null,
        renewal_date: result?.renewal_date ?? null,
        scope: ["Personal", "Employee", "Company"].includes(result?.scope) ? result.scope : "Personal",
        confidence: Math.max(0, Math.min(100, Math.round(Number(result?.confidence || 0)))),
        ocr_text: String(result?.ocr_text || "").trim(),
        summary: String(result?.summary || "").trim(),
      },
    });
  } catch (error) {
    console.error("smart-scan unexpected error:", error);
    return json({
      error: error instanceof Error ? error.message : "Smart Scan failed.",
      code: "SMART_SCAN_ERROR"
    }, 500);
  }
});
