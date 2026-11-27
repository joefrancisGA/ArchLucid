using System.Net;

namespace ArchLucid.Application.Integrations.AzureBoards.Outbound;

public sealed record AzureBoardsOutboundIssueHttpResult(
    bool Ok,
    string? WorkItemId,
    string? RemoteId,
    HttpStatusCode StatusCode,
    string? ErrorDetail);
