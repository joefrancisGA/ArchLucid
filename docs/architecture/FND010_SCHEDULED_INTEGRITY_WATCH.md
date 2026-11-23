# FND-010 independent scheduled integrity watch

An opt-in GitHub Actions workflow (`fnd010-independent-integrity-watch.yml`) checks the signed authorization journal **hourly** at minute 17 UTC. It requires repository variable `FND010_MONITOR_ENABLED=true`; otherwise the job is skipped. This is intentionally **not enabled** by the PR.

## Independent runner prerequisites
- A separately administered self-hosted Linux runner with label `fnd010-independent-monitor`, outside the authorization database trust boundary.
- `/etc/fnd010/trusted-checkpoint.json` from independent immutable storage and `/etc/fnd010/pinned-verification.pem` from an independently governed trust store; do not place untrusted job-supplied keys there.
- `/usr/local/bin/fnd010-readonly-sqlcmd` wrapping an authenticated, **read-only** SQL connection without credentials on command lines. The runner must not have DML privileges.
- Repository variable `FND010_PINNED_KEY_ID` set to the exact approved versioned signing-key URI.
- The runner must periodically refresh trusted checkpoints from immutable storage under an independent monotonic anchor. A static checkpoint detects alterations at that anchor but cannot guarantee recent writes are covered.
- Restrict who can edit the workflow, runner labels, repository variables and GitHub issues. GitHub issues are notification artifacts, not an independent SIEM or paging destination.

## Alert behavior
The verifier exits nonzero on integrity failure or monitoring errors. The runner emits a bounded critical incident JSON without secrets. The workflow uploads a 90-day incident artifact, opens or comments on a deduplicated GitHub issue, and fails the job. GitHub issue delivery is best effort; a separate security alert channel and heartbeat/missed-run alert are required before production claims of continuous monitoring.

## Release limitations
No self-hosted runner, production Azure identity, immutable checkpoint retrieval, production scheduler activation, SIEM routing or on-call paging has been provisioned. This PR supplies the orchestration contract and unit tests only. End-to-end testing with independent infrastructure is required.
