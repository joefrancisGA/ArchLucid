using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class InMemoryAuthenticationIdentityRepositoryInsertDuplicateIdTests
{
    [Fact]
    public async Task InsertAsync_throws_when_identity_id_collides_with_existing_row()
    {
        InMemoryAuthenticationIdentityRepository sut = new();
        Guid sharedId = Guid.NewGuid();

        await sut.InsertAsync(
            new AuthenticationIdentityInsert
            {
                Id = sharedId,
                UserId = Guid.NewGuid(),
                ProviderType = AuthenticationProviderType.MicrosoftIdentity,
                NormalizedIssuer = "issuer-a",
                Subject = "subject-a",
            },
            CancellationToken.None);

        Func<Task> act = () => sut.InsertAsync(
            new AuthenticationIdentityInsert
            {
                Id = sharedId,
                UserId = Guid.NewGuid(),
                ProviderType = AuthenticationProviderType.MicrosoftIdentity,
                NormalizedIssuer = "issuer-b",
                Subject = "subject-b",
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<DuplicateAuthenticationIdentityException>();
        (await sut.GetByIdAsync(sharedId, CancellationToken.None))!.Subject.Should().Be("subject-a");
    }
}
