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
        (await sut.GetByIdAsync(id, CancellationToken.None))!.CancelledUtc.Should().Be(now.AddMinutes(2));

        await sut.UpdateStatusAsync(
            Guid.NewGuid(),
            AuthenticationIdentityLinkProposalStatus.Confirmed,
            now,
            CancellationToken.None);
    }
}
