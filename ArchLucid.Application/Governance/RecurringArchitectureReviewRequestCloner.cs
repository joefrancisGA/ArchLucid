using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Governance;

/// <summary>Clones a persisted <see cref="ArchitectureRequest"/> for scheduled follow-up reviews.</summary>
public static class RecurringArchitectureReviewRequestCloner
{
    public static ArchitectureRequest CloneForRecurrence(ArchitectureRequest source, Guid sourceRunId, DateTimeOffset triggeredAtUtc)
    {
        ArgumentNullException.ThrowIfNull(source);

        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        ArchitectureRequest? clone = JsonSerializer.Deserialize<ArchitectureRequest>(json, ContractJson.Default);

        if (clone is null)
            throw new InvalidOperationException("Could not clone architecture request for recurrence.");

        string suffix = triggeredAtUtc.ToString("yyyyMMddHHmmss");
        string requestId = $"recurrence-{sourceRunId:N}-{suffix}";

        if (requestId.Length > 64)
            requestId = requestId[..64];

        clone.RequestId = requestId;
        clone.Description =
            $"{source.Description.Trim()} (scheduled follow-up from run {sourceRunId:N} at {triggeredAtUtc:u})";

        return clone;
    }
}
