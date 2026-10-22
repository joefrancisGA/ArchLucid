namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     Greenfield SQL factory for IDOR tests. Sets <c>Hosting:Role=Api</c> to suppress
///     background outbox workers that are irrelevant to scope-denial assertions.
/// </summary>
/// <remarks>
///     With the default <c>Combined</c> role, <see cref="AuthorityPipelineWorkHostedService" />
///     and <see cref="RetrievalIndexingOutboxHostedService" /> start immediately and poll
///     <c>dbo.AuthorityPipelineWorkOutbox</c> every two seconds via a CTE with
///     <c>UPDLOCK, ROWLOCK</c>. Under CI SQL pressure, these polls race with the
///     create-run pipeline that also writes to the outbox, causing
///     <c>SqlException: Execution Timeout Expired</c> on the outbox CTE query (observed in
///     CI #2235 shard 5/6 — <c>Wrong_workspace_cannot_list_run_artifacts_sql</c> failed after
///     ~46 min because six separate factory boots each ran the full warmup + seed with active
///     background workers).
///
///     The <c>Api</c> role does not register those hosted services. The processors
///     (<see cref="IAuthorityPipelineWorkProcessor" />) are still wired as singletons for DI
///     completeness. IDOR tests only need <c>POST /v1/architecture/request</c> to return a
///     <c>runId</c> — no outbox drain is required.
/// </remarks>
internal sealed class IdorGreenfieldSqlApiFactory : GreenfieldSqlApiFactory
{
    protected override IReadOnlyDictionary<string, string?>? GetAdditionalHostConfigurationOverrides() =>
        new Dictionary<string, string?>
        {
            // Api role skips AuthorityPipelineWorkHostedService and all other
            // Combined/Worker-only background pollers. Purge workers registered by
            // Program.cs for Api role (RetentionPurgeWorker etc.) are inert because
            // BaseIntegrationTestFixture sets their Enabled=false config flags.
            ["Hosting:Role"] = "Api",
        };
}
