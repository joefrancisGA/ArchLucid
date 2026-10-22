# 42. Demo and public surfaces

Demo preview and sample-run endpoints use read-only demo bundles only — they must never bypass tenant catalog isolation. Demo seed uses expensive rate limiting.

![Demo public surfaces](../architecture_diagrams/archlucid-demo-public-surfaces.svg)
