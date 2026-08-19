using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Export;
using ArchLucid.Retrieval.FineTuning.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.FineTuning;

[Trait("Category", "Unit")]
public sealed class AcceptedManifestTrainingDataExporterTests
{
    [Fact]
    public async Task ExportAsync_without_consent_throws()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        FakeFineTuningConsentService consent = new(FineTuningConsentStatus.Disabled);
        AcceptedManifestTrainingDataExporter exporter = CreateExporter(consent);

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Func<Task> act = () => exporter.ExportAsync(scope, [], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*consent*");
    }

    [Fact]
    public async Task ExportAsync_with_consent_returns_records()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Guid workspaceId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");
        Guid projectId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000001");

        FakeFineTuningConsentService consent = new(FineTuningConsentStatus.Enabled);
        AcceptedManifestTrainingDataExporter exporter = CreateExporter(consent);

        ManifestDocument manifest = FineTuningTestFixtures.CreateSampleManifest(tenantId, workspaceId, projectId);

        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

        FineTuningTrainingExportResult result = await exporter.ExportAsync(scope, [manifest], CancellationToken.None);

        result.ManifestCount.Should().Be(1);
        result.Records.Should().NotBeEmpty();
        result.ConsentSnapshot.Should().Be(FineTuningConsentStatus.Enabled);
    }

    private static AcceptedManifestTrainingDataExporter CreateExporter(IFineTuningConsentService consent)
    {
        return new AcceptedManifestTrainingDataExporter(
            consent,
            FineTuningTestFixtures.CreateRedactor(),
            FineTuningTestFixtures.CreateOptions());
    }
}
