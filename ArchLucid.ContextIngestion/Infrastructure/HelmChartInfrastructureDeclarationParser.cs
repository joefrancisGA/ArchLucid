using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses in-batch Helm chart <c>templates/</c> manifests into canonical objects (DX-30).
/// </summary>
public sealed class HelmChartInfrastructureDeclarationParser(
    ILogger<HelmChartInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    internal const string TemplatesDirectoryName = "templates";

    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "helm", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        return ParseAsync(declaration, batchDeclarations: null, ct);
    }

    internal Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        IReadOnlyList<InfrastructureDeclarationReference>? batchDeclarations,
        CancellationToken ct)
    {
        _ = ct;

        if (batchDeclarations is null || batchDeclarations.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        if (!IsChartManifest(declaration.Name))
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        if (!BatchContainsChartManifest(batchDeclarations, declaration.Name))
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        string chartRoot = InfrastructureDeclarationBatchPathIndex.GetDirectoryName(declaration.Name);
        string templatesPrefix = string.IsNullOrWhiteSpace(chartRoot)
            ? $"{TemplatesDirectoryName}/"
            : $"{chartRoot}/{TemplatesDirectoryName}/";

        List<CanonicalObject> results = [];

        foreach (InfrastructureDeclarationReference batchDeclaration in batchDeclarations)
        {
            if (string.IsNullOrWhiteSpace(batchDeclaration.Name))
            {
                continue;
            }

            string normalizedName = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(batchDeclaration.Name);

            if (!normalizedName.StartsWith(templatesPrefix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!IsTemplateManifest(normalizedName))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(batchDeclaration.Content))
            {
                continue;
            }

            results.AddRange(
                KubernetesYamlContentParser.ParseContent(batchDeclaration.Content, batchDeclaration, logger));
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    internal static bool IsChartManifest(string declarationName)
    {
        if (string.IsNullOrWhiteSpace(declarationName))
        {
            return false;
        }

        string fileName = Path.GetFileName(declarationName.Replace('/', Path.DirectorySeparatorChar));

        return string.Equals(fileName, "Chart.yaml", StringComparison.OrdinalIgnoreCase)
            || string.Equals(fileName, "Chart.yml", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool IsTemplateManifest(string normalizedDeclarationName)
    {
        if (string.IsNullOrWhiteSpace(normalizedDeclarationName))
        {
            return false;
        }

        return normalizedDeclarationName.EndsWith(".yaml", StringComparison.OrdinalIgnoreCase)
            || normalizedDeclarationName.EndsWith(".yml", StringComparison.OrdinalIgnoreCase);
    }

    internal static HashSet<string> CollectConsumedTemplatePaths(
        IEnumerable<InfrastructureDeclarationReference> declarations)
    {
        HashSet<string> consumed = new(StringComparer.OrdinalIgnoreCase);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (!IsChartManifest(declaration.Name))
            {
                continue;
            }

            string chartRoot = InfrastructureDeclarationBatchPathIndex.GetDirectoryName(declaration.Name);
            string templatesPrefix = string.IsNullOrWhiteSpace(chartRoot)
                ? $"{TemplatesDirectoryName}/"
                : $"{chartRoot}/{TemplatesDirectoryName}/";

            foreach (InfrastructureDeclarationReference batchDeclaration in declarations)
            {
                if (string.IsNullOrWhiteSpace(batchDeclaration.Name))
                {
                    continue;
                }

                string normalizedName = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(batchDeclaration.Name);

                if (!normalizedName.StartsWith(templatesPrefix, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!IsTemplateManifest(normalizedName))
                {
                    continue;
                }

                consumed.Add(normalizedName);
            }
        }

        return consumed;
    }

    private static bool BatchContainsChartManifest(
        IReadOnlyList<InfrastructureDeclarationReference> batchDeclarations,
        string chartDeclarationName)
    {
        string normalizedChart = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(chartDeclarationName);

        return batchDeclarations.Any(declaration =>
            string.Equals(
                InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(declaration.Name),
                normalizedChart,
                StringComparison.OrdinalIgnoreCase));
    }
}
