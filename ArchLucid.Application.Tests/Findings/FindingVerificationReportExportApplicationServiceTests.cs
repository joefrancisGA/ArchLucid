using ArchLucid.Application.Findings;
using ArchLucid.Application.Findings.FindingVerification;
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

    [Fact]
    public async Task ExportMarkdownAsync_returns_markdown_bytes_for_existing_report()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid findingsSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

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
                        Findings =
                        [
                            new Finding
                            {
                                FindingId = "finding-1",
                                Title = "Public storage",
                                Severity = FindingSeverity.Critical,
                            },
                        ],
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
        markdown.Should().Contain("Public storage");
    }
}
