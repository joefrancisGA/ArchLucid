using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Persistence.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InfrastructureDiagramDocumentationDecisionRepositoryTests
{
    [Fact]
    public async Task Latest_lookup_requires_the_same_diagram_fingerprint()
    {
        Guid tenantId = Guid.Parse("88888888-9999-aaaa-bbbb-cccccccccccc");
        InMemoryInfrastructureDiagramDocumentationDecisionRepository repository = new();

        await repository.UpsertAsync(CreateRecord(tenantId, "drawing-a", DateTime.UtcNow.AddMinutes(-1)));
        await repository.UpsertAsync(CreateRecord(tenantId, null, DateTime.UtcNow.AddSeconds(-30)));

        InfrastructureDiagramDocumentationDecisionPersistRecord? differentDrawing =
            await repository.TryGetLatestBySubjectAsync(
                tenantId,
                "drawing-b",
                "InventoryResource",
                "22222222-3333-4444-5555-666666666666");

        InfrastructureDiagramDocumentationDecisionPersistRecord? sameDrawing =
            await repository.TryGetLatestBySubjectAsync(
                tenantId,
                "drawing-a",
                "InventoryResource",
                "22222222-3333-4444-5555-666666666666");

        differentDrawing.Should().BeNull();
        sameDrawing.Should().NotBeNull();
        sameDrawing!.DiagramFingerprint.Should().Be("drawing-a");
    }

    private static InfrastructureDiagramDocumentationDecisionPersistRecord CreateRecord(
        Guid tenantId,
        string? diagramFingerprint,
        DateTime updatedUtc) =>
        new()
        {
            DecisionId = Guid.NewGuid(),
            TenantId = tenantId,
            ScopeId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(),
            SubjectKind = "InventoryResource",
            SubjectKey = "22222222-3333-4444-5555-666666666666",
            Decision = "AcceptAsUndocumented",
            DiagramFingerprint = diagramFingerprint,
            EvidenceFingerprint = "InfrastructureOnly",
            CreatedUtc = updatedUtc,
            UpdatedUtc = updatedUtc,
        };
}
