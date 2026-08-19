using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Agents;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Import;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationNoOpAndTriageCoverageTests
{
    [Fact]
    public async Task NoOpEvidencePackageInjectionMitigator_returns_zero_redactions()
    {
        NoOpEvidencePackageInjectionMitigator sut = new();
        AgentEvidencePackage evidence = new() { RunId = Guid.NewGuid().ToString("N") };

        int redacted = await sut.RedactKnownInjectionPatternsAsync(evidence, CancellationToken.None);

        redacted.Should().Be(0);
    }

    [Fact]
    public async Task NoOpAgentEvidenceUntrustedInputSanitizer_completes()
    {
        NoOpAgentEvidenceUntrustedInputSanitizer sut = new();
        AgentEvidencePackage evidence = new() { RunId = Guid.NewGuid().ToString("N") };

        await sut.Invoking(s => s.SanitizeAsync(evidence, CancellationToken.None)).Should().NotThrowAsync();
    }

    [Fact]
    public async Task NoOpAgentToolInvocationRecordWriter_completes()
    {
        NoOpAgentToolInvocationRecordWriter sut = new();

        await sut.Invoking(
                s => s.SaveFromTraceAsync(new AgentExecutionTrace(), sortOrder: 0, durationMs: 1, CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpAgentResultPostExecutionEnricher_completes()
    {
        NoOpAgentResultPostExecutionEnricher sut = new();
        string runId = Guid.NewGuid().ToString("N");

        await sut.Invoking(
                s => s.EnrichAsync(
                    runId,
                    new ArchitectureRequest { RequestId = "req", Description = "desc" },
                    new AgentEvidencePackage { RunId = runId },
                    [],
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NullDiagramImageRenderer_returns_null_png()
    {
        NullDiagramImageRenderer sut = new();

        (await sut.RenderMermaidPngAsync("graph TD; A-->B;", CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task NullTenantReviewBoardCoverLogoStore_returns_null_bytes()
    {
        NullTenantReviewBoardCoverLogoStore sut = new();

        (await sut.TryGetBytesAsync(CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public void NullTenantReviewBoardCoverLogoStore_upload_throws_when_disabled()
    {
        NullTenantReviewBoardCoverLogoStore sut = new();

        Func<Task> act = () => sut.UploadAsync([0x01], CancellationToken.None);

        act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public void RealAgentFailureTriageResolver_EnrichWithTriage_sets_scenario_id()
    {
        AgentExecutionFailureSummary summary = new()
        {
            FailureClass = AgentExecutionFailureClasses.Timeout,
        };

        AgentExecutionFailureSummary enriched = RealAgentFailureTriageResolver.EnrichWithTriage(summary);

        enriched.TriageScenarioId.Should().Be(RealAgentFailureTriageScenarioIds.Timeout);
    }

    [Fact]
    public void ImportArchitectureRequestSerializerOptions_StrictDeserialize_disallows_unknown_members()
    {
        JsonSerializerOptions options = ImportArchitectureRequestSerializerOptions.StrictDeserialize;

        options.PropertyNamingPolicy.Should().Be(JsonNamingPolicy.CamelCase);
        options.UnmappedMemberHandling.Should().Be(JsonUnmappedMemberHandling.Disallow);
        options.ReadCommentHandling.Should().Be(JsonCommentHandling.Disallow);
    }
}
