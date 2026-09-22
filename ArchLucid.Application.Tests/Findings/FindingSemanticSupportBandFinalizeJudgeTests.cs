using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FindingSemanticSupportBandFinalizeJudgeTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ApplyAsync_skips_simulator_without_calling_judge()
    {
        RecordingLlmJudge recording = new(FindingSemanticSupportBand.Supported);
        Finding finding = CreateUncheckedFinding();
        FindingSemanticSupportBandFinalizeJudge sut = CreateSut(recording);

        await sut.ApplyAsync(
            new ArchitectureRun { StructuralExecutionMode = StructuralExecutionMode.Simulator },
            new FindingsSnapshot { FindingsSnapshotId = Guid.NewGuid(), Findings = [finding] },
            Scope);

        recording.InvocationCount.Should().Be(0);
        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unchecked);
    }

    [Fact]
    public async Task ApplyAsync_real_unchecked_persists_llm_band_with_as099_version()
    {
        RecordingLlmJudge recording = new(FindingSemanticSupportBand.Supported);
        Finding finding = CreateUncheckedFinding();
        Guid snapshotId = Guid.NewGuid();
        InMemoryFindingSemanticSupportBandOverlayRepository repo = new();
        FindingSemanticSupportBandFinalizeJudge sut = CreateSut(recording, repo);

        await sut.ApplyAsync(
            new ArchitectureRun { StructuralExecutionMode = StructuralExecutionMode.Real },
            new FindingsSnapshot { FindingsSnapshotId = snapshotId, Findings = [finding] },
            Scope);

        recording.InvocationCount.Should().Be(1);
        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Supported);
        finding.SemanticSupportBandScorerVersion.Should().Be(FindingSemanticSupportBandScorerVersions.As099LlmFinalizeV1);

        IReadOnlyDictionary<string, ArchLucid.Core.Persistence.FindingSemanticSupportBandOverlayRecord> overlays =
            await repo.GetBySnapshotAsync(snapshotId, Scope);

        overlays.Should().ContainKey(finding.FindingId);
        overlays[finding.FindingId].Band.Should().Be(FindingSemanticSupportBand.Supported);
        overlays[finding.FindingId].ScorerVersion.Should().Be(FindingSemanticSupportBandScorerVersions.As099LlmFinalizeV1);
    }

    [Fact]
    public async Task ApplyAsync_fail_open_keeps_heuristic_when_judge_returns_null()
    {
        RecordingLlmJudge recording = new(llmBand: null);
        Finding finding = CreateUncheckedFinding();
        FindingSemanticSupportBandFinalizeJudge sut = CreateSut(recording);

        await sut.ApplyAsync(
            new ArchitectureRun { StructuralExecutionMode = StructuralExecutionMode.Real },
            new FindingsSnapshot { FindingsSnapshotId = Guid.NewGuid(), Findings = [finding] },
            Scope);

        recording.InvocationCount.Should().Be(1);
        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unchecked);
    }

    [Fact]
    public async Task ApplyAsync_skips_already_supported_decision_grade_row()
    {
        RecordingLlmJudge recording = new(FindingSemanticSupportBand.Unchecked);
        Finding finding = CreateUncheckedFinding();
        finding.SemanticSupportBand = FindingSemanticSupportBand.Supported;
        FindingSemanticSupportBandFinalizeJudge sut = CreateSut(recording);

        await sut.ApplyAsync(
            new ArchitectureRun { StructuralExecutionMode = StructuralExecutionMode.Real },
            new FindingsSnapshot { FindingsSnapshotId = Guid.NewGuid(), Findings = [finding] },
            Scope);

        recording.InvocationCount.Should().Be(0);
        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Supported);
    }

    [Fact]
    public async Task ApplyAsync_skips_when_finalize_flag_off()
    {
        RecordingLlmJudge recording = new(FindingSemanticSupportBand.Supported);
        Finding finding = CreateUncheckedFinding();
        FindingSemanticSupportBandFinalizeJudge sut = CreateSut(
            recording,
            overlayRepository: new InMemoryFindingSemanticSupportBandOverlayRepository(),
            options: new FindingSemanticSupportBandOptions { EnableLlmJudgeOnFinalize = false });

        await sut.ApplyAsync(
            new ArchitectureRun { StructuralExecutionMode = StructuralExecutionMode.Real },
            new FindingsSnapshot { FindingsSnapshotId = Guid.NewGuid(), Findings = [finding] },
            Scope);

        recording.InvocationCount.Should().Be(0);
    }

    private static FindingSemanticSupportBandFinalizeJudge CreateSut(
        RecordingLlmJudge recording,
        InMemoryFindingSemanticSupportBandOverlayRepository? overlayRepository = null,
        FindingSemanticSupportBandOptions? options = null)
    {
        FindingSemanticSupportBandOverlayWriter writer = new(
            overlayRepository ?? new InMemoryFindingSemanticSupportBandOverlayRepository());

        return new FindingSemanticSupportBandFinalizeJudge(
            recording,
            Options.Create(options ?? new FindingSemanticSupportBandOptions()),
            writer);
    }

    private static Finding CreateUncheckedFinding() =>
        new()
        {
            FindingId = "FIND-UNCHECKED",
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Gateway TLS",
            Rationale = "Gateway layer provides encrypted transport before requests reach the router tier.",
            SemanticSupportBand = FindingSemanticSupportBand.Unchecked,
            EvidenceRefs = ["The API gateway terminates TLS and forwards traffic to the internal router service."],
        };

    private sealed class RecordingLlmJudge(FindingSemanticSupportBand? llmBand) : IFindingSemanticSupportBandLlmJudge
    {
        public int InvocationCount { get; private set; }

        public FindingSemanticSupportBand? TryScore(
            Finding finding,
            string findingMessage,
            IReadOnlyList<string> citationExcerpts,
            FindingSemanticSupportBandOptions options)
        {
            InvocationCount++;
            return llmBand;
        }
    }
}
