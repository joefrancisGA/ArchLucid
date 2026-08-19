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

        foreach (InfrastructureDeclarationReference declaration in payload.InfrastructureDeclarations)
        {
            IInfrastructureDeclarationParser? parser = parsers.FirstOrDefault(x => x.CanParse(declaration.Format));

            if (parser is null)
            {
                batch.Warnings.Add(
                    $"No infrastructure declaration parser for '{declaration.Name}' (format='{declaration.Format}'). Declaration skipped.");
                continue;
            }

            IReadOnlyList<CanonicalObject> objects = await parser.ParseAsync(declaration, ct);
            batch.CanonicalObjects.AddRange(objects);
        }

        return batch;
    }
}
