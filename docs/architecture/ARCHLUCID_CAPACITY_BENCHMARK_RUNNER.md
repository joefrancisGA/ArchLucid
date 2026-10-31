# ArchLucid synthetic capacity benchmark runner

The `tools/ArchLucid.CapacityBench` .NET 10 console application executes one synthetic workload per process, measures CPU elapsed time and sampled working set with `IsolatedWorkloadBenchmark`, and writes one JSON artifact. The dedicated CI workflow builds the executable and invokes each of three fixed cohorts three times in nine separate OS processes, uploading all results as `archlucid-capacity-synthetic-profiles`.

`document-ingestion`, `retrieval` and `graph-analysis` are **small synthetic CPU fixtures**, NOT representative application pipeline implementations. They cannot calibrate actual service demand, SQL capacity, agent tokens or production resource use. The current runner records full wrapper metadata, with the calibration observation at `sample.Observation`; consumers must extract the nested observation before calling `WorkloadCalibrationImport.Parse`. Revision is taken from the CI commit SHA. Memory is sampled, not guaranteed peak. This makes repeatable instrumentation checks possible, not accurate production resource predictions.

No credentials, tenant IDs, production calls, scaling settings or deployment endpoints are used. CI timing numbers depend on runner sharing and must not be treated as stable performance acceptance gates.

## v2 partial real-path benchmark

The `document-ingestion` fixture now runs the real `StructureAwareTextChunker`; `retrieval` runs the real `SimpleTextChunker` from `ArchLucid.Retrieval` using deterministic generated Markdown. Input construction happens before timed execution. These are genuine application components but do **not** constitute complete document ingestion, embedding, SQL persistence, search, or architecture review. `graph-analysis` retains its synthetic arithmetic fixture and must not be reported as product graph throughput. Calibration applicability is limited to the exercised chunker operation on the runner environment. Benchmark validity and CI execution remain to be confirmed.
