namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Result of a successful Confluence page create.</summary>
public sealed record ConfluenceFirstValueReportPublishResponse(string? PageId, string? PageUrl);
