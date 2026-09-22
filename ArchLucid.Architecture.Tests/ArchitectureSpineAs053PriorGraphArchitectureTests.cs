using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-053 ratchet: Working execute loads prior sealed graph for topology-security-drift (DX-64).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs053PriorGraphArchitectureTests
{
    [Fact]
    public void FindingAnalysisContextBuilder_resolves_architecture_prior_sealed_review_for_working_execute()
    {
        string builder = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        builder.Should().Contain("GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync");
        builder.Should().Contain("TryResolvePriorFromArchitectureSealedReviewAsync");
        builder.Should().Contain("header.IsSample");
    }
}
