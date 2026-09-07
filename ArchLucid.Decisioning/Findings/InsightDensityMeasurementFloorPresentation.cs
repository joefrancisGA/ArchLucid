namespace ArchLucid.Decisioning.Findings;

/// <summary>Catalog vs run vs harness counts for stamp, finalize scorecard, and career exports (PC-01 / LK-14).</summary>
public sealed class InsightDensityMeasurementFloorPresentation
{
    public int CatalogEngineCount
    {
        get;
        init;
    }

    /// <summary>Distinct engine origins that produced at least one finding on this package snapshot.</summary>
    public int? MeasuredThisRunEngineCount
    {
        get;
        init;
    }

    public int HarnessEngineCount
    {
        get;
        init;
    }

    /// <summary>One honest sentence for UI and export metadata.</summary>
    public string Sentence
    {
        get;
        init;
    } = string.Empty;

    /// <summary>False when measured engines are below the harness regression floor for career export.</summary>
    public bool MeetsCareerExportFloor
    {
        get;
        init;
    }

    /// <summary>Actor-dependent engine types that did not run because the graph has no Actor nodes (DX-15).</summary>
    public IReadOnlyList<string> SkippedActorEngineTypes
    {
        get;
        init;
    } = [];

    /// <summary>Premium insight-density judge findings skipped by per-snapshot cap when persisted on the snapshot.</summary>
    public int? JudgeSkippedByCap
    {
        get;
        init;
    }
}
