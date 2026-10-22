using ArchLucid.Integrations.GcpExtractor;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.GcpExtractor;

[Trait("Category", "Unit")]
public sealed class GcpWorkloadIdentityCredentialFactoryTests
{
    [Theory]
    [InlineData("//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/provider")]
    [InlineData("projects/123/locations/global/workloadIdentityPools/pool/providers/provider")]
    [InlineData("//IAM.GOOGLEAPIS.COM/projects/123/locations/global/workloadIdentityPools/pool/providers/provider")]
    public void NormalizeAudience_accepts_full_or_relative_provider_resource(string provider)
    {
        string audience = GcpWorkloadIdentityCredentialFactory.NormalizeAudience(provider);

        audience.Should().StartWith("//iam.googleapis.com/");
        audience.Should().Contain("workloadIdentityPools");
    }

    [Fact]
    public void NormalizeAudience_normalizes_mixed_case_audience_prefix()
    {
        string audience = GcpWorkloadIdentityCredentialFactory.NormalizeAudience(
            "//IAM.GOOGLEAPIS.COM/projects/123/locations/global/workloadIdentityPools/pool/providers/provider");

        audience.Should().Be(
            "//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/provider");
    }

    [Fact]
    public void NormalizeAudience_normalizes_https_iam_googleapis_com_prefix()
    {
        string audience = GcpWorkloadIdentityCredentialFactory.NormalizeAudience(
            "https://iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/provider");

        audience.Should().Be(
            "//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/provider");
    }

    [Fact]
    public void NormalizeAudience_normalizes_http_iam_googleapis_com_prefix()
    {
        string audience = GcpWorkloadIdentityCredentialFactory.NormalizeAudience(
            "http://iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/provider");

        audience.Should().Be(
            "//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/pool/providers/provider");
    }

    [Fact]
    public void CreateImpersonatedCredential_throws_when_provider_missing()
    {
        Mock<IGcpSubjectTokenProvider> tokenProvider = new();
        GcpWorkloadIdentityCredentialFactory factory = new(tokenProvider.Object);

        Action act = () => factory.CreateImpersonatedCredential("  ", "svc@test.iam.gserviceaccount.com");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void CreateImpersonatedCredential_throws_when_service_account_missing()
    {
        Mock<IGcpSubjectTokenProvider> tokenProvider = new();
        GcpWorkloadIdentityCredentialFactory factory = new(tokenProvider.Object);

        Action act = () => factory.CreateImpersonatedCredential(
            "projects/1/locations/global/workloadIdentityPools/pool/providers/provider",
            " ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void CreateImpersonatedCredential_returns_google_credential()
    {
        Mock<IGcpSubjectTokenProvider> tokenProvider = new();
        GcpWorkloadIdentityCredentialFactory factory = new(tokenProvider.Object);

        Google.Apis.Auth.OAuth2.GoogleCredential credential = factory.CreateImpersonatedCredential(
            "projects/1/locations/global/workloadIdentityPools/pool/providers/provider",
            "svc@test.iam.gserviceaccount.com");

        credential.Should().NotBeNull();
    }
}
