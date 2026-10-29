using ArchLucid.Application.Tenancy;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

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
        SqlException ex = SqlExceptionTestFactory.Create(
            2627,
            "Violation of UNIQUE KEY constraint 'IX_Tenants_Slug'. Cannot insert duplicate key in object 'dbo.Tenants'.");

        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(ex).Should().BeTrue();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_bare_sql_unique_violation_without_org_context()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(SqlExceptionTestFactory.Create(2627))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_sql_unique_violation_on_unrelated_tenant_settings_index()
    {
        SqlException ex = SqlExceptionTestFactory.Create(
            2627,
            "Violation of UNIQUE KEY constraint 'IX_TenantSettings_TenantId_SettingKey'.");

        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(ex).Should().BeFalse();
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

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_with_organization_name_substring_only()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Duplicate PrimaryOrganizationNameCache entry rejected during sync."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_unrelated_ix_slug_index_outside_tenants_table()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Violation of UNIQUE KEY constraint 'IX_IntegrationWebhook_Slug'."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_key_on_unrelated_table_slug_column()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Cannot insert duplicate key row in object 'dbo.IntegrationWebhooks' with unique index 'IX_IntegrationWebhooks_Slug'."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_key_referencing_tenants_id_foreign_key()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Cannot insert duplicate key row in object 'dbo.TenantNavSettings'. Conflict with FOREIGN KEY constraint referencing Tenants.Id."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_with_normalized_organization_name_substring_only()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Duplicate UserNormalizedOrganizationNameCache entry rejected during directory sync."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_sql_unique_violation_on_entra_tenant_id_index()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                SqlExceptionTestFactory.Create(
                    2627,
                    "Violation of UNIQUE KEY constraint 'IX_Tenants_EntraTenantId'."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_with_dotted_organization_name_substring_only()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Duplicate Primary.OrganizationNameCache entry rejected during sync."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_with_organization_name_identifier_substring()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Duplicate Billing_OrganizationNameReference row rejected during invoice sync."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_with_tenant_slug_line_substring()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Duplicate Tenant slug-line correlation token rejected by edge gateway."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_text_with_normalized_organization_name_identifier_substring()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Duplicate User_NormalizedOrganizationName snapshot rejected during sync."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_sqlite_unique_constraint_on_archive_tenants_slug()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("UNIQUE constraint failed: ArchiveTenants.Slug"))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_sqlite_unique_constraint_on_archive_tenants_normalized_organization_name()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "UNIQUE constraint failed: ArchiveTenants.NormalizedOrganizationName"))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_unrelated_ix_tenants_slug_history_index()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Violation of UNIQUE KEY constraint 'IX_Tenants_SlugHistory'."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_sqlite_unique_constraint_on_tenants_slug_history_column()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "UNIQUE constraint failed: Tenants.SlugHistory"))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_sqlite_unique_constraint_on_tenants_normalized_organization_name_history_column()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "UNIQUE constraint failed: Tenants.NormalizedOrganizationNameHistory"))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_key_with_dbo_tenants_in_unrelated_prose()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "duplicate key could not restore dbo.Tenants backup snapshot"))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_detects_tenant_slug_label_with_colon_in_already_exists_message()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException("Tenant slug: acme already exists"))
            .Should()
            .BeTrue();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_key_with_dbo_tenants_double_space_before_prose()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "duplicate key could not restore dbo.Tenants  backup snapshot"))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_detects_ix_tenants_slug_when_constraint_name_ends_with_semicolon()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Violation of UNIQUE KEY constraint 'IX_Tenants_Slug';"))
            .Should()
            .BeTrue();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_unrelated_ix_tenants_normalized_organization_name_history_index()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "Violation of UNIQUE KEY constraint 'IX_Tenants_NormalizedOrganizationNameHistory'."))
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public void IsDuplicateOrganization_does_not_match_duplicate_key_with_quoted_dbo_tenants_followed_by_prose()
    {
        TenantOrganizationDuplicateDetector.IsDuplicateOrganization(
                new InvalidOperationException(
                    "duplicate key could not insert into object 'dbo.Tenants' backup table"))
            .Should()
            .BeFalse();
    }
}
