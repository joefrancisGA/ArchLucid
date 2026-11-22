using ArchLucid.Core.Admin;
using ArchLucid.Persistence.Admin;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class UserInvitationRepositoryAcceptanceTests
{
    [Fact]
    public async Task MarkAcceptedAsync_rejects_expired_invitation()
    {
        InMemoryUserInvitationRepository sut = new();
        DateTimeOffset acceptedUtc = DateTimeOffset.UtcNow;

        UserInvitationRecord invitation = await sut.InsertAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "expired@example.com",
            "Reader",
            "actor",
            null,
            [1, 2, 3, 4],
            acceptedUtc.AddSeconds(-1),
            CancellationToken.None);

        (await sut.MarkAcceptedAsync(invitation.Id, acceptedUtc, CancellationToken.None)).Should().BeFalse();
    }
}
