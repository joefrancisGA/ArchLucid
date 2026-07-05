> **Scope:** GTM, pilots, and implementers aligning on V1 GA bulk evidence uploads (up to **200** files per multipart request); **ZIP archives count as one file** and expand server-side. Folder recursion in the browser remains V1.1.

# Bulk Evidence Upload (V1 GA)

Bulk upload up to **200** files per multipart request at GA. Each **ZIP archive counts as one file** toward the cap; the server expands ZIP entries server-side (up to configured expansion limits).

**Note:** Browser folder recursion (`webkitdirectory`) was evaluated as a V1.1 candidate and rejected by the owner (2026-07-05) — manual file selection and ZIP upload cover this need. See `docs/library/V1_DEFERRED.md` §6k.
