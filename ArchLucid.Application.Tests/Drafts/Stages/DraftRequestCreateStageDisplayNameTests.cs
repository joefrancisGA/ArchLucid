using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.Stages;
using ArchLucid.Application.Tests.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts.Stages;

[Trait("Category", "Unit")]
public sealed class DraftRequestCreateStageDisplayNameTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task CreateAsync_names_identity_from_system_name_when_provided()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService identityService =
            ArchitectureIdentityServiceTestSupport.Create(identityRepository, runRepository, draftRepository);
        DraftRequestCreateStage sut = new(
            draftRepository,
            Mock.Of<IPriorPackageSemanticMergeService>(),
            identityService);

        DraftRequestResponse created = await sut.CreateAsync(
            Scope,
            "operator@test",
            new CreateDraftRequest
            {
                FreeTextIntent = new string('x', DraftIntakeValidation.MinimumFreeTextIntentLength),
                SystemName = "PartnerApiPlatform",
            },
            CancellationToken.None);

        created.Document.SystemName.Should().Be("PartnerApiPlatform");

        ArchitectureIdentityRecord? identity = await identityRepository.GetByIdAsync(Scope, created.ArchitectureId!.Value);
        identity.Should().NotBeNull();
        identity!.DisplayName.Should().Be("PartnerApiPlatform");
    }

    [Fact]
    public async Task CreateAsync_names_identity_from_intent_when_system_name_is_absent()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService identityService =
            ArchitectureIdentityServiceTestSupport.Create(identityRepository, runRepository, draftRepository);
        DraftRequestCreateStage sut = new(
            draftRepository,
            Mock.Of<IPriorPackageSemanticMergeService>(),
            identityService);
        string intent = new('x', DraftIntakeValidation.MinimumFreeTextIntentLength);

        DraftRequestResponse created = await sut.CreateAsync(
            Scope,
            "operator@test",
            new CreateDraftRequest { FreeTextIntent = intent },
            CancellationToken.None);

        created.Document.SystemName.Should().BeNull();

        ArchitectureIdentityRecord? identity = await identityRepository.GetByIdAsync(Scope, created.ArchitectureId!.Value);
        identity.Should().NotBeNull();
        identity!.DisplayName.Should().Be(intent);
    }
}
