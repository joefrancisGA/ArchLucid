using System.Net;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed record JiraOutboundIssueHttpResult(bool Ok, string? IssueKey, string? RemoteId, HttpStatusCode StatusCode, string? ErrorDetail);
