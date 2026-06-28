namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateEvidenceReport
{
    public required string BaseUrl
    {
        get;
        init;
    }

    public required string RunId
    {
        get;
        init;
    }

    public string? UiBaseUrl
    {
        get;
        init;
    }

    public string? UiBaseUrlSource
    {
        get;
        init;
    }

    public required DateTime GeneratedUtc
    {
        get;
        init;
    }

    public required IReadOnlyList<ShipGateEvidenceGateResult> Gates
    {
        get;
        init;
    }

    public string? RepositoryRoot
    {
        get;
        init;
    }

    public string? JsonArtifactPath
    {
        get;
        init;
    }

    public string? MarkdownArtifactPath
    {
        get;
        init;
    }

    public ShipGateEvidenceVerdict OverallVerdict => ShipGateEvidenceVerdictRollup.FromGates(Gates);

    public bool AnyFail => OverallVerdict == ShipGateEvidenceVerdict.Fail;

    public bool AnyUnknown => Gates.Any(static gate => gate.Verdict == ShipGateEvidenceVerdict.Unknown);

    internal ShipGateEvidenceReport WithOutputMetadata(
        string? repositoryRoot,
        string? jsonArtifactPath,
        string? markdownArtifactPath) =>
        new()
        {
            BaseUrl = BaseUrl,
            RunId = RunId,
            UiBaseUrl = UiBaseUrl,
            UiBaseUrlSource = UiBaseUrlSource,
            GeneratedUtc = GeneratedUtc,
            Gates = Gates,
            RepositoryRoot = repositoryRoot,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
        };
}
