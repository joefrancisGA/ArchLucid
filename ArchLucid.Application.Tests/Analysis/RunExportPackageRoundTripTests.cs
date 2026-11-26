using ArchLucid.Application.Analysis;
using ArchLucid.Application.Tests.Exports;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunExportPackageRoundTripTests
{
    [Fact]
    public async Task Manifest_and_typed_authority_trace_survive_the_real_run_ZIP()
    {
        Guid runId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        Guid traceId = Guid.Parse("bbbbbbbb-2222-3333-4444-555555555555");
        ManifestHashService hashes = new();
        Mock<IAuthorityQueryService> authority = new();
        ManifestDocument manifest = SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runId, hashes);
        ScopeContext scope = new()
        {
            TenantId = manifest.TenantId, WorkspaceId = manifest.WorkspaceId, ProjectId = manifest.ProjectId,
        };
        authority.Setup(q => q.GetRunDetailForExportAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId, GoldenManifestId = manifest.ManifestId, LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                },
                GoldenManifest = manifest,
                AuthorityTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload
                {
                    RunId = runId,
                    DecisionTraceId = traceId,
                    AppliedRuleIds = ["rule-inventory", "rule-ordering"],
                    AcceptedFindingIds = ["finding-ordering"],
                }),
            });
        Mock<IArtifactQueryService> artifacts = new();
        artifacts.Setup(s => s.GetArtifactsByManifestIdAsync(scope, manifest.ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchLucid.Contracts.Persistence.Artifacts.SynthesizedArtifact>());

        RunExportPackageBuilder writer = new(new RunExportAuthorityMaterialLoader(authority.Object, hashes),
            artifacts.Object, new ArtifactPackagingService(new ArtifactContentTypeResolver()));
        RunExportPackageResult export = await writer.BuildAsync(scope, runId, renderedDiagramPng: null, CancellationToken.None);
        export.Found.Should().BeTrue(export.NotFoundReason);
        export.ZipContent.Should().NotBeNull();

        ManifestDocument restored = ExportRoundTripTestReader.Deserialize<ManifestDocument>(
            await ExportRoundTripTestReader.ReadEntryTextAsync(export.ZipContent!, "manifest.json"));
        restored.RunId.Should().Be(runId);
        restored.ManifestId.Should().Be(Guid.Parse("11111111-1111-1111-1111-111111111111"));
        restored.Metadata!.Version.Should().Be("v1");
        restored.ManifestHash.Should().Be(manifest.ManifestHash);

        RuleAuditTracePayload trace = ExportRoundTripTestReader.Deserialize<DecisionTraceDto>(
            await ExportRoundTripTestReader.ReadEntryTextAsync(export.ZipContent!, "decision-trace.json")).RequireRuleAudit();
        trace.RunId.Should().Be(runId);
        trace.DecisionTraceId.Should().Be(traceId);
        trace.AppliedRuleIds.Should().Equal("rule-inventory", "rule-ordering");
        trace.AcceptedFindingIds.Should().Equal("finding-ordering");
    }
}
