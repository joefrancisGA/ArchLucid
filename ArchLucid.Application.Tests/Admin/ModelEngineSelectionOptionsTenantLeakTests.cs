using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Admin;

[Trait("Category", "Unit")]
public sealed class ModelEngineSelectionOptionsTenantLeakTests
{
    [Fact]
    public void ModelEngineSelectionOptionResponse_DoesNotExposeDeploymentName()
    {
        typeof(ModelEngineSelectionOptionResponse)
            .GetProperties()
            .Select(property => property.Name)
            .Should()
            .NotContain(name => name.Contains("Deployment", StringComparison.OrdinalIgnoreCase));
    }
}
