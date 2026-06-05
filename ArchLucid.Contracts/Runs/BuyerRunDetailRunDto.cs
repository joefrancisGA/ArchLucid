namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Buyer-safe run metadata on <see cref="BuyerRunDetailSummaryDto" /> — identifiers and flags only, no snapshot subgraphs (TB-283).
/// </summary>
public sealed class BuyerRunDetailRunDto
{
    public Guid RunId
    {
        get;
        set;
    }

    public string ProjectId
    {
        get;
        set;
    } = "";

    public string? Description
    {
        get;
        set;
    }

    public string? DisplayName
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public Guid? GoldenManifestId
    {
        get;
        set;
    }

    public bool HasGraphSnapshot
    {
        get;
        set;
    }

    public bool HasGoldenManifest
    {
        get;
        set;
    }

    public bool HasFindingsSnapshot
    {
        get;
        set;
    }

    public bool RunDegradedExecution
    {
        get;
        set;
    }

    public IReadOnlyList<string> DegradedExecutionAgents
    {
        get;
        set;
    } = [];
}
