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
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Cannot insert duplicate key row in object 'dbo.Tenants' with unique index 'IX_Tenants_Slug'."))
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

    [SkippableFact]
    public void IsDuplicateOrganization_detects_ix_index_name_on_outer_exception_message()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Violation of UNIQUE KEY constraint 'IX_Tenants_Slug'"))
            .Should()
            .BeTrue();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_detects_duplicate_text_on_inner_exception_only()
    {
        Exception wrapped = new InvalidOperationException(
            "Registration failed.",
            new InvalidOperationException(
                "duplicate key value violates unique constraint 'IX_Tenants_NormalizedOrganizationName'"));

        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(wrapped).Should().BeTrue();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_generic_unique_word_without_constraint_context()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("A unique identifier format was invalid."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_unrelated_already_exists_phrase()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Distributed cache entry already exists for unrelated resource."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_detects_sqlite_unique_constraint_failed_with_slug_context()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("UNIQUE constraint failed: Tenants.Slug"))
            .Should()
            .BeTrue();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_unrelated_duplicate_phrase()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Duplicate request id header rejected by upstream gateway."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_sqlite_unique_constraint_on_unrelated_tenant_settings()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("UNIQUE constraint failed: TenantSettings.SettingKey"))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_detects_sqlite_unique_constraint_failed_on_normalized_organization_name()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "UNIQUE constraint failed: Tenants.NormalizedOrganizationName"))
            .Should()
            .BeTrue();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_already_exists_on_unrelated_tenant_settings()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("TenantSettings row already exists for this key."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_on_unrelated_tenant_settings()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Duplicate TenantSettings entry rejected during nav seed."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_sql_server_duplicate_key_on_unrelated_tenant_settings()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Cannot insert duplicate key row in object 'dbo.TenantSettings'."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_unrelated_ix_tenant_settings_index()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Violation of UNIQUE KEY constraint 'IX_TenantSettings_TenantId_SettingKey'."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_with_organization_substring_only()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Duplicate organization-wide integration webhook id rejected."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_with_unrelated_ix_in_context()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Duplicate row rejected for index IX_TenantWorkspaces_TenantId_WorkspaceId."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_with_unrelated_slug_substring()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Duplicate route slug segment rejected by edge gateway."))
            .Should()
            .BeFalse();
    }
}
