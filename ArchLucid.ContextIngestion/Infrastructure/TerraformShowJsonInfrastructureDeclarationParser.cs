using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses <c>terraform show -json</c> state output (Terraform JSON state representation) into
///     <see cref="CanonicalObject" /> rows aligned with other infrastructure declaration parsers.
/// </summary>
/// <remarks>
///     Clients paste the JSON into <see cref="InfrastructureDeclarationReference.Content" /> with
///     <see cref="InfrastructureDeclarationReference.Format" /> <c>terraform-show-json</c>.
/// </remarks>
public sealed partial class TerraformShowJsonInfrastructureDeclarationParser(
    ILogger<TerraformShowJsonInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "terraform-show-json", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        List<CanonicalObject> results = [];
        Dictionary<string, int> labelTotals = [];
        Dictionary<string, int> labelSeen = new(StringComparer.OrdinalIgnoreCase);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(declaration.Content);
            JsonElement root = doc.RootElement;

            if (!TryGetTerraformShowValuesRoot(root, out JsonElement values))
            {
                logger.LogWarning(
                    "Infrastructure declaration '{Name}' (terraform-show-json) has no 'values' or 'planned_values' root; expected terraform show/plan JSON.",
                    declaration.Name);

                return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
            }

            if (TryGetPropertyIgnoreCase(values, "root_module", out JsonElement rootModule)
                || TryGetPropertyIgnoreCase(values, "rootModule", out rootModule))
            {
                labelTotals = CountTerraformLabelOccurrences(rootModule);
                CollectFromModule(rootModule, moduleAddress: string.Empty, declaration, results, labelTotals, labelSeen);
            }
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as terraform-show-json; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static bool TryGetTerraformShowValuesRoot(JsonElement root, out JsonElement values)
    {
        if (TryGetPropertyIgnoreCase(root, "values", out values))
            return true;

        if (TryGetPropertyIgnoreCase(root, "planned_values", out values))
            return true;

        if (TryGetPropertyIgnoreCase(root, "plannedValues", out values))
            return true;

        values = default;

        return false;
    }
}
