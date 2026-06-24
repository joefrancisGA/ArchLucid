> **Scope:** Auto-generated retrieval IR benchmark report from golden fixtures; audience is engineering contributors validating search recall and MRR against configured floors.

# Retrieval IR report

- **Cases evaluated:** 31
- **Mean recall@5:** 1.0000
- **Mean MRR:** 0.9247
- **Mean NDCG@10:** 0.9427
- **Floor recall@5:** 0.8500
- **Floor MRR:** 0.7500

## Per-corpus breakdown

| Corpus | Cases | Mean recall@5 | Mean MRR | Mean NDCG@10 | Ordering-sensitive NDCG@10 |
| --- | ---: | ---: | ---: | ---: | ---: |
| PlatformDoc | 7 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| PolicyPack | 12 | 1.0000 | 0.8056 | 0.8521 | 0.5581 |
| PriorManifest | 12 | 1.0000 | 1.0000 | 1.0000 | — |

## Per-case results

| Case | Corpus | recall@5 | MRR | NDCG@10 | Ordering-sensitive |
|------|--------|----------|-----|---------|--------------------|
| ir-pp-kv-01 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-kv-02 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-mi-01 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-mi-02 | PolicyPack | 1.0000 | 1.0000 | 0.9197 | no |
| ir-pp-pe-01 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-pe-02 | PolicyPack | 1.0000 | 1.0000 | 1.0000 | no |
| ir-pp-dual-01 | PolicyPack | 1.0000 | 0.3333 | 0.5271 | yes |
| ir-pp-dual-02 | PolicyPack | 1.0000 | 0.3333 | 0.5271 | yes |
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
