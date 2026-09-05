using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>LK-12: draft PATCH fail-closed on stale <see cref="DraftRequestResponse.UpdatedUtc"/>.</summary>
public static class DraftPatchStaleUpdatedUtcGuard
{
    public static void EnsurePatchNotStaleOrThrow(
        DraftRequestResponse existing,
        DateTime? expectedUpdatedUtc,
        bool forceOverwrite)
    {
        ArgumentNullException.ThrowIfNull(existing);

        if (forceOverwrite)
        {
            return;
        }

        if (!expectedUpdatedUtc.HasValue)
        {
            return;
        }

        DateTime expected = DateTime.SpecifyKind(expectedUpdatedUtc.Value, DateTimeKind.Utc);
        DateTime actual = DateTime.SpecifyKind(existing.UpdatedUtc, DateTimeKind.Utc);

        if (expected != actual)
        {
            throw new ConflictException(
                $"Draft '{existing.DraftId}' changed since this tab loaded it; choose keep mine or load the server copy.");
        }
    }
}
