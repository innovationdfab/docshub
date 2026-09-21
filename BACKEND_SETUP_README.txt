DOCHUB COMPLETE BACKEND SETUP
=============================

This ZIP contains the complete DocHub UI plus all backend setup files.

1. SUPABASE PROJECT
-------------------
Create a Supabase project.

2. ENABLE ANONYMOUS AUTH
------------------------
Authentication -> Sign In / Providers -> Anonymous Sign-Ins -> ON

DocHub currently uses anonymous authenticated sessions so no OTP/login screen is required.

3. DATABASE
-----------
Open Supabase -> SQL Editor -> New Query.

Run these files in this order:

supabase/sql/01_database_setup.sql
supabase/sql/02_history_setup.sql

Optional:
supabase/sql/04_optional_profiles.sql

4. PRIVATE STORAGE
------------------
Supabase -> Storage -> New Bucket

Bucket name:
documents

Public bucket:
OFF

Then run:

supabase/sql/03_storage_policies.sql

5. GEMINI SMART SCAN
--------------------
Create a Gemini API key.

In Supabase:
Edge Functions -> Secrets

Add:
GEMINI_API_KEY = your Gemini API key
GEMINI_MODEL = gemini-2.5-flash

Create/deploy an Edge Function named exactly:
smart-scan

Use:
supabase/functions/smart-scan/index.ts

IMPORTANT:
Never put GEMINI_API_KEY inside index.html.

6. FRONTEND CONNECTION
----------------------
The current DocHub UI already contains the Supabase project connection used during development.

If you move to another Supabase project, update the Project URL and publishable key in index.html.

Never use the service_role key in browser JavaScript.

7. CURRENT WORKFLOW
-------------------
Open DocHub
-> automatic anonymous Supabase session
-> Smart Scan
-> Camera / Upload
-> Preview
-> Next
-> Gemini analysis
-> auto-fill name / document type / renewal date / Vault folder
-> Preview
-> Confirm & Save
-> PDF saved in private Supabase Storage
-> metadata saved in documents table
-> history saved in document_history
-> Vault loads directly from Supabase
-> Download / Edit / Delete sync with backend
-> renewal reminders use backend fields

8. FOLDER STRUCTURE
-------------------
index.html
.env.example
BACKEND_SETUP_README.txt

supabase/
  sql/
    01_database_setup.sql
    02_history_setup.sql
    03_storage_policies.sql
    04_optional_profiles.sql

  functions/
    smart-scan/
      index.ts
      .env.example

9. SECRETS
----------
Keep these private:
- Gemini API key
- database password
- Supabase secret/service_role key

The Supabase publishable key is intended for frontend use when RLS policies are correctly configured.
