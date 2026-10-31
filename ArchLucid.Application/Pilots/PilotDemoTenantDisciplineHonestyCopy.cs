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
}
