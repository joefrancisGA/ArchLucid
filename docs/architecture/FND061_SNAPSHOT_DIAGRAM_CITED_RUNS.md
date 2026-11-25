# FND-061 snapshot diagram cited-run reads

Snapshot diagram preview, Mermaid rendering and PNG export use the same caller-aware
run-share check as the Evidence Hub before hydrating cited manifests. PNG uses the
Mermaid render path before invoking the image renderer. Unreadable citations do
not produce seal conflicts or affect the scoped graph lookup. A readable corrupt
seal still returns HTTP 409.

The authenticated HTTP fixture separates the graph lookup from the cited manifest.
It covers all three routes, a readable invalid seal, and access revocation without
a manifest read.

The Drift Workbench also authorizes each distinct citation before the batched
snapshot-page manifest query, and before cited manifests are read for a snapshot's
diffs, either side of a diff's changes, or a snapshot's inventory rows. Inventory
rows first confirm that the snapshot itself is in scope. The HTTP tests cover
revoked shares, runs outside the active scope and corrupt seals on readable runs.
Service-level tests keep the batched lookup and verify that only readable run IDs
enter the bulk manifest query.

Other callers of the legacy helper are outside this slice. FND-061 remains partial.
