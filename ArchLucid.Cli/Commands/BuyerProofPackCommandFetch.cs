namespace ArchLucid.Cli.Commands;

/// <summary>API fetch + repo inputs for <see cref="BuyerProofPackCommand" />.</summary>
internal static class BuyerProofPackCommandFetch
{
    internal sealed record Success(
        string RunId,
        string RepoRoot,
        BuyerProofArtifacts Artifacts,
        string SponsorBriefText);

    internal static async Task<(Success? Result, int ExitCode, string? ErrorMessage)> RunAsync(
        BuyerProofPackCommandOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);

        string? repoRoot = ResolveRepoRoot(options.RepoRootOverride);

        if (repoRoot is null || !Directory.Exists(repoRoot))
        {
            return (
                null,
                CliExitCode.UsageError,
                "Could not locate repository root (docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md). Run from the repo tree or pass --repo-root.");
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        ApiConnectionOutcome outcome = await CliCommandShared.TryConnectToApiAsync(baseUrl, config, cancellationToken);

        if (outcome != ApiConnectionOutcome.Connected)
            return (null, CliCommandShared.ExitCodeForFailedConnection(outcome), null);

        string normalized = baseUrl.Trim().TrimEnd('/');
        using CliHttpProbeSession session = CliHttpProbeSession.ForApi(normalized, config, TimeSpan.FromMinutes(2));
        IBuyerProofArtifactCollector collector = new BuyerProofArtifactCollector();
        BuyerProofArtifactCollectionResult collection = await collector.CollectAsync(
            options.RunId,
            session,
            includePdf: true,
            cancellationToken);

        if (collection.Status == BuyerProofArtifactCollectionStatus.NotFound)
            return (null, CliExitCode.UsageError, $"Run '{collection.RunId}' was not found (or is out of scope).");

        if (collection.Status == BuyerProofArtifactCollectionStatus.GateFailed)
            return (null, CliExitCode.UsageError, collection.ErrorMessage);

        if (collection.Status != BuyerProofArtifactCollectionStatus.Success || collection.Artifacts is null)
            return (null, CliExitCode.OperationFailed, collection.ErrorMessage);

        string sponsorBriefSource = Path.Combine(repoRoot, "docs", "go-to-market", "EXECUTIVE_SPONSOR_BRIEF.md");

        if (!File.Exists(sponsorBriefSource))
        {
            return (
                null,
                CliExitCode.OperationFailed,
                $"Missing sponsor brief source: {sponsorBriefSource}");
        }

        string sponsorBriefText = await File.ReadAllTextAsync(sponsorBriefSource, cancellationToken);

        return (
            new Success(options.RunId, repoRoot, collection.Artifacts, sponsorBriefText),
            CliExitCode.Success,
            null);
    }

    private static string? ResolveRepoRoot(string? overridePath)
    {
        if (string.IsNullOrWhiteSpace(overridePath))
            return CliRepositoryRootResolver.TryResolveRepositoryRoot();

        string full = Path.GetFullPath(overridePath.Trim());

        return Directory.Exists(full) ? full : CliRepositoryRootResolver.TryResolveRepositoryRoot();
    }
}
