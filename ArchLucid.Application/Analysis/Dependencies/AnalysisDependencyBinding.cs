namespace ArchLucid.Application.Analysis;

internal sealed record AnalysisDependencyBinding(
    string GraphVersion, string LocalWitness, string InputVersion, IReadOnlyList<KeyValuePair<string, string>> Upstream,
    string? MissingStage, IReadOnlyList<KeyValuePair<string, string>>? LocalInputs = null);
