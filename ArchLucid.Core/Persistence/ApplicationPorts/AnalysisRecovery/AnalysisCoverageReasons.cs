namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>Stable allowlist used by fenced failed checkpoints. Never store exception messages here.</summary>
public static class AnalysisCoverageReasons
{
    public static bool IsAllowed(string? reason) => reason is
        "dependency_provider_unavailable" or "incomplete_or_stale_inventory" or "stale_snapshot_plan" or
        "source_changed_during_execution" or "inputs_changed_during_execution" or "upstream_changed_during_execution" or
        "incomplete_path_coverage" or "incomplete_engine_coverage" or "incomplete_findings" or "stale_dependencies" or
        "output_missing";

    public static string RequireKnown(string reason) => IsAllowed(reason)
        ? reason : throw new ArgumentException("Unrecognized coverage reason.", nameof(reason));

    public static string? ReadKnown(string? value) => IsAllowed(value) ? value : null;
}
