using ArchLucid.Core.Configuration;

using Azure.Core;
using Azure.Identity;

using Microsoft.Extensions.Options;

using Moq;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class WorkloadIdentityHostedAzureExtractorCredentialFactoryTests
{
  private const string CustomerTenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  private const string CustomerAppId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  [Fact]
  public void CreateCredential_throws_when_customerTenantId_missing()
  {
    WorkloadIdentityHostedAzureExtractorCredentialFactory sut = CreateFactory();

    Assert.Throws<ArgumentException>(() => sut.CreateCredential(string.Empty, CustomerAppId));
  }

  [Fact]
  public void CreateCredential_throws_when_customerAppId_missing()
  {
    WorkloadIdentityHostedAzureExtractorCredentialFactory sut = CreateFactory();

    Assert.Throws<ArgumentException>(() => sut.CreateCredential(CustomerTenantId, string.Empty));
  }

  [Fact]
  public void CreateCredential_returns_client_assertion_credential_with_default_exchange_scope()
  {
    WorkloadIdentityHostedAzureExtractorCredentialFactory sut = CreateFactory();

    TokenCredential credential = sut.CreateCredential(CustomerTenantId, CustomerAppId);

    Assert.IsType<ClientAssertionCredential>(credential);
  }

  [Fact]
  public void CreateCredential_accepts_custom_managed_identity_client_id_and_exchange_scope()
  {
    Mock<IOptionsMonitor<HostedAzureExtractorOptions>> options = new();
    options.Setup(o => o.CurrentValue).Returns(new HostedAzureExtractorOptions
    {
      ArchLucidManagedIdentityClientId = "cccccccc-cccc-cccc-cccc-cccccccccccc",
      FederatedTokenExchangeScope = "api://CustomExchange/.default",
    });

    WorkloadIdentityHostedAzureExtractorCredentialFactory sut = new(options.Object);

    TokenCredential credential = sut.CreateCredential(CustomerTenantId, CustomerAppId);

    Assert.IsType<ClientAssertionCredential>(credential);
  }

  private static WorkloadIdentityHostedAzureExtractorCredentialFactory CreateFactory()
  {
    Mock<IOptionsMonitor<HostedAzureExtractorOptions>> options = new();
    options.Setup(o => o.CurrentValue).Returns(new HostedAzureExtractorOptions());

    return new WorkloadIdentityHostedAzureExtractorCredentialFactory(options.Object);
  }
}
