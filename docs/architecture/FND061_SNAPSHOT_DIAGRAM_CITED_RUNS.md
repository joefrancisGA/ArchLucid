# FND-061 snapshot diagram cited-run reads

Snapshot diagram preview, Mermaid rendering and PNG export use the same caller-aware
run-share check as the Evidence Hub before hydrating cited manifests. PNG uses the
Mermaid render path before invoking the image renderer. Unreadable citations do
not produce seal conflicts or affect the scoped graph lookup. A readable corrupt
seal still returns HTTP 409.

The authenticated HTTP fixture separates the graph lookup from the cited manifest.
It covers all three routes, a readable invalid seal, and access revocation without
a manifest read. Other snapshot, drift and export callers of the legacy helper
are outside this slice. FND-061 remains partial.
