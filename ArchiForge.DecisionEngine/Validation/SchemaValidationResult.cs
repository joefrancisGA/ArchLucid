namespace ArchiForge.DecisionEngine.Validation;

public sealed class SchemaValidationResult
{
    public bool IsValid => Errors.Count == 0;

    public List<string> Errors { get; set; } = [];
}

