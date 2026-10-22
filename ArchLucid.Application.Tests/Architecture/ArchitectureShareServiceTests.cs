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
public sealed class ArchitectureShareServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private const string ActorOid = "jwt:11111111-1111-1111-1111-111111111111:admin";
    private const string TargetOid = "jwt:11111111-1111-1111-1111-111111111111:viewer";

    [Fact]
    public async Task PatchRestrictToSharesAsync_empty_share_list_auto_inserts_admin_for_actor()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureShareRepository shareRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository =
            ArchitectureIdentityServiceTestSupport.CreateIdentityRepository(
                draftRepository,
                runRepository,
                shareRepository);
        ArchitectureShareService sut = new(identityRepository, shareRepository);

        ArchitectureIdentityRecord architecture = await identityRepository.CreateAsync(Scope, "Restricted", null);

        ArchitectureShareMutationResult result = await sut.PatchRestrictToSharesAsync(
            Scope,
            architecture.ArchitectureId,
            new PatchArchitectureRestrictToSharesRequest
            {
                RestrictToShares = true,
                ConfirmRestrict = true,
            },
            "Admin User",
            ActorOid);

        result.Status.Should().Be(ArchitectureShareMutationStatus.Success);
        result.Response!.RestrictToShares.Should().BeTrue();
        result.Response.Shares.Should().ContainSingle(share =>
            share.ActorOid == ActorOid && share.Role == ArchitectureShareRoles.Admin);
    }

    [Fact]
    public async Task PatchRestrictToSharesAsync_requires_confirm_when_enabling_restrict()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureShareRepository shareRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository =
            ArchitectureIdentityServiceTestSupport.CreateIdentityRepository(
                draftRepository,
                runRepository,
                shareRepository);
        ArchitectureShareService sut = new(identityRepository, shareRepository);

        ArchitectureIdentityRecord architecture = await identityRepository.CreateAsync(Scope, "Restricted", null);

        ArchitectureShareMutationResult result = await sut.PatchRestrictToSharesAsync(
            Scope,
            architecture.ArchitectureId,
            new PatchArchitectureRestrictToSharesRequest
            {
                RestrictToShares = true,
                ConfirmRestrict = false,
            },
            "Admin User",
            ActorOid);

        result.Status.Should().Be(ArchitectureShareMutationStatus.ValidationFailed);
    }

    [Fact]
    public async Task PutShareAsync_rejects_group_actor_oid()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureShareRepository shareRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository =
            ArchitectureIdentityServiceTestSupport.CreateIdentityRepository(
                draftRepository,
                runRepository,
                shareRepository);
        ArchitectureShareService sut = new(identityRepository, shareRepository);

        ArchitectureIdentityRecord architecture = await identityRepository.CreateAsync(Scope, "Shared", null);

        ArchitectureShareMutationResult result = await sut.PutShareAsync(
            Scope,
            architecture.ArchitectureId,
            new PutArchitectureShareRequest
            {
                ActorOid = "group:engineering",
                Role = ArchitectureShareRoles.View,
            },
            "Admin User",
            ActorOid);

        result.Status.Should().Be(ArchitectureShareMutationStatus.ValidationFailed);
        result.ValidationMessage.Should().Contain("SCIM group");
    }
}
