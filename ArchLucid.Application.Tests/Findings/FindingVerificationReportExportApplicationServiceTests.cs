using System.Text.Json;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using DocumentFormat.OpenXml.Packaging;

using ArchLucid.Application.Findings;
using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.ArtifactSynthesis.FindingVerification;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingVerificationReportExportApplicationServiceTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Theory]
    [InlineData("legacy", false)]
    [InlineData("contradicted", false)]
    [InlineData("unverified", false)]
    [InlineData("model-agreement", false)]
    [InlineData("wrong-property", false)]
    [InlineData("missing-evidence", false)]
    [InlineData("verified", true)]
    [InlineData("foreign", false)]
    [InlineData("malformed", false)]
    public async Task Exports_render_independent_evidence_only_for_a_verified_source_finding(string scenario, bool includeEvidence)
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid findingsSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Guid resource = Guid.NewGuid(), snapshot = Guid.NewGuid(), row = Guid.NewGuid();
        var outcome = scenario switch
        {
            "contradicted" => PublicNetworkAccessVerificationOutcome.Contradicted,
            "unverified" => PublicNetworkAccessVerificationOutcome.Unverified,
            _ => PublicNetworkAccessVerificationOutcome.Verified,
        };
        var verification = new PublicNetworkAccessVerification(resource, outcome,
            snapshot, new DateTime(2026, 11, 24, 10, 0, 0, DateTimeKind.Utc))
        {
            Evidence = scenario == "missing-evidence" ? null : new(scenario == "model-agreement" ? "independent-model/1" : InventoryPublicNetworkAccessVerifier.VerifierVersion,
                TestScope.TenantId, TestScope.WorkspaceId,
                scenario == "foreign" ? Guid.NewGuid() : TestScope.ProjectId, row,
                scenario == "wrong-property" ? "unrelatedSetting" : "publicNetworkAccess", 24),
        };
        Finding finding = new()
        {
            FindingId = "finding-1",
            Title = ScopedPublicNetworkAccessVerifier.Title(resource),
            Severity = FindingSeverity.Critical,
        };
        if (scenario != "legacy")
            finding.Properties[ArchitectureIntelligenceProductPublishService.InventoryVerificationProperty] =
                scenario == "malformed" ? "{" : JsonSerializer.Serialize(verification);

        InMemoryFindingVerificationReportRepository repository = new();
        FindingVerificationReportRecord record = await repository.AppendAsync(
            new FindingVerificationReportAppend
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                RunId = runId,
                SourceManifestHash = "sha256-sealed",
                SourceFindingsSnapshotId = findingsSnapshotId,
                TriggeredByUserId = "operator@test",
                Results =
                [
                    new FindingVerificationResultAppend
                    {
                        FindingId = "finding-1",
                        Status = FindingVerificationStatus.Materialized,
                        TraceText = "RV-003",
                    },
                ],
            },
            CancellationToken.None);

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunDetailDto
                {
                    Run = new RunRecord { RunId = runId },
                    FindingsSnapshot = new FindingsSnapshot
                    {
                        FindingsSnapshotId = findingsSnapshotId,
                        Findings = [finding],
                    },
                    GoldenManifest = new ManifestDocument { ManifestHash = "sha256-sealed" },
                });

        FindingVerificationReportExportApplicationService sut = new(
            repository,
            authorityQuery.Object,
            new FindingVerificationReportExportService());

        byte[] bytes = await sut.ExportMarkdownAsync(
            TestScope,
            runId,
            record.ReportId,
            CancellationToken.None);

        string markdown = System.Text.Encoding.UTF8.GetString(bytes);
        markdown.Should().Contain("finding-1");
        markdown.Should().Contain(finding.Title);

        byte[] docx = await sut.ExportDocxAsync(TestScope, runId, record.ReportId);
        using var stream = new MemoryStream(docx);
        using var document = WordprocessingDocument.Open(stream, false);
        string docxText = document.MainDocumentPart!.Document.Body!.InnerText;
        foreach (string output in new[] { markdown, docxText })
        {
            if (includeEvidence)
                output.Should().Contain(InventoryPublicNetworkAccessVerifier.VerifierVersion).And.Contain(row.ToString("D"))
                    .And.Contain(snapshot.ToString("D")).And.Contain(TestScope.ProjectId.ToString("D"))
                    .And.Contain("Coverage: publicNetworkAccess=Disabled.")
                    .And.Contain("does not establish network reachability or live state");
            else
                output.Should().NotContain("Independent evidence from the source findings")
                    .And.NotContain(InventoryPublicNetworkAccessVerifier.VerifierVersion)
                    .And.NotContain("independent-model/1");
        }
    }
}
