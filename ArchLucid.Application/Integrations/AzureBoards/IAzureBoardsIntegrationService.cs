namespace ArchLucid.Application.Integrations.AzureBoards;

/// <summary>Azure Boards discovery, stored health, live probes, and settings helpers.</summary>
public interface IAzureBoardsIntegrationService
{
    Task<AzureBoardsStoredHealth> GetStoredHealthAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<AzureBoardsConnectionTestResult> TestConnectionAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> ListProjectsAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> ListWorkItemTypesAsync(Guid tenantId, string projectName, CancellationToken cancellationToken);
}

public sealed record AzureBoardsConnectionTestResult(bool Ok, string Summary, int? StatusCode);
