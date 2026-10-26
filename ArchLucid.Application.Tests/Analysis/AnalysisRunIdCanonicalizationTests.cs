using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class AnalysisRunIdCanonicalizationTests
{
    [Fact]
    public void CanonicalRunIdForPersistenceOrNull_whitespace_only_returns_null()
    {
        AnalysisRunIdCanonicalization.CanonicalRunIdForPersistenceOrNull("   ").Should().BeNull();
        AnalysisRunIdCanonicalization.CanonicalRunIdForPersistenceOrNull("\t\n").Should().BeNull();
    }

    [Fact]
    public void CanonicalRunIdForLookup_trims_opaque_run_id()
    {
        AnalysisRunIdCanonicalization.CanonicalRunIdForLookup("  opaque-run-key  ")
            .Should().Be("opaque-run-key");
    }

    [Fact]
    public void CanonicalRunIdForLookupOrNull_whitespace_only_returns_null()
    {
        AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull("  ").Should().BeNull();
    }

    [Fact]
    public void EnumerateRunIdRepositoryLookupKeys_includes_uppercase_dashed_guid()
    {
        Guid runKey = Guid.Parse("14141414-1414-1414-1414-141414141414");
        string canonical = runKey.ToString("N");
        string dashedUpper = runKey.ToString("D").ToUpperInvariant();

        AnalysisRunIdCanonicalization.EnumerateRunIdRepositoryLookupKeys(canonical)
            .Should()
            .Contain(dashedUpper);
    }

    [Fact]
    public void EnumerateRunIdRepositoryLookupKeys_includes_uppercase_braced_guid()
    {
        Guid runKey = Guid.Parse("16161616-1616-1616-1616-161616161616");
        string canonical = runKey.ToString("N");
        string bracedUpper = runKey.ToString("B").ToUpperInvariant();

        AnalysisRunIdCanonicalization.EnumerateRunIdRepositoryLookupKeys(canonical)
            .Should()
            .Contain(bracedUpper);
    }

    [Fact]
    public void EnumerateRunIdRepositoryLookupKeys_includes_parentheses_guid()
    {
        Guid runKey = Guid.Parse("36363636-3636-3636-3636-363636363636");
        string canonical = runKey.ToString("N");
        string parentheses = runKey.ToString("P");

        AnalysisRunIdCanonicalization.EnumerateRunIdRepositoryLookupKeys(canonical)
            .Should()
            .Contain(parentheses);
    }

    [Fact]
    public void AgentResultsAppearAnchoredToRun_returns_false_when_any_result_lacks_run_anchor()
    {
        Guid runKey = Guid.Parse("19191919-1919-1919-1919-191919191919");
        string canonical = runKey.ToString("N");

        AnalysisRunIdCanonicalization.AgentResultsAppearAnchoredToRun(
                [new AgentResult { RunId = string.Empty, AgentType = AgentType.Topology }],
                canonical)
            .Should()
            .BeFalse();

        AnalysisRunIdCanonicalization.AgentResultsAppearAnchoredToRun(
                [new AgentResult { RunId = canonical, AgentType = AgentType.Topology }],
                canonical)
            .Should()
            .BeTrue();
    }
}
