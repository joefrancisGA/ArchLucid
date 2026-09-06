using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityEnsureForDraftTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task EnsureForDraftAsync_creates_one_identity_and_links_draft()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new();

        DraftRequestResponse draft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator@test",
            new DraftRequestDocument
            {
                FreeTextIntent = new string('x', DraftIntakeValidation.MinimumFreeTextIntentLength),
                SystemName = "Payments API",
            },
            CancellationToken.None);

        ArchitectureIdentityService sut = new(
            identityRepository,
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            draftRepository);

        ArchitectureIdentityRecord? first = await sut.EnsureForDraftAsync(
            Scope,
            draft.DraftId,
            draft.Document.SystemName,
            CancellationToken.None);

        ArchitectureIdentityRecord? second = await sut.EnsureForDraftAsync(
            Scope,
            draft.DraftId,
            draft.Document.SystemName,
            CancellationToken.None);

        first.Should().NotBeNull();
        second.Should().NotBeNull();
        first!.ArchitectureId.Should().Be(second!.ArchitectureId);
        first.DisplayName.Should().Be("Payments API");

        DraftRequestResponse? refreshed = await draftRepository.GetAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            CancellationToken.None);

        refreshed.Should().NotBeNull();
        refreshed!.ArchitectureId.Should().Be(first.ArchitectureId);
    }
}
