namespace ArchLucid.Decisioning.Validation;

public interface ISchemaValidationService
{
    SchemaValidationResult ValidateAgentResultJson(string json);

    SchemaValidationResult ValidateGoldenManifestJson(string json);

    SchemaValidationResult ValidateExplanationRunJson(string json);

    SchemaValidationResult ValidateComparisonExplanationJson(string json);
}
