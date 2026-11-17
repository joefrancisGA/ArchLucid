using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

internal static class PilotDemoTenantDisciplineHonestyCopy
{
    internal const string FailedPlain =
        "**FAILED — non-negotiable demo warning.** Replace seeded identifiers before any sponsor-facing circulation.";

    internal const string PassPlain =
        "Pass — operator identifiers only per loaded tenant scope.";

    internal static string FormatProofPackageCell(bool demoTenantWarningRequired) =>
        demoTenantWarningRequired ? FailedPlain : PassPlain;

    /// <summary>Demo discipline follows persisted run deltas — not lagging proof-package JSON flags.</summary>
    internal static bool RequiresDemoDisciplineWarning(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        return deltas.IsDemoTenant;
    }

    internal static string FormatSponsorSafeConcreteGapLine() => FailedPlain;

    internal static string FormatSponsorFirstPageEvidenceSourceCell(
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(proof);
        ArgumentNullException.ThrowIfNull(deltas);

        if (RequiresDemoDisciplineWarning(deltas))
            return FailedPlain;

        return proof.BuyerSafeRedactionProfile.Length > 0
            ? $"{FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(proof.BuyerSafeRedactionProfile)} — tenant-scoped persisted proof fields."
            : "**Tenant evidence** — persisted proof fields available; redaction profile was not stored.";
    }
}
