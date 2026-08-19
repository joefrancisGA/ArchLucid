> **Scope:** Auto-generated retrieval IR benchmark report from golden fixtures; audience is engineering contributors validating search recall and MRR against configured floors.

# Retrieval IR report

- **Cases evaluated:** 53
- **Mean recall@5:** 0.9811
- **Mean MRR:** 0.9308
- **Mean NDCG@10:** 0.9467
- **Floor recall@5:** 0.8500
- **Floor MRR:** 0.7500

## Per-corpus breakdown

| Corpus | Cases | Mean recall@5 | Mean MRR | Mean NDCG@10 | Ordering-sensitive NDCG@10 |
| --- | ---: | ---: | ---: | ---: | ---: |
| AzureRetail | 6 | 1.0000 | 0.8889 | 0.9080 | — |
| CustomerProvided | 2 | 1.0000 | 1.0000 | 1.0000 | — |
| DemoDerived | 2 | 1.0000 | 1.0000 | 1.0000 | — |
| PlatformDoc | 9 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| PolicyPack | 15 | 0.9333 | 0.8000 | 0.8485 | 0.5152 |
| PriorManifest | 13 | 1.0000 | 1.0000 | 1.0000 | — |
| ReferenceArchitecture | 6 | 1.0000 | 1.0000 | 1.0000 | — |

## Per-case results

| Case | Corpus | recall@5 | MRR | NDCG@10 | Ordering-sensitive |
|------|--------|----------|-----|---------|--------------------|
| ir-pp-kv-01 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-kv-02 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-mi-01 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-mi-02 | PolicyPack | 1.0000 | 1.0000 | 0.9197 | no |
| ir-pp-pe-01 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-pe-02 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-dual-01 | PolicyPack | 0.5000 | 0.2500 | 0.4628 | yes |
| ir-pp-dual-02 | PolicyPack | 0.5000 | 0.2500 | 0.4628 | yes |
| ir-pp-triple | PolicyPack | 1.0000 | 0.5000 | 0.6199 | yes |
| ir-pp-noise-guard | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-run-01 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-run-02 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-run-03 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-run-04 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-pair-01 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-pair-02 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-noise | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-cross-01 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-cross-02 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-cross-03 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pd-arch-01 | PlatformDoc | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pd-arch-02 | PlatformDoc | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pd-arch-03 | PlatformDoc | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pd-pair-01 | PlatformDoc | 1.0000 | 1.0000 | 1.0000 | yes |
| ir-pd-pair-02 | PlatformDoc | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pd-noise | PlatformDoc | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pd-tenant-only-pp | PolicyPack | 1.0000 | 0.5000 | 0.6309 | no |
| ir-pd-tenant-only-pm | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-mixed-scope-01 | PlatformDoc | 1.0000 | 1.0000 | 1.0000 | no |
| ir-mixed-scope-02 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-mixed-scope-03 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ar-app-01 | AzureRetail | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ar-app-02 | AzureRetail | 1.0000 | 1.0000 | 0.8772 | no |
| ir-ar-sql-01 | AzureRetail | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ar-fd-01 | AzureRetail | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ar-noise | AzureRetail | 1.0000 | 1.0000 | 1.0000 | no |
| ir-demo-01 | DemoDerived | 1.0000 | 1.0000 | 1.0000 | no |
| ir-demo-02 | DemoDerived | 1.0000 | 1.0000 | 1.0000 | no |
| ir-cust-01 | CustomerProvided | 1.0000 | 1.0000 | 1.0000 | no |
| ir-cust-02 | CustomerProvided | 1.0000 | 1.0000 | 1.0000 | no |
| ir-tenant-b-pp | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-tenant-a-not-b | PolicyPack | 1.0000 | 0.5000 | 0.6309 | no |
| ir-pd-lib-01 | PlatformDoc | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ar-pp-mixed | AzureRetail | 1.0000 | 0.3333 | 0.5706 | no |
| ir-pp-kv-03 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pm-run-05 | PriorManifest | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pd-arch-04 | PlatformDoc | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ra-ms-01 | ReferenceArchitecture | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ra-ms-02 | ReferenceArchitecture | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ra-3tier-01 | ReferenceArchitecture | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ra-dr-01 | ReferenceArchitecture | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ra-platform-scope | ReferenceArchitecture | 1.0000 | 1.0000 | 1.0000 | no |
| ir-ra-noise | ReferenceArchitecture | 1.0000 | 1.0000 | 1.0000 | no |
