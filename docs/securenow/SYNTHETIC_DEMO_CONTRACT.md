# SecureNow synthetic buyer-demo contract (GTM-03)

**Internal offline evidence only — not pilot results, buyer validation, release GO or permission to deploy.**

The ten-lane workpack emits a deterministic illustrative storage exposure example. Its role is demonstrating the boundary from hypothetical evidence through advisory human action to an explicitly **NOT_VERIFIED** result. No real capture, verified postcondition, observed attack or customer outcome is included.

The independent Python auditor (scripts/ci/audit_securenow_synthetic_demo.py) pins the generated JSON's shape and claim limitations. It fails on newly introduced fields (including buyer identities or ROI), changed provenance, simulated SecureNow mutation, upgraded verification, missing later-capture inputs, duplicate JSON keys, symlinks or malformed inputs. Its report contains safe reason codes and preserves betaGo=false. Conformance is **never** market proof or beta approval.

Offline commands:

~~~sh
python3 -m unittest scripts.ci.test_audit_securenow_synthetic_demo -v
python3 scripts/ci/build_two_product_commercial_workpack.py --out-dir artifacts/commercial-readiness
python3 scripts/ci/audit_securenow_synthetic_demo.py \
  --input artifacts/commercial-readiness/securenow-synthetic-demo.json \
  --output artifacts/commercial-readiness/synthetic-contract-audit.json
~~~

The non-deploying PR workflow (securenow-synthetic-demo-contract.yml) checks the actual generated artifact and uploads its report. Any intentional copy or schema changes must update the generator and independent contract together under code review. This does **not** validate a live tenant, pilot readiness, revenue, ROI, or a beta release gate.
