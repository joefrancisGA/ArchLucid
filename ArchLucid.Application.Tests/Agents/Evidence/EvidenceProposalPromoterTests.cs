using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Category", "Unit")]
public sealed class EvidenceProposalPromoterTests
{
    private static readonly ScopeContext TenantScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task PromoteAsync_WhenAlreadyPromoted_Throws()
    {
        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(r => r.TryGetEvidenceProposalAsync(It.IsAny<ScopeContext>(), "r1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EvidenceProposalListItem
            {
                ResultId = "r1",
                RunId = Guid.NewGuid().ToString(),
                AgentType = "Topology",
                ProposedEvidenceJson = """{"type":"Policy","title":"Encrypt","description":"Use CMK.","rationale":"Gap"}""",
                CreatedUtc = DateTime.UtcNow,
                IsPromoted = true,
            });

        EvidenceProposalPromoter sut = BuildSut(agentResults.Object, new Mock<ITenantCuratedEvidenceRepository>().Object);

        Func<Task> act = () => sut.PromoteAsync("r1");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already promoted*");
    }

    [Fact]
    public async Task PromoteAsync_WhenInvalidJson_Throws()
    {
        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(r => r.TryGetEvidenceProposalAsync(It.IsAny<ScopeContext>(), "r1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EvidenceProposalListItem
            {
                ResultId = "r1",
                ProposedEvidenceJson = "not-json",
                IsPromoted = false,
            });

        EvidenceProposalPromoter sut = BuildSut(agentResults.Object, new Mock<ITenantCuratedEvidenceRepository>().Object);

        Func<Task> act = () => sut.PromoteAsync("r1");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*invalid*");
    }

    private static EvidenceProposalPromoter BuildSut(
        IAgentResultRepository agentResults,
        ITenantCuratedEvidenceRepository curated,
        IAgentResultEnrichmentRepository? enrichmentRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(TenantScope);

        Mock<IArchLucidUnitOfWorkFactory> uowFactory = new();
        Mock<IArchLucidUnitOfWork> uow = new();
        uow.SetupGet(x => x.SupportsExternalTransaction).Returns(false);
        uow.Setup(x => x.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        uow.Setup(x => x.RollbackAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        uowFactory.Setup(f => f.CreateAsync(It.IsAny<CancellationToken>())).ReturnsAsync(uow.Object);

        IAgentResultEnrichmentRepository enrichments =
            enrichmentRepository ?? new InMemoryAgentResultEnrichmentRepository();

        return new EvidenceProposalPromoter(
            agentResults,
            enrichments,
            curated,
            scope.Object,
            uowFactory.Object);
    }
}
