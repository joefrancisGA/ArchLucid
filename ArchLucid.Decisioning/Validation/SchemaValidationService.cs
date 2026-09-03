using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Text.Json;

using Json.Schema;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Validation;

public sealed class SchemaValidationService : ISchemaValidationService
{
    /// <summary>OpenTelemetry meter name for schema validation metrics.</summary>
    public const string MeterName = "ArchLucid.Decisioning.SchemaValidation";

    private static readonly Meter SMeter = new(MeterName, "1.0");

    /// <summary>Counts total validation calls by schema name and outcome (valid/invalid).</summary>
    private static readonly Counter<long> SValidationCounter =
        SMeter.CreateCounter<long>("schema_validation_total", description: "Total schema validation calls.");

    /// <summary>Records validation duration in milliseconds by schema name.</summary>
    private static readonly Histogram<double> SValidationDurationMs =
        SMeter.CreateHistogram<double>("schema_validation_duration_ms", "ms", "Schema validation duration.");

    private readonly SchemaValidationCache _cache;
    private readonly ILogger<SchemaValidationService> _logger;
    private readonly SchemaValidationOptions _options;
    private readonly SchemaValidationRegistry _registry;

    public SchemaValidationService(
        ILogger<SchemaValidationService> logger,
        IOptions<SchemaValidationOptions>? options)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _registry = new SchemaValidationRegistry(_logger, _options);
        _cache = new SchemaValidationCache(_options);
    }

    public SchemaValidationResult ValidateAgentResultJson(string json)
    {
        return Validate(json, _registry.AgentResultSchema, "AgentResult");
    }

    public SchemaValidationResult ValidateGoldenManifestJson(string json)
    {
        return Validate(json, _registry.GoldenManifestSchema, "GoldenManifest");
    }

    public SchemaValidationResult ValidateExplanationRunJson(string json)
    {
        return Validate(json, _registry.ExplanationRunSchema, "ExplanationRun");
    }

    public SchemaValidationResult ValidateComparisonExplanationJson(string json)
    {
        return Validate(json, _registry.ComparisonExplanationSchema, "ComparisonExplanation");
    }

    public Task<SchemaValidationResult> ValidateAgentResultJsonAsync(
        string json,
        CancellationToken cancellationToken = default)
    {
        return ValidateAsync(json, _registry.AgentResultSchema, "AgentResult", cancellationToken);
    }

    public Task<SchemaValidationResult> ValidateGoldenManifestJsonAsync(
        string json,
        CancellationToken cancellationToken = default)
    {
        return ValidateAsync(json, _registry.GoldenManifestSchema, "GoldenManifest", cancellationToken);
    }

    private SchemaValidationResult Validate(
        string json,
        JsonSchema schema,
        string objectName)
    {
        if (!_cache.IsEnabled)
            return ValidateCore(json, schema, objectName);

        if (_cache.TryGet(objectName, json, out SchemaValidationResult? cached))
            return cached;

        SchemaValidationResult fresh = ValidateCore(json, schema, objectName);
        _cache.Add(objectName, json, fresh);
        return fresh;
    }

    private SchemaValidationResult ValidateCore(
        string json,
        JsonSchema schema,
        string objectName)
    {
        Stopwatch sw = Stopwatch.StartNew();
        SchemaValidationResult result = new();

        if (string.IsNullOrWhiteSpace(json))
        {
            string error = $"{objectName} JSON payload is empty.";
            result.Errors.Add(error);

            if (_logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning("Validation failed for {ObjectName}: Empty payload", objectName);

            EmitMetrics(objectName, false, sw.Elapsed.TotalMilliseconds);
            return result;
        }

        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(json);
        }
        catch (JsonException ex)
        {
            string error = $"{objectName} JSON could not be parsed: {ex.Message}";
            result.Errors.Add(error);

            if (_logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning(ex, "Validation failed for {ObjectName}: Invalid JSON", objectName);

            EmitMetrics(objectName, false, sw.Elapsed.TotalMilliseconds);
            return result;
        }

        using (doc)
        {
            EvaluationResults evaluation = schema.Evaluate(
                doc.RootElement,
                new EvaluationOptions { OutputFormat = OutputFormat.List });

            if (evaluation.IsValid)
            {

                if (_logger.IsEnabled(LogLevel.Debug))

                    _logger.LogDebug("Validation succeeded for {ObjectName}", objectName);

                EmitMetrics(objectName, true, sw.Elapsed.TotalMilliseconds);
                return result;
            }

            CollectErrors(evaluation, result, objectName);

            if (_logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning(
                    "Validation failed for {ObjectName} with {ErrorCount} errors",
                    objectName,
                    result.Errors.Count);

            EmitMetrics(objectName, false, sw.Elapsed.TotalMilliseconds);
            return result;
        }
    }

    private static void EmitMetrics(string objectName, bool valid, double elapsedMs)
    {
        TagList tags = new() { { "schema", objectName }, { "outcome", valid ? "valid" : "invalid" } };

        SValidationCounter.Add(1, tags);
        SValidationDurationMs.Record(elapsedMs, new KeyValuePair<string, object?>("schema", objectName));
    }

    private Task<SchemaValidationResult> ValidateAsync(
        string json,
        JsonSchema schema,
        string objectName,
        CancellationToken cancellationToken)
    {
        return Task.Run(() =>
        {
            cancellationToken.ThrowIfCancellationRequested();
            return Validate(json, schema, objectName);
        }, cancellationToken);
    }

    private void CollectErrors(
        EvaluationResults evaluation,
        SchemaValidationResult result,
        string objectName)
    {
        if (evaluation.Errors is not null && evaluation.Errors.Count > 0)

            foreach (KeyValuePair<string, string> kvp in evaluation.Errors)
            {
                string message = kvp.Value;
                string location = evaluation.InstanceLocation.ToString();

                if (string.IsNullOrEmpty(location))
                    location = "(root)";
                string? schemaPath = evaluation.SchemaLocation?.ToString();
                string keyword = kvp.Key;

                string errorMessage = $"{objectName} schema error at '{location}': {message}";
                result.Errors.Add(errorMessage);

                if (_options.EnableDetailedErrors)

                    result.DetailedErrors.Add(new SchemaValidationError { Message = message, Location = location, SchemaPath = schemaPath, Keyword = keyword });
            }

        if (evaluation.Details is null)
            return;

        foreach (EvaluationResults detail in evaluation.Details)

            CollectErrors(detail, result, objectName);
    }
}
