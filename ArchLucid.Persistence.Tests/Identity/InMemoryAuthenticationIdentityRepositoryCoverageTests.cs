using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class InMemoryAuthenticationIdentityRepositoryCoverageTests
{
    [Fact]
    public async Task InsertAsync_round_trips_find_get_list_and_record_authentication()
    {
        InMemoryAuthenticationIdentityRepository sut = new();
        Guid userId = Guid.NewGuid();
        AuthenticationIdentityInsert insert = new()
        {
            UserId = userId,
            ProviderType = AuthenticationProviderType.MicrosoftIdentity,
            NormalizedIssuer = "https://login.microsoftonline.com/tenant/v2.0",
            Subject = "oid-1",
            NormalizedEmail = "USER@EXAMPLE.COM",
            DisplayEmail = "user@example.com",
            EmailVerified = true,
        };

        AuthenticationIdentityRecord created = await sut.InsertAsync(insert, CancellationToken.None);

        created.Id.Should().NotBe(Guid.Empty);
        created.UserId.Should().Be(userId);

        ExternalIdentityKey key = new()
        {
            ProviderType = insert.ProviderType,
            NormalizedIssuer = insert.NormalizedIssuer,
            Subject = insert.Subject,
        };

        (await sut.FindByExternalKeyAsync(key, CancellationToken.None)).Should().BeEquivalentTo(created);
        (await sut.GetByIdAsync(created.Id, CancellationToken.None)).Should().BeEquivalentTo(created);

        IReadOnlyList<AuthenticationIdentityRecord> listed =
            await sut.ListByUserIdAsync(userId, CancellationToken.None);

        listed.Should().ContainSingle(row => row.Id == created.Id);

        DateTimeOffset authenticatedUtc = DateTimeOffset.UtcNow;

        await sut.RecordAuthenticationAsync(created.Id, authenticatedUtc, CancellationToken.None);

        AuthenticationIdentityRecord? updated = await sut.GetByIdAsync(created.Id, CancellationToken.None);

        updated.Should().NotBeNull();
        updated!.LastAuthenticatedUtc.Should().Be(authenticatedUtc);
        (await sut.HasActiveIdentityAsync(userId, CancellationToken.None)).Should().BeTrue();
    }

    [Fact]
    public async Task InsertAsync_throws_when_external_key_already_active()
    {
        InMemoryAuthenticationIdentityRepository sut = new();
        AuthenticationIdentityInsert insert = new()
        {
            UserId = Guid.NewGuid(),
            ProviderType = AuthenticationProviderType.EmailOneTimeCode,
            NormalizedIssuer = "archlucid:email-otp",
            Subject = "subject-1",
        };

        await sut.InsertAsync(insert, CancellationToken.None);

        Func<Task> act = () => sut.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = Guid.NewGuid(),
                ProviderType = insert.ProviderType,
                NormalizedIssuer = insert.NormalizedIssuer,
                Subject = insert.Subject,
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<DuplicateAuthenticationIdentityException>();
    }

    [Fact]
    public async Task DisableAsync_and_ReEnableAsync_toggle_active_lookup()
    {
        InMemoryAuthenticationIdentityRepository sut = new();
        AuthenticationIdentityRecord created = await sut.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = Guid.NewGuid(),
                ProviderType = AuthenticationProviderType.MicrosoftIdentity,
                NormalizedIssuer = "issuer",
                Subject = "subject",
            },
            CancellationToken.None);
        ExternalIdentityKey key = new()
        {
            ProviderType = created.ProviderType,
            NormalizedIssuer = created.NormalizedIssuer,
            Subject = created.Subject,
        };
        DateTimeOffset disabledUtc = DateTimeOffset.UtcNow;

        await sut.DisableAsync(created.Id, disabledUtc, CancellationToken.None);

        (await sut.FindByExternalKeyAsync(key, CancellationToken.None)).Should().BeNull();
        (await sut.HasActiveIdentityAsync(created.UserId, CancellationToken.None)).Should().BeFalse();

        (await sut.ReEnableAsync(created.Id, CancellationToken.None)).Should().BeTrue();
        (await sut.FindByExternalKeyAsync(key, CancellationToken.None)).Should().NotBeNull();
        (await sut.HasActiveIdentityAsync(created.UserId, CancellationToken.None)).Should().BeTrue();
    }

    [Fact]
    public async Task FindAnyByExternalKeyAsync_returns_disabled_row_when_no_active_match()
    {
        InMemoryAuthenticationIdentityRepository sut = new();
        AuthenticationIdentityRecord created = await sut.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = Guid.NewGuid(),
                ProviderType = AuthenticationProviderType.MicrosoftIdentity,
                NormalizedIssuer = "issuer",
                Subject = "subject",
            },
            CancellationToken.None);

        await sut.DisableAsync(created.Id, DateTimeOffset.UtcNow, CancellationToken.None);

        ExternalIdentityKey key = new()
        {
            ProviderType = created.ProviderType,
            NormalizedIssuer = created.NormalizedIssuer,
            Subject = created.Subject,
        };

        AuthenticationIdentityRecord? any = await sut.FindAnyByExternalKeyAsync(key, CancellationToken.None);

        any.Should().NotBeNull();
        any!.DisabledUtc.Should().NotBeNull();
    }
}
