using ArchiForge.Application.Diffs;

namespace ArchiForge.Application.Analysis;

public sealed class EndToEndReplayComparisonReport
{
    public string LeftRunId { get; set; } = string.Empty;

    public string RightRunId { get; set; } = string.Empty;

    public RunMetadataDiffResult RunDiff { get; set; } = new();

    public AgentResultDiffResult? AgentResultDiff
    {
        get; set;
    }

    public ManifestDiffResult? ManifestDiff
    {
        get; set;
    }

    public List<ExportRecordDiffResult> ExportDiffs { get; set; } = [];

    public List<string> InterpretationNotes { get; set; } = [];

    public List<string> Warnings { get; set; } = [];
}

