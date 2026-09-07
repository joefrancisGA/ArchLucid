namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Committed frontier capture fixture for offline novelty measurement (DX-20).
///     Not a named-model benchmark transcript.
/// </summary>
public sealed class InsightDensityFrontierCaptureFixture
{
    public const string SchemaId = "archlucid.insight-density-frontier-capture.v1";

    public const double MaxExpectedNoveltyDeviation = 0.001;

    public string Schema
    {
        get;
        init;
    } = SchemaId;

    public string? Id
    {
        get;
        init;
    }

    public required string ArchitecturePackageSha256
    {
        get;
        init;
    }

    public required Guid FindingsSnapshotId
    {
        get;
        init;
    }

    public Guid? RunId
    {
        get;
        init;
    }

    public required DateTimeOffset CapturedUtc
    {
        get;
        init;
    }

    public required string Label
    {
        get;
        init;
    }

    public List<string> DecisionGradeFindingTitles
    {
        get;
        init;
    } = [];

    public List<string> NoveltyFindingIds
    {
        get;
        init;
    } = [];

    public List<InsightDensityFrontierCaptureFixtureFinding> ArchlucidFindings
    {
        get;
        init;
    } = [];

    public required InsightDensityFrontierCaptureBaselineDocument FrontierBaseline
    {
        get;
        init;
    }

    public double ExpectedNoveltyPercentage
    {
        get;
        init;
    }
}
