using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses uploaded <c>appsettings.json</c> / <c>appsettings.*.json</c> extracts into proposed connection edges (SN-RT-09).
/// </summary>
public sealed class AppSettingsJsonInfrastructureDeclarationParser(
    ILogger<AppSettingsJsonInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "appsettings-json", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        if (declaration.Content.Length > UploadedConfigProposedEdgeEmitter.MaxContentLength)
        {
            logger.LogWarning(
                "Infrastructure declaration '{Name}' (appsettings-json) exceeds size cap ({MaxLength}); skipping.",
                declaration.Name,
                UploadedConfigProposedEdgeEmitter.MaxContentLength);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        List<CanonicalObject> results = [];

        try
        {
            using JsonDocument doc = JsonDocument.Parse(declaration.Content);
            WalkJsonElement(doc.RootElement, declaration, results, settingPathPrefix: string.Empty);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(
                ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as appsettings-json; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static void WalkJsonElement(
        JsonElement element,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        string settingPathPrefix)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (JsonProperty property in element.EnumerateObject())
            {
                string key = string.IsNullOrEmpty(settingPathPrefix)
                    ? property.Name
                    : $"{settingPathPrefix}:{property.Name}";

                if (property.Value.ValueKind == JsonValueKind.String)
                {
                    UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                        results,
                        declaration,
                        "appsettings-json",
                        key,
                        property.Value.GetString());

                    continue;
                }

                if (property.Value.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
                {
                    WalkJsonElement(property.Value, declaration, results, key);
                }
            }

            return;
        }

        if (element.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        int index = 0;

        foreach (JsonElement child in element.EnumerateArray())
        {
            string indexedPrefix = string.IsNullOrEmpty(settingPathPrefix)
                ? $"[{index}]"
                : $"{settingPathPrefix}[{index}]";

            if (child.ValueKind == JsonValueKind.String)
            {
                UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                    results,
                    declaration,
                    "appsettings-json",
                    indexedPrefix,
                    child.GetString());
            }
            else
            {
                WalkJsonElement(child, declaration, results, indexedPrefix);
            }

            index++;
        }
    }
}
