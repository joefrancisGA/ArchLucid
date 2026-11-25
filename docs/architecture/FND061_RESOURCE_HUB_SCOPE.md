# FND-061 resource evidence hub scope

The hub uses the same exact tenant/workspace/project identity boundary as the resource
explorer before assembling its payload. It does not change the tenant-wide identity
used internally for ingestion and deduplication. Audit lineage uses the assessment
project in SQL before selecting metadata and applying the result limit. Optional
assessment, snapshot and control IDs narrow the lookup. A caller-supplied tuple
does not establish that a resource was observed.

The hub controller already sends no-store. The hub assembler itself does not have a
response-cache lookup. This slice does not establish scope or run-share enforcement
for every downstream reader. The shared run-cited inventory seal guard still
requires a separate authorization-first pass for derived or explicit snapshot
selection. Other alternatives and fallback paths remain partial.
