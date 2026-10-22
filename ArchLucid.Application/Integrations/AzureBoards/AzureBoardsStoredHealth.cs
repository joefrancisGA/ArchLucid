namespace ArchLucid.Application.Integrations.AzureBoards;

/// <summary>Last-known Azure Boards reachability derived from SQL, not a live probe.</summary>
public sealed record AzureBoardsStoredHealth(
    string Status,
    bool Reachable,
    string Summary,
    int? StatusCode);
