using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;
[Trait("Category", "Unit")]

public sealed class ExecutionProvenanceFooterRendererTests
{
    private readonly ExecutionProvenanceFooterRenderer _sut = new();

    [SkippableFact]
    public void BuildFooterMarkdown_WhenSimulatorMode_usesSimulatorLabel()
    {
        ExecutionProvenanceFooterInput input = new(
            PersistedStructuralExecutionMode: StructuralExecutionMode.Simulator,
            RealModeFellBackToSimulator: false,
            PilotAoaiDeploymentSnapshot: null,
            HostAgentExecutionMode: "Simulator",
            HostAzureOpenAiDeploymentName: "gpt-4",
            LlmCompletionTraceCount: 2);

        string md = _sut.BuildFooterMarkdown(input);

        md.Should().Contain("| Mode | Simulator |");
        md.Should().Contain("LLM completion traces (this run) | 2");
    }

    [SkippableFact]
    public void BuildFooterMarkdown_WhenRealMode_usesRealLabelAndDeployment()
    {
        ExecutionProvenanceFooterInput input = new(
            PersistedStructuralExecutionMode: StructuralExecutionMode.Real,
            RealModeFellBackToSimulator: false,
            PilotAoaiDeploymentSnapshot: null,
            HostAgentExecutionMode: "Real",
            HostAzureOpenAiDeploymentName: "my-deployment",
            LlmCompletionTraceCount: 5);

        string md = _sut.BuildFooterMarkdown(input);

        md.Should().Contain("| Mode | Real |");
        md.Should().Contain("`my-deployment`");
    }

    [SkippableFact]
    public void BuildFooterMarkdown_WhenFellBack_usesFallbackLabelAndSnapshotDeployment()
    {
        ExecutionProvenanceFooterInput input = new(
            PersistedStructuralExecutionMode: StructuralExecutionMode.Fallback,
            RealModeFellBackToSimulator: true,
            PilotAoaiDeploymentSnapshot: "snap-dep",
            HostAgentExecutionMode: "Real",
            HostAzureOpenAiDeploymentName: "ignored",
            LlmCompletionTraceCount: 1);

        string md = _sut.BuildFooterMarkdown(input);

        md.Should().Contain("| Mode | Fallback |");
        md.Should().Contain("Real \u2192 Simulator (fallback)");
        md.Should().Contain("`snap-dep`");
    }

    [SkippableFact]
    public void BuildFooterMarkdown_WhenFellBackAndNoSnapshot_showsUnknownPlaceholder()
    {
        ExecutionProvenanceFooterInput input = new(
            PersistedStructuralExecutionMode: StructuralExecutionMode.Fallback,
            RealModeFellBackToSimulator: true,
            PilotAoaiDeploymentSnapshot: null,
            HostAgentExecutionMode: "Real",
            HostAzureOpenAiDeploymentName: "dep",
            LlmCompletionTraceCount: 0);

        string md = _sut.BuildFooterMarkdown(input);

        md.Should().Contain("(unknown at fallback)");
    }

    [SkippableFact]
    public void BuildYellowSimulatorSubstitutionCallout_containsWarningAndDocLink()
    {
        string callout = _sut.BuildYellowSimulatorSubstitutionCallout();

        callout.Should().Contain("[!WARNING]");
        callout.Should().Contain("docs/runbooks/AGENT_EXECUTION_FAILURES.md");
    }
}
