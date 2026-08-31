using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAuthenticationIdentityLinkProposalRepositoryCoverageTests
{
    [Fact]
    public async Task Insert_get_confirm_cancel_and_missing_update_noop()
    {
        InMemoryAuthenticationIdentityLinkProposalRepository sut = new();
        Guid id = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        AuthenticationIdentityLinkProposalRecord inserted = await sut.InsertAsync(
            new AuthenticationIdentityLinkProposalRecord
            {
                Id = id,
                UserId = Guid.NewGuid(),
                ProviderType = AuthenticationProviderType.TenantOidc,
                NormalizedIssuer = "https://login.example",
                Subject = "sub-1",
                Status = AuthenticationIdentityLinkProposalStatus.PendingConfirmation,
                CreatedUtc = now,
                ExpiresUtc = now.AddHours(1),
            },
            CancellationToken.None);

        inserted.Id.Should().Be(id);
        (await sut.GetByIdAsync(id, CancellationToken.None)).Should().NotBeNull();
        (await sut.GetByIdAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeNull();

        await sut.UpdateStatusAsync(
            id,
            AuthenticationIdentityLinkProposalStatus.Confirmed,
            now.AddMinutes(1),
            CancellationToken.None);
        (await sut.GetByIdAsync(id, CancellationToken.None))!.ConfirmedUtc.Should().Be(now.AddMinutes(1));

        await sut.UpdateStatusAsync(
            id,
            AuthenticationIdentityLinkProposalStatus.Cancelled,
            now.AddMinutes(2),
            CancellationToken.None);
        AuthenticationIdentityLinkProposalRecord? afterCancelAttempt = await sut.GetByIdAsync(id, CancellationToken.None);
        afterCancelAttempt!.Status.Should().Be(AuthenticationIdentityLinkProposalStatus.Confirmed);
        afterCancelAttempt.CancelledUtc.Should().BeNull();

        await sut.UpdateStatusAsync(
            Guid.NewGuid(),
            AuthenticationIdentityLinkProposalStatus.Confirmed,
            now,
            CancellationToken.None);
    }

    [Fact]
    public async Task UpdateStatusAsync_allows_pending_to_expired_transition()
    {
        InMemoryAuthenticationIdentityLinkProposalRepository sut = new();
        Guid id = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        await sut.InsertAsync(
            new AuthenticationIdentityLinkProposalRecord
            {
                Id = id,
                UserId = Guid.NewGuid(),
                ProviderType = AuthenticationProviderType.TenantOidc,
                NormalizedIssuer = "https://login.example",
                Subject = "sub-expire",
                Status = AuthenticationIdentityLinkProposalStatus.PendingConfirmation,
                CreatedUtc = now,
                ExpiresUtc = now.AddHours(1),
            },
            CancellationToken.None);

        await sut.UpdateStatusAsync(
            id,
            AuthenticationIdentityLinkProposalStatus.Expired,
            now.AddMinutes(5),
            CancellationToken.None);

        AuthenticationIdentityLinkProposalRecord? expired = await sut.GetByIdAsync(id, CancellationToken.None);
        expired!.Status.Should().Be(AuthenticationIdentityLinkProposalStatus.Expired);
    }
}
