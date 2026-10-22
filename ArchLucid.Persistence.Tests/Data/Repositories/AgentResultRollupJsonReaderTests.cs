using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentResultRollupJsonReaderTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ReadClaims_returns_empty_for_missing_fragment(string? claimsJson)
    {
        AgentResultRollupJsonReader.ReadClaims(claimsJson, "run1").Should().BeEmpty();
    }

    [Fact]
    public void ReadClaims_reads_a_json_array_fragment()
    {
        List<string> claims = AgentResultRollupJsonReader.ReadClaims("""["first","second"]""", "run1");

        claims.Should().Equal("first", "second");
    }

    [Fact]
    public void ReadClaims_throws_with_the_run_id_when_the_fragment_is_corrupt()
    {
        Action act = () => AgentResultRollupJsonReader.ReadClaims("[not json", "run1");

        act.Should().Throw<InvalidOperationException>().WithMessage("*run1*");
    }

    [Fact]
    public void ReadStringList_reads_a_json_array_fragment()
    {
        AgentResultRollupJsonReader.ReadStringList("""["e1"]""", "run1", "evidenceRefs")
            .Should()
            .Equal("e1");
    }

    [Fact]
    public void ReadStringList_names_the_field_when_the_fragment_is_corrupt()
    {
        Action act = () => AgentResultRollupJsonReader.ReadStringList("[", "run1", "evidenceRefs");

        act.Should().Throw<InvalidOperationException>().WithMessage("*evidenceRefs*run1*");
    }

    [Fact]
    public void ReadStringList_returns_empty_for_missing_fragment()
    {
        AgentResultRollupJsonReader.ReadStringList(null, "run1", "warnings").Should().BeEmpty();
    }

    [Fact]
    public void ReadFindings_reads_architecture_findings()
    {
        const string findingsJson = """[{"message":"Unencrypted queue","severity":"Warning"}]""";

        List<ArchitectureFinding> findings = AgentResultRollupJsonReader.ReadFindings(findingsJson, "run1");

        ArchitectureFinding finding = findings.Should().ContainSingle().Subject;
        finding.Message.Should().Be("Unencrypted queue");
        finding.Severity.Should().Be(FindingSeverity.Warning);
    }

    [Fact]
    public void ReadFindings_returns_empty_for_missing_fragment()
    {
        AgentResultRollupJsonReader.ReadFindings("  ", "run1").Should().BeEmpty();
    }

    [Fact]
    public void ReadFindings_throws_when_the_fragment_is_corrupt()
    {
        Action act = () => AgentResultRollupJsonReader.ReadFindings("[{", "run1");

        act.Should().Throw<InvalidOperationException>().WithMessage("*findings*run1*");
    }

    [Fact]
    public void ReadProposedChanges_returns_null_when_both_control_lists_are_empty()
    {
        AgentResultRollupJsonReader.ReadProposedChanges("[]", null, "run1").Should().BeNull();
    }

    [Fact]
    public void ReadProposedChanges_projects_required_controls_and_warnings()
    {
        AgentTopologyProposal? proposal = AgentResultRollupJsonReader.ReadProposedChanges(
            """["private-endpoints"]""",
            """["public ingress"]""",
            "run1");

        proposal.Should().NotBeNull();
        proposal!.RequiredControls.Should().Equal("private-endpoints");
        proposal.Warnings.Should().Equal("public ingress");
    }
}
