using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Governance;

namespace ArchLucid.Persistence.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class NoOpGovernanceQueryTests
{
    [Fact]
    public async Task NoOpArchitectureRiskRegisterQuery_returns_empty_list()
    {
        NoOpArchitectureRiskRegisterQuery sut = new();

        IReadOnlyList<ArchitectureRiskRegisterEntry> rows =
            await sut.ListAsync(Guid.NewGuid(), Guid.NewGuid(), null, 50, options: null, CancellationToken.None);

        rows.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpArchitectureDecisionRegisterQuery_returns_empty_list()
    {
        NoOpArchitectureDecisionRegisterQuery sut = new();

        IReadOnlyList<ArchitectureDecisionRegisterEntry> rows =
            await sut.ListAsync(Guid.NewGuid(), Guid.NewGuid(), null, 50, filters: null, CancellationToken.None);

        rows.Should().BeEmpty();
    }
}
