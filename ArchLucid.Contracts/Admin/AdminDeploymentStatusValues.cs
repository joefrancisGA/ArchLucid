namespace ArchLucid.Contracts.Admin;

public static class AdminDeploymentStatusValues
{
    public const string Unknown = "Unknown";

    public const string AgreementMatch = "Match";

    public const string AgreementMismatch = "Mismatch";

    public const string AgreementPartial = "Partial";

    public const string OverallHealthy = "Healthy";

    public const string OverallWarning = "Warning";

    public const string OverallFailed = "Failed";
}
