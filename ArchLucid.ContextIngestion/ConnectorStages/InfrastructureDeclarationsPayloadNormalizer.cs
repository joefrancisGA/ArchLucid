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
        Dictionary<string, InfrastructureDeclarationReference> bicepBatchByPath =
            BicepDeclarationBatchIndex.Build(payload.InfrastructureDeclarations);

        HashSet<string> referencedBicepModulePaths = BicepDeclarationBatchIndex.CollectReferencedModulePaths(
            payload.InfrastructureDeclarations,
            bicepBatchByPath);

        foreach (InfrastructureDeclarationReference declaration in payload.InfrastructureDeclarations)
        {
            if (ShouldSkipReferencedBicepModule(declaration, referencedBicepModulePaths))
                continue;

            IInfrastructureDeclarationParser? parser = parsers.FirstOrDefault(x => x.CanParse(declaration.Format));

            if (parser is null)
            {
                batch.Warnings.Add(
                    $"No infrastructure declaration parser for '{declaration.Name}' (format='{declaration.Format}'). Declaration skipped.");
                continue;
            }

            IReadOnlyList<CanonicalObject> objects = parser is BicepInfrastructureDeclarationParser bicepParser
                ? await bicepParser.ParseAsync(declaration, bicepBatchByPath, ct)
                : await parser.ParseAsync(declaration, ct);

            batch.CanonicalObjects.AddRange(objects);
        }

        return batch;
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
}
