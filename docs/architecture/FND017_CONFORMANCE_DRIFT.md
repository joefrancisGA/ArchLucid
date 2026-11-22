# FND-017 Architecture Conformance and Drift Detection

This increment introduces a **non-blocking** architecture conformance scanner, machine-readable rules, stable finding fingerprints, baseline comparison and an advisory GitHub Actions artifact. The scanner checks AST imports/calls in selected Python reference modules and explicit token contracts in selected .NET authorization files. It never edits source or fails CI merely because a finding exists.

Rules cover FND-014/015 no network/process/cloud/SQL imports, FND-010 mandatory audit and stored-procedure path, and FND-016 non-execution contract. Missing files are surfaced as findings, which is expected on branches without FND-016. Tests cover violations, missing files, drift and stable fingerprints.

**Scope limitations:** Token checks are heuristic, not proof of control flow or security invariants. Dynamic imports, aliases, reflection, transitive dependencies and generated code can evade this scanner. A present token does not prove audit occurs before authorization. Do not treat a zero-finding report as security certification. Add compiler-backed .NET architecture tests and dataflow analysis before enforcing critical rules.

**Next steps:** establish a reviewed baseline on master, classify false positives, add rule ownership/severity and audited exemptions, measure conformance drift separately from source defect density, then selectively promote independently validated rules to CI blockers. This work requires no Azure infrastructure and does not change production behavior.
