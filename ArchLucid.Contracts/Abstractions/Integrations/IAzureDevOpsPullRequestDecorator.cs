namespace ArchLucid.Contracts.Abstractions.Integrations;

/// <summary>Posts ArchLucid commit evidence to an Azure DevOps PR (status + thread comment).</summary>
public interface IAzureDevOpsPullRequestDecorator
{
    /// <summary>
    ///     After a golden manifest commit, posts a PR status and a thread comment: golden-manifest delta Markdown when
    ///     compare can be loaded, otherwise a run summary with finding counts and an optional operator deep link.
    /// </summary>
    Task PostManifestDeltaAsync(
        AzureDevOpsManifestDeltaRequest request,
        AzureDevOpsPullRequestTarget target,
        CancellationToken cancellationToken);
}
