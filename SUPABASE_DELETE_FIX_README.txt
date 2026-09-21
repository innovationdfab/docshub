DocHub — Supabase Storage deletion correction

In index.html, deleting a Vault document now:
1) checks the active Supabase account owns the database row/storage path;
2) requests removal of that exact PDF from the private 'documents' Storage bucket;
3) checks Storage confirms an object was removed (rather than silently returning an empty result);
4) removes the matching row from public.documents, verifying one row was deleted;
5) refreshes My Vault after successful deletion.

If cloud Storage deletion fails, the database row remains, and DocHub displays an error. This avoids falsely saying a document was permanently deleted when its PDF remains in Storage.

IMPORTANT ABOUT EXISTING FILES: This change cannot retroactively delete old PDFs already orphaned in Supabase Storage. Before manually removing an old PDF, verify it is not referenced by ANY active document row, and verify that you are deleting the correct user's file. Anonymous sign-in on another browser creates a DIFFERENT Supabase user. That browser cannot safely delete files owned by another anonymous user. Do not bulk-clear the Storage bucket or modify security policies to bypass this restriction.

Supabase Storage deletion requires SELECT and DELETE policies on storage.objects for the signed-in user's own 'documents' files. Existing supabase/sql/03_storage_policies.sql defines these policies. If the signed-in user differs from the user ID folder containing the PDF, deletion should fail rather than conceal a permissions mismatch.

Only index.html was functionally modified; all other frontend/backend assets remain as supplied. Real Gemini API keys belong in Supabase Edge Function Secrets, not this ZIP or Git.
