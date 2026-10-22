using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Wave-23 suggestion 226: draft start-review fail-closed on stale <see cref="DraftRequestResponse.UpdatedUtc"/> or unreadiness.</summary>
public static class DraftStartReviewStaleUpdatedUtcGuard
{
    public static void EnsureStartReviewNotStaleOrThrow(
        DraftRequestResponse existing,
        DateTime? expectedUpdatedUtc)
    {
        ArgumentNullException.ThrowIfNull(existing);

        ArchitectureDraftReviewReadinessValidator.EnsureReviewReady(existing.Document);

        if (!expectedUpdatedUtc.HasValue)
            return;

        DateTime expected = DateTime.SpecifyKind(expectedUpdatedUtc.Value, DateTimeKind.Utc);
        DateTime actual = DateTime.SpecifyKind(existing.UpdatedUtc, DateTimeKind.Utc);

        if (expected != actual)
        {
            throw new ConflictException(
                $"Draft '{existing.DraftId}' changed since the workspace loaded it; refresh and retry start review.");
        }
    }
}
