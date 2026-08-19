using System.Net.Http.Headers;

using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Application.Integrations.AzureBoards;

public sealed class AzureBoardsIntegrationService(
    IItsmTenantConnectorCredentialResolver credentialResolver,
    ITenantAzureBoardsOutboundSettingsRepository settingsRepository,
    ITenantItsmConnectorConnectionRepository connectionRepository,
    AzureBoardsOutboundIssueClient azureBoardsClient,
    IItsmOutboundHttpAuthenticator httpAuthenticator) : IAzureBoardsIntegrationService
{
    private readonly IItsmTenantConnectorCredentialResolver _credentialResolver =
        credentialResolver ?? throw new ArgumentNullException(nameof(credentialResolver));

    private readonly ITenantAzureBoardsOutboundSettingsRepository _settingsRepository =
        settingsRepository ?? throw new ArgumentNullException(nameof(settingsRepository));

    private readonly ITenantItsmConnectorConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly AzureBoardsOutboundIssueClient _azureBoardsClient =
        azureBoardsClient ?? throw new ArgumentNullException(nameof(azureBoardsClient));

    private readonly IItsmOutboundHttpAuthenticator _httpAuthenticator =
        httpAuthenticator ?? throw new ArgumentNullException(nameof(httpAuthenticator));

    public async Task<AzureBoardsStoredHealth> GetStoredHealthAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantItsmConnectorConnectionRecord? connection = await _connectionRepository
            .GetAsync(tenantId, TenantItsmConnectorProvider.AzureBoards, cancellationToken)
            .ConfigureAwait(false);

        TenantAzureBoardsOutboundSettings? settings =
            await _settingsRepository.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return AzureBoardsStoredHealthMapper.Map(
            AzureBoardsStoredHealthMapper.AreCredentialsConfigured(connection),
            settings);
    }

    public async Task<AzureBoardsConnectionTestResult> TestConnectionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        (ResolvedItsmOutboundCredentials? credentials, AuthenticationHeaderValue? authorization, string? error) =
            await TryResolveAuthorizationAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (credentials is null || authorization is null)
        {
            string summary = error ?? "Azure Boards connector credentials are not configured.";

            return new AzureBoardsConnectionTestResult(false, summary, null);
        }

        Uri projectsUri = BuildProjectsUri(credentials.InstanceBaseUrl);
        AzureBoardsProjectsHttpResult result =
            await _azureBoardsClient.ListProjectsAsync(projectsUri, authorization, cancellationToken).ConfigureAwait(false);

        string summaryText = result.Ok
            ? $"Azure Boards reachable ({result.ProjectNames.Count} project(s) discovered)."
            : result.ErrorDetail ?? "Azure Boards connection test failed.";

        if (await _settingsRepository.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false) is not null)
        {
            await _settingsRepository.UpdateConnectionTestAsync(
                tenantId,
                TimeProvider.System.GetUtcNow().UtcDateTime,
                summaryText,
                cancellationToken).ConfigureAwait(false);
        }

        return new AzureBoardsConnectionTestResult(result.Ok, summaryText, (int)result.StatusCode);
    }

    public async Task<IReadOnlyList<string>> ListProjectsAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        (ResolvedItsmOutboundCredentials? credentials, AuthenticationHeaderValue? authorization, _) =
            await TryResolveAuthorizationAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (credentials is null || authorization is null)
            return [];

        Uri projectsUri = BuildProjectsUri(credentials.InstanceBaseUrl);
        AzureBoardsProjectsHttpResult result =
            await _azureBoardsClient.ListProjectsAsync(projectsUri, authorization, cancellationToken).ConfigureAwait(false);

        return result.Ok ? result.ProjectNames : [];
    }

    public async Task<IReadOnlyList<string>> ListWorkItemTypesAsync(
        Guid tenantId,
        string projectName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(projectName))
            throw new ArgumentException("projectName is required.", nameof(projectName));

        (ResolvedItsmOutboundCredentials? credentials, AuthenticationHeaderValue? authorization, _) =
            await TryResolveAuthorizationAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (credentials is null || authorization is null)
            return [];

        Uri workItemTypesUri = BuildWorkItemTypesUri(credentials.InstanceBaseUrl, projectName.Trim());
        AzureBoardsWorkItemTypesHttpResult result =
            await _azureBoardsClient.ListWorkItemTypesAsync(workItemTypesUri, authorization, cancellationToken)
                .ConfigureAwait(false);

        return result.Ok ? result.WorkItemTypeNames : [];
    }

    private async Task<(ResolvedItsmOutboundCredentials? Credentials, AuthenticationHeaderValue? Authorization, string? Error)>
        TryResolveAuthorizationAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        ResolvedItsmOutboundCredentials? credentials = await _credentialResolver
            .TryResolveOutboundAsync(tenantId, TenantItsmConnectorProvider.AzureBoards, cancellationToken)
            .ConfigureAwait(false);

        if (credentials is null)
            return (null, null, "Azure Boards connector credentials are not configured.");

        AuthenticationHeaderValue? authorization = await _httpAuthenticator.TryCreateAuthorizationHeaderAsync(
            tenantId,
            TenantItsmConnectorProvider.AzureBoards,
            credentials,
            cancellationToken).ConfigureAwait(false);

        if (authorization is null)
            return (credentials, null, "Azure Boards credentials could not be authorized.");

        return (credentials, authorization, null);
    }

    internal static Uri BuildProjectsUri(string organizationBaseUrl) =>
        new($"{organizationBaseUrl.Trim().TrimEnd('/')}/_apis/projects?api-version=7.1");

    internal static Uri BuildWorkItemTypesUri(string organizationBaseUrl, string projectName)
    {
        string encodedProject = Uri.EscapeDataString(projectName.Trim());

        return new Uri($"{organizationBaseUrl.Trim().TrimEnd('/')}/{encodedProject}/_apis/wit/workitemtypes?api-version=7.1");
    }
}
