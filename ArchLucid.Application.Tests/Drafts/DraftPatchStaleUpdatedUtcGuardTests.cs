using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftPatchStaleUpdatedUtcGuardTests
{
    [Fact]
    public void EnsurePatchNotStaleOrThrow_skips_when_force_overwrite()
    {
        DraftRequestResponse existing = CreateDraft(updatedUtc: DateTime.UtcNow);

        Action act = () => DraftPatchStaleUpdatedUtcGuard.EnsurePatchNotStaleOrThrow(
            existing,
            expectedUpdatedUtc: existing.UpdatedUtc.AddMinutes(-5),
            forceOverwrite: true);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsurePatchNotStaleOrThrow_throws_when_token_stale()
    {
        DraftRequestResponse existing = CreateDraft(updatedUtc: DateTime.UtcNow);

        Action act = () => DraftPatchStaleUpdatedUtcGuard.EnsurePatchNotStaleOrThrow(
            existing,
            expectedUpdatedUtc: existing.UpdatedUtc.AddMinutes(-5),
            forceOverwrite: false);

        act.Should().Throw<ConflictException>();
    }

    private static DraftRequestResponse CreateDraft(DateTime updatedUtc)
    {
        return new DraftRequestResponse
        {
            DraftId = Guid.NewGuid(),
            Status = DraftRequestStatus.Drafting,
            UpdatedUtc = updatedUtc,
            Document = new DraftRequestDocument
            {
                FreeTextIntent = "intent",
                BusinessOutcome = "outcome",
                ActorSet = new ActorSet(),
            },
        };
    }
}
