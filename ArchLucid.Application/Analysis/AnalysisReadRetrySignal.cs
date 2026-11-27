namespace ArchLucid.Application.Analysis;

/// <summary>Opt-in decision from the owner of a replay-safe read with no lower command retry.</summary>
internal readonly record struct AnalysisReadRetrySignal(TimeSpan? MinimumDelay);
