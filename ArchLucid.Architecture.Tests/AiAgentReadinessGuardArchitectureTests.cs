using System.Reflection;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-325–TB-327: AI/Agent Readiness guardrails stay wired and typed failure codes remain stable.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AiAgentReadinessGuardArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb325_prompt_injection_precheck_and_typed_rejection_exist()
    {
        typeof(DefaultRequestContentSafetyPrecheck).Should().NotBeNull();
        typeof(RequestContentSafetyRejectedException).Should().NotBeNull();
        AgentExecutionTraceFailureReasonCodes.PromptInjectionDetected.Should().Be("PromptInjectionDetected");
    }

    [Fact]
    public void Tb325_ci_runs_prompt_injection_regression_gate()
    {
        string ci = File.ReadAllText(Path.Combine(RepoRoot, ".github", "workflows", "ci.yml"));
        ci.Should().Contain("ci-agent-prompt-injection-regression");
        ci.Should().Contain("--enforce-prompt-injection-block-layer");
    }

    [Fact]
    public void Tb326_fallback_completion_client_and_degradation_projection_exist()
    {
        typeof(FallbackAgentCompletionClient).Should().NotBeNull();
        typeof(RunExecutionDegradation).Should().NotBeNull();

        MethodInfo? consume = typeof(FallbackAgentCompletionClient).GetMethod(
            nameof(FallbackAgentCompletionClient.TryConsumeLastFallbackUsed),
            BindingFlags.Public | BindingFlags.Static);

        consume.Should().NotBeNull();
    }

    [Fact]
    public void Tb326_host_composition_wires_fallback_and_cost_guardrail()
    {
        string agentsStartupDir = Path.Combine(RepoRoot, "ArchLucid.Host.Composition", "Startup");
        string text = string.Concat(
            File.ReadAllText(Path.Combine(agentsStartupDir, "ServiceCollectionExtensions.Agents.cs")),
            File.ReadAllText(Path.Combine(agentsStartupDir, "ServiceCollectionExtensions.Agents.CompletionPipeline.cs")));

        text.Should().Contain("new FallbackAgentCompletionClient(");
        text.Should().Contain("new CostGuardrailInterceptor(");
    }

    [Fact]
    public void Tb327_token_budget_reason_code_and_interceptor_exist()
    {
        AgentExecutionTraceFailureReasonCodes.TokenBudgetExceeded.Should().Be("TokenBudgetExceeded");
        typeof(CostGuardrailInterceptor).Should().NotBeNull();

        string production = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Api", "appsettings.Production.json"));
        production.Should().Contain("MaxTokensPerRun");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
