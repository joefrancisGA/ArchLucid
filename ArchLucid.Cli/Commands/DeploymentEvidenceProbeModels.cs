namespace ArchLucid.Cli.Commands;

internal sealed class DeploymentEvidenceProbeResult
{
    internal DeploymentEvidenceProbeResult(
        string name,
        int statusCode,
        bool passed,
        string detailLine,
        IReadOnlyList<string> nextSteps,
        string? bodyPreview = null)
    {
        Name = name;
        StatusCode = statusCode;
        Passed = passed;
        DetailLine = detailLine;
        NextSteps = nextSteps;
        BodyPreview = bodyPreview;
    }

    internal string Name
    {
        get;
    }

    internal int StatusCode
    {
        get;
    }

    internal bool Passed
    {
        get;
    }

    internal string DetailLine
    {
        get;
    }

    internal IReadOnlyList<string> NextSteps
    {
        get;
    }

    internal string? BodyPreview
    {
        get;
    }
}

internal sealed class DeploymentEvidenceProbeBundle
{
    internal DeploymentEvidenceProbeBundle(
        IReadOnlyList<DeploymentEvidenceProbeResult> probes,
        bool allRequiredPassed)
    {
        Probes = probes;
        AllRequiredPassed = allRequiredPassed;
    }

    internal IReadOnlyList<DeploymentEvidenceProbeResult> Probes
    {
        get;
    }

    internal bool AllRequiredPassed
    {
        get;
    }
}
