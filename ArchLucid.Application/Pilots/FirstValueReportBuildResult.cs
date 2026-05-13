using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Canonical first-value Markdown plus classifications for PDF watermarks.</summary>
public sealed record FirstValueReportBuildResult(
    string Markdown,
    FirstValueEvidenceCompletenessLevel EvidenceCompleteness,
    SponsorProofReadinessClassification SponsorProofReadiness,
    TenantFirstValueReportBrandingForExport? TenantFirstValueReportBranding = null);
