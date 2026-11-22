using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Governance;

/// <summary>Clones a persisted <see cref="ArchitectureRequest"/> for scheduled follow-up reviews.</summary>
public static class RecurringArchitectureReviewRequestCloner
{
    public static ArchitectureRequest CloneForRecurrence(ArchitectureRequest source, Guid priorRunId, DateTimeOffset triggeredAtUtc)
    {
        ArgumentNullException.ThrowIfNull(source);

        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        ArchitectureRequest? clone = JsonSerializer.Deserialize<ArchitectureRequest>(json, ContractJson.Default);

        if (clone is null)
            throw new InvalidOperationException("Could not clone architecture request for recurrence.");

        // Second-resolution ids collide for two recurrences of the same run in one second.
        // UTC ticks preserve deterministic identity across offset representations.
        string suffix = triggeredAtUtc.UtcDateTime.Ticks.ToString("D19", System.Globalization.CultureInfo.InvariantCulture);
        string requestId = $"recurrence-{priorRunId:N}-{suffix}";

        if (requestId.Length > 64)
            requestId = requestId[..64];

        clone.RequestId = requestId;
        clone.RequestSource = "recurrence";
        string description = source.Description.Trim();
        string followUpNote = $" (scheduled follow-up from run {priorRunId:N} at {triggeredAtUtc:u})";
        clone.Description = description.Length <= ArchitectureRequestFieldLimits.MaxDescriptionLength - followUpNote.Length
            ? description + followUpNote
            : description;

        clone.PriorRunId = priorRunId.ToString("N");

        return clone;
    }
}
