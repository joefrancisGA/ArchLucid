namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>Stable allowlist used by fenced failed checkpoints. Never store exception messages here.</summary>
public static class AnalysisCoverageReasons
{
    private const string Prefix = "coverage:";

    public static bool IsAllowed(string reason) => reason is
        "dependency_provider_unavailable" or "incomplete_or_stale_inventory" or "stale_snapshot_plan" or
        "source_changed_during_execution" or "inputs_changed_during_execution" or "upstream_changed_during_execution" or
        "incomplete_path_coverage" or "incomplete_engine_coverage" or "incomplete_findings" or "stale_dependencies" or
        "output_missing";

    public static string Encode(string reason) => IsAllowed(reason)
        ? Prefix + reason : throw new ArgumentException("Unrecognized coverage reason.", nameof(reason));

    public static string? Decode(string? value) =>
        value is not null && value.StartsWith(Prefix, StringComparison.Ordinal) && IsAllowed(value[Prefix.Length..])
            ? value[Prefix.Length..] : null;
}
