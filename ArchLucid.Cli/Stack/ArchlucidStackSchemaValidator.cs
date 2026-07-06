using System.Text.Json;

using Json.Schema;

namespace ArchLucid.Cli.Stack;

/// <summary>Validates stack answers against <c>deploy/archlucid.stack.schema.json</c>.</summary>
internal static class ArchlucidStackSchemaValidator
{
    private static readonly Lazy<JsonSchema> Schema = new(LoadSchema);

    private static readonly JsonSerializerOptions DocumentJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    internal sealed record Evaluation(bool IsValid, IReadOnlyList<string> Errors)
    {
        internal static Evaluation Success { get; } = new(true, Array.Empty<string>());
    }

    internal static Evaluation ValidateDocument(ArchlucidStackDocument document)
    {
        string json = JsonSerializer.Serialize(document, DocumentJsonOptions);

        return ValidateJsonString(json);
    }

    internal static Evaluation ValidateRawJson(string rawJson)
    {
        return ValidateJsonString(rawJson);
    }

    private static Evaluation ValidateJsonString(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        EvaluationResults result = Schema.Value.Evaluate(document.RootElement, new EvaluationOptions
        {
            OutputFormat = OutputFormat.List,
        });

        if (result.IsValid)
            return Evaluation.Success;

        List<string> errors = new();
        CollectErrors(result, errors);

        return new Evaluation(false, errors);
    }

    private static void CollectErrors(EvaluationResults evaluation, List<string> errors)
    {
        if (evaluation.Errors is not null)
        {
            foreach (KeyValuePair<string, string> kvp in evaluation.Errors)
            {
                string location = evaluation.InstanceLocation.ToString();

                if (string.IsNullOrEmpty(location))
                    location = "(root)";

                errors.Add($"{location}: {kvp.Value}");
            }
        }

        if (evaluation.Details is null)
            return;

        foreach (EvaluationResults detail in evaluation.Details)
            CollectErrors(detail, errors);
    }

    private static JsonSchema LoadSchema()
    {
        string? schemaPath = ResolveSchemaPath();

        if (schemaPath is null || !File.Exists(schemaPath))
            throw new FileNotFoundException(
                "archlucid.stack.schema.json was not found beside the CLI or in deploy/.");

        return JsonSchema.FromFile(schemaPath);
    }

    private static string? ResolveSchemaPath()
    {
        string baseDir = AppContext.BaseDirectory;
        string besideCli = Path.Combine(baseDir, "deploy", "archlucid.stack.schema.json");

        if (File.Exists(besideCli))
            return besideCli;

        string cwdCandidate = Path.Combine(Environment.CurrentDirectory, ArchlucidStackPaths.SchemaRelativePath);

        if (File.Exists(cwdCandidate))
            return cwdCandidate;

        return null;
    }
}
