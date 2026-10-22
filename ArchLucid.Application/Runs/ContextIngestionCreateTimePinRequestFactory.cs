using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Builds the <see cref="ArchitectureRequest" /> slice needed to apply create-time pins on the
///     authority ingest path (policy-pack / evidence / focused-pilot). Findings analysis requires those pins
///     on the persisted header.
/// </summary>
public static class ContextIngestionCreateTimePinRequestFactory
{
    public static ArchitectureRequest FromIngest(ContextIngestionRequest ingest, Guid runId)
    {
        ArgumentNullException.ThrowIfNull(ingest);

        string requestId = string.IsNullOrWhiteSpace(ingest.ArchitectureRequestId)
            ? runId.ToString("N")
            : ingest.ArchitectureRequestId.Trim();

        return new ArchitectureRequest
        {
            RequestId = requestId,
            Description = ingest.Description ?? string.Empty,
            SystemName = ingest.ProjectId ?? string.Empty,
            PolicyReferences = ingest.PolicyReferences ?? [],
        };
    }
}
