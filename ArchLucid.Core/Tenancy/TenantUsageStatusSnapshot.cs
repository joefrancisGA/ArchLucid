namespace ArchLucid.Core.Tenancy;

/// <summary>Server-side usage headroom for paid-tenant expansion nudges (Improvement #5).</summary>
public sealed record TenantUsageStatusSnapshot(
    bool IsTrial,
    string? CommercialTier,
    int SeatsUsed,
    int? SeatsLimit,
    int WorkspacesUsed,
    int? WorkspacesLimit);
