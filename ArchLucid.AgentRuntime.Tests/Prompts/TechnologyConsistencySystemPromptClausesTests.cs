using ArchLucid.AgentRuntime.Prompts;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Prompts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TechnologyConsistencySystemPromptClausesTests
{
    [Fact]
    public void ClosedWorldClause_references_technology_ledger_and_assumed_proposals()
    {
        TechnologyConsistencySystemPromptClauses.ClosedWorldClause
            .Should()
            .Contain("Technology Ledger")
            .And.Contain("Assumed")
            .And.Contain("ProposedChanges");
    }

    [Fact]
    public void AlternativeLabelingClause_requires_alternative_under_consideration()
    {
        TechnologyConsistencySystemPromptClauses.AlternativeLabelingClause
            .Should()
            .Contain("alternative under consideration")
            .And.Contain("under consideration");
    }

    [Fact]
    public void NeutralModeClause_forbids_hyperscaler_defaults_when_cloud_neutral()
    {
        TechnologyConsistencySystemPromptClauses.NeutralModeClause
            .Should()
            .Contain("cloud-neutral")
            .And.Contain("secrets store");
    }

    [Fact]
    public void TargetCloudAwarenessClause_defers_to_user_prompt_ledger_context()
    {
        TechnologyConsistencySystemPromptClauses.TargetCloudAwarenessClause
            .Should()
            .Contain("Technology Ledger")
            .And.Contain("effective target cloud");
    }

    [Fact]
    public void MandatoryBlock_composes_all_clauses()
    {
        string block = TechnologyConsistencySystemPromptClauses.MandatoryBlock;

        block.Should().Contain("Technology Ledger consistency (mandatory):");
        block.Should().Contain(TechnologyConsistencySystemPromptClauses.ClosedWorldClause.Trim());
        block.Should().Contain(TechnologyConsistencySystemPromptClauses.AlternativeLabelingClause.Trim());
        block.Should().Contain(TechnologyConsistencySystemPromptClauses.NeutralModeClause.Trim());
        block.Should().Contain(TechnologyConsistencySystemPromptClauses.TargetCloudAwarenessClause.Trim());
    }
}
