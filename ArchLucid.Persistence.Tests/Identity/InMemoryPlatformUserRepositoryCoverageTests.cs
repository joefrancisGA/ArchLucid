using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryPlatformUserRepositoryCoverageTests
{
    [Fact]
    public async Task Insert_update_status_email_and_auth_version_round_trip()
    {
        InMemoryPlatformUserRepository sut = new();
        Guid userId = Guid.NewGuid();
        Guid authVersion = Guid.NewGuid();
        DateTimeOffset updated = TimeProvider.System.GetUtcNow();

        PlatformUserRecord inserted = await sut.InsertAsync(
            new PlatformUserInsert
            {
                Id = userId,
                PrimaryEmail = "User@Example.com",
                NormalizedPrimaryEmail = "user@example.com",
                DisplayName = "Coverage User",
                Status = PlatformUserStatus.Active,
                AuthVersion = authVersion,
            },
            CancellationToken.None);

        inserted.Id.Should().Be(userId);
        inserted.AuthVersion.Should().Be(authVersion);
        (await sut.GetByIdAsync(userId, CancellationToken.None))!.DisplayName.Should().Be("Coverage User");

        PlatformUserRecord generated = await sut.InsertAsync(
            new PlatformUserInsert
            {
                PrimaryEmail = "gen@example.com",
                NormalizedPrimaryEmail = "gen@example.com",
                Status = PlatformUserStatus.Active,
            },
            CancellationToken.None);

        generated.Id.Should().NotBe(Guid.Empty);
        generated.AuthVersion.Should().NotBe(Guid.Empty);

        await sut.UpdateStatusAsync(userId, PlatformUserStatus.Suspended, updated, CancellationToken.None);
        await sut.UpdatePrimaryEmailAsync(
            userId,
            "new@example.com",
            "new@example.com",
            updated.AddMinutes(1),
            CancellationToken.None);
        Guid rotated = Guid.NewGuid();
        await sut.RotateAuthVersionAsync(userId, rotated, updated.AddMinutes(2), CancellationToken.None);

        PlatformUserRecord? row = await sut.GetByIdAsync(userId, CancellationToken.None);
        row.Should().NotBeNull();
        row!.Status.Should().Be(PlatformUserStatus.Suspended);
        row.PrimaryEmail.Should().Be("new@example.com");
        row.AuthVersion.Should().Be(rotated);

        Guid missing = Guid.NewGuid();
        Func<Task> statusMissing = () => sut.UpdateStatusAsync(missing, PlatformUserStatus.Active, updated, CancellationToken.None);
        Func<Task> emailMissing = () => sut.UpdatePrimaryEmailAsync(missing, "a", "a", updated, CancellationToken.None);
        Func<Task> rotateMissing = () => sut.RotateAuthVersionAsync(missing, Guid.NewGuid(), updated, CancellationToken.None);

        await statusMissing.Should().ThrowAsync<PlatformUserNotFoundException>();
        await emailMissing.Should().ThrowAsync<PlatformUserNotFoundException>();
        await rotateMissing.Should().ThrowAsync<PlatformUserNotFoundException>();
    }
}
