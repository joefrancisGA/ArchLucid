using System.Text.Json;

using Json.Schema;

namespace ArchLucid.Cli;

/// <summary>
///     Bundled golden manifest JSON Schema evaluation for offline CLI validation (no Decisioning dependency).
/// </summary>
internal static class GoldenManifestJsonSchemaEvaluator
{
    private const string GoldenManifestSchemaRelativePath = "schemas/goldenmanifest.schema.json";

    private static readonly Lazy<JsonSchema> GoldenManifestSchema = new(LoadGoldenManifestSchema);

    internal sealed class Evaluation
    {
        public bool IsValid => Errors.Count == 0;

        public List<string> Errors
        {
            get;
        } = [];

        public List<Detail> DetailedErrors
        {
            get;
        } = [];
    }

    internal sealed class Detail
    {
        public required string Message
        {
            get;
            init;
        }

        public required string Location
        {
            get;
            init;
        }
    }

    internal static Evaluation ValidateJson(string json)
    {
        Evaluation result = new();

        if (string.IsNullOrWhiteSpace(json))
        {
            result.Errors.Add("GoldenManifest JSON payload is empty.");

            return result;
        }

        JsonDocument doc;

        try
        {
            doc = JsonDocument.Parse(json);
        }
        catch (JsonException ex)
        {
            result.Errors.Add($"GoldenManifest JSON could not be parsed: {ex.Message}");

            return result;
        }

        using (doc)
        {
            EvaluationResults evaluation = GoldenManifestSchema.Value.Evaluate(
                doc.RootElement,
                new EvaluationOptions { OutputFormat = OutputFormat.List });

            if (evaluation.IsValid)
                return result;

            CollectErrors(evaluation, result);
        }

        return result;
    }

    private static JsonSchema LoadGoldenManifestSchema()
    {
        string fullPath = Path.Combine(AppContext.BaseDirectory, GoldenManifestSchemaRelativePath);

        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"Schema file not found: {fullPath}", fullPath);

        return JsonSchema.FromText(File.ReadAllText(fullPath));
    }

    private static void CollectErrors(EvaluationResults evaluation, Evaluation result)
    {
        if (evaluation.Errors is not null && evaluation.Errors.Count > 0)

            foreach (KeyValuePair<string, string> kvp in evaluation.Errors)
            {
                string message = kvp.Value;
                string location = evaluation.InstanceLocation.ToString();

                if (string.IsNullOrEmpty(location))
                    location = "(root)";

                result.Errors.Add($"GoldenManifest schema error at '{location}': {message}");
                result.DetailedErrors.Add(new Detail { Message = message, Location = location });
            }

        if (evaluation.Details is null)
            return;

        foreach (EvaluationResults detail in evaluation.Details)

            CollectErrors(detail, result);
    }
}
