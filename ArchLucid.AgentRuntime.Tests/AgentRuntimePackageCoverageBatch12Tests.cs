using ArchLucid.AgentRuntime.Prompts;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch12Tests
{
    [Fact]
    public void AgentRunIdParser_parses_guid_without_dashes()
    {
        Guid expected = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string compact = expected.ToString("N");

        bool parsed = AgentRunIdParser.TryParse(compact, out Guid runGuid);

        parsed.Should().BeTrue();
        runGuid.Should().Be(expected);
    }

    [Fact]
    public void AgentRunIdParser_parses_standard_guid_format()
    {
        Guid expected = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        bool parsed = AgentRunIdParser.TryParse(expected.ToString(), out Guid runGuid);

        parsed.Should().BeTrue();
        runGuid.Should().Be(expected);
    }

    [Fact]
    public void AgentRunIdParser_rejects_blank_run_id()
    {
        Action act = () => AgentRunIdParser.TryParse("  ", out _);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void FaithfulnessJudgeUserPromptBuilder_includes_trace_evidence_and_agent_json()
    {
        string prompt = FaithfulnessJudgeUserPromptBuilder.Build("trace-1", "evidence body", """{"ok":true}""");

        prompt.Should().Contain("traceId:trace-1");
        prompt.Should().Contain("evidence body");
        prompt.Should().Contain("agentJson");
    }

    [Fact]
    public void InsightDensityJudgeSystemPromptTemplate_exposes_metadata_and_json_shape()
    {
        string text = InsightDensityJudgeSystemPromptTemplate.GetText();

        InsightDensityJudgeSystemPromptTemplate.TemplateId.Should().Be("insight-density-judge-system");
        InsightDensityJudgeSystemPromptTemplate.Version.Should().Be("1.0.0");
        text.Should().Contain("insightDensityScore");
        text.Should().Contain("demoteToChecklist");
    }
}
