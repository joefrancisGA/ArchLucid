namespace ArchLucid.Application.Integrations.AzureBoards;

/// <summary>Azure Boards discovery, health probes, and settings helpers.</summary>
public interface IAzureBoardsIntegrationService
{
    Task<AzureBoardsConnectionTestResult> TestConnectionAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> ListProjectsAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> ListWorkItemTypesAsync(Guid tenantId, string projectName, CancellationToken cancellationToken);
}

public sealed record AzureBoardsConnectionTestResult(bool Ok, string Summary, int? StatusCode);
