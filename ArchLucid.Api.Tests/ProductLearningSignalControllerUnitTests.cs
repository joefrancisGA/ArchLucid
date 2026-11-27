using ArchLucid.Api.Controllers.Advisory;
using ArchLucid.Api.Models.ProductLearning;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.ProductLearning;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProductLearningSignalControllerUnitTests
{
    [Theory]
    [InlineData(127, "\U0001F680-tail", "")]
    [InlineData(126, "\U0001F680-tail", "\U0001F680")]
    [InlineData(127, "z-tail", "z")]
    [InlineData(1, "z  ", "z")]
    public async Task PostSignal_persists_a_whole_character_prefix_when_capping_manifest_version(
        int prefixLength,
        string suffix,
        string expectedSuffix)
    {
        string prefix = new('v', prefixLength);
        Mock<IProductLearningPilotSignalRepository> repository = new(MockBehavior.Strict);
        ProductLearningPilotSignalRecord? persisted = null;
        repository.Setup(r => r.InsertAsync(It.IsAny<ProductLearningPilotSignalRecord>(), CancellationToken.None))
            .Callback<ProductLearningPilotSignalRecord, CancellationToken>((signal, _) => persisted = signal)
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
        });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("Fixture Actor");
        actorContext.Setup(a => a.GetActorId()).Returns("fixture-actor");

        Mock<IAuditService> auditService = new(MockBehavior.Strict);
        auditService.Setup(a => a.LogAsync(
                It.Is<AuditEvent>(evt => evt.EventType == AuditEventTypes.ProductLearningPilotSignalRecorded),
                CancellationToken.None))
            .Returns(Task.CompletedTask);

        ProductLearningController controller = new(
            Mock.Of<IProductLearningDashboardService>(),
            repository.Object,
            actorContext.Object,
            scopeProvider.Object,
            auditService.Object);

        IActionResult result = await controller.PostSignal(new ProductLearningSignalRequest
        {
            SubjectType = "Diagram",
            Disposition = ProductLearningDispositionValues.Trusted,
            ManifestVersion = prefix + suffix,
        }, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        repository.Verify(r => r.InsertAsync(It.IsAny<ProductLearningPilotSignalRecord>(), CancellationToken.None),
            Times.Once);
        persisted.Should().NotBeNull();
        persisted!.ManifestVersion.Should().Be(prefix + expectedSuffix);
    }
}
