# Isolated workload benchmark harness

`IsolatedWorkloadBenchmark.MeasureAsync` wraps a caller-supplied representative workload, capturing elapsed time, process CPU-time delta, and sampled process working set. The output is a schema-v1 observation compatible with `WorkloadCalibrationImport.Parse`.

**Isolation requirements:** Only pass `dedicatedProcessConfirmed=true` when the benchmark runner actually owns a dedicated process without concurrent activities. The flag is a caller attestation, not proof. Do not treat a normal API server or shared CI test runner as isolated. Process CPU includes JIT, GC and unrelated host overhead. The measured worker duration is elapsed wall-clock time. The maximum sampled working set is not a true peak and is marked `MemoryIsTruePeak=false` even when the process is dedicated.

No benchmark is executed at production startup. Run the harness from a dedicated, controlled benchmark process with representative workloads, pinned runtime/software revision and hardware configuration. Persist results through approved artifacts and use them for the matching cohort/revision only. Do not invent measurements, infer memory capacity solely from sampled working set, or automatically alter replica counts.
