using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Tests.Queries;

[Trait("Category", "Unit")]
public sealed class AuthorityRunMapperTests
{
    [SkippableFact]
    public void MapSummary_projects_run_record_fields()
    {
        Guid runId = Guid.NewGuid();
        RunRecord run = new()
        {
            RunId = runId,
            ProjectId = "my-proj",
            Description = "d",
            CreatedUtc = new DateTime(2026, 1, 2, 3, 4, 5, DateTimeKind.Utc),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            GoldenManifestId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            ArtifactBundleId = Guid.NewGuid()
        };

        RunSummaryDto dto = AuthorityRunMapper.MapSummary(run);

        dto.RunId.Should().Be(runId);
        dto.ProjectId.Should().Be("my-proj");
        dto.Description.Should().Be("d");
        dto.CreatedUtc.Should().Be(run.CreatedUtc);
        dto.ContextSnapshotId.Should().Be(run.ContextSnapshotId);
        dto.GraphSnapshotId.Should().Be(run.GraphSnapshotId);
        dto.FindingsSnapshotId.Should().Be(run.FindingsSnapshotId);
        dto.GoldenManifestId.Should().Be(run.GoldenManifestId);
        dto.DecisionTraceId.Should().Be(run.DecisionTraceId);
        dto.ArtifactBundleId.Should().Be(run.ArtifactBundleId);
    }

    [SkippableFact]
    public void MapManifestSummary_projects_manifest_counts_and_status()
    {
        Guid manifestId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        ManifestDocument manifest = new()
        {
            ManifestId = manifestId,
            RunId = runId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "h",
            RuleSetId = "r",
            RuleSetVersion = "v",
            Metadata = new ManifestMetadata { Status = "Committed" },
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    Title = "Identity",
                    SelectedOption = "Entra ID",
                },
            ],
            Warnings = ["w"],
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue
                    {
                        IssueType = "t",
                        Title = "title",
                        Description = "d",
                        Severity = "Medium"
                    }
                ]
            }
        };

        ManifestSummaryDto dto = AuthorityRunMapper.MapManifestSummary(manifest);

        dto.ManifestId.Should().Be(manifestId);
        dto.RunId.Should().Be(runId);
        dto.CreatedUtc.Should().Be(manifest.CreatedUtc);
        dto.ManifestHash.Should().Be("h");
        dto.RuleSetId.Should().Be("r");
        dto.RuleSetVersion.Should().Be("v");
        dto.DecisionCount.Should().Be(1);
        dto.WarningCount.Should().Be(1);
        dto.UnresolvedIssueCount.Should().Be(1);
        dto.Status.Should().Be("Committed");
        dto.TopDecisionSynopses.Should().ContainSingle().Which.Should().Be("Identity: Entra ID");
    }

    [SkippableFact]
    public void MapManifestSummary_projects_feasibility_verdict_when_present()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.SoftInfeasible,
            Summary = "Policy controls are not satisfied for the proposed architecture.",
            TransparencyTrail = new TransparencyTrail(),
            SoftEnvelope = new SoftInfeasibilityEnvelope
            {
                ConfidenceLow = 50,
                ConfidenceHigh = 80,
                EnvelopeDescription = "Holds for this manifest snapshot.",
                SoftAssumption = "Operator intent matches asserted inputs.",
                CostOfBeingWrong = "Shipping policy gaps to production.",
            },
        };

        ManifestDocument manifest = new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "h",
            RuleSetId = "r",
            RuleSetVersion = "v",
            Metadata = new ManifestMetadata { Status = "NeedsAttention" },
            FeasibilityVerdict = verdict,
        };

        ManifestSummaryDto dto = AuthorityRunMapper.MapManifestSummary(manifest);

        dto.FeasibilityVerdict.Should().NotBeNull();
        dto.FeasibilityVerdict!.Kind.Should().Be(FeasibilityVerdictKind.SoftInfeasible);
        dto.FeasibilityVerdict.Summary.Should().Be(verdict.Summary);
    }
}
