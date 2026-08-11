ALTER TABLE "PacklistEntry"
DROP CONSTRAINT IF EXISTS "packlist_number_format";

ALTER TABLE "PacklistEntry"
ADD CONSTRAINT "packlist_number_format"
CHECK ("packlistNumber" ~ '^[A-Za-z0-9]{8}$');