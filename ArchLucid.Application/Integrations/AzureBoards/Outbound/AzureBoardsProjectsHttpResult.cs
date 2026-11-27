using System.Net;

namespace ArchLucid.Application.Integrations.AzureBoards.Outbound;

public sealed record AzureBoardsProjectsHttpResult(
    bool Ok,
    IReadOnlyList<string> ProjectNames,
    HttpStatusCode StatusCode,
    string? ErrorDetail);
