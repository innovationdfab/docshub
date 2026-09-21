-- DocHub OCR / Search fields
alter table public.documents
add column if not exists ocr_text text,
add column if not exists document_number text,
add column if not exists issue_date date,
add column if not exists ai_confidence integer;
