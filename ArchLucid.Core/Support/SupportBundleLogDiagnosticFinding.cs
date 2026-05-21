namespace ArchLucid.Core.Support;

/// <summary>
///     One heuristic match from <see cref="SupportBundleLogDiagnosticsAnalyzer" />.
/// </summary>
public sealed record SupportBundleLogDiagnosticFinding(string Title, int OccurrenceCount, string Guidance);
