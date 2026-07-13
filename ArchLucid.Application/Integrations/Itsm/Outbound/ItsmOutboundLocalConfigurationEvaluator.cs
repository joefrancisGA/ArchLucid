using System.Net;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Host + tenant ITSM outbound readiness without calling vendors (mirrors connector summary semantics).</summary>
public readonly record struct ItsmOutboundLocalReadiness(bool IsReady, string Summary);

/// <summary>Shared rules for whether Jira / ServiceNow outbound is sufficiently configured to attempt vendor calls.</summary>
public static class ItsmOutboundLocalConfigurationEvaluator
{
    public static ItsmOutboundLocalReadiness EvaluateJira(IntegrationsItsmOutboundOptions options, TenantItsmOutboundSettings? tenantItsm)
    {
        ArgumentNullException.ThrowIfNull(options);

        string url = options.Jira.CloudBaseUrl.Trim();
        bool urlOk = TryValidateItsmOutboundVendorBaseUrl(url);

        string projectFallback = options.Jira.DefaultProjectKey.Trim();
        string? projectOverride = tenantItsm?.JiraProjectKeyOverride?.Trim();
        bool projectOk = !string.IsNullOrWhiteSpace(projectOverride) || !string.IsNullOrWhiteSpace(projectFallback);

        bool tokenOk = !string.IsNullOrWhiteSpace(options.Jira.ApiToken.Trim());
        bool emailOk = !string.IsNullOrWhiteSpace(options.Jira.ServiceAccountEmail.Trim());

        if (!urlOk)
            return new ItsmOutboundLocalReadiness(false,
                "Set Integrations:ItsmOutbound:Jira:CloudBaseUrl to a valid https:// Atlassian URL.");

        if (!emailOk || !tokenOk)
            return new ItsmOutboundLocalReadiness(false,
                "Jira requires a service account email and API token in app settings or Key Vault materialization.");

        if (!projectOk)
            return new ItsmOutboundLocalReadiness(false,
                "Provide DefaultProjectKey or a per-tenant Jira project key override.");

        return new ItsmOutboundLocalReadiness(true,
            "Jira Cloud base URL, project key, and credentials fields are populated (live validation still required).");
    }

    public static ItsmOutboundLocalReadiness EvaluateJiraFromResolvedCredentials(
        ResolvedItsmOutboundCredentials? credentials,
        IntegrationsItsmOutboundOptions options,
        TenantItsmOutboundSettings? tenantItsm)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (credentials is null)
            return EvaluateJira(options, tenantItsm);

        string projectFallback = options.Jira.DefaultProjectKey.Trim();
        string? projectOverride = tenantItsm?.JiraProjectKeyOverride?.Trim();
        bool projectOk = !string.IsNullOrWhiteSpace(projectOverride) || !string.IsNullOrWhiteSpace(projectFallback);

        if (!projectOk)
        {
            return new ItsmOutboundLocalReadiness(false,
                "Provide DefaultProjectKey or a per-tenant Jira project key override.");
        }

        return new ItsmOutboundLocalReadiness(
            true,
            credentials.FromTenantConnection
                ? "Tenant Jira connector references are configured (live validation still required)."
                : "Jira Cloud base URL, project key, and credentials fields are populated (live validation still required).");
    }

    public static ItsmOutboundLocalReadiness EvaluateServiceNowFromResolvedCredentials(
        ResolvedItsmOutboundCredentials? credentials,
        IntegrationsItsmOutboundOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (credentials is null)
            return EvaluateServiceNow(options);

        return new ItsmOutboundLocalReadiness(
            true,
            credentials.FromTenantConnection
                ? "Tenant ServiceNow connector references are configured (live validation still required)."
                : "ServiceNow instance URL and credential fields are populated (live validation still required).");
    }

    public static ItsmOutboundLocalReadiness EvaluateAzureBoards(
        IntegrationsItsmOutboundOptions options,
        TenantItsmConnectorConnectionRecord? tenantConnection,
        TenantAzureBoardsOutboundSettings? tenantSettings)
    {
        ArgumentNullException.ThrowIfNull(options);

        bool urlOk = tenantConnection is not null
            && TryValidateItsmOutboundVendorBaseUrl(tenantConnection.InstanceBaseUrl)
            || TryValidateItsmOutboundVendorBaseUrl(options.AzureBoards.OrganizationBaseUrl.Trim());

        bool credentialOk = tenantConnection is not null
            && !string.IsNullOrWhiteSpace(tenantConnection.CredentialKeyVaultSecretName)
            || !string.IsNullOrWhiteSpace(options.AzureBoards.PersonalAccessToken.Trim());

        bool projectOk = !string.IsNullOrWhiteSpace(tenantSettings?.ProjectName?.Trim());
        bool workItemTypeOk = !string.IsNullOrWhiteSpace(tenantSettings?.DefaultWorkItemType?.Trim());

        if (!urlOk)
        {
            return new ItsmOutboundLocalReadiness(
                false,
                "Set an Azure DevOps organization URL (https://dev.azure.com/your-organization).");
        }

        if (!credentialOk)
        {
            return new ItsmOutboundLocalReadiness(
                false,
                "Azure Boards requires a personal access token reference in secure storage.");
        }

        if (!projectOk || !workItemTypeOk)
        {
            return new ItsmOutboundLocalReadiness(
                false,
                "Select a default Azure Boards project and work item type for this workspace.");
        }

        return new ItsmOutboundLocalReadiness(
            true,
            "Azure DevOps organization, credentials, project, and work item type are configured (live validation still required).");
    }

    public static ItsmOutboundLocalReadiness EvaluateServiceNow(IntegrationsItsmOutboundOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string url = options.ServiceNow.InstanceBaseUrl.Trim();
        bool urlOk = TryValidateItsmOutboundVendorBaseUrl(url);
        bool userOk = !string.IsNullOrWhiteSpace(options.ServiceNow.Username.Trim());
        bool passOk = !string.IsNullOrWhiteSpace(options.ServiceNow.Password.Trim());

        if (!urlOk)
            return new ItsmOutboundLocalReadiness(false,
                "Set Integrations:ItsmOutbound:ServiceNow:InstanceBaseUrl to a valid https:// instance URL.");

        if (!userOk || !passOk)
            return new ItsmOutboundLocalReadiness(false,
                "ServiceNow requires username and password fields (store secrets in Key Vault in production).");

        return new ItsmOutboundLocalReadiness(true,
            "ServiceNow instance URL and credential fields are populated (live Table API validation still required).");
    }

    public static bool TryValidateHttpsUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        return Uri.TryCreate(url, UriKind.Absolute, out Uri? uri) &&
               string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Production URLs must be <c>https://</c>. <c>http://</c> is permitted only for loopback hosts so local WireMock /
    ///     test doubles match real probe paths without TLS setup.
    /// </summary>
    public static bool TryValidateItsmOutboundVendorBaseUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri))
            return false;

        if (string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase))
            return IsLoopbackHttpHost(uri);

        return false;
    }

    private static bool IsLoopbackHttpHost(Uri uri)
    {
        if (string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase))
            return true;

        if (!IPAddress.TryParse(uri.Host, out IPAddress? ip))
            return false;

        return IPAddress.IsLoopback(ip);
    }
}
