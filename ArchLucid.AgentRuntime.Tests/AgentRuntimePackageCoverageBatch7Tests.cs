using System.Diagnostics;

using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Prompts;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch7Tests
{
    [Fact]
    public void AgentPromptActivityTags_applies_tags_when_activity_current_is_set()
    {
        using ActivitySource source = new("ArchLucid.Coverage.Batch7");
        using ActivityListener listener = new()
        {
            ShouldListenTo = s => s.Name == source.Name,
            Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllData,
        };
        ActivitySource.AddActivityListener(listener);

        using Activity? activity = source.StartActivity("prompt");
        activity.Should().NotBeNull();

        AgentPromptActivityTags.Apply(
            new ResolvedSystemPrompt(
                Text: "system",
                TemplateId: "tpl-1",
                TemplateVersion: "v1",
                ContentSha256Hex: "abc123",
                ReleaseLabel: "rc13"));

        activity!.GetTagItem("archlucid.agent.prompt_template_id").Should().Be("tpl-1");
        activity.GetTagItem("archlucid.agent.prompt_release_label").Should().Be("rc13");
    }

    [Fact]
    public void AgentPromptActivityTags_rejects_null_resolved_prompt()
    {
        Action act = () => AgentPromptActivityTags.Apply(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void AgentOutputReferenceCaseCatalog_returns_empty_when_disabled()
    {
        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new AgentExecutionReferenceEvaluationOptions { Enabled = false });

        AgentOutputReferenceCaseCatalog sut = new(
            options.Object,
            contentRootPath: Path.GetTempPath(),
            NullLogger<AgentOutputReferenceCaseCatalog>.Instance);

        sut.Cases.Should().BeEmpty();
    }

    [Fact]
    public void AgentOutputReferenceCaseCatalog_returns_empty_when_path_missing_or_file_absent()
    {
        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(
            new AgentExecutionReferenceEvaluationOptions
            {
                Enabled = true,
                ReferenceCasesPath = string.Empty,
            });

        AgentOutputReferenceCaseCatalog emptyPath = new(
            options.Object,
            Path.GetTempPath(),
            NullLogger<AgentOutputReferenceCaseCatalog>.Instance);
        emptyPath.Cases.Should().BeEmpty();

        options.Setup(o => o.CurrentValue).Returns(
            new AgentExecutionReferenceEvaluationOptions
            {
                Enabled = true,
                ReferenceCasesPath = Path.Combine(Path.GetTempPath(), "missing-cases-" + Guid.NewGuid().ToString("N") + ".json"),
            });

        AgentOutputReferenceCaseCatalog missingFile = new(
            options.Object,
            Path.GetTempPath(),
            NullLogger<AgentOutputReferenceCaseCatalog>.Instance);
        missingFile.Cases.Should().BeEmpty();
    }

    [Fact]
    public void AgentOutputReferenceCaseCatalog_loads_valid_cases_and_skips_blank_ids()
    {
        string path = Path.Combine(Path.GetTempPath(), "ref-cases-" + Guid.NewGuid().ToString("N") + ".json");
        File.WriteAllText(
            path,
            """
            [
              { "caseId": "case-a", "agentType": "Topology", "description": "ok" },
              { "caseId": "  ", "agentType": "Topology", "description": "skip" },
              { "caseId": "case-b", "agentType": "Cost", "description": "ok2" }
            ]
            """);

        try
        {
            Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> options = new();
            options.Setup(o => o.CurrentValue).Returns(
                new AgentExecutionReferenceEvaluationOptions
                {
                    Enabled = true,
                    ReferenceCasesPath = path,
                });

            AgentOutputReferenceCaseCatalog sut = new(
                options.Object,
                contentRootPath: Path.GetTempPath(),
                NullLogger<AgentOutputReferenceCaseCatalog>.Instance);

            sut.Cases.Select(c => c.CaseId).Should().Equal("case-a", "case-b");
        }
        finally
        {
            if (File.Exists(path))
                File.Delete(path);
        }
    }

    [Fact]
    public void LlmTelemetryLabelOptions_exposes_section_defaults()
    {
        LlmTelemetryLabelOptions options = new();

        options.ProviderId.Should().Be("unknown");
        options.ModelDeploymentLabel.Should().Be("unknown");
    }
}
