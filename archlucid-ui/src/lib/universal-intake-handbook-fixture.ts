/** Newline-preserving excerpt shaped like ARCHITECTURE_HANDBOOK platform documentation. */
export const HANDBOOK_INTAKE_INFERENCE_FIXTURE = `Assumptions
- Azure-first hosting (Container Apps, SQL, private networking) unless a pilot diverges.

Actors
Actor
How they touch the system
Operators / architects
Browser — Architect workspace (Next.js)
Sponsors / evaluators
Same UI; sponsor-oriented views and packages
CLI / CI automation
HTTPS — API (API key or JWT), optionally via Front Door / APIM
Diagram — system overview

Trust edges (summary)
- UI proxies to ArchLucid.Api with scope and correlation headers.
- API authenticates via Entra ID / JWT or API keys (environment-dependent).

FinOps and capacity drivers
Operational levers are config-driven circuit breakers and GA/budget gates.

Observability map
Metrics and traces flow through OpenTelemetry collectors into centralized monitoring.

SQL geo failover group listener is the app connection target. Drill: confirm listener → force failover → smoke /health/ready → record actual RTO vs targets.`;
