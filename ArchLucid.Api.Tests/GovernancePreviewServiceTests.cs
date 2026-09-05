using ArchLucid.Application;
using ArchLucid.Application.Governance.Preview;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Preview;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Governance Preview Service.
/// </summary>
[Trait("Category", "Unit")]
public sealed class GovernancePreviewServiceTests
{
    private const string RunA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    private const string RunB = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    private const string RunOld = "cccccccccccccccccccccccccccccccc";
    private const string RunX = "dddddddddddddddddddddddddddddddd";
    private const string R1 = "11111111111111111111111111111112";
    private const string R2 = "22222222222222222222222222222223";
    private const string RunForeign = "99999999999999999999999999999999";
    private const string RunForeign2 = "88888888888888888888888888888888";
    private const string MissingRun = "33333333333333333333333333333334";
    private const string RunOne = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private readonly Mock<IGovernanceEnvironmentActivationRepository> _activationRepo = new();
    private readonly Mock<IRunDetailQueryService> _runDetailQueryService = new();
    private readonly GovernancePreviewService _sut;
    private readonly Mock<IUnifiedGoldenManifestReader> _unifiedManifestReader = new();
    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IAuthorityQueryService> _authority = new();
    private readonly ManifestHashService _manifestHashService = new();

    public GovernancePreviewServiceTests()
    {
        _scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);
        ConfigureSealedManifestAuthority(_authority);

        _sut = new GovernancePreviewService(
            _activationRepo.Object,
            _runDetailQueryService.Object,
            _unifiedManifestReader.Object,
            _scopeProvider.Object,
            _authority.Object,
            _manifestHashService);
    }

    private void ConfigureSealedManifestAuthority(Mock<IAuthorityQueryService> authority)
    {
        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) =>
                new RunDetailDto
                {
                    Run = new RunRecord { RunId = runId },
                    GoldenManifest = CreateSealedManifestDocument(runId),
                });
    }

    private ManifestDocument CreateSealedManifestDocument(Guid runId)
    {
        ManifestDocument manifest = new()
        {
            RunId = runId,
            ManifestHash = "placeholder",
        };

        manifest.ManifestHash = _manifestHashService.ComputeHash(manifest);

        return manifest;
    }

    private static GoldenManifest Manifest(string runId, string version, Action<ManifestGovernance>? tweak = null)
    {
        ManifestGovernance gov = new();
        tweak?.Invoke(gov);

        return new GoldenManifest
        {
            RunId = runId,
            SystemName = "Sys",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = gov,
            Metadata = new ManifestMetadata { ManifestVersion = version, CreatedUtc = TimeProvider.System.UtcNowDateTime() }
        };
    }

    private static ArchitectureRun Run(string runId)
    {
        return new ArchitectureRun
        {
            RunId = runId,
            RequestId = "req-1",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }

    /// <summary>
    ///     Returns a run detail whose manifest is null (pre-commit), so the service falls back to
    ///     <see cref="IUnifiedGoldenManifestReader.GetByVersionAsync" /> for the candidate manifest lookup.
    /// </summary>
    private static ArchitectureRunDetail RunDetail(string runId)
    {
        return new ArchitectureRunDetail { Run = Run(runId), Manifest = null };
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_WhenNoCurrentActiveRowExists_ReturnsPreviewAgainstEmptyCurrent()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(RunA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunDetail(RunA));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunA, "v1", g => g.RequiredControls.Add("PEP")));
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("dev", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GovernanceEnvironmentActivation>());

        GovernancePreviewResult result = await _sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = RunA, ManifestVersion = "v1", Environment = "dev"
        });

        result.CurrentRunId.Should().BeNull();
        result.CurrentManifestVersion.Should().BeNull();
        result.PreviewRunId.Should().Be(RunA);
        result.Differences.Should()
            .Contain(d => d.Key == "RequiredControls" && d.ChangeType == GovernanceDiffChangeType.Added);
        result.Notes.Should().Contain(n =>
            n.Contains("No current active governance activation", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_WhenCurrentActiveRowExists_ReturnsDifferences()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(RunB, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunDetail(RunB));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("v2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunB, "v2", g =>
            {
                g.RequiredControls.Add("MI");
                g.RiskClassification = "High";
            }));

        GovernanceEnvironmentActivation currentActivation = new()
        {
            ActivationId = "act-1",
            RunId = RunOld,
            ManifestVersion = "v-old",
            Environment = "test",
            IsActive = true
        };
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GovernanceEnvironmentActivation> { currentActivation });

        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("v-old", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunOld, "v-old", g =>
            {
                g.RequiredControls.Add("PEP");
                g.RiskClassification = "Low";
            }));

        GovernancePreviewResult result = await _sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = RunB, ManifestVersion = "v2", Environment = "test"
        });

        result.CurrentRunId.Should().Be(RunOld);
        result.Differences.Should().Contain(d =>
            d.Key == "RiskClassification" && d.ChangeType == GovernanceDiffChangeType.Changed);
        result.Differences.Should().Contain(d =>
            d.Key == "RequiredControls" && d.ChangeType == GovernanceDiffChangeType.Changed);
    }

    [SkippableFact]
    public async Task CompareEnvironmentsAsync_WhenBothHaveActiveRows_ReturnsDifferences()
    {
        GovernanceEnvironmentActivation srcAct = new()
        {
            RunId = R1, ManifestVersion = "m1", Environment = "dev", IsActive = true
        };
        GovernanceEnvironmentActivation tgtAct = new()
        {
            RunId = R2, ManifestVersion = "m2", Environment = "test", IsActive = true
        };

        _activationRepo.Setup(a => a.GetByEnvironmentAsync("dev", It.IsAny<CancellationToken>()))
            .ReturnsAsync([srcAct]);
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync([tgtAct]);

        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("m1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(R1, "m1", g => g.CostClassification = "Low"));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("m2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(R2, "m2", g => g.CostClassification = "High"));

        GovernanceEnvironmentComparisonResult result = await _sut.CompareEnvironmentsAsync(
            new GovernanceEnvironmentComparisonRequest { SourceEnvironment = "dev", TargetEnvironment = "test" });

        result.SourceEnvironment.Should().Be("dev");
        result.TargetEnvironment.Should().Be("test");
        result.Differences.Should().Contain(d =>
            d.Key == "CostClassification" && d.ChangeType == GovernanceDiffChangeType.Changed);
        result.Notes.Should()
            .Contain(n => n.Contains("Compared active governance", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task CompareEnvironmentsAsync_AcceptsPaddedEnvironmentNames_WhenInScope()
    {
        GovernanceEnvironmentActivation act1 = new()
        {
            RunId = R1, ManifestVersion = "m1", Environment = "dev", IsActive = true
        };
        GovernanceEnvironmentActivation act2 = new()
        {
            RunId = R2, ManifestVersion = "m2", Environment = "test", IsActive = true
        };

        _activationRepo.Setup(a => a.GetByEnvironmentAsync("dev", It.IsAny<CancellationToken>())).ReturnsAsync([act1]);
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>())).ReturnsAsync([act2]);
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("m1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(R1, "m1", g => g.CostClassification = "Low"));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("m2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(R2, "m2", g => g.CostClassification = "High"));

        GovernanceEnvironmentComparisonResult result = await _sut.CompareEnvironmentsAsync(
            new GovernanceEnvironmentComparisonRequest { SourceEnvironment = "  dev  ", TargetEnvironment = "  test  " });

        result.SourceEnvironment.Should().Be("dev");
        result.TargetEnvironment.Should().Be("test");
    }

    [SkippableFact]
    public async Task CompareEnvironmentsAsync_WhenStatesAreEquivalent_ReturnsNoMeaningfulDiffs()
    {
        ManifestGovernance gov = new() { RiskClassification = "Moderate", CostClassification = "Moderate" };
        GoldenManifest m = Manifest(R1, "v1", _ =>
        {
        });
        m.Governance = gov;

        GovernanceEnvironmentActivation act1 = new()
        {
            RunId = R1, ManifestVersion = "v1", Environment = "dev", IsActive = true
        };
        GovernanceEnvironmentActivation act2 = new()
        {
            RunId = R2, ManifestVersion = "v2", Environment = "prod", IsActive = true
        };

        _activationRepo.Setup(a => a.GetByEnvironmentAsync("dev", It.IsAny<CancellationToken>())).ReturnsAsync([act1]);
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("prod", It.IsAny<CancellationToken>())).ReturnsAsync([act2]);
        _unifiedManifestReader
            .Setup(goldenManifestRepository =>
                goldenManifestRepository.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(R1, "v1"));
        _unifiedManifestReader
            .Setup(goldenManifestRepository =>
                goldenManifestRepository.GetByVersionAsync("v2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(R2, "v2"));

        GovernanceEnvironmentComparisonResult result = await _sut.CompareEnvironmentsAsync(
            new GovernanceEnvironmentComparisonRequest { SourceEnvironment = "dev", TargetEnvironment = "prod" });

        result.Differences.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task CompareEnvironmentsAsync_WhenActivationManifestRunMismatch_OmitsForeignManifest()
    {
        GovernanceEnvironmentActivation srcAct = new()
        {
            RunId = R1, ManifestVersion = "m1", Environment = "dev", IsActive = true
        };
        GovernanceEnvironmentActivation tgtAct = new()
        {
            RunId = R2, ManifestVersion = "m2", Environment = "test", IsActive = true
        };

        _activationRepo.Setup(a => a.GetByEnvironmentAsync("dev", It.IsAny<CancellationToken>()))
            .ReturnsAsync([srcAct]);
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync([tgtAct]);

        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("m1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunForeign, "m1", g => g.CostClassification = "Low"));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("m2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunForeign2, "m2", g => g.CostClassification = "High"));

        GovernanceEnvironmentComparisonResult result = await _sut.CompareEnvironmentsAsync(
            new GovernanceEnvironmentComparisonRequest { SourceEnvironment = "dev", TargetEnvironment = "test" });

        result.Differences.Should().BeEmpty();
        result.Notes.Should().Contain(n =>
            n.Contains($"does not belong to activation run '{R1}'", StringComparison.OrdinalIgnoreCase));
        result.Notes.Should().Contain(n =>
            n.Contains($"does not belong to activation run '{R2}'", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_WhenCurrentActivationManifestRunMismatch_OmitsForeignManifest()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(RunB, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunDetail(RunB));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("v2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunB, "v2", g => g.RiskClassification = "High"));

        GovernanceEnvironmentActivation currentActivation = new()
        {
            ActivationId = "act-1",
            RunId = RunOld,
            ManifestVersion = "v-old",
            Environment = "test",
            IsActive = true
        };
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GovernanceEnvironmentActivation> { currentActivation });

        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("v-old", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunForeign, "v-old", g => g.RiskClassification = "Low"));

        GovernancePreviewResult result = await _sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = RunB, ManifestVersion = "v2", Environment = "test"
        });

        result.Notes.Should().Contain(n =>
            n.Contains($"does not belong to activation run '{RunOld}'", StringComparison.OrdinalIgnoreCase));
        result.Differences.Should().Contain(d =>
            d.Key == "RiskClassification" && d.ChangeType == GovernanceDiffChangeType.Added);
        result.Differences.Should().NotContain(d =>
            d.Key == "RiskClassification" && d.ChangeType == GovernanceDiffChangeType.Changed);
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_DoesNotMutateActivationRows()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(RunX, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunDetail(RunX));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunX, "v1"));
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("dev", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        await _sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = RunX, ManifestVersion = "v1", Environment = "dev"
        });

        _activationRepo.Verify(
            a => a.CreateAsync(It.IsAny<GovernanceEnvironmentActivation>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _activationRepo.Verify(
            a => a.UpdateAsync(It.IsAny<GovernanceEnvironmentActivation>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_WhenRunMissing_ThrowsRunNotFoundException()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(MissingRun, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        Func<Task<GovernancePreviewResult>> act = () => _sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = MissingRun, ManifestVersion = "v1", Environment = "dev"
        });

        await act.Should().ThrowAsync<RunNotFoundException>();
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_WhenManifestBelongsToAnotherRun_ThrowsGoldenManifestVersionNotFoundException()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(RunA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunDetail(RunA));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunB, "v1"));

        Func<Task<GovernancePreviewResult>> act = () => _sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = RunA, ManifestVersion = "v1", Environment = "dev"
        });

        await act.Should().ThrowAsync<GoldenManifestVersionNotFoundException>();
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_accepts_padded_run_id_and_manifest_version_when_in_scope()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(RunA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunDetail(RunA));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunA, "v1", g => g.RequiredControls.Add("PEP")));
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("dev", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GovernanceEnvironmentActivation>());

        GovernancePreviewResult result = await _sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = $"  {RunA}  ",
            ManifestVersion = "  v1  ",
            Environment = "dev",
        });

        result.PreviewRunId.Should().Be(RunA);
        result.PreviewManifestVersion.Should().Be("v1");
        _unifiedManifestReader.VerifyAll();
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_accepts_padded_environment_when_in_scope()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(RunA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunDetail(RunA));
        _unifiedManifestReader.Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manifest(RunA, "v1", g => g.RequiredControls.Add("PEP")));
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("dev", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GovernanceEnvironmentActivation>());

        GovernancePreviewResult result = await _sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = RunA,
            ManifestVersion = "v1",
            Environment = "  dev  ",
        });

        result.Environment.Should().Be("dev");
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_operator_retry_manifest_version_casing_only_succeeds_when_run_embeds_manifest()
    {
        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        ArchitectureRunDetail runDetail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = RunA,
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                CurrentManifestVersion = "v1",
            },
            Manifest = Manifest(RunA, "v1", g => g.RequiredControls.Add("PEP")),
        };

        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(RunA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runDetail);
        _activationRepo.Setup(a => a.GetByEnvironmentAsync("dev", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GovernanceEnvironmentActivation>());

        GovernancePreviewService sut = new(
            _activationRepo.Object,
            _runDetailQueryService.Object,
            manifests.Object,
            _scopeProvider.Object,
            _authority.Object,
            _manifestHashService);

        GovernancePreviewResult result = await sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = RunA,
            ManifestVersion = "V1",
            Environment = "dev",
        });

        result.PreviewRunId.Should().Be(RunA);
        result.PreviewManifestVersion.Should().Be("V1");
        manifests.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task PreviewActivationAsync_WhenManifestVersionMissing_ThrowsGoldenManifestVersionNotFoundException()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailAsync(RunOne, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunDetail(RunOne));
        _unifiedManifestReader
            .Setup(r => r.GetByVersionAsync("missing-v", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        Func<Task<GovernancePreviewResult>> act = () => _sut.PreviewActivationAsync(new GovernancePreviewRequest
        {
            RunId = RunOne, ManifestVersion = "missing-v", Environment = "dev"
        });

        await act.Should().ThrowAsync<GoldenManifestVersionNotFoundException>();
    }
}
