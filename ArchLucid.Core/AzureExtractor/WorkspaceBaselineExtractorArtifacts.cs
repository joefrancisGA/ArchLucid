namespace ArchLucid.Core.AzureExtractor;

/// <summary>Scoped Azure extractor baseline signals for workspace onboarding UI.</summary>
public sealed record WorkspaceBaselineExtractorArtifacts(bool HasAnyInWorkspace, string? LatestScriptVersion);
