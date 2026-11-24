# Historical analytical reproducibility — ArchLucid and SecureNow

**Status:** Proposed architectural note; current implementation only partially assessed.  
**Date:** 2026-11-24.  
**Source review:** targeted static inspection of revision `a21b92b90c3daff9ff6cbe034d6d9b88e28e6b6f`, not a runtime or security certification.  
**Tracking:** [Active technical backlog](../ACTIVE_TECHNICAL_BACKLOG.md). The four Critical entries FND-094–097 accompany this note; implementation remains subject to existing governance and verification gates.

## 1. Problem and objective

A customer disputes a security finding months or years after its issuance. The original estate, policies, algorithms, configuration, dependencies and AI models may have changed or disappeared. The objective is to reconstruct what the system actually concluded, identify what evidence and rules supported that conclusion, and independently assess its defensibility without requiring access to a retired AI service.

Treat every externally generated or nondeterministic response as a versioned input to subsequent processing, not as an independently established fact. Preserve the minimum authorized evidence necessary for the promised level of reproducibility. Do not promise unlimited retention, the original model's internal reasoning, or a bit-identical fresh inference.

## 2. Distinct operations and guarantees

| Operation | Meaning | Limitation |
| --- | --- | --- |
| Historical reconstruction | Retrieve the original sealed outputs and trace their recorded input and decision lineage. | Establishes what was recorded, not that it was correct. |
| Recorded-input deterministic replay | Reexecute pinned deterministic stages using retained evidence and the exact recorded stage inputs, including accepted AI outputs, without contacting the original model. | Requires compatible retained code, environment, inputs and controlled nondeterminism. |
| Independent historical revalidation | Evaluate the original claim against preserved evidence using explicitly identified independent checks and adjudication. | New checks may refute the original claim; missing evidence remains unknown. |
| Current reassessment | Run current engines, policies or models against historical or current evidence with differences explicitly labeled. | A new analysis, not proof of historical reproduction. |

An output match does not prove correctness. Cryptographic integrity does not establish factual truth. A new model response is never silently substituted for a missing historical response.

## 3. Existing implementation and source-checked gaps

| Component | Observed behavior | Implication |
| --- | --- | --- |
| [AuthorityReplayService](../../ArchLucid.Persistence/Coordination/Replay/AuthorityReplayService.cs) | Loads stored run detail, checks manifest hash, supports reconstruct-only and invokes the decision engine for rebuild; rebuild saves traces/manifests and optionally artifacts. | Strong historical-record foundation. Rebuild does not by itself establish execution with the original binary, runtime or rule configuration. New identifiers may change full hashes. Preserve the original chain and audit rebuild behavior. |
| [ReplayRunExecutePreparedStage](../../ArchLucid.Application/Replay/ReplayRunExecutePreparedStage.cs) | Guards sealed source, checks source scope, clones evidence, resolves an executor by execution mode and calls ExecuteAsync on the four-agent path; authority replay uses the queued pipeline. | The inspected execution path is not a demonstrated provider-free playback of all original AI responses. Do not reinterpret existing fresh-execution replay as historical deterministic replay. |
| [ReplayRunCommitStage](../../ArchLucid.Application/Replay/ReplayRunCommitStage.cs) | Evaluates, resolves and merges replay outputs; checks source/replay scope and policy/evidence pins in the inspected four-agent commit path. | Reuse the pin and integrity checks; verify coverage of other paths rather than assuming universal enforcement. |
| [EvidencePackagePin](../../ArchLucid.Contracts/Architecture/EvidencePackagePin.cs), [RunEvidencePackagePinService](../../ArchLucid.Application/Runs/RunEvidencePackagePinService.cs), [RunPolicyPackPinService](../../ArchLucid.Application/Runs/RunPolicyPackPinService.cs) | Evidence identity and create-time policy/evidence pin infrastructure. | Reuse, and confirm all retained artifacts resolve to exact content and historical versions. Identity alone is insufficient. |
| [AgentExecutionTrace](../../ArchLucid.Contracts/Agents/AgentExecutionTrace.cs), [AgentExecutionTraceRecorder](../../ArchLucid.AgentRuntime/AgentExecutionTraceRecorder.cs) | Records prompt/model metadata, sampling settings, attempts and parsed result. Inline prompt and raw-response fields are truncated at 8,192 characters; optional redaction is applied before storage, and real-mode forensic persistence is invoked separately. Full-content pointers/fallback and failure fields exist. | Excellent forensic basis, but a trace row does not guarantee availability of exact original request/response bytes. Establish which accepted stage inputs are retained, redacted, truncated, missing or deliberately erased. Do not bypass privacy controls. |
| [Comparison replay](../library/COMPARISON_REPLAY.md) | Artifact, regenerate and verify modes with persisted comparison records. | Reuse the mode separation and drift reporting; not evidence of complete historical engine replay. |
| [SecureNow native question replay](../securenow/EVIDENCE_LAB_NATIVE_QUESTION_REPLAY.md), [replay reconciliation](../securenow/EVIDENCE_LAB_REPLAY_RECONCILIATION.md) | Existing offline question replay tooling and reconciliation guidance. | Reuse this isolated replay seam; assess actual finding/path and engine coverage, not merely question-answer parity. |

No universal historical execution capsule, versioned executable retention guarantee or complete provider-independent replay path was established by this inspection. Absence from targeted inspection is not proof that a feature does not exist elsewhere. Revalidate against current master, open PRs and applicable RC before implementation.

## 4. Shared historical analysis record

Extend the existing sealed manifest, evidence pins, trace persistence, checkpoint and audit infrastructure rather than introduce a competing authority store. A proposed versioned replay descriptor references immutable artifacts by scoped identifiers and digests:

- Tenant/workspace/project, original run and snapshot IDs, finding identity, stage/dependency graph, collection timestamps and completeness.
- Exact authorized source evidence, graph snapshots, external tool results and effective policy/exception/asset assertion versions.
- Engine build/commit and content digest, schema and canonicalization versions, effective configuration, solver/runtime/dependency versions, and executable/package/image digests where replay is promised.
- Recorded accepted AI stage inputs/outputs, prompt template and content identity, model/provider/deployment/version when known, parameters, tool invocations, attempt lineage, validation and quality disposition. Mark incomplete metadata explicitly.
- Intermediate results required to reconstruct decisions, including negative conclusions and missing coverage; reuse FND-075/076/083–086. Eviction of optional performance caches must not destroy required historical evidence.
- Verification outcomes, independent check identity, human decisions, confidence limitations, original findings and sealed decision artifacts.
- Artifact content hashes, integrity/signature metadata, applicable retention policy and explicit availability classification.

Store artifacts only through authorized existing persistence boundaries. Bind the descriptor to the original sealed chain without silently changing legacy manifest hashing or historical identities. Version any new commitment scheme; verify compatible migration behavior and external anchoring where required. Digests identify and detect changes but do not substitute for the bytes, attest to the truth of findings, or protect against wholesale replacement without a trusted commitment.

## 5. Provider-independent deterministic replay

Introduce a restricted recorded-result adapter at the existing agent/external-input boundary, not a second production inference framework. The adapter should resolve the exact accepted input artifact by original run, stage, attempt, dependency and content identity; distinguish raw response replay from typed-result replay. Typed-result playback can reproduce downstream processing, but cannot prove that the original parser would accept a missing raw response.

A replay plan selects the historical engine versions and validates every required artifact before execution. Use an isolated, resource-bounded worker with deny-by-default network, no live credentials, no customer mutation, no outbound AI calls, and no implicit fallback to current policies, collectors or models. Treat stored artifacts as untrusted data; archived executables require signature/digest verification, sandboxing and explicit approval. Preserve time-dependent inputs, stable ordering and seeds where relevant. Where older execution environments cannot be retained safely or legally, downgrade the promised replay level.

Compare versioned semantic outputs separately from original byte-level integrity. Exclude only demonstrated nonsemantic generated IDs and timestamps; preserve security-relevant times, evidence scope, uncertainty and authority. Reuse FND-062/078/084/086. A mismatch is a result to investigate, not an excuse to overwrite the historical finding.

Record replay as a separate linked, authorized audit operation; never change the original sealed chain or grant a replay authority automatically. Current replay rebuild modes have persistence side effects and must not be used as an unqualified read-only historical verification path.

## 6. Privacy, retention and availability

Retention must be tenant-approved, purpose-limited, region-appropriate, encrypted, access-controlled and consistent with deletion obligations, legal holds, contractual terms and provider restrictions. Do not capture secrets or hidden model reasoning; preserve only lawful, necessary artifact content. Respect existing prompt redaction and forensic-storage policies.

Define a retention/availability matrix for each reproducibility mode and artifact class. Prefer a retained authorized typed result where raw content is unnecessary or prohibited. If a raw prompt/response is redacted, its retained form is a derived artifact, not a byte-identical original. Mark partial, unavailable, expired, erased, tampered or incompatible inputs and refuse claims that depend on missing content. Preserve non-sensitive audit/availability metadata only when policy permits. Historical reproducibility guarantees must be explicitly bounded by the authorized retention period and artifact completeness.

## 7. Verification and acceptance

- Reconstruct a sealed ArchLucid run and SecureNow finding from retained evidence; verify original integrity and source scope.
- Disable provider access and current collectors; replay an authorized representative historical case using recorded results and pinned deterministic components. Assert zero live provider or customer mutation calls.
- Change current model, policies, engine version and clock. Verify the historical mode does not silently use them and that a separate current reassessment is labeled accordingly.
- Cover missing, truncated, redacted, deleted, tampered and wrong-attempt artifacts; unsupported schemas; mismatched binaries; unavailable tools; stale snapshots; cross-tenant and cross-project access; timeout/cancellation.
- Compare stage-level and final semantic results against independently pinned historical expectations; inject counterexamples that disprove a previously recorded conclusion.
- Confirm historical chain immutability and authorization of separate replay reports; audit all material differences, proof scope, unavailable inputs and version changes.
- Measure storage, retrieval and isolated execution costs, retention enforcement and replay latency. Run representative restored-artifact tests, not just in-memory fixtures.
- Expose distinct statuses: reconstructed, reproduced within stated scope, drift detected, independently supported/refuted, partial, unavailable. Never equate missing evidence with no vulnerability or model agreement with proof.

## 8. Critical backlog disposition

Existing FND-005/008/009/019/052/059/069–071/075–076/078–079/083–086 and TB-2106 already cover related foundations. Do not create duplicate storage, provenance or comparison frameworks. The following narrowly scoped cross-product integration gaps are recorded as Critical backlog items, subject to current implementation revalidation.

| ID | Critical slice | Exit evidence |
| --- | --- | --- |
| FND-094 | Historical replay descriptor and sealed artifact completeness | Versioned scoped descriptor binds required evidence, effective policies, accepted AI results, engine/configuration and lineage; explicit availability and legacy compatibility tests. |
| FND-095 | Provider-independent recorded-input replay and historical execution isolation | Replay representative original conclusions with network/provider access disabled and pinned compatible deterministic stages; no live substitution, original-chain mutation or scope bypass. |
| FND-096 | Governed reproducibility retention and artifact availability | Reuse existing forensic, evidence and checkpoint retention; validate redaction, expiration, deletion, missing/tampered artifacts, access and restoration without overpromising fidelity. |
| FND-097 | Cross-product historical replay equivalence and independent revalidation | Independent regression corpus spanning ArchLucid and SecureNow, semantic drift checks and explicit reconstruction/reproduction/revalidation outcomes; test historical model retirement and changes to current engines/policies. |

FND-094–097 are assigned in the active backlog following the remediation portfolio entries FND-087–093. FND-094/096 are prerequisites for reliable FND-095; develop FND-097 assurance alongside each slice rather than defer it. Prefer extending existing replay contracts and small verified adoption increments.

## 9. Decision and open issues

Historical reproducibility is an evidence-retention and deterministic execution problem, not a requirement that an LLM recreate its original response. A customer may challenge a recorded claim and an independent check may refute it. Preserve both the original history and the later adjudication.

Open decisions: exact supported historical replay horizon; which execution artifacts are legally and operationally retainable; semantic equality contracts; the complete set of nondeterministic boundaries; migration of legacy rows with incomplete traces; and deployment and resource limits of isolated historical workers. Do not activate or claim complete reproducibility until these requirements are verified. Under the current owner instruction, comprehensive builds belong to RC49; master-targeted work uses focused validation unless separately authorized.
