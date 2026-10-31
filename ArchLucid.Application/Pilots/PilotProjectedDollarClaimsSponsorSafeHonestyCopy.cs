namespace ArchLucid.Application.Pilots;

internal static class PilotProjectedDollarClaimsSponsorSafeHonestyCopy
{
    internal const string NoPlain = "**No** — do not lead with projected USD savings";

    internal static string FormatProofPackageCell(bool projectedDollarClaimsSponsorSafe) =>
        projectedDollarClaimsSponsorSafe ? "Yes" : NoPlain;

    internal static string FormatRoiBaselineInputsTableCell(bool projectedDollarClaimsSponsorSafe) =>
        projectedDollarClaimsSponsorSafe ? "**Yes**" : NoPlain;
}
