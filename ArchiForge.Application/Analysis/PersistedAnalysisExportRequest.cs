namespace ArchiForge.Application.Analysis;

public sealed class PersistedAnalysisExportRequest
{
    public string? TemplateProfile { get; set; }

    public string? Audience { get; set; }

    public bool ExternalDelivery { get; set; }

    public bool ExecutiveFriendly { get; set; }

    public bool RegulatedEnvironment { get; set; }

    public bool NeedDetailedEvidence { get; set; }

    public bool NeedExecutionTraces { get; set; }

    public bool NeedDeterminismOrCompareAppendices { get; set; }

    public bool IncludeEvidence { get; set; }

    public bool IncludeExecutionTraces { get; set; }

    public bool IncludeManifest { get; set; }

    public bool IncludeDiagram { get; set; }

    public bool IncludeSummary { get; set; }

    public bool IncludeDeterminismCheck { get; set; }

    public int DeterminismIterations { get; set; }

    public bool IncludeManifestCompare { get; set; }

    public string? CompareManifestVersion { get; set; }

    public bool IncludeAgentResultCompare { get; set; }

    public string? CompareRunId { get; set; }
}

