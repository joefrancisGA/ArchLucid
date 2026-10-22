using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Suite", "Persistence")]
public sealed class TenantBrandingProfileRepositoryTests
{
  private static readonly Guid TenantA = Guid.Parse("a9a9a9a9-a9a9-a9a9-a9a9-a9a9a9a9a9a9");
  private static readonly Guid TenantB = Guid.Parse("b9b9b9b9-b9b9-b9b9-b9b9-b9b9b9b9b9b9");

  [Fact]
  public async Task Insert_second_active_profile_for_same_tenant_is_rejected()
  {
    InMemoryTenantBrandingProfileRepository repository = new();
    DateTime utcNow = DateTime.UtcNow;

    TenantBrandingProfileRecord first = BuildProfile(TenantA, BrandingProfileStatus.Active, utcNow);
    await repository.InsertAsync(first, CancellationToken.None);

    TenantBrandingProfileRecord second = BuildProfile(TenantA, BrandingProfileStatus.Active, utcNow);

    Func<Task> act = () => repository.InsertAsync(second, CancellationToken.None);

    await act.Should().ThrowAsync<InvalidOperationException>();
  }

  [Fact]
  public async Task TryGetActive_is_isolated_by_tenant()
  {
    InMemoryTenantBrandingProfileRepository repository = new();
    DateTime utcNow = DateTime.UtcNow;

    await repository.InsertAsync(
      BuildProfile(TenantA, BrandingProfileStatus.Active, utcNow, companyDisplayName: "Tenant A Co"),
      CancellationToken.None);

    TenantBrandingProfileRecord? tenantBActive =
      await repository.TryGetActiveAsync(TenantB, CancellationToken.None);

    tenantBActive.Should().BeNull();
  }

  private static TenantBrandingProfileRecord BuildProfile(
    Guid tenantId,
    BrandingProfileStatus status,
    DateTime utcNow,
    string? companyDisplayName = "Example Co")
  {
    return new TenantBrandingProfileRecord
    {
      BrandingProfileId = Guid.NewGuid(),
      TenantId = tenantId,
      CompanyDisplayName = companyDisplayName,
      WebsiteUrl = "https://example.com",
      BrandingStatus = status,
      Version = 1,
      CreatedUtc = utcNow,
      UpdatedUtc = utcNow,
    };
  }
}
