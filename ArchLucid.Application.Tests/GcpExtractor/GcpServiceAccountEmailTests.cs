using ArchLucid.Integrations.GcpExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.GcpExtractor;

[Trait("Category", "Unit")]
public sealed class GcpServiceAccountEmailTests
{
    [Fact]
    public void EnsureProjectMatches_accepts_padded_project_id_when_service_account_matches_trimmed_project()
    {
        const string email = "collector@my-project.iam.gserviceaccount.com";

        Action act = () => GcpServiceAccountEmail.EnsureProjectMatches(" my-project ", email);

        act.Should().NotThrow();
    }
}
