using Json.Schema;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Validation;

public sealed class SchemaValidationRegistry
{
    private readonly Lazy<JsonSchema> _agentResultSchema;
    private readonly Lazy<JsonSchema> _comparisonExplanationSchema;
    private readonly Lazy<JsonSchema> _explanationRunSchema;
    private readonly Lazy<JsonSchema> _goldenManifestSchema;

    private readonly ILogger _logger;
    private readonly SchemaValidationOptions _options;

    public SchemaValidationRegistry(
        ILogger logger,
        SchemaValidationOptions options)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options ?? throw new ArgumentNullException(nameof(options));

        _agentResultSchema = new Lazy<JsonSchema>(() =>
            LoadSchema(_options.AgentResultSchemaPath, "AgentResult"));
        _goldenManifestSchema = new Lazy<JsonSchema>(() =>
            LoadSchema(_options.GoldenManifestSchemaPath, "GoldenManifest"));
        _explanationRunSchema = new Lazy<JsonSchema>(() =>
            LoadSchema(_options.ExplanationRunSchemaPath, "ExplanationRun"));
        _comparisonExplanationSchema = new Lazy<JsonSchema>(() =>
            LoadSchema(_options.ComparisonExplanationSchemaPath, "ComparisonExplanation"));
    }

    public JsonSchema AgentResultSchema => _agentResultSchema.Value;

    public JsonSchema GoldenManifestSchema => _goldenManifestSchema.Value;

    public JsonSchema ExplanationRunSchema => _explanationRunSchema.Value;

    public JsonSchema ComparisonExplanationSchema => _comparisonExplanationSchema.Value;

    private JsonSchema LoadSchema(string relativePath, string schemaName)
    {
        try
        {
            string fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);

            if (!File.Exists(fullPath))
            {

                if (_logger.IsEnabled(LogLevel.Error))

                    _logger.LogError("Schema file not found: {FullPath} for {SchemaName}", fullPath, schemaName);

                throw new FileNotFoundException($"Schema file not found: {fullPath}", fullPath);
            }

            if (_logger.IsEnabled(LogLevel.Information))

                _logger.LogInformation("Loading schema {SchemaName} from {FullPath}", schemaName, fullPath);

            string schemaText = File.ReadAllText(fullPath);
            JsonSchema schema = JsonSchema.FromText(schemaText);

            if (_logger.IsEnabled(LogLevel.Information))

                _logger.LogInformation("Successfully loaded schema {SchemaName}", schemaName);

            return schema;
        }
        catch (Exception ex) when (ex is not FileNotFoundException)
        {

            if (_logger.IsEnabled(LogLevel.Error))

                _logger.LogError(ex, "Failed to load or parse schema {SchemaName} from {RelativePath}", schemaName,
                    relativePath);

            throw;
        }
    }
}
