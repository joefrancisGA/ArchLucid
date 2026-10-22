using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Feasibility;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Feasibility;

[Trait("Suite", "Core")]
public sealed class AuthorityFeasibilityVerdictComposerTests
{
    private readonly AuthorityFeasibilityVerdictComposer _composer =
        new(new FeasibilityVerdictBuilder(new FeasibilityVerdictValidator()));

    [Fact]
    public void Compose_ResolvedManifestWithoutGaps_ReturnsFeasible()
    {
        ManifestDocument manifest = CreateBaseManifest();
        manifest.Metadata.Status = "Resolved";

        FeasibilityVerdict verdict = _composer.Compose(manifest, intakeTransparencyTrail: null);

        verdict.Kind.Should().Be(FeasibilityVerdictKind.Feasible);
        verdict.TransparencyTrail.Should().NotBeNull();
    }

    [Fact]
    public void Compose_PolicyViolations_ReturnsSoftInfeasible()
    {
        ManifestDocument manifest = CreateBaseManifest();
        manifest.Metadata.Status = "Resolved";
        manifest.Policy.Violations.Add(
            new PolicyControlItem
            {
                ControlId = "CIS-1.1",
                ControlName = "Encrypt data at rest",
                Description = "Storage must enforce encryption (INV-004).",
            });

        FeasibilityVerdict verdict = _composer.Compose(manifest, intakeTransparencyTrail: null);

        verdict.Kind.Should().Be(FeasibilityVerdictKind.SoftInfeasible);
        verdict.SoftEnvelope.Should().NotBeNull();
        verdict.UnsatCoreInvariantKeys.Should().ContainSingle().Which.Should().Be("INV-004");
        verdict.ProposedRelaxations.Should().ContainSingle();
        verdict.TransparencyTrail.Inferred.Should().NotBeEmpty();
    }

    [Fact]
    public void Compose_SkippedMustQuestionOnIntakeTrail_ReturnsSoftInfeasible()
    {
        ManifestDocument manifest = CreateBaseManifest();
        manifest.Metadata.Status = "Resolved";

        TransparencyTrail intakeTrail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    QuestionKey = "l0.pillar.security",
                    Tier = ElicitationQuestionTier.Must,
                },
            ],
        };

        FeasibilityVerdict verdict = _composer.Compose(manifest, intakeTrail);

        verdict.Kind.Should().Be(FeasibilityVerdictKind.SoftInfeasible);
        verdict.TransparencyTrail.Skipped.Should().ContainSingle();
        verdict.TransparencyTrail.HasSkippedMustQuestions.Should().BeTrue();
    }

    [Fact]
    public void Compose_BlockingAcceptedFindingSeverities_ReturnsSoftInfeasible()
    {
        ManifestDocument manifest = CreateBaseManifest();
        manifest.Metadata.Status = "Resolved";

        FindingsSnapshot findingsSnapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ContextSnapshotId = manifest.ContextSnapshotId,
            GraphSnapshotId = manifest.GraphSnapshotId,
            CreatedUtc = DateTime.UtcNow,
            Findings =
            [
                new ArchLucid.Contracts.Findings.Finding
                {
                    FindingId = "blocking-1",
                    FindingType = "TopologyGap",
                    Category = "Topology",
                    EngineType = "topology-structure",
                    Severity = ArchLucid.Contracts.Findings.FindingSeverity.Error,
                    Title = "Missing private endpoint",
                    Rationale = "Storage account is public.",
                    Treatment = ArchLucid.Contracts.Findings.FindingTreatment.Promote,
                },
            ],
        };

        FeasibilityVerdict verdict = _composer.Compose(
            manifest,
            intakeTransparencyTrail: null,
            findingsSnapshot,
            ["blocking-1"]);

        verdict.Kind.Should().Be(FeasibilityVerdictKind.SoftInfeasible);
        verdict.Summary.Should().Contain("blocking");
        verdict.TransparencyTrail.Inferred.Should().NotBeEmpty();
    }

    [Fact]
    public void Compose_MergesIntakeAssertedEntriesIntoTrail()
    {
        ManifestDocument manifest = CreateBaseManifest();
        manifest.Metadata.Status = "Resolved";

        TransparencyTrail intakeTrail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "businessOutcome",
                    Value = "Reduce claims processing time by 30%",
                },
            ],
        };

        FeasibilityVerdict verdict = _composer.Compose(manifest, intakeTrail);

        verdict.TransparencyTrail.Asserted.Should().ContainSingle();
        verdict.TransparencyTrail.Asserted[0].Value.Should().Contain("30%");
    }

    private static ManifestDocument CreateBaseManifest() =>
        new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            RuleSetId = "default",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            ManifestHash = "pending",
            Metadata = new ManifestMetadata
            {
                Name = "test",
                Version = "1.0.0",
                Status = "Draft",
                Summary = "test manifest",
            },
        };
}
