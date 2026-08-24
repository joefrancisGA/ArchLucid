using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Resolves the prior run that anchors <see cref="Contracts.Architecture.ArchitectureIdentityRecord" />
///     recurrence for review-led create paths.
/// </summary>
public static class ArchitectureReviewSourceRunResolver
{
    public static bool IsReviewOrigin(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return string.Equals(
            ArchitecturePackageOriginResolver.Resolve(request),
            ArchitecturePackageOrigin.Reviewed,
            StringComparison.Ordinal);
    }

    public static Guid? TryResolveSourceRunId(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid? fromPrior = TryParseRunGuid(request.PriorRunId);

        if (fromPrior.HasValue)
            return fromPrior;

        return TryParseRecurrenceSourceRunId(request.RequestId);
    }

    public static Guid? TryParseRecurrenceSourceRunId(string requestId)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return null;

        if (!requestId.StartsWith("recurrence-", StringComparison.OrdinalIgnoreCase))
            return null;

        string remainder = requestId["recurrence-".Length..];
        int dash = remainder.IndexOf('-', StringComparison.Ordinal);

        if (dash <= 0)
            return null;

        string hex = remainder[..dash];

        return Guid.TryParseExact(hex, "N", out Guid parsed) ? parsed : null;
    }

    public static Guid? TryParseDraftIdFromRequestId(string requestId)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return null;

        return Guid.TryParseExact(requestId.Trim(), "N", out Guid draftId) ? draftId : null;
    }

    public static Guid? TryParseRunGuid(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return null;

        string trimmed = runId.Trim();

        if (Guid.TryParseExact(trimmed, "N", out Guid parsedN))
            return parsedN;

        return Guid.TryParse(trimmed, out Guid parsed) ? parsed : null;
    }
}
