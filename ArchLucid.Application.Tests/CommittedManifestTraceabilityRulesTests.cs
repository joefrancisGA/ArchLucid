using ArchiForge.Application.Architecture;
using ArchiForge.Contracts.Architecture;
using ArchiForge.Contracts.Common;
using ArchiForge.Contracts.DecisionTraces;
using ArchiForge.Contracts.Manifest;
using ArchiForge.Contracts.Metadata;

using FluentAssertions;

namespace ArchiForge.Application.Tests;

public sealed class CommittedManifestTraceabilityRulesTests
{
    [Fact]
    public void GetLinkageGaps_WhenManifestAndTracesAlign_ReturnsEmpty()
    {
        RunEventTracePayload ev = new()
        {
            TraceId = "aa",
            RunId = "run1",
            EventType = "Test",
            EventDescription = "d"
        };

        GoldenManifest manifest = new()
        {
            RunId = "run1",
            SystemName = "Sys",
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "v1",
                DecisionTraceIds = ["aa"]
            }
        };

        IReadOnlyList<string> gaps = CommittedManifestTraceabilityRules.GetLinkageGaps(
            manifest,
            [DecisionTrace.FromRunEvent(ev)]);

        gaps.Should().BeEmpty();
    }

    [Fact]
    public void GetLinkageGaps_WhenTraceMissingFromManifest_ReturnsGap()
    {
        RunEventTracePayload ev = new()
        {
            TraceId = "missing",
            RunId = "run1",
            EventType = "Test",
            EventDescription = "d"
        };

        GoldenManifest manifest = new()
        {
            RunId = "run1",
            SystemName = "Sys",
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "v1",
                DecisionTraceIds = []
            }
        };

        IReadOnlyList<string> gaps = CommittedManifestTraceabilityRules.GetLinkageGaps(
            manifest,
            [DecisionTrace.FromRunEvent(ev)]);

        gaps.Should().ContainSingle()
            .Which.Should().Contain("missing");
    }

    [Fact]
    public void GetLinkageGaps_FromDetail_WhenNotCommitted_ReturnsEmpty()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "r",
                RequestId = "q",
                Status = ArchitectureRunStatus.ReadyForCommit
            }
        };

        CommittedManifestTraceabilityRules.GetLinkageGaps(detail).Should().BeEmpty();
    }
}
