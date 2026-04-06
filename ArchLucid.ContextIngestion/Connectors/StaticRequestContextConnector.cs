using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Connectors;

public class StaticRequestContextConnector : IContextConnector
{
    public string ConnectorType => "static-request";

    public Task<RawContextPayload> FetchAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        return Task.FromResult(new RawContextPayload
        {
            Description = request.Description
        });
    }

    public Task<NormalizedContextBatch> NormalizeAsync(
        RawContextPayload payload,
        CancellationToken ct)
    {
        NormalizedContextBatch batch = new();

        if (!string.IsNullOrWhiteSpace(payload.Description))
        
            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectType = "Requirement",
                Name = "Primary Request",
                SourceType = "StaticRequest",
                SourceId = "description",
                Properties = new Dictionary<string, string>
                {
                    ["text"] = payload.Description!
                }
            });
        

        return Task.FromResult(batch);
    }

    public Task<ContextDelta> DeltaAsync(
        NormalizedContextBatch current,
        ContextSnapshot? previous,
        CancellationToken ct)
    {
        return Task.FromResult(new ContextDelta
        {
            Summary = previous is null ? "Initial ingestion" : "Updated ingestion"
        });
    }
}

