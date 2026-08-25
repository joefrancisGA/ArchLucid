using ArchLucid.Integrations.GcpExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.GcpExtractor;

[Trait("Category", "Unit")]
public sealed class GcpWorkloadIdentityPoolProviderTests
{
    [Fact]
    public void TryGetProjectId_parses_provider_resource_name()
    {
        const string provider =
            "projects/my-project/locations/global/workloadIdentityPools/pool/providers/provider";

        bool parsed = GcpWorkloadIdentityPoolProvider.TryGetProjectId(provider, out string projectId);

        parsed.Should().BeTrue();
        projectId.Should().Be("my-project");
    }

    [Fact]
    public void EnsureProjectMatches_rejects_provider_project_mismatch()
    {
        const string provider =
            "projects/other-project/locations/global/workloadIdentityPools/pool/providers/provider";

        Action act = () => GcpWorkloadIdentityPoolProvider.EnsureProjectMatches("my-project", provider);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*does not match workload identity pool provider project*");
    }
}
