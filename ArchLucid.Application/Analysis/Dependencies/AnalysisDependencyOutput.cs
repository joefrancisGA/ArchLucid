namespace ArchLucid.Application.Analysis;

/// <summary>Graph-protocol checkpoint payload. Older checkpoint and final receipt shapes are unchanged.</summary>
internal sealed record AnalysisDependencyOutput<T>(T Output, string Witness);
