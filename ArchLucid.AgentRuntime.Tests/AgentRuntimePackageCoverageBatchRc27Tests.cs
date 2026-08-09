using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     RC27 coverage batch for AgentRuntime helpers: embedding vector math, LLM provider budget exclusions,
///     Azure OpenAI cached-token reading, schema-violation audit scheduling, and completion request ambient params.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatchRc27Tests
{
    [Fact]
    public void EmbeddingFaithfulnessVectorMath_CosineSimilarity_returns_zero_for_length_mismatch_or_empty()
    {
        float[] a = [1f, 0f];
        float[] b = [1f];

        EmbeddingFaithfulnessVectorMath.CosineSimilarity(a, b).Should().Be(0);
        EmbeddingFaithfulnessVectorMath.CosineSimilarity(ReadOnlySpan<float>.Empty, ReadOnlySpan<float>.Empty)
            .Should().Be(0);
    }

    [Fact]
    public void EmbeddingFaithfulnessVectorMath_CosineSimilarity_returns_zero_for_zero_vectors()
    {
        float[] zero = [0f, 0f, 0f];

        EmbeddingFaithfulnessVectorMath.CosineSimilarity(zero, zero).Should().Be(0);
    }

    [Fact]
    public void EmbeddingFaithfulnessVectorMath_CosineSimilarity_identical_and_orthogonal_vectors()
    {
        float[] identicalA = [1f, 2f, 3f];
        float[] identicalB = [1f, 2f, 3f];
        float[] orthogonalA = [1f, 0f];
        float[] orthogonalB = [0f, 1f];

        EmbeddingFaithfulnessVectorMath.CosineSimilarity(identicalA, identicalB).Should().BeApproximately(1.0, 1e-9);
        EmbeddingFaithfulnessVectorMath.CosineSimilarity(orthogonalA, orthogonalB).Should().BeApproximately(0.0, 1e-9);
    }

    [Theory]
    [InlineData(-1.0, 0.0)]
    [InlineData(0.0, 0.5)]
    [InlineData(1.0, 1.0)]
    [InlineData(-2.0, 0.0)]
    [InlineData(3.0, 1.0)]
    public void EmbeddingFaithfulnessVectorMath_ToTelemetryUnitInterval_clamps_mapped_cosine(
        double cosine,
        double expected)
    {
        EmbeddingFaithfulnessVectorMath.ToTelemetryUnitInterval(cosine).Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("azure-openai")]
    public void LlmProviderKindExtensions_non_excluded_kinds_return_false(string? kind)
    {
        kind.IsExcludedFromBudgetTracking().Should().BeFalse();
    }

    [Theory]
    [InlineData("simulator")]
    [InlineData("Simulator")]
    [InlineData("fake")]
    [InlineData("FAKE")]
    [InlineData("echo")]
    [InlineData("ECHO")]
    public void LlmProviderKindExtensions_excluded_kinds_return_true(string kind)
    {
        kind.IsExcludedFromBudgetTracking().Should().BeTrue();
    }

    [Fact]
    public void AzureOpenAiChatTokenUsageReader_reads_cached_input_tokens_or_zero()
    {
        ChatInputTokenUsageDetails details = OpenAIChatModelFactory.ChatInputTokenUsageDetails(cachedTokenCount: 42);
        ChatTokenUsage withDetails = OpenAIChatModelFactory.ChatTokenUsage(
            outputTokenCount: 1,
            inputTokenCount: 10,
            totalTokenCount: 11,
            inputTokenDetails: details);
        ChatTokenUsage withoutDetails = OpenAIChatModelFactory.ChatTokenUsage(
            outputTokenCount: 1,
            inputTokenCount: 10,
            totalTokenCount: 11);

        AzureOpenAiChatTokenUsageReader.ReadCachedInputTokens(withDetails).Should().Be(42);
        AzureOpenAiChatTokenUsageReader.ReadCachedInputTokens(withoutDetails).Should().Be(0);
    }

    [Fact]
    public void AgentResultSchemaViolationAudit_ScheduleLog_rejects_null_or_blank_required_args()
    {
        Mock<IAuditService> audit = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        AgentResultSchemaViolationException ex = new(
            "schema failed",
            ["e1"],
            """{"x":1}""",
            AgentType.Critic);

        Action nullAudit = () => AgentResultSchemaViolationAudit.ScheduleLog(
            null!,
            scopeProvider.Object,
            ex,
            runId: Guid.NewGuid().ToString("N"),
            taskId: "t1",
            modelDeploymentName: null,
            modelVersion: null);
        Action nullScope = () => AgentResultSchemaViolationAudit.ScheduleLog(
            audit.Object,
            null!,
            ex,
            runId: Guid.NewGuid().ToString("N"),
            taskId: "t1",
            modelDeploymentName: null,
            modelVersion: null);
        Action nullEx = () => AgentResultSchemaViolationAudit.ScheduleLog(
            audit.Object,
            scopeProvider.Object,
            null!,
            runId: Guid.NewGuid().ToString("N"),
            taskId: "t1",
            modelDeploymentName: null,
            modelVersion: null);
        Action blankRun = () => AgentResultSchemaViolationAudit.ScheduleLog(
            audit.Object,
            scopeProvider.Object,
            ex,
            runId: "  ",
            taskId: "t1",
            modelDeploymentName: null,
            modelVersion: null);
        Action blankTask = () => AgentResultSchemaViolationAudit.ScheduleLog(
            audit.Object,
            scopeProvider.Object,
            ex,
            runId: Guid.NewGuid().ToString("N"),
            taskId: "",
            modelDeploymentName: null,
            modelVersion: null);

        nullAudit.Should().Throw<ArgumentNullException>().WithParameterName("auditService");
        nullScope.Should().Throw<ArgumentNullException>().WithParameterName("scopeProvider");
        nullEx.Should().Throw<ArgumentNullException>().WithParameterName("ex");
        blankRun.Should().Throw<ArgumentException>().WithParameterName("runId");
        blankTask.Should().Throw<ArgumentException>().WithParameterName("taskId");
    }

    [Fact]
    public void AgentResultSchemaViolationAudit_ScheduleLog_schedules_without_throwing_and_truncates_errors()
    {
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        AgentResultSchemaViolationException violation = new(
            "schema failed",
            ["error-1", "error-2", "error-3", "error-4"],
            """{"findings":[]}""",
            AgentType.Topology);
        string runId = Guid.NewGuid().ToString("N");

        Action act = () => AgentResultSchemaViolationAudit.ScheduleLog(
            audit.Object,
            scopeProvider.Object,
            violation,
            runId,
            taskId: "task-1",
            modelDeploymentName: "gpt",
            modelVersion: "2024");

        act.Should().NotThrow();
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.AgentResultSchemaViolation
                    && e.RunId == Guid.Parse(runId)
                    && e.DataJson.Contains("error-1", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"errorCount\":4", StringComparison.Ordinal)
                    && !e.DataJson.Contains("error-4", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public void AgentResultSchemaViolationAudit_ScheduleLog_swallows_scope_provider_failures()
    {
        Mock<IAuditService> audit = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Throws(new InvalidOperationException("scope boom"));
        AgentResultSchemaViolationException violation = new(
            "schema failed",
            ["e1"],
            """{"x":1}""",
            AgentType.Critic);

        Action act = () => AgentResultSchemaViolationAudit.ScheduleLog(
            audit.Object,
            scopeProvider.Object,
            violation,
            runId: "not-a-guid",
            taskId: "task-1",
            modelDeploymentName: null,
            modelVersion: null);

        act.Should().NotThrow();
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public void AgentCompletionRequestParams_TryConsume_returns_nulls_when_ambient_empty()
    {
        LlmCompletionRequestParamsAmbient.Clear();

        AgentCompletionRequestParams.TryConsume(out float? temperature, out int? maxOutputTokens, out float? topP);

        temperature.Should().BeNull();
        maxOutputTokens.Should().BeNull();
        topP.Should().BeNull();
    }

    [Fact]
    public void AgentCompletionRequestParams_TryConsume_reads_and_clears_seeded_ambient_params()
    {
        LlmCompletionRequestParamsAmbient.Clear();
        LlmCompletionRequestParamsAmbient.TestingSeed(0.2f, 256, 0.9f);

        AgentCompletionRequestParams.TryConsume(out float? temperature, out int? maxOutputTokens, out float? topP);

        temperature.Should().Be(0.2f);
        maxOutputTokens.Should().Be(256);
        topP.Should().Be(0.9f);

        AgentCompletionRequestParams.TryConsume(out float? againTemp, out int? againMax, out float? againTopP);

        againTemp.Should().BeNull();
        againMax.Should().BeNull();
        againTopP.Should().BeNull();
    }
}
