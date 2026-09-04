using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SponsorReviewPacketBuilderTests
{
    private const string RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    [Fact]
    public async Task BuildMarkdownAsync_returns_null_when_run_is_not_committed()
    {
        ArchitectureRunDetail detail = new()
        {
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            Run = new ArchitectureRun
            {
                RunId = RunId,
                Status = ArchitectureRunStatus.WaitingForResults
            },
            Manifest = null
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(x => x.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        SponsorReviewPacketBuilder sut = CreateSut(runDetails.Object);

        string? markdown = await sut.BuildMarkdownAsync(RunId, CancellationToken.None);

        markdown.Should().BeNull();
    }

    [Fact]
    public async Task BuildMarkdownAsync_counts_error_severity_findings_as_high_in_sponsor_report()
    {
        ArchitectureRunDetail detail = new()
        {
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            Run = new ArchitectureRun
            {
                RunId = RunId,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1"
            },
            Manifest = new GoldenManifest
            {
                RunId = RunId,
                SystemName = "Contoso",
                Services = [],
                Datastores = [],
                Relationships = [],
                Governance = new ManifestGovernance(),
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow }
            },
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Critical,
                            Message = "Critical gap",
                            Category = "Security"
                        },
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Error,
                            Message = "High gap",
                            Category = "Security"
                        }
                    ]
                }
            ]
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(x => x.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        SponsorReviewPacketBuilder sut = CreateSut(runDetails.Object);

        string? markdown = await sut.BuildMarkdownAsync(RunId, CancellationToken.None);

        markdown.Should().NotBeNull();
        markdown.Should().Contain("1 critical and 1 high findings");
    }

    [Fact]
    public async Task BuildMarkdownAsync_includes_active_trial_notice_when_tenant_on_trial()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        ArchitectureRunDetail detail = new()
        {
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            Run = new ArchitectureRun
            {
                RunId = RunId,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1"
            },
            Manifest = new GoldenManifest
            {
                RunId = RunId,
                SystemName = "Contoso",
                Services = [],
                Datastores = [],
                Relationships = [],
                Governance = new ManifestGovernance(),
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow }
            }
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(x => x.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(x => x.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "Trial tenant",
                    Slug = "trial",
                    Tier = TenantTier.Standard,
                    TrialStatus = TrialLifecycleStatus.Active
                });

        SponsorReviewPacketBuilder sut = CreateSut(runDetails.Object, scope.Object, tenants.Object);

        string? markdown = await sut.BuildMarkdownAsync(RunId, CancellationToken.None);

        markdown.Should().NotBeNull();
        markdown.Should().Contain("Trial notice");
        markdown.Should().Contain(ActiveTrialExportNoticeFormatter.BaseSuffix);
    }

    [Fact]
    public async Task BuildMarkdownAsync_returns_null_when_manifest_reference_is_broken()
    {
        ArchitectureRunDetail detail = new()
        {
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            Run = new ArchitectureRun
            {
                RunId = RunId,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v-missing"
            },
            Manifest = null,
            HasBrokenManifestReference = true
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(x => x.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        SponsorReviewPacketBuilder sut = CreateSut(runDetails.Object);

        string? markdown = await sut.BuildMarkdownAsync(RunId, CancellationToken.None);

        markdown.Should().BeNull();
    }

    [Fact]
    public async Task BuildMarkdownAsync_includes_only_decisions_for_the_requested_run()
    {
        Guid otherRunId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        ArchitectureRunDetail detail = new()
        {
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            Run = new ArchitectureRun
            {
                RunId = RunId,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1",
            },
            Manifest = new GoldenManifest
            {
                RunId = RunId,
                SystemName = "Contoso",
                Services = [],
                Datastores = [],
                Relationships = [],
                Governance = new ManifestGovernance(),
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
            },
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(x => x.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IArchitectureDecisionRegisterService> decisions = new();
        decisions
            .Setup(x => x.GetRegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<ArchitectureDecisionRegisterQueryOptions?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureDecisionRegisterResponse
            {
                Decisions =
                [
                    new ArchitectureDecisionRegisterEntry
                    {
                        RunId = Guid.Parse(RunId),
                        Title = "Run A decision",
                        SelectedOption = "Option A",
                    },
                    new ArchitectureDecisionRegisterEntry
                    {
                        RunId = otherRunId,
                        Title = "Run B decision",
                        SelectedOption = "Option B",
                    },
                ],
            });

        SponsorReviewPacketBuilder sut = CreateSut(runDetails.Object, decisions: decisions.Object);

        string? markdown = await sut.BuildMarkdownAsync(RunId, CancellationToken.None);

        markdown.Should().NotBeNull();
        markdown.Should().Contain("Run A decision");
        markdown.Should().NotContain("Run B decision");
    }

    private static SponsorReviewPacketBuilder CreateSut(
        IRunDetailQueryService runDetails,
        IScopeContextProvider? scopeContextProvider = null,
        ITenantRepository? tenantRepository = null,
        IArchitectureDecisionRegisterService? decisions = null)
    {
        Mock<ISponsorRoiSummaryService> roi = new();
        roi.Setup(x => x.BuildAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SponsorRoiSummaryResponse());

        Mock<IArchitectureDecisionRegisterService> decisionsMock = new();
        decisionsMock
            .Setup(x => x.GetRegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<ArchitectureDecisionRegisterQueryOptions?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureDecisionRegisterResponse());

        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(x => x.GetCurrentScope()).Returns(new ScopeContext());
        IScopeContextProvider scopeProvider = scopeContextProvider ?? scopeMock.Object;

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(q => q.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(h => h.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns("SEALED-HASH");

        return new SponsorReviewPacketBuilder(
            runDetails,
            roi.Object,
            decisions ?? decisionsMock.Object,
            scopeProvider,
            tenantRepository ?? Mock.Of<ITenantRepository>(),
            authorityQuery.Object,
            manifestHash.Object);
    }
}
