using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Tenancy;

/// <summary>
///     Maps trial signup <c>IndustryVertical</c> to a welcome pre-seed <see cref="ArchitectureRequest" /> aligned with
///     <c>templates/briefs/</c> vertical packs.
/// </summary>
public static class TrialVerticalWelcomeRequestFactory
{
    /// <summary>Builds a deterministic welcome request id for the tenant.</summary>
    public static ArchitectureRequest Create(Guid tenantId, string? industryVertical)
    {
        string requestId = FormatRequestId(tenantId);
        string? normalized = NormalizeVertical(industryVertical);

        if (normalized is null)
            return CreateDefaultWelcomeRequest(requestId);

        if (string.Equals(normalized, "Healthcare", StringComparison.Ordinal))
            return CreateHealthcareRequest(requestId);

        if (string.Equals(normalized, "Financial Services", StringComparison.Ordinal))
            return CreateFinancialServicesRequest(requestId);

        if (string.Equals(normalized, "Retail", StringComparison.Ordinal))
            return CreateRetailRequest(requestId);

        if (string.Equals(normalized, "Government / Public Sector", StringComparison.Ordinal))
            return CreatePublicSectorRequest(requestId);

        if (string.Equals(normalized, "Technology", StringComparison.Ordinal))
            return CreateTechnologyRequest(requestId);

        return CreateDefaultWelcomeRequest(requestId);
    }

    private static string FormatRequestId(Guid tenantId)
    {
        string requestId = $"trial-welcome-{tenantId:N}".ToLowerInvariant();

        if (requestId.Length > 64)
            return requestId[..64];

        return requestId;
    }

    private static string? NormalizeVertical(string? industryVertical)
    {
        if (string.IsNullOrWhiteSpace(industryVertical))
            return null;

        return industryVertical.Trim();
    }

    private static ArchitectureRequest CreateDefaultWelcomeRequest(string requestId)
    {
        return new ArchitectureRequest
        {
            RequestId = requestId,
            Description =
                "Design a minimal secure Azure web API with private SQL connectivity and managed identity for secrets — trial welcome pre-seed.",
            SystemName = "TrialWelcomeApi",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Private connectivity", "Managed identity"],
            RequiredCapabilities = ["Azure SQL", "App Service or Container Apps"]
        };
    }

    private static ArchitectureRequest CreateHealthcareRequest(string requestId)
    {
        return new ArchitectureRequest
        {
            RequestId = requestId,
            SystemName = "MeridianFhirHub",
            Environment = "staging",
            CloudProvider = CloudProvider.Azure,
            Description = "Meridian Care Coordination FHIR Hub — HIPAA minimum necessary and regional PHI residency.",
            Constraints =
            [
                "No PHI in public CDN or third-party APM without BAA",
                "Customer-managed keys for PHI stores"
            ],
            RequiredCapabilities =
            [
                "FHIR R4 compliant APIs",
                "Field-level security labels",
                "ADT event ingestion with ordering"
            ],
            Assumptions =
            [
                "Two hospital IDs onboarded first wave",
                "Identity from Entra ID with clinical roles"
            ]
        };
    }

    private static ArchitectureRequest CreateFinancialServicesRequest(string requestId)
    {
        return new ArchitectureRequest
        {
            RequestId = requestId,
            SystemName = "NorthRiverCoreBankingApi",
            Environment = "staging",
            CloudProvider = CloudProvider.Azure,
            Description = "NorthRiver Core Banking API — GLBA/SOX aligned read path with mainframe bridge.",
            Constraints =
            [
                "Azure primary region only for customer metadata",
                "Monthly non-prod+staging spend under 18000 USD"
            ],
            RequiredCapabilities =
            [
                "Tokenized partner APIs",
                "Tamper-evident audit pipeline",
                "Regional DR with tested restore"
            ],
            Assumptions =
            [
                "Mainframe remains system of record for balances",
                "Partners present OAuth2 client credentials"
            ]
        };
    }

    private static ArchitectureRequest CreateRetailRequest(string requestId)
    {
        return new ArchitectureRequest
        {
            RequestId = requestId,
            SystemName = "HarborOneCheckout",
            Environment = "production",
            CloudProvider = CloudProvider.Azure,
            Description = "HarborOne omnichannel checkout — PCI-DSS CDE segmentation and tokenized payments.",
            Constraints =
            [
                "CDE isolated subnets with deny-by-default east-west",
                "No PAN in logs or partner webhooks"
            ],
            RequiredCapabilities =
            [
                "Payment intents with idempotent finalize",
                "ASV-scoped perimeter documented"
            ],
            Assumptions =
            [
                "PSP provides network tokens",
                "Stores use hardened POS agents"
            ]
        };
    }

    private static ArchitectureRequest CreatePublicSectorRequest(string requestId)
    {
        return new ArchitectureRequest
        {
            RequestId = requestId,
            SystemName = "BalticCitizenGateway",
            Environment = "production",
            CloudProvider = CloudProvider.Azure,
            Description = "Baltic EU citizen services gateway — GDPR Art.32 and DPIA-driven minimization.",
            Constraints =
            [
                "Data residency EU West pair only",
                "No US-region failover that moves EU citizen data"
            ],
            RequiredCapabilities =
            [
                "DSR automation hooks",
                "Legal basis metadata per dataset",
                "Offline kiosk sync with audit"
            ],
            Assumptions =
            [
                "National eID for strong auth",
                "Special category data isolated modules"
            ]
        };
    }

    private static ArchitectureRequest CreateTechnologyRequest(string requestId)
    {
        return new ArchitectureRequest
        {
            RequestId = requestId,
            SystemName = "OrbitStackControlPlane",
            Environment = "staging",
            CloudProvider = CloudProvider.Azure,
            Description = "OrbitStack multi-tenant SaaS control plane — SOC 2 aligned MVP for design partners.",
            Constraints =
            [
                "Per-tenant encryption boundaries",
                "No cross-tenant workers without signed job tokens"
            ],
            RequiredCapabilities =
            [
                "SCIM deprovision hooks",
                "Per-tenant LLM spend caps",
                "Tenant isolation tests in CI"
            ],
            Assumptions =
            [
                "Stripe metering for usage billing",
                "Entra B2B for admin access"
            ]
        };
    }
}
