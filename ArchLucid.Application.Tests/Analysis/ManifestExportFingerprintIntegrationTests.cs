using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Manifest;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestExportFingerprintIntegrationTests
{
    private static readonly Guid OriginalRun = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly Guid LaterRun = Guid.Parse("10000000-0000-0000-0000-000000000002");
    private static readonly DateTime OriginalTime = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
    private static readonly JsonSerializerOptions ExportReadOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task Retargeting_a_relationship_changes_the_fingerprint_of_the_exported_manifest()
    {
        ExportedManifest original = await ExportAndFingerprintAsync(OriginalRun, OriginalTime, "orders");
        ExportedManifest retargeted = await ExportAndFingerprintAsync(OriginalRun, OriginalTime, "archive");

        original.RelationshipTarget.Should().Be("orders");
        retargeted.RelationshipTarget.Should().Be("archive");
        retargeted.ContentFingerprint.Should().NotBe(original.ContentFingerprint);
    }

    [Fact]
    public async Task A_new_run_and_timestamp_leave_the_exported_content_fingerprint_unchanged()
    {
        ExportedManifest original = await ExportAndFingerprintAsync(OriginalRun, OriginalTime, "orders");
        ExportedManifest later = await ExportAndFingerprintAsync(LaterRun, OriginalTime.AddDays(1), "orders");

        original.RunId.Should().Be(OriginalRun);
        later.RunId.Should().Be(LaterRun);
        original.CreatedUtc.Should().Be(OriginalTime);
        later.CreatedUtc.Should().Be(OriginalTime.AddDays(1));
        later.RelationshipTarget.Should().Be(original.RelationshipTarget);
        later.FullFingerprint.Should().NotBe(original.FullFingerprint);
        later.ContentFingerprint.Should().Be(original.ContentFingerprint);
    }

    private static async Task<ExportedManifest> ExportAndFingerprintAsync(Guid runId, DateTime createdUtc, string target)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("20000000-0000-0000-0000-000000000001"),
            WorkspaceId = Guid.Parse("20000000-0000-0000-0000-000000000002"),
            ProjectId = Guid.Parse("20000000-0000-0000-0000-000000000003"),
        };
        ManifestDocument authorityManifest = CreateAuthorityManifest(scope, runId, createdUtc, target);
        ManifestHashService hashes = new();
        authorityManifest.CommittedDecisionReceiptHashSha256 = DecisionReceiptComposer.BuildForRun(
            runId, authorityManifest.FeasibilityVerdict!, hashes.ComputeHash(authorityManifest), "v1").ReceiptHashSha256;
        authorityManifest.ManifestHash = hashes.ComputeHash(authorityManifest);

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(q => q.GetRunDetailForExportAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    GoldenManifestId = authorityManifest.ManifestId,
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                },
                GoldenManifest = authorityManifest,
            });
        Mock<IArtifactQueryService> artifacts = new();
        artifacts.Setup(q => q.GetArtifactsByManifestIdAsync(scope, authorityManifest.ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchLucid.Contracts.Persistence.Artifacts.SynthesizedArtifact>());

        RunExportPackageBuilder exporter = new(
            new RunExportAuthorityMaterialLoader(authority.Object, hashes),
            artifacts.Object,
            new ArtifactPackagingService(new ArtifactContentTypeResolver()));
        RunExportPackageResult package = await exporter.BuildAsync(scope, runId, renderedDiagramPng: null, CancellationToken.None);

        package.Found.Should().BeTrue(package.NotFoundReason);
        package.ZipContent.Should().NotBeNull();
        using MemoryStream bytes = new(package.ZipContent!);
        using ZipArchive zip = new(bytes, ZipArchiveMode.Read);
        ZipArchiveEntry? entry = zip.GetEntry("manifest.json");
        entry.Should().NotBeNull();
        using Stream content = entry!.Open();
        ManifestDocument? exported = await JsonSerializer.DeserializeAsync<ManifestDocument>(content, ExportReadOptions);
        exported.Should().NotBeNull();

        AuthorityCommitProjectionBuilder projection = new();
        AuthorityCommitProjectionInput input = new() { SystemName = "Order processing" };
        GoldenManifest originalProjection = await projection.BuildAsync(authorityManifest, input);
        GoldenManifest fromExport = await projection.BuildAsync(exported!, input);
        fromExport.Relationships.Should().ContainSingle().Which.TargetId.Should().Be(target);
        string contentFingerprint = GoldenManifestFingerprint.ComputeContentSha256Hex(fromExport);
        contentFingerprint.Should().Be(GoldenManifestFingerprint.ComputeContentSha256Hex(originalProjection));

        return new ExportedManifest(
            exported!.RunId,
            exported.CreatedUtc,
            fromExport.Relationships[0].TargetId,
            contentFingerprint,
            GoldenManifestFingerprint.ComputeSha256Hex(fromExport));
    }

    private static ManifestDocument CreateAuthorityManifest(ScopeContext scope, Guid runId, DateTime createdUtc, string target) =>
        new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            ManifestId = Guid.Parse("30000000-0000-0000-0000-000000000001"),
            DecisionTraceId = runId,
            CreatedUtc = createdUtc,
            RuleSetId = "default",
            RuleSetVersion = "1",
            RuleSetHash = "test-rules",
            Metadata = new ArchLucid.Core.Manifest.Sections.ManifestMetadata { Name = "Order processing", Version = "v1" },
            FeasibilityVerdict = new FeasibilityVerdict { Kind = FeasibilityVerdictKind.Feasible, Summary = "Test manifest." },
            Topology = new ArchLucid.Core.Manifest.Sections.TopologySection
            {
                Services = [new ManifestService { ServiceId = "api", ServiceName = "Orders API", ServiceType = ServiceType.Api }],
                Datastores =
                [
                    new ManifestDatastore { DatastoreId = "orders", DatastoreName = "Order store", DatastoreType = DatastoreType.Sql },
                    new ManifestDatastore { DatastoreId = "archive", DatastoreName = "Archive", DatastoreType = DatastoreType.Sql },
                ],
                Relationships =
                [
                    new ManifestRelationship
                    {
                        RelationshipId = "persist-order",
                        SourceId = "api",
                        TargetId = target,
                        RelationshipType = RelationshipType.WritesTo,
                    },
                ],
            },
        };

    private sealed record ExportedManifest(Guid RunId, DateTime CreatedUtc, string RelationshipTarget, string ContentFingerprint, string FullFingerprint);
}
