using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.PromptInjection;
using ArchLucid.Core.AiUsage;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch17Tests
{
    [Fact]
    public async Task PassthroughTenantLlmMonthlyBudgetCapResolver_returns_no_cap_and_allows_overage()
    {
        PassthroughTenantLlmMonthlyBudgetCapResolver sut = new();
        Guid tenantId = Guid.NewGuid();

        decimal? hardCap = await sut.ResolveHardCapUsdAsync(tenantId, CancellationToken.None);
        bool overageAllowed = await sut.IsWalletOverageAllowedAsync(tenantId, CancellationToken.None);

        hardCap.Should().BeNull();
        overageAllowed.Should().BeTrue();
    }

    [Fact]
    public async Task NoOpAiBudgetPreCallGuard_allows_calls_and_no_ops_on_recording()
    {
        NoOpAiBudgetPreCallGuard sut = new();

        AiBudgetPreCallGuardResult result = await sut.EnsureAllowedAsync(
            Guid.NewGuid(),
            AiUsageFeature.ArchitectureGeneration,
            "azure-openai",
            "sys",
            "user",
            correlationId: null,
            actorUserId: null,
            CancellationToken.None);
        Func<Task> record = async () => await sut.RecordCompletionAsync(
            Guid.NewGuid(),
            AiUsageFeature.ArchitectureGeneration,
            "azure-openai",
            inputTokens: 10,
            outputTokens: 5,
            estimatedCostUsd: 0.01m,
            correlationId: null,
            actorUserId: null,
            CancellationToken.None);

        result.ServedFromDemoCache.Should().BeFalse();
        result.CachedResponseJson.Should().BeNull();
        await record.Should().NotThrowAsync();
    }

    [Fact]
    public void NoOpDemoAiPromptCache_TryGet_always_misses_and_Set_is_a_noop()
    {
        NoOpDemoAiPromptCache sut = new();

        bool found = sut.TryGet("any-key", out string responseJson);
        sut.Set("any-key", "{\"ignored\":true}");

        found.Should().BeFalse();
        responseJson.Should().BeEmpty();
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    [InlineData(11, 10)]
    [InlineData(500, 10)]
    [InlineData(5, 5)]
    public void AgentSchemaRemediationOptions_Normalize_clamps_into_safe_interval(int requested, int expected)
    {
        AgentSchemaRemediationOptions options = new() { MaxCompletionAttempts = requested };

        options.Normalize();

        options.MaxCompletionAttempts.Should().Be(expected);
    }

    [Fact]
    public void AgentResultSchemaValidationOptions_exposes_section_path_and_default_enforcement()
    {
        AgentResultSchemaValidationOptions options = new();

        AgentResultSchemaValidationOptions.SectionPath.Should().Be("AgentExecution:SchemaValidation");
        options.EnforceOnParse.Should().BeTrue();
    }

    [Fact]
    public void AgentExecutionTraceStorageOptions_exposes_section_path_and_default_timeout()
    {
        AgentExecutionTraceStorageOptions options = new();

        AgentExecutionTraceStorageOptions.SectionPath.Should().Be("AgentExecution:TraceStorage");
        options.BlobPersistenceTimeoutSeconds.Should().Be(30);
    }

    [Fact]
    public void ExplanationServiceOptions_exposes_section_path_and_defaults()
    {
        ExplanationServiceOptions options = new();

        ExplanationServiceOptions.SectionPath.Should().Be("AgentExecution:Explanation");
        options.AgentType.Should().Be("run-explanation");
        options.PromptTemplateId.Should().BeNull();
        options.PromptTemplateVersion.Should().BeNull();
        options.PromptContentHash.Should().BeNull();
        options.MaxTokens.Should().BeNull();
    }

    [Fact]
    public void AgentOutputReferenceCaseCatalog_Cases_returns_empty_when_disabled()
    {
        AgentOutputReferenceCaseCatalog sut = CreateCatalog(
            new AgentExecutionReferenceEvaluationOptions { Enabled = false, ReferenceCasesPath = "unused.json" },
            contentRootPath: Path.GetTempPath());

        sut.Cases.Should().BeEmpty();
    }

    [Fact]
    public void AgentOutputReferenceCaseCatalog_Cases_returns_empty_when_path_blank()
    {
        AgentOutputReferenceCaseCatalog sut = CreateCatalog(
            new AgentExecutionReferenceEvaluationOptions { Enabled = true, ReferenceCasesPath = "   " },
            contentRootPath: Path.GetTempPath());

        sut.Cases.Should().BeEmpty();
    }

    [Fact]
    public void AgentOutputReferenceCaseCatalog_Cases_returns_empty_when_file_missing()
    {
        string contentRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);

        try
        {
            AgentOutputReferenceCaseCatalog sut = CreateCatalog(
                new AgentExecutionReferenceEvaluationOptions
                {
                    Enabled = true,
                    ReferenceCasesPath = "does-not-exist.json",
                },
                contentRoot);

            sut.Cases.Should().BeEmpty();
        }
        finally
        {
            Directory.Delete(contentRoot, recursive: true);
        }
    }

    [Fact]
    public void AgentOutputReferenceCaseCatalog_Cases_returns_empty_when_json_invalid()
    {
        string contentRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);
        string path = Path.Combine(contentRoot, "cases.json");
        File.WriteAllText(path, "{ not valid json ]");

        try
        {
            AgentOutputReferenceCaseCatalog sut = CreateCatalog(
                new AgentExecutionReferenceEvaluationOptions { Enabled = true, ReferenceCasesPath = "cases.json" },
                contentRoot);

            sut.Cases.Should().BeEmpty();
        }
        finally
        {
            Directory.Delete(contentRoot, recursive: true);
        }
    }

    [Fact]
    public void AgentOutputReferenceCaseCatalog_Cases_skips_entries_with_blank_case_id_and_caches_result()
    {
        string contentRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);
        string path = Path.Combine(contentRoot, "cases.json");
        File.WriteAllText(
            path,
            """
            [
              { "caseId": "valid-case", "agentType": "Topology" },
              { "caseId": "  ", "agentType": "Cost" }
            ]
            """);

        try
        {
            AgentOutputReferenceCaseCatalog sut = CreateCatalog(
                new AgentExecutionReferenceEvaluationOptions { Enabled = true, ReferenceCasesPath = "cases.json" },
                contentRoot);

            IReadOnlyList<AgentOutputReferenceCaseDefinition> first = sut.Cases;
            IReadOnlyList<AgentOutputReferenceCaseDefinition> second = sut.Cases;

            first.Should().ContainSingle();
            first[0].CaseId.Should().Be("valid-case");
            second.Should().BeSameAs(first);
        }
        finally
        {
            Directory.Delete(contentRoot, recursive: true);
        }
    }

    [Fact]
    public void FaithfulnessJudgeSystemPromptTemplate_GetText_documents_the_scoring_rubric()
    {
        FaithfulnessJudgeSystemPromptTemplate.TemplateId.Should().Be("faithfulness-judge-system");
        FaithfulnessJudgeSystemPromptTemplate.Version.Should().Be("1.0.0");

        string text = FaithfulnessJudgeSystemPromptTemplate.GetText();

        text.Should().Contain("Faithfulness");
        text.Should().Contain("faithfulnessScore");
        text.Should().NotContain(AzureResourceTagPromptSanitizer.IgnoreInstructionsInUntrustedTags);
    }

    [Fact]
    public void FaithfulnessJudgePromptResolver_Resolve_appends_untrusted_tag_guard_and_sets_metadata()
    {
        ResolvedSystemPrompt resolved = FaithfulnessJudgePromptResolver.Resolve(releaseLabel: "rel-1");

        resolved.Text.Should().Contain(AzureResourceTagPromptSanitizer.IgnoreInstructionsInUntrustedTags);
        resolved.TemplateId.Should().Be(FaithfulnessJudgeSystemPromptTemplate.TemplateId);
        resolved.TemplateVersion.Should().Be(FaithfulnessJudgeSystemPromptTemplate.Version);
        resolved.ReleaseLabel.Should().Be("rel-1");
        resolved.ContentSha256Hex.Should().NotBeNullOrWhiteSpace();
    }

    private static AgentOutputReferenceCaseCatalog CreateCatalog(
        AgentExecutionReferenceEvaluationOptions currentValue,
        string contentRootPath)
    {
        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(currentValue);

        return new AgentOutputReferenceCaseCatalog(
            options.Object,
            contentRootPath,
            NullLogger<AgentOutputReferenceCaseCatalog>.Instance);
    }
}
