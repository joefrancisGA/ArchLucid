using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class SqlTenantSqlCatalogProvisioner
{
    private async Task MirrorTenantRowFromSystemAsync(
        Guid tenantId,
        string tenantConnectionString,
        CancellationToken cancellationToken)
    {
        await using SqlConnection systemConnection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string selectSql = """
                                 SELECT Id, Name, Slug, Tier, EntraTenantId, DataRegion, CreatedUtc, SuspendedUtc,
                                        OffboardedUtc, ErasureEligibleUtc, LegalHoldUntilUtc, LegalHoldReason, LegalHoldSetByUserId, LegalHoldSetUtc,
                                        TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                        TrialStatus, TrialSampleRunId,
                                        TrialArchitecturePreseedEnqueuedUtc, TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                        BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                        BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                        CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                        EnterpriseSeatsLimit, EnterpriseSeatsUsed
                                 FROM dbo.Tenants
                                 WHERE Id = @Id;
                                 """;


        CatalogTenantRow? row = await systemConnection.QuerySingleOrDefaultAsync<CatalogTenantRow>(
            new CommandDefinition(selectSql, new { Id = tenantId }, cancellationToken: cancellationToken));

        if (row is null)
            throw new InvalidOperationException(
                "Control-plane tenant row is missing before tenant catalog mirror for id '" + tenantId.ToString("D") + "'.");

        await using SqlConnection tenantConnection = new(
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(tenantConnectionString));

        await tenantConnection.OpenAsync(cancellationToken);

        const string insertSql = """
                                 IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @Id)
                                 BEGIN
                                     INSERT INTO dbo.Tenants (
                                         Id, Name, Slug, Tier, EntraTenantId, DataRegion, CreatedUtc, SuspendedUtc,
                                         OffboardedUtc, ErasureEligibleUtc, LegalHoldUntilUtc, LegalHoldReason, LegalHoldSetByUserId, LegalHoldSetUtc,
                                         TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                         TrialStatus, TrialSampleRunId,
                                         TrialArchitecturePreseedEnqueuedUtc, TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                         BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                         BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                         CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                         EnterpriseSeatsLimit, EnterpriseSeatsUsed)
                                     VALUES (
                                         @Id, @Name, @Slug, @Tier, @EntraTenantId, @DataRegion, @CreatedUtc, @SuspendedUtc,
                                         @OffboardedUtc, @ErasureEligibleUtc, @LegalHoldUntilUtc, @LegalHoldReason, @LegalHoldSetByUserId, @LegalHoldSetUtc,
                                         @TrialStartUtc, @TrialExpiresUtc, @TrialRunsLimit, @TrialRunsUsed, @TrialSeatsLimit, @TrialSeatsUsed,
                                         @TrialStatus, @TrialSampleRunId,
                                         @TrialArchitecturePreseedEnqueuedUtc, @TrialWelcomeRunId, @TrialFirstManifestCommittedUtc,
                                         @BaselineReviewCycleHours, @BaselineReviewCycleSource, @BaselineReviewCycleCapturedUtc,
                                         @BaselineManualPrepHoursPerReview, @BaselinePeoplePerReview, @BaselineManualPrepCapturedUtc,
                                         @CompanySize, @ArchitectureTeamSize, @IndustryVertical, @IndustryVerticalOther,
                                         @EnterpriseSeatsLimit, @EnterpriseSeatsUsed);
                                 END
                                 """;

        await tenantConnection.ExecuteAsync(new CommandDefinition(insertSql, row, cancellationToken: cancellationToken));
    }
}
