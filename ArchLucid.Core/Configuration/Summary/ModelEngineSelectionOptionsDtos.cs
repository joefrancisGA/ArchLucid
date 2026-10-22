namespace ArchLucid.Core.Configuration.Summary;

public sealed class ModelEngineSelectionOptionResponse
{
    public string AliasId { get; set; } = string.Empty;

    public string StructuredOutputLevel { get; set; } = "StrictJsonSchema";

    public IReadOnlyList<ModelAliasTaskEvaluationResponse> TaskEvaluations { get; set; } = [];
}

public sealed class ModelEngineSelectionOptionsResponse
{
    public string DefaultAliasId { get; set; } = string.Empty;

    public IReadOnlyList<ModelEngineSelectionOptionResponse> Options { get; set; } = [];
}
