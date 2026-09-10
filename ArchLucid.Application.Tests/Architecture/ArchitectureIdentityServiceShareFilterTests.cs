using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityServiceShareFilterTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private const string SharedActorOid = "jwt:11111111-1111-1111-1111-111111111111:shared";
    private const string OtherActorOid = "jwt:11111111-1111-1111-1111-111111111111:other";

    [Fact]
    public async Task ListIdentitiesAsync_hides_restricted_architecture_without_share()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureShareRepository shareRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository =
            ArchitectureIdentityServiceTestSupport.CreateIdentityRepository(
                draftRepository,
                runRepository,
                shareRepository);
        ArchitectureIdentityService sut = ArchitectureIdentityServiceTestSupport.Create(
            identityRepository,
            runRepository,
            draftRepository,
            shareRepository);

        ArchitectureIdentityRecord open = await identityRepository.CreateAsync(Scope, "Open", null);
        ArchitectureIdentityRecord restricted = await identityRepository.CreateAsync(Scope, "Restricted", null);

        await identityRepository.TrySetRestrictToSharesAsync(Scope, restricted.ArchitectureId, restrictToShares: true);

        await shareRepository.UpsertAsync(
            new ArchitectureShareRecord
            {
                ArchitectureId = restricted.ArchitectureId,
                ActorOid = SharedActorOid,
                Role = ArchitectureShareRoles.View,
                GrantedBy = "Admin",
                GrantedUtc = DateTime.UtcNow,
            });

        ArchitectureIdentityListPage sharedPage = await sut.ListIdentitiesAsync(
            Scope,
            page: 1,
            pageSize: 50,
            actorOidForShareFilter: SharedActorOid);

        sharedPage.Items.Select(item => item.ArchitectureId).Should().BeEquivalentTo([open.ArchitectureId, restricted.ArchitectureId]);

        ArchitectureIdentityListPage otherPage = await sut.ListIdentitiesAsync(
            Scope,
            page: 1,
            pageSize: 50,
            actorOidForShareFilter: OtherActorOid);

        otherPage.Items.Select(item => item.ArchitectureId).Should().ContainSingle(id => id == open.ArchitectureId);
    }

    [Fact]
    public async Task GetIdentityAsync_returns_null_for_restricted_architecture_without_share()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureShareRepository shareRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository =
            ArchitectureIdentityServiceTestSupport.CreateIdentityRepository(
                draftRepository,
                runRepository,
                shareRepository);
        ArchitectureIdentityService sut = ArchitectureIdentityServiceTestSupport.Create(
            identityRepository,
            runRepository,
            draftRepository,
            shareRepository);

        ArchitectureIdentityRecord restricted = await identityRepository.CreateAsync(Scope, "Restricted", null);

        await identityRepository.TrySetRestrictToSharesAsync(Scope, restricted.ArchitectureId, restrictToShares: true);

        ArchitectureIdentityDetail? detail = await sut.GetIdentityAsync(
            Scope,
            restricted.ArchitectureId,
            OtherActorOid);

        detail.Should().BeNull("AS-095 hides restricted architectures as 404 at the API layer");
    }
}
