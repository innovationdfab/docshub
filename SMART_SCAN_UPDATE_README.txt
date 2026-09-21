DOCHUB - SMART SCAN UPDATED BACKEND

The Gemini API key is intentionally NOT included.

Supabase setup:
1. Open Supabase Dashboard -> Edge Functions -> Secrets.
2. Add/update:
   GEMINI_API_KEY = your real Gemini API key
   GEMINI_MODEL = gemini-2.5-flash
3. Deploy the folder:
   supabase/functions/smart-scan/index.ts
4. Test Smart Scan.
5. In Edge Functions -> smart-scan -> Logs, a successful request should return 200.

Important:
- Do not paste the real Gemini key into index.html.
- The Edge Function now sends the key using the x-goog-api-key header.
- The function returns clearer auth/quota/model errors to the frontend.
