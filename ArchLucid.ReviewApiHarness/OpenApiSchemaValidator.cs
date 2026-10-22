using System.Text.Json;

using Json.Schema;

namespace ArchLucid.ReviewApiHarness;

/// <summary>Validates a JSON payload against a named OpenAPI component schema via JsonSchema.Net.</summary>
public sealed class OpenApiSchemaValidator(OpenApiContractCatalog catalog)
{
    private readonly OpenApiContractCatalog _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));

    public ResponseValidationResult Validate(string schemaName, JsonElement payload)
    {
        if (string.IsNullOrWhiteSpace(schemaName))
            throw new ArgumentException("Schema name is required.", nameof(schemaName));

        List<string> errors = [];

        try
        {
            JsonSchema schema = _catalog.GetEvaluatorSchema(schemaName);
            EvaluationResults evaluation = schema.Evaluate(
                payload,
                new EvaluationOptions { OutputFormat = OutputFormat.List });

            if (!evaluation.IsValid)
                CollectErrors(evaluation, errors);
        }
        catch (Exception ex)
        {
            errors.Add($"OpenAPI schema evaluation failed for '{schemaName}': {ex.Message}");
        }

        return new ResponseValidationResult(
            Passed: errors.Count == 0,
            Errors: errors);
    }

    private static void CollectErrors(EvaluationResults evaluation, List<string> errors)
    {
        if (evaluation.Errors is not null)

            foreach (KeyValuePair<string, string> kvp in evaluation.Errors)
            {
                string location = evaluation.InstanceLocation.ToString();

                if (string.IsNullOrEmpty(location))
                    location = "(root)";

                errors.Add($"schema '{location}': {kvp.Value}");
            }

        if (evaluation.Details is null)
            return;

        foreach (EvaluationResults detail in evaluation.Details)
            CollectErrors(detail, errors);
    }
}
