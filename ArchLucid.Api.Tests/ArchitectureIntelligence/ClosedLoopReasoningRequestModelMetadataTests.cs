using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests.ArchitectureIntelligence;

/// <summary>
/// Locks the HTTP 400 that Refine architecture with AI hit: [ApiController] treats
/// non-nullable reference types as required before the controller can stamp TenantId from scope.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ClosedLoopReasoningRequestModelMetadataTests
{
    [Fact]
    public void TenantId_is_not_implicitly_required_by_mvc()
    {
        ServiceCollection services = new();
        services.AddLogging();
        services.AddMvcCore();
        ServiceProvider provider = services.BuildServiceProvider();
        IModelMetadataProvider metadataProvider = provider.GetRequiredService<IModelMetadataProvider>();
        ModelMetadata metadata = metadataProvider.GetMetadataForProperty(
            typeof(ClosedLoopReasoningRequest),
            nameof(ClosedLoopReasoningRequest.TenantId));

        metadata.IsRequired.Should().BeFalse(
            "Inbound refine requests omit tenantId; the controller stamps it from authenticated scope.");
    }
}
