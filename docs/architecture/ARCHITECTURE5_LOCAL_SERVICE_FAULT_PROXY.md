# Architecture #5: local service fault-proxy drill

Start a **disposable local ArchLucid API** (for example via `docker compose --profile full-stack up -d --build`) and verify `http://127.0.0.1:5000/health/live` responds 200.

```bash
python3 scripts/ci/local_service_fault_proxy.py \
  --upstream-port 5000 \
  --approval I_APPROVE_LOCAL_DISPOSABLE_FAULT_TEST \
  --output artifacts/local-service-recovery.json
```

The harness refuses non-local upstreams, requires explicit approval, and creates an ephemeral localhost proxy. It forwards `/health/live` normally, injects HTTP 503 at the **proxy** for a bounded interval, then measures the time until the proxy again reports upstream HTTP 200. It does not stop SQL Server, interrupt actual application dependencies, mutate persistent data, or validate end-to-end state recovery.

The focused CI tests use a local stub HTTP server and **do not start Docker Compose**. For real dependency recovery and integrity evidence, the next stage must introduce a dedicated disposable deployment with test-only SQL/dependency fault injection, verified dataset fingerprints before/after, and rollback/retry assertions. Do not point this harness at a production service, even via localhost forwarding.
