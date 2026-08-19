using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class PriorPackageSemanticMergeServiceTests
{
    [Fact]
    public async Task MergePriorPackageSemanticsAsync_inherits_actors_and_assumptions()
    {
        Guid priorRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, priorRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = priorRunId,
                ArchitectureRequestId = "prior-req",
                GoldenManifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            });

        Mock<IArchitectureRequestRepository> requestRepository = new();
        requestRepository
            .Setup(r => r.GetByIdAsync("prior-req", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                Description = "Prior regulated workload",
                SystemName = "prior-system",
                DraftActors =
                [
                    new ActorDescriptor
                    {
                        Label = "Claims adjuster",
                        Kind = ActorKind.Human,
                        TrustOrigin = TrustOrigin.Internal,
                        Contract = InteractionContract.Sync,
                    },
                ],
                Assumptions = ["Single-region MVP"],
            });

        Mock<IGoldenManifestRepository> manifestRepository = new();
        manifestRepository
            .Setup(r => r.GetByIdAsync(
                scope,
                Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ManifestDocument
            {
                Assumptions = ["Audit logs retained 7 years"],
                Decisions =
                [
                    new ResolvedArchitectureDecision
                    {
                        DecisionId = "dec-1",
                        Title = "Use private endpoints",
                        Category = "network",
                        SelectedOption = "private-link",
                        Rationale = "Prior review",
                    },
                ],
            });

        PriorPackageSemanticMergeService sut = new(
            runRepository.Object,
            requestRepository.Object,
            manifestRepository.Object);

        DraftRequestDocument document = new();

        await sut.MergePriorPackageSemanticsAsync(scope, document, priorRunId.ToString("D"), CancellationToken.None);

        document.ActorSet.Actors.Should().ContainSingle();
        document.StructuredBrief.ConfirmedAssumptions.Should().Contain("Single-region MVP");
        document.StructuredBrief.ConfirmedAssumptions.Should().Contain("Audit logs retained 7 years");
        document.TransparencyTrail.Asserted.Should().Contain(entry => entry.Key.StartsWith("prior.decision.", StringComparison.Ordinal));
    }
}
