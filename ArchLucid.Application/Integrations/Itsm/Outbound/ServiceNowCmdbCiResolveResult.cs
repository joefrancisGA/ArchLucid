using System.Net;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed record ServiceNowCmdbCiResolveResult(bool Fatal, string? SysId, HttpStatusCode? StatusCode, string? ErrorDetail);
