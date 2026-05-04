using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Shared contract assertions for <see cref="IGovernanceEnvironmentActivationRepository" />.
/// </summary>
public abstract class GovernanceEnvironmentActivationRepositoryContractTests
{
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    protected abstract IGovernanceEnvironmentActivationRepository CreateRepository();

    [SkippableFact]
    public async Task Create_then_GetByEnvironment_returns_row_newest_first()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceEnvironmentActivationRepository repo = CreateRepository();
        // Full Guid suffix avoids Environment collisions on shared CI catalogs under FETCH NEXT 200.
        string env = "dev-" + Guid.NewGuid().ToString("N");
        string idOld = "act-env-old-" + Guid.NewGuid().ToString("N");
        string idNew = "act-env-new-" + Guid.NewGuid().ToString("N");
        string runOld = "run-env-old-" + Guid.NewGuid().ToString("N");
        string runNew = "run-env-new-" + Guid.NewGuid().ToString("N");
        // Distinct sub-ms instants at the DATETIME2 ceiling — stable ORDER BY vs ties or legacy rows.
        DateTime newer = DateTime.MaxValue.AddTicks(-2);
        DateTime older = DateTime.MaxValue.AddTicks(-4);

        await repo.CreateAsync(NewActivation(idOld, runOld, env, older, true), CancellationToken.None);
        await repo.CreateAsync(NewActivation(idNew, runNew, env, newer, true), CancellationToken.None);

        IReadOnlyList<GovernanceEnvironmentActivation> list =
            await repo.GetByEnvironmentAsync(env, CancellationToken.None);

        GovernanceEnvironmentActivation[] ours =
        [
            .. list.Where(x =>
                string.Equals(x.ActivationId, idNew, StringComparison.Ordinal)
                || string.Equals(x.ActivationId, idOld, StringComparison.Ordinal))
        ];

        ours.Should().HaveCount(2);
        ours[0].ActivationId.Should().Be(idNew);
        ours[1].ActivationId.Should().Be(idOld);
    }

    [SkippableFact]
    public async Task Update_changes_only_IsActive_visible_in_GetByRunId()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceEnvironmentActivationRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string activationId = "act-upd-" + Guid.NewGuid().ToString("N");

        GovernanceEnvironmentActivation created =
            NewActivation(activationId, runId, GovernanceEnvironment.Dev, DateTime.UtcNow, true);
        created.ManifestVersion = "v-before";

        await repo.CreateAsync(created, CancellationToken.None);

        GovernanceEnvironmentActivation patch = new()
        {
            ActivationId = activationId,
            RunId = runId,
            ManifestVersion = "v-after",
            Environment = GovernanceEnvironment.Test,
            IsActive = false,
            ActivatedUtc = new DateTime(2099, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };

        await repo.UpdateAsync(patch, CancellationToken.None);

        IReadOnlyList<GovernanceEnvironmentActivation> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        GovernanceEnvironmentActivation? row = list.SingleOrDefault(x => x.ActivationId == activationId);
        row.Should().NotBeNull();
        row.IsActive.Should().BeFalse();
        row.ManifestVersion.Should().Be("v-before");
        row.Environment.Should().Be(GovernanceEnvironment.Dev);
    }

    [SkippableFact]
    public async Task GetByRunId_orders_descending_by_ActivatedUtc()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceEnvironmentActivationRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string idOld = "act-run-old-" + Guid.NewGuid().ToString("N");
        string idNew = "act-run-new-" + Guid.NewGuid().ToString("N");
        string env = GovernanceEnvironment.Test;
        // Distinct sub-ms instants at the DATETIME2 ceiling — stable ORDER BY vs ties or dirty shared catalogs.
        DateTime newer = DateTime.MaxValue.AddTicks(-2);
        DateTime older = DateTime.MaxValue.AddTicks(-4);

        await repo.CreateAsync(NewActivation(idOld, runId, env, older, false), CancellationToken.None);
        await repo.CreateAsync(NewActivation(idNew, runId, env, newer, true), CancellationToken.None);

        IReadOnlyList<GovernanceEnvironmentActivation> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        GovernanceEnvironmentActivation[] ours =
        [
            .. list.Where(x =>
                string.Equals(x.ActivationId, idNew, StringComparison.Ordinal)
                || string.Equals(x.ActivationId, idOld, StringComparison.Ordinal))
        ];

        ours.Should().HaveCount(2);
        ours[0].ActivationId.Should().Be(idNew);
        ours[1].ActivationId.Should().Be(idOld);
    }

    private static GovernanceEnvironmentActivation NewActivation(
        string activationId,
        string runId,
        string environment,
        DateTime activatedUtc,
        bool isActive)
    {
        return new GovernanceEnvironmentActivation
        {
            ActivationId = activationId,
            RunId = runId,
            TenantId = GovernanceRepositoryContractScope.TenantId,
            WorkspaceId = GovernanceRepositoryContractScope.WorkspaceId,
            ProjectId = GovernanceRepositoryContractScope.ProjectId,
            ManifestVersion = "v1",
            Environment = environment,
            IsActive = isActive,
            ActivatedUtc = activatedUtc
        };
    }
}
