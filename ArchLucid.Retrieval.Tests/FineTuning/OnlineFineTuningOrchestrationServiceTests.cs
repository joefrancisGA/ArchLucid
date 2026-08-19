using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Evaluation;
using ArchLucid.Retrieval.FineTuning.Export;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Orchestration;
using ArchLucid.Retrieval.FineTuning.Registry;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Retrieval.Tests.FineTuning;

[Trait("Category", "Unit")]
public sealed class FineTuningConsentServiceTests
{
    [Fact]
    public async Task GetConsentAsync_defaults_to_disabled_when_unset()
    {
        InMemoryFineTuningManifestConsentReaderDouble reader = new();
        FineTuningConsentService consent = new(reader);

        FineTuningConsentStatus status = await consent.GetConsentAsync(Guid.NewGuid(), CancellationToken.None);

        status.Should().Be(FineTuningConsentStatus.Disabled);
    }
}

[Trait("Category", "Unit")]
public sealed class OnlineFineTuningOrchestrationServiceTests
{
    [Fact]
    public async Task RunPipelineAsync_promotes_when_eval_passes()
    {
        FakeFineTuningConsentService consent = new(FineTuningConsentStatus.Enabled);
        FixedValueOptionsMonitor<FineTuningOptions> options = new(new FineTuningOptions
        {
            Enabled = true,
            BaseModelDeploymentName = "gpt-4o-mini",
            MinEvalSupportRatio = 0.75,
        });

        AcceptedManifestTrainingDataExporter exporter =
            new(consent, FineTuningTestFixtures.CreateRedactor(), options);

        AzureOpenAiFineTuningJobOrchestrator orchestrator =
            new(options, NullLogger<AzureOpenAiFineTuningJobOrchestrator>.Instance);

        GoldenCohortFineTuningPromotionGate gate = new(options);
        InMemoryFineTunedModelRegistry registry = new();
        OnlineFineTuningOrchestrationService service =
            new(exporter, orchestrator, gate, registry);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        ManifestDocument manifest = FineTuningTestFixtures.CreateSampleManifest(tenantId, workspaceId, projectId);

        (FineTuningTrainingExportResult export, FineTunedModelRegistryEntry? job, FineTuningEvalGateResult? eval) =
            await service.RunPipelineAsync(scope, [manifest], 0.70, 0.85, CancellationToken.None);

        export.Records.Should().NotBeEmpty();
        eval.Should().NotBeNull();
        eval!.Promoted.Should().BeTrue();
        job.Should().NotBeNull();
        job!.IsActive.Should().BeTrue();
    }
}
