using System.Text.Json;
using Json.Schema;

namespace ArchiForge.DecisionEngine.Validation;

public sealed class SchemaValidationService : ISchemaValidationService
{
    private readonly JsonSchema _agentResultSchema;
    private readonly JsonSchema _goldenManifestSchema;

    public SchemaValidationService()
    {
        _agentResultSchema = LoadSchema("schemas/agentresult.schema.json");
        _goldenManifestSchema = LoadSchema("schemas/goldenmanifest.schema.json");
    }

    public SchemaValidationResult ValidateAgentResultJson(string json)
    {
        return Validate(json, _agentResultSchema, "AgentResult");
    }

    public SchemaValidationResult ValidateGoldenManifestJson(string json)
    {
        return Validate(json, _goldenManifestSchema, "GoldenManifest");
    }

    private static JsonSchema LoadSchema(string relativePath)
    {
        var fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"Schema file not found: {fullPath}");
        }

        var schemaText = File.ReadAllText(fullPath);
        return JsonSchema.FromText(schemaText);
    }

    private static SchemaValidationResult Validate(
        string json,
        JsonSchema schema,
        string objectName)
    {
        var result = new SchemaValidationResult();

        if (string.IsNullOrWhiteSpace(json))
        {
            result.Errors.Add($"{objectName} JSON payload is empty.");
            return result;
        }

        JsonDocument? doc;

        try
        {
            doc = JsonDocument.Parse(json);
        }
        catch (Exception ex)
        {
            result.Errors.Add($"{objectName} JSON could not be parsed: {ex.Message}");
            return result;
        }

        if (doc is null)
        {
            result.Errors.Add($"{objectName} JSON parsed to null.");
            return result;
        }

        var evaluation = schema.Evaluate(
            doc.RootElement,
            new EvaluationOptions
            {
                OutputFormat = OutputFormat.List
            });

        if (evaluation.IsValid)
        {
            return result;
        }

        CollectErrors(evaluation, result.Errors, objectName);

        return result;
    }

    private static void CollectErrors(
        EvaluationResults evaluation,
        List<string> errors,
        string objectName)
    {
        if (evaluation.HasErrors && evaluation.Errors is not null)
        {
            foreach (var kvp in evaluation.Errors)
            {
                errors.Add($"{objectName} schema error at '{evaluation.InstanceLocation}': {kvp.Value}");
            }
        }

        foreach (var detail in evaluation.Details)
        {
            CollectErrors(detail, errors, objectName);
        }
    }
}

