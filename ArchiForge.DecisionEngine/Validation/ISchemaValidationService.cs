namespace ArchiForge.DecisionEngine.Validation;

public interface ISchemaValidationService
{
    SchemaValidationResult ValidateAgentResultJson(string json);

    SchemaValidationResult ValidateGoldenManifestJson(string json);
}

