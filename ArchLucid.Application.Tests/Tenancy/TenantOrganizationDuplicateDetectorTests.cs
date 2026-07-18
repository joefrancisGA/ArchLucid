using ArchLucid.Application.Tenancy;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantOrganizationDuplicateDetectorTests
{
    [SkippableFact]
    public void NormalizeOrganizationName_trims_and_uppercases()
    {
        TenantOrganizationDuplicateDetector.NormalizeOrganizationName("  Acme Corp ")
            .Should()
            .Be("ACME CORP");
    }

    [SkippableFact]
    public void IsDuplicateOrganization_detects_sql_unique_violation()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                SqlExceptionTestFactory.Create(2627))
            .Should()
            .BeTrue();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_detects_duplicate_text_in_message()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(new InvalidOperationException("duplicate key row"))
            .Should()
            .BeTrue();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_detects_already_exists_text_in_message()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Tenant slug 'acme' already exists."))
            .Should()
            .BeTrue();
    }
}
