using System.Net;

namespace ArchLucid.Application.Integrations.AzureBoards.Outbound;

public sealed record AzureBoardsWorkItemTypesHttpResult(
    bool Ok,
    IReadOnlyList<string> WorkItemTypeNames,
    HttpStatusCode StatusCode,
    string? ErrorDetail);
