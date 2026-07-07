namespace ArchLucid.Cli.Stack.Doctor;

/// <summary>Deployment readiness profiles for <c>archlucid stack doctor</c> (TB-658).</summary>
internal static class StackDoctorProfile
{
    internal const string FirstPilotMinimum = "FirstPilotMinimum";
    internal const string StagingRealLlm = "StagingRealLlm";
    internal const string ProductionLike = "ProductionLike";
    internal const string StagingDeploy = "staging-deploy";
    internal const string PostDeploy = "post-deploy";

    private static readonly string[] AllProfiles =
    [
        FirstPilotMinimum,
        StagingRealLlm,
        ProductionLike,
        StagingDeploy,
        PostDeploy,
    ];

    internal static bool TryNormalize(string? raw, out string normalized)
    {
        normalized = string.Empty;

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        string trimmed = raw.Trim();

        foreach (string profile in AllProfiles)
        {
            if (string.Equals(trimmed, profile, StringComparison.OrdinalIgnoreCase))
            {
                normalized = profile;

                return true;
            }
        }

        return false;
    }

    internal static string DescribeUsageList() =>
        string.Join("|", AllProfiles);
}
