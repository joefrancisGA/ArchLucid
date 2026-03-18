namespace ArchiForge.DecisionEngine.Validation;

public sealed class SchemaValidationOptions
{
    public const string SectionName = "SchemaValidation";

    public string AgentResultSchemaPath { get; set; } = "schemas/agentresult.schema.json";

    public string GoldenManifestSchemaPath { get; set; } = "schemas/goldenmanifest.schema.json";

    public bool EnableDetailedErrors { get; set; } = true;
}
