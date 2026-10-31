# SecureNow cold-start plan — COLD-01, COLD-02 and COLD-06

## First business read (COLD-01)
After observing a NEW API Container Apps revision reach `/health/ready`, run:

```bash
python scripts/ci/probe_securenow_cold_read.py \
  --base-url https://YOUR-STAGING-API \
  --api-key "$ARCHLUCID_API_KEY" \
  --samples 5 \
  --output artifacts/securenow/cold-start/first-path-read.json
```

The probe makes only authenticated GET requests to `/v1/operational-security/paths?page=1&pageSize=1`. It records the first-request wall time and subsequent warm median separately. It fails closed on non-200 status; never include credentials in artifacts. Capture the revision ID, environment, release SHA and readiness timestamp separately before comparing results. Running after another caller warmed the service is **not a cold request**. This script is opt-in; CI cannot manufacture a truly fresh deploy.

## Startup dependency inventory (COLD-02)
The hosted Azure extractor composition registers collection ingest, run-trigger service, Azure Automation HTTP client and cloud readers through DI; this registration alone is **not evidence of eager construction**. SQL pool warmup already exists in `SqlConnectionPoolWarmupHostedService`, which performs up to 32 connection opens when enabled. Review hosted service startup durations and first request traces before adding further warmers. Do not defer tenant/auth/configuration validation.

## Regression evidence (COLD-06)
The performance workflow executes the cold-read reporter's tests without credentials or network access. A deployed staging capture is required to populate actual cold/warm numbers; no production latency SLA gate is implied.

## Deferred
COLD-03 targeted warm-up, COLD-04 host separation and COLD-05 ReadyToRun/trim/image changes require measured Phase A/B results and full published-build compatibility checks. No paid sizing or startup behavior was changed.
