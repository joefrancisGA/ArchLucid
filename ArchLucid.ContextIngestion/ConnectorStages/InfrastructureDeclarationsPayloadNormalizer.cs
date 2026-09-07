using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class InfrastructureDeclarationsPayloadNormalizer(IEnumerable<IInfrastructureDeclarationParser> parsers)
    : IConnectorNormalizer<InfrastructureDeclarationsPayload>
{
    public async Task<NormalizedContextBatch> NormalizeAsync(
        InfrastructureDeclarationsPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        NormalizedContextBatch batch = new();
        IReadOnlyList<InfrastructureDeclarationReference> declarations = payload.InfrastructureDeclarations;
        Dictionary<string, InfrastructureDeclarationReference> bicepBatchByPath =
            BicepDeclarationBatchIndex.Build(declarations);
        Dictionary<string, InfrastructureDeclarationReference> batchByPath =
            InfrastructureDeclarationBatchPathIndex.Build(declarations);
        Dictionary<string, IReadOnlyDictionary<string, string>> bicepParamByBicepPath =
            BicepParamBatchIndex.Build(declarations, batchByPath);

        HashSet<string> referencedBicepModulePaths = BicepDeclarationBatchIndex.CollectReferencedModulePaths(
            declarations,
            bicepBatchByPath);
        HashSet<string> consumedHelmTemplatePaths =
            HelmChartInfrastructureDeclarationParser.CollectConsumedTemplatePaths(declarations);
        HashSet<string> consumedKustomizeResourcePaths =
            KustomizeOverlayInfrastructureDeclarationParser.CollectConsumedResourcePaths(declarations, batchByPath);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (ShouldSkipReferencedBicepModule(declaration, referencedBicepModulePaths))
                continue;

            if (ShouldSkipBicepParamDeclaration(declaration))
                continue;

            if (ShouldSkipConsumedHelmTemplate(declaration, consumedHelmTemplatePaths))
                continue;

            if (ShouldSkipConsumedKustomizeResource(declaration, consumedKustomizeResourcePaths))
                continue;

            IInfrastructureDeclarationParser? parser = parsers.FirstOrDefault(x => x.CanParse(declaration.Format));

            if (parser is null)
            {
                batch.Warnings.Add(
                    $"No infrastructure declaration parser for '{declaration.Name}' (format='{declaration.Format}'). Declaration skipped.");
                continue;
            }

            IReadOnlyList<CanonicalObject> objects = await ParseDeclarationAsync(
                parser,
                declaration,
                declarations,
                bicepBatchByPath,
                batchByPath,
                bicepParamByBicepPath,
                ct);

            batch.CanonicalObjects.AddRange(objects);
        }

        return batch;
    }

    private static async Task<IReadOnlyList<CanonicalObject>> ParseDeclarationAsync(
        IInfrastructureDeclarationParser parser,
        InfrastructureDeclarationReference declaration,
        IReadOnlyList<InfrastructureDeclarationReference> batchDeclarations,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> bicepBatchByPath,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath,
        IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> bicepParamByBicepPath,
        CancellationToken ct)
    {
        if (parser is BicepInfrastructureDeclarationParser bicepParser)
        {
            string normalizedName = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(declaration.Name);
            bicepParamByBicepPath.TryGetValue(normalizedName, out IReadOnlyDictionary<string, string>? parameterValues);

            return await bicepParser.ParseAsync(declaration, bicepBatchByPath, parameterValues, ct);
        }

        if (parser is HelmChartInfrastructureDeclarationParser helmParser)
            return await helmParser.ParseAsync(declaration, batchDeclarations, ct);

        if (parser is KustomizeOverlayInfrastructureDeclarationParser kustomizeParser)
            return await kustomizeParser.ParseAsync(declaration, batchByPath, ct);

        return await parser.ParseAsync(declaration, ct);
    }

    private static bool ShouldSkipReferencedBicepModule(
        InfrastructureDeclarationReference declaration,
        IReadOnlySet<string> referencedBicepModulePaths)
    {
        if (!string.Equals(declaration.Format?.Trim(), "bicep", StringComparison.OrdinalIgnoreCase))
            return false;

        string normalizedName = BicepDeclarationBatchIndex.NormalizeLookupKey(declaration.Name);

        return referencedBicepModulePaths.Contains(normalizedName);
    }

    private static bool ShouldSkipBicepParamDeclaration(InfrastructureDeclarationReference declaration)
    {
        return string.Equals(declaration.Format?.Trim(), "bicep-param", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ShouldSkipConsumedHelmTemplate(
        InfrastructureDeclarationReference declaration,
        IReadOnlySet<string> consumedHelmTemplatePaths)
    {
        if (consumedHelmTemplatePaths.Count == 0)
            return false;

        string normalizedName = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(declaration.Name);

        return consumedHelmTemplatePaths.Contains(normalizedName);
    }

    private static bool ShouldSkipConsumedKustomizeResource(
        InfrastructureDeclarationReference declaration,
        IReadOnlySet<string> consumedKustomizeResourcePaths)
    {
        if (consumedKustomizeResourcePaths.Count == 0)
            return false;

        if (string.Equals(declaration.Format?.Trim(), "kustomize", StringComparison.OrdinalIgnoreCase))
            return false;

        string normalizedName = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(declaration.Name);

        return consumedKustomizeResourcePaths.Contains(normalizedName);
    }
}
