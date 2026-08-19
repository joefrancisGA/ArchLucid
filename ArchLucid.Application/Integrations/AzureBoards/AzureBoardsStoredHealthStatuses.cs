namespace ArchLucid.Application.Integrations.AzureBoards;

/// <summary>Status tokens for stored Azure Boards health (no live Azure DevOps probe).</summary>
public static class AzureBoardsStoredHealthStatuses
{
    public const string NotConfigured = "not_configured";

    public const string NotTested = "not_tested";

    public const string Healthy = "healthy";

    public const string Unhealthy = "unhealthy";
}
