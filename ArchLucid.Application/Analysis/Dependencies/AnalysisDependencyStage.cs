namespace ArchLucid.Application.Analysis;

/// <summary>One registered stage and its outcome-affecting local inputs and required upstream stages.</summary>
internal sealed record AnalysisDependencyStage(string Name, string[] Inputs, params string[] Requires);
