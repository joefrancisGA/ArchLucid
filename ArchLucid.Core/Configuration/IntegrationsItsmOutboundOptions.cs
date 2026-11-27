namespace ArchLucid.Core.Configuration;

/// <summary>First-party outbound ITSM issue/incident creation (see <c>Integrations:ItsmOutbound</c>).</summary>
public sealed class IntegrationsItsmOutboundOptions
{
    public const string SectionName = "Integrations:ItsmOutbound";

    /// <summary>
    ///     When <see langword="true" /> (hosted multi-tenant SaaS), deployment-wide Jira/ServiceNow credentials are ignored;
    ///     each tenant must register rows via <c>/v1/integrations/itsm/connections</c>.
    /// </summary>
    public bool RequireTenantScopedCredentials
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see langword="true" /> (default), outbound create is enqueued on the background job queue
    ///     and returns <c>202 Accepted</c> with a job id. When <see langword="false" />, create runs synchronously in the HTTP request (local smoke).
    /// </summary>
    public bool DurableAsyncCreateEnabled
    {
        get;
        set;
    } = true;

    /// <summary>Legacy setting retained for configuration compatibility. Outbound ticket create jobs do not retry.</summary>
    public int AsyncCreateMaxRetries
    {
        get;
        set;
    } = 3;

    public JiraItsmOutboundOptions Jira { get; set; } = new();

    public ServiceNowItsmOutboundOptions ServiceNow { get; set; } = new();

    public AzureBoardsItsmOutboundOptions AzureBoards { get; set; } = new();
}
