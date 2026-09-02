using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Bootstrap;

internal static partial class TrialWelcomeWorkspaceSeed
{
    internal static IReadOnlyList<Finding> BuildFindings(Guid authorityRunId)
    {
        string rid = authorityRunId.ToString("N");

        return
        [
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-edge-headers",
                FindingType = "ArchitectureReview",
                Category = "Security",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Warning,
                Title = "Front Door still forwards legacy CDN forwarding headers",
                Rationale =
                    "Migrating traffic through Azure Front Door without stripping obsolete x-forwarded-* headers from the retired CDN lets session affinity and bot scoring drift. Normalize headers at the edge and add a WAF rule to reject ambiguous origin chains."
            },
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-sql-ha",
                FindingType = "ReliabilityReview",
                Category = "Reliability",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Info,
                Title = "Orders SQL failover pairs are documented but not yet validated under regional outage",
                Rationale =
                    "The design references geo-redundant SQL with automatic failover groups; run a game-day that forces read/write cutover while checkout traffic is replayed so recovery time stays inside the four-hour sponsor target."
            },
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-redis-tier",
                FindingType = "CostReview",
                Category = "Cost",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Warning,
                Title = "Redis Premium tier is oversized for non-peak months",
                Rationale =
                    "Session and cart cache is pinned to Premium P2 before load tests justify it. Start with burstable Premium P1 with autoscale policy tied to connection saturation and egress, then step up after Thanksgiving peak rehearsal."
            },
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-payment-callback",
                FindingType = "ComplianceReview",
                Category = "Compliance",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Error,
                Title = "Payment adapter callbacks lack signed replay protection",
                Rationale =
                    "Asynchronous PSP callbacks enter the adapter over mutual TLS but do not carry a rotating JWS profile yet, which weakens replay detection. Adopt provider-supported signature validation plus short-lived nonces before production cutover."
            },
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-observability",
                FindingType = "OperationalReview",
                Category = "Operational",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Info,
                Title = "Synthetic canaries stop at catalog path — extend through payment sandbox",
                Rationale =
                    "Availability tests cover storefront → BFF → catalog only. Add a nightly sandbox transaction through payment adapter with alert routing to commerce ops so silent checkout regressions surface before business hours."
            }
        ];
    }
}
