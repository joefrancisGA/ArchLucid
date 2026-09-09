namespace ArchLucid.Core.Findings;

/// <summary>Candidate assumption extracted from in-batch prose (DX-55).</summary>
public sealed class ProseAssumptionCandidate
{
    public required string Statement
    {
        get;
        init;
    }

    public required string DocumentPath
    {
        get;
        init;
    }

    public required int LineNumber
    {
        get;
        init;
    }

    public required string QuotedSpan
    {
        get;
        init;
    }

    public string? LogicalPropertyName
    {
        get;
        init;
    }

    public string? ImpliedPropertyValue
    {
        get;
        init;
    }

    public string EvidenceRef => $"doc:{DocumentPath}#L{LineNumber}";
}
