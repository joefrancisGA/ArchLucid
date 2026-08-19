using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Admin;

/// <inheritdoc cref="IAdminDeploymentStatusQuery" />
public sealed class AdminDeploymentStatusQuery(
    IHostBuildInfoAccessor hostBuildInfoAccessor,
    IConfiguration configuration,
    TimeProvider timeProvider,
    HealthCheckService healthCheckService,
    ISchemaVersionsJournalReader schemaVersionsJournalReader,
    IOptions<DeploymentStatusOptions> deploymentStatusOptions) : IAdminDeploymentStatusQuery
{
    private const string LiveTag = "live";
    private const string ReadyTag = "ready";
    private const string WorkerBuildEnvVar = "ARCHLUCID_WORKER_BUILD_COMMIT_SHA";
    private const string ContainerAppRevisionEnvVar = "CONTAINER_APP_REVISION";

    private readonly IHostBuildInfoAccessor _hostBuildInfoAccessor =
        hostBuildInfoAccessor ?? throw new ArgumentNullException(nameof(hostBuildInfoAccessor));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly HealthCheckService _healthCheckService =
        healthCheckService ?? throw new ArgumentNullException(nameof(healthCheckService));

    private readonly ISchemaVersionsJournalReader _schemaVersionsJournalReader =
        schemaVersionsJournalReader ?? throw new ArgumentNullException(nameof(schemaVersionsJournalReader));

    private readonly DeploymentStatusOptions _options =
        (deploymentStatusOptions ?? throw new ArgumentNullException(nameof(deploymentStatusOptions))).Value
        ?? new DeploymentStatusOptions();

    public async Task<AdminDeploymentStatusResponse> GetAsync(
        string? frontendBuildId,
        CancellationToken cancellationToken)
    {
        BuildInfoResponse build = _hostBuildInfoAccessor.GetBuildInfo();

        string apiBuildId = DisplayOrUnknown(build.CommitSha);
        string releaseBuildId = apiBuildId;
        string sourceCommit = apiBuildId;
        string deploymentTime = DisplayOrUnknown(build.BuildTimestamp);
        string environment = DisplayOrUnknown(build.Environment);
        string frontend = DisplayOrUnknown(frontendBuildId);
        string worker = ResolveWorkerBuildId();
        string activeRevision = DisplayOrUnknown(
            Environment.GetEnvironmentVariable(ContainerAppRevisionEnvVar));

        string healthStatus = await ProbeHealthStatusAsync(
            static registration => registration.Tags.Contains(LiveTag),
            cancellationToken).ConfigureAwait(false);

        string readinessStatus = await ProbeHealthStatusAsync(
            static registration => registration.Tags.Contains(ReadyTag),
            cancellationToken).ConfigureAwait(false);

        string migrationVersion = await ReadMigrationVersionAsync(cancellationToken).ConfigureAwait(false);

        string smoke = DisplayOrUnknown(_options.LatestSmokeTestResult);
        string lastKnownGood = DisplayOrUnknown(_options.LastKnownGoodBuildId);

        (string agreement, string agreementDetail) = DeploymentComponentAgreementEvaluator.Evaluate(
            apiBuildId,
            frontend,
            worker);

        (string overall, string overallLabel) = DeploymentStatusOverallEvaluator.Evaluate(
            healthStatus,
            readinessStatus,
            agreement);

        return new AdminDeploymentStatusResponse
        {
            Environment = environment,
            ReleaseBuildId = releaseBuildId,
            SourceCommit = sourceCommit,
            FrontendBuildId = frontend,
            ApiBuildId = apiBuildId,
            WorkerBuildId = worker,
            DeploymentTimeUtc = deploymentTime,
            ActivePlatformRevision = activeRevision,
            HealthStatus = healthStatus,
            ReadinessStatus = readinessStatus,
            DatabaseMigrationVersion = migrationVersion,
            LatestSmokeTestResult = smoke,
            LastKnownGoodBuildId = lastKnownGood,
            ComponentAgreement = agreement,
            ComponentAgreementDetail = agreementDetail,
            OverallStatus = overall,
            OverallStatusLabel = overallLabel,
            Links = BuildSafeLinks(sourceCommit),
            GeneratedAtUtc = _timeProvider.GetUtcNow(),
        };
    }

    private string ResolveWorkerBuildId()
    {
        string? fromOptions = _options.WorkerBuildCommitSha;

        if (!string.IsNullOrWhiteSpace(fromOptions))
            return fromOptions.Trim();

        string? fromEnv = Environment.GetEnvironmentVariable(WorkerBuildEnvVar);

        if (!string.IsNullOrWhiteSpace(fromEnv))
            return fromEnv.Trim();

        string? fromConfig = _configuration[WorkerBuildEnvVar];

        if (!string.IsNullOrWhiteSpace(fromConfig))
            return fromConfig.Trim();

        return AdminDeploymentStatusValues.Unknown;
    }

    private async Task<string> ProbeHealthStatusAsync(
        Func<HealthCheckRegistration, bool> predicate,
        CancellationToken cancellationToken)
    {
        try
        {
            HealthReport report = await _healthCheckService
                .CheckHealthAsync(predicate, cancellationToken)
                .ConfigureAwait(false);

            return report.Status.ToString();
        }
        catch (Exception)
        {
            return AdminDeploymentStatusValues.Unknown;
        }
    }

    private async Task<string> ReadMigrationVersionAsync(CancellationToken cancellationToken)
    {
        try
        {
            SchemaVersionsJournalSnapshot snapshot =
                await _schemaVersionsJournalReader.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

            if (snapshot.TableMissing)
                return AdminDeploymentStatusValues.Unknown;

            if (string.IsNullOrWhiteSpace(snapshot.LatestScriptName))
                return AdminDeploymentStatusValues.Unknown;

            return snapshot.LatestScriptName.Trim();
        }
        catch (Exception)
        {
            return AdminDeploymentStatusValues.Unknown;
        }
    }

    private IReadOnlyList<AdminDeploymentStatusLink> BuildSafeLinks(string sourceCommit)
    {
        List<AdminDeploymentStatusLink> links = [];

        if (!IsUnknown(sourceCommit)
            && !string.IsNullOrWhiteSpace(_options.GitHubCommitUrlTemplate)
            && _options.GitHubCommitUrlTemplate.Contains("{commitSha}", StringComparison.Ordinal))
        {
            links.Add(
                new AdminDeploymentStatusLink
                {
                    Kind = "source-commit",
                    Label = "Source commit",
                    Url = _options.GitHubCommitUrlTemplate.Replace(
                        "{commitSha}",
                        Uri.EscapeDataString(sourceCommit),
                        StringComparison.Ordinal),
                });
        }

        if (!string.IsNullOrWhiteSpace(_options.LatestGitHubWorkflowRunId)
            && !string.IsNullOrWhiteSpace(_options.GitHubWorkflowRunUrlTemplate)
            && _options.GitHubWorkflowRunUrlTemplate.Contains("{runId}", StringComparison.Ordinal))
        {
            links.Add(
                new AdminDeploymentStatusLink
                {
                    Kind = "github-workflow-run",
                    Label = "GitHub workflow run",
                    Url = _options.GitHubWorkflowRunUrlTemplate.Replace(
                        "{runId}",
                        Uri.EscapeDataString(_options.LatestGitHubWorkflowRunId.Trim()),
                        StringComparison.Ordinal),
                });
        }

        AddStaticLink(links, "azure-resource-overview", "Azure resource overview", _options.AzureResourceOverviewUrl);
        AddStaticLink(links, "logs", "Logs", _options.LogsUrl);
        AddStaticLink(links, "monitoring", "Monitoring", _options.MonitoringUrl);

        return links;
    }

    private static void AddStaticLink(
        List<AdminDeploymentStatusLink> links,
        string kind,
        string label,
        string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return;

        string trimmed = url.Trim();

        if (!trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return;

        links.Add(
            new AdminDeploymentStatusLink
            {
                Kind = kind,
                Label = label,
                Url = trimmed,
            });
    }

    private static string DisplayOrUnknown(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return AdminDeploymentStatusValues.Unknown;

        string trimmed = value.Trim();

        if (string.Equals(trimmed, "unknown", StringComparison.OrdinalIgnoreCase))
            return AdminDeploymentStatusValues.Unknown;

        return trimmed;
    }

    private static bool IsUnknown(string value) =>
        string.Equals(value, AdminDeploymentStatusValues.Unknown, StringComparison.OrdinalIgnoreCase);
}
