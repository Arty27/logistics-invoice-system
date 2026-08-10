-- This is an empty migration.
ALTER TABLE "PacklistEntry"
ADD CONSTRAINT "packlist_number_format"
CHECK ("packlistNumber" ~ '^[0-9]{8}$');