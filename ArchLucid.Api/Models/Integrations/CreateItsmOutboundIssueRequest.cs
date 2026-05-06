namespace ArchLucid.Api.Models.Integrations;

public sealed class CreateItsmOutboundIssueRequest
{
    /// <summary><c>Jira</c> or <c>ServiceNow</c>.</summary>
    public string Provider { get; set; } = string.Empty;

    public string FindingId { get; set; } = string.Empty;
}

public sealed record CreateItsmOutboundIssueResponse(string Provider, string? ExternalKey);
