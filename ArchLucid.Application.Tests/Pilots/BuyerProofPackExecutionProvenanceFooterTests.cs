using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackExecutionProvenanceFooterTests
{
    [SkippableFact]
    public async Task BuildMarkdownAsync_when_llm_traces_unresolved_execution_provenance_footer_omits_zero_count()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "r1",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
                CreatedUtc = DateTime.UtcNow.AddHours(-1),
                CompletedUtc = DateTime.UtcNow,
                StructuralExecutionMode = StructuralExecutionMode.Simulator,
            },
            Manifest = new GoldenManifest
            {
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
            },
            Results = [],
            DecisionTraces = [],
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
        };

        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("r1", It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        PilotRunDeltas computed = new()
        {
            RunCreatedUtc = detail.Run.CreatedUtc,
            ManifestCommittedUtc = detail.Manifest!.Metadata.CreatedUtc,
            TimeToCommittedManifest = TimeSpan.FromHours(1),
            FindingsBySeverity = [new KeyValuePair<string, int>("Warning", 1)],
            AuditRowCount = 1,
            LlmCallCount = 0,
            LlmCallCountResolved = false,
            SynthesizedArtifactDescriptorCountResolved = true,
            SynthesizedArtifactDescriptorCount = 1,
        };

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>())).ReturnsAsync(computed);

        FirstValueReportBuilder sut = CreateFirstValueReportBuilder(query.Object, deltas.Object);

        string? markdown = await sut.BuildMarkdownAsync("r1", "http://api.test");

        markdown.Should().NotBeNull();
        markdown.Should().Contain("## Execution provenance");
        markdown.Should().NotContain("LLM completion traces (this run) | 0");
        markdown.Should().Contain("not attested");
    }

    [Fact]
    public void Execution_provenance_footer_when_deployment_name_contains_pipe_escapes_table_cell()
    {
        ExecutionProvenanceFooterRenderer renderer = new();
        string markdown = renderer.BuildFooterMarkdown(
            new ExecutionProvenanceFooterInput(
                PersistedStructuralExecutionMode: StructuralExecutionMode.Real,
                RealModeFellBackToSimulator: false,
                PilotAoaiDeploymentSnapshot: null,
                HostAgentExecutionMode: "Real",
                HostAzureOpenAiDeploymentName: "gpt|4o",
                LlmCompletionTraceCount: 2));

        string row = markdown.Split('\n')
            .Single(line => line.Contains("| Azure OpenAI deployment (when known) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Azure OpenAI deployment (when known) | `gpt\\|4o` |");
    }

    private static FirstValueReportBuilder CreateFirstValueReportBuilder(
        IRunDetailQueryService query,
        IPilotRunDeltaComputer deltas)
    {
        Mock<IValueReportMetricsReader> metrics = new();
        metrics
            .Setup(m => m.ReadAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValueReportRawMetrics([], 0, 0, 0, 0, 0, 0, 8m, "signup", TimeProvider.System.GetUtcNow(), 6m, 3, null, null, null));

        Mock<IOptionsMonitor<ValueReportComputationOptions>> opt = new();
        opt.Setup(o => o.CurrentValue).Returns(new ValueReportComputationOptions());

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            });

        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator" })
            .Build();

        Mock<IOptionsMonitor<PublicSiteOptions>> siteOpts = new();
        siteOpts.Setup(s => s.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = "https://ui.example" });

        ITenantBrandingService branding = FirstValueReportBrandingTestDoubles.CreateProductBrandService().Object;
        ITenantReportBrandingApplyHelper reportBranding = FirstValueReportBrandingTestDoubles.CreateApplyHelper(branding);

        Mock<IPilotBaselineRepository> pilotBaselines = new();
        pilotBaselines
            .Setup(b => b.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PilotBaselineRecord?)null);

        IManifestHashService hashes = FirstValueReportBuilderTestDoubles.CreateManifestHashService();

        return new FirstValueReportBuilder(
            query,
            deltas,
            new ValueReportBuilder(metrics.Object, opt.Object),
            scope.Object,
            new ExecutionProvenanceFooterRenderer(),
            configuration,
            siteOpts.Object,
            reportBranding,
            pilotBaselines.Object,
            FirstValueReportBuilderTestDoubles.CreateDefaultCostEvidenceResolver(),
            FirstValueReportBuilderTestDoubles.CreateDefaultFreshnessOptions(),
            FirstValueReportBuilderTestDoubles.CreateAuthorityQueryForSponsorExport(hashes),
            hashes,
            FirstValueReportBuilderTestDoubles.CreateGraphSnapshotRepository(),
            FirstValueReportBuilderTestDoubles.CreateEmptyAgentExecutionTraceRepository(),
            Mock.Of<IRunRepository>(),
            Mock.Of<ArchLucid.Core.Persistence.ApplicationPorts.Architecture.IArchitectureInventoryBindingRepository>(),
            NullLogger<FirstValueReportBuilder>.Instance);
    }
}
