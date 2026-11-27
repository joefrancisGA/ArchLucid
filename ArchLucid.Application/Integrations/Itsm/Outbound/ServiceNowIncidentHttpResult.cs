using System.Net;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed record ServiceNowIncidentHttpResult(bool Ok, string? SysId, string? Number, HttpStatusCode StatusCode, string? ErrorDetail);
