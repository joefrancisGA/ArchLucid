namespace ArchLucid.Contracts.Abstractions.Integrations;

/// <summary>Input for <see cref="IAzureDevOpsPullRequestDecorator.PostManifestDeltaAsync" /> after an authority run commits.</summary>
public sealed record AzureDevOpsManifestDeltaRequest(
    Guid ManifestId,
    Guid RunId,
    Guid TenantId,
    Guid WorkspaceId,
    Guid ProjectId,
    Guid? PreviousRunId,
    IReadOnlyList<AuthorityRunCompletedFindingLink> Findings);

/// <summary>One finding row from <c>com.archlucid.authority.run.completed</c> for PR summary text.</summary>
public sealed record AuthorityRunCompletedFindingLink(string FindingId, string DeepLinkUrl, string? Severity);
