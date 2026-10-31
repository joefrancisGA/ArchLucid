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

    internal static string FormatSponsorSafeConcreteGapLine() => FailedPlain;

    internal static string FormatSponsorFirstPageEvidenceSourceCell(ProofPackageCompletenessResponse proof)
    {
        ArgumentNullException.ThrowIfNull(proof);

        if (proof.DemoTenantWarningRequired)
            return FailedPlain;

        return proof.BuyerSafeRedactionProfile.Length > 0
            ? $"{FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(proof.BuyerSafeRedactionProfile)} — tenant-scoped persisted proof fields."
            : "**Tenant evidence** — persisted proof fields available; redaction profile was not stored.";
    }
}
