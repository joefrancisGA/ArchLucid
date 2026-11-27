namespace ArchLucid.Application.Analysis;

internal readonly record struct AnalysisStageObservation(string Stage, string Status, int Attempts, TimeSpan Elapsed);
