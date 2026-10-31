namespace ArchLucid.Application.Pilots;

internal static class PilotSupportRunIdHonestyCopy
{
    internal const string MissingPlain =
        "Support run id missing — this export cannot be anchored to a persisted architecture review identity.";

    internal static string FormatProofPackageCell(bool supportRunIdPresent) =>
        supportRunIdPresent ? "Present" : MissingPlain;

    internal static string FormatSponsorSafeConcreteGapLine() => MissingPlain;
}
