using System.IO.Compression;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Api.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class AuditEvidencePackageExportTests
{
    private static readonly Guid FixedAssessmentId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid FixedSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid FixedControlId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid FixedRequirementId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid FixedFrameworkId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly byte[] FixedRootHash = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2];

    [Fact]
    public void BuildZip_regenerating_fixture_produces_identical_evidence_hashes_json()
    {
        AuditEvidencePackageProjectionContext context = CreateFixtureContext(includeCollectedEvidence: true);
        IReadOnlyList<AuditEvidencePackageEntry> entries = AuditEvidencePackageProjectionBuilder.BuildEntries(context);
        AuditEvidencePackageCollectionManifest manifest = CreateManifest();

        (_, string firstHashesJson) = AuditEvidencePackageZipBuilder.BuildZip(entries, manifest);
        (_, string secondHashesJson) = AuditEvidencePackageZipBuilder.BuildZip(entries, manifest);

        secondHashesJson.Should().Be(firstHashesJson);
        firstHashesJson.Should().NotBeNullOrWhiteSpace();
        ExportManifestBuilder.ComputeSha256UpperHex(Encoding.UTF8.GetBytes(firstHashesJson))
            .Should().HaveLength(64);
    }

    [Fact]
    public void BuildEntries_missing_evidence_is_listed_not_fabricated()
    {
        AuditEvidencePackageProjectionContext context = CreateFixtureContext(includeCollectedEvidence: false);
        IReadOnlyList<AuditEvidencePackageEntry> entries = AuditEvidencePackageProjectionBuilder.BuildEntries(context);

        AuditEvidencePackageEntry index = entries.Single(entry =>
            entry.RelativePath.EndsWith("Evidence-Index.md", StringComparison.Ordinal));

        string text = Encoding.UTF8.GetString(index.Content);
        text.Should().Contain("MISSING");
        text.Should().Contain("not fabricated");

        AuditEvidencePackageEntry automated = entries.Single(entry =>
            entry.RelativePath.EndsWith("Automated-Evidence.md", StringComparison.Ordinal));

        Encoding.UTF8.GetString(automated.Content).Should().Contain("No automated evidence rows");
    }

    [Fact]
    public void BuildCollectionMethodology_labels_simulator_collection_method()
    {
        AuditEvidencePackageProjectionContext context = CreateFixtureContext(
            includeCollectedEvidence: true,
            selectorDescriptors:
            [
                new AuditEvidenceSelectorDescriptorRecord
                {
                    CollectorId = "simulator-inventory",
                    Version = "1.0.0",
                    CollectionMethod = "SimulatorInventorySnapshot.Resources",
                },
            ]);

        IReadOnlyList<AuditEvidencePackageEntry> entries = AuditEvidencePackageProjectionBuilder.BuildEntries(context);
        AuditEvidencePackageEntry methodology = entries.Single(entry =>
            entry.RelativePath.EndsWith("Collection-Methodology.md", StringComparison.Ordinal));

        string text = Encoding.UTF8.GetString(methodology.Content);
        text.Should().Contain(AzureInventoryDiffNarrativeBuilder.SimulatorLabel);
        text.Should().Contain("SimulatorInventorySnapshot.Resources");
    }

    [Fact]
    public void FormatCollectionMethodLabel_marks_simulator_methods()
    {
        string label = AuditEvidencePackageProjectionBuilder.FormatCollectionMethodLabel("SimulatorInventorySnapshot.Resources");

        label.Should().Contain(AzureInventoryDiffNarrativeBuilder.SimulatorLabel);
    }

    [Fact]
    public void BuildZip_includes_collection_manifest_and_evidence_hashes_entries()
    {
        AuditEvidencePackageProjectionContext context = CreateFixtureContext(includeCollectedEvidence: true);
        IReadOnlyList<AuditEvidencePackageEntry> entries = AuditEvidencePackageProjectionBuilder.BuildEntries(context);
        AuditEvidencePackageCollectionManifest manifest = CreateManifest();

        (byte[] zipBytes, string evidenceHashesJson) = AuditEvidencePackageZipBuilder.BuildZip(entries, manifest);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        archive.GetEntry($"ARC-AMPE-{FixedAssessmentId:N}/Collection-Manifest.json").Should().NotBeNull();
        archive.GetEntry($"ARC-AMPE-{FixedAssessmentId:N}/Evidence-Hashes.json").Should().NotBeNull();
        evidenceHashesJson.Should().Contain(Convert.ToHexString(FixedRootHash));
    }

    private static AuditEvidencePackageCollectionManifest CreateManifest() =>
        new()
        {
            RootFolder = $"ARC-AMPE-{FixedAssessmentId:N}",
            AssessmentId = FixedAssessmentId,
            AuditEvidenceSnapshotId = FixedSnapshotId,
            FrameworkId = FixedFrameworkId,
            FrameworkVersion = "1.0.0",
            ControlCatalogVersion = "2026.01",
            SelectorVersionsJson = "{\"inventory-snapshot-selector\":\"1.0.0\"}",
            InventorySnapshotIds = [Guid.Parse("66666666-6666-6666-6666-666666666666")],
            SnapshotRootHashSha256 = Convert.ToHexString(FixedRootHash),
            ExportedUtc = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc),
        };

    private static AuditEvidencePackageProjectionContext CreateFixtureContext(
        bool includeCollectedEvidence,
        IReadOnlyList<AuditEvidenceSelectorDescriptorRecord>? selectorDescriptors = null)
    {
        AuditControlRecord control = new()
        {
            ControlId = FixedControlId,
            FrameworkId = FixedFrameworkId,
            ControlNumber = "AC-1",
            Title = "Access control policy",
        };

        AuditEvidenceRequirementRecord requirement = new()
        {
            RequirementId = FixedRequirementId,
            ControlId = FixedControlId,
            FrameworkId = FixedFrameworkId,
            Name = "Policy document",
            EvidenceType = AuditEvidenceTypeNames.Governance,
            ManualEvidenceAllowed = true,
        };

        List<AuditEvidenceSnapshotItemRecord> items = [];

        if (includeCollectedEvidence)
        {
            items.Add(new AuditEvidenceSnapshotItemRecord
            {
                EvidenceRowId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                AuditEvidenceSnapshotId = FixedSnapshotId,
                RequirementId = FixedRequirementId,
                TenantId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                EvidenceType = AuditEvidenceTypeNames.Inventory,
                CollectedUtc = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                CollectorVersion = "1.0.0",
                EvidenceHashSha256 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
                CollectionStatus = AuditEvidenceCollectionStatus.Collected,
                FreshnessStatus = AuditEvidenceFreshnessStatus.Current,
                Confidence = 1.0m,
                Summary = "inventory row",
                ProvenanceKind = ProvenanceKind.ObservedFact,
                SelectorVersion = "1.0.0",
            });
        }

        AuditControlReadinessRecord readiness = new()
        {
            ControlId = FixedControlId,
            ControlNumber = control.ControlNumber,
            Title = control.Title,
            Applicability = AuditControlApplicabilityStatus.Applicable,
            Completeness = includeCollectedEvidence
                ? AuditControlEvidenceCompleteness.FullyEvident
                : AuditControlEvidenceCompleteness.LackingEvidence,
            WorstFreshnessStatus = AuditEvidenceFreshnessStatus.Current,
            ManualEvidenceRequired = !includeCollectedEvidence,
        };

        return new AuditEvidencePackageProjectionContext
        {
            Assessment = new AuditAssessmentRecord
            {
                AssessmentId = FixedAssessmentId,
                TenantId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                FrameworkId = FixedFrameworkId,
                FrameworkVersion = "1.0.0",
                ScopeJson = "{\"subscriptions\":[\"sub-1\"]}",
                PeriodStartUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                PeriodEndUtc = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            Framework = new AuditFrameworkRecord
            {
                FrameworkId = FixedFrameworkId,
                Name = "Fixture Framework",
                Version = "1.0.0",
            },
            SnapshotHeader = new AuditEvidenceSnapshotHeaderRecord
            {
                AuditEvidenceSnapshotId = FixedSnapshotId,
                AssessmentId = FixedAssessmentId,
                TenantId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                FrameworkVersion = "1.0.0",
                ControlCatalogVersion = "2026.01",
                SelectorVersionsJson = "{\"inventory-snapshot-selector\":\"1.0.0\"}",
                CollectionStartedUtc = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                CollectionCompletedUtc = new DateTime(2026, 1, 10, 1, 0, 0, DateTimeKind.Utc),
                EvidenceHashSha256 = FixedRootHash,
                CreatedUtc = new DateTime(2026, 1, 10, 1, 0, 0, DateTimeKind.Utc),
            },
            Controls = [control],
            Requirements = [requirement],
            SnapshotItems = items,
            ReadinessSummary = new AuditAssessmentReadinessSummaryRecord
            {
                AggregateLabel = AuditReadinessLabels.DefaultAggregateLabel,
                ApplicableControlCount = 1,
                Controls = [readiness],
            },
            SelectorDescriptors = selectorDescriptors ??
            [
                new AuditEvidenceSelectorDescriptorRecord
                {
                    CollectorId = "inventory-snapshot-selector",
                    Version = "1.0.0",
                    CollectionMethod = "AzureInventorySnapshot.Resources",
                },
            ],
            HybridByControlId = new Dictionary<Guid, AuditHybridControlEvidenceRecord>
            {
                [FixedControlId] = new()
                {
                    ControlId = FixedControlId,
                    SourceKinds = includeCollectedEvidence
                        ? [AuditEvidenceSourceKind.Automated]
                        : [],
                },
            },
        };
    }
}
