namespace ArchLucid.Core.Hosting;

/// <summary>
///     Canonical configuration keys read by <see cref="ProductionDangerousMisconfigurationLint.DescribeFailFastFindings" />.
///     Architecture tests assert <see cref="Configuration.ConfigurationKeyCatalog" /> guard metadata stays aligned.
/// </summary>
public static class ProductionProfileFailFastMonitoredConfigurationPaths
{
    public const string AuthenticationApiKeyDevelopmentBypassAll = "Authentication:ApiKey:DevelopmentBypassAll";
    public const string ArchLucidAuthMode = "ArchLucidAuth:Mode";
    public const string ArchLucidAuthJwtSigningPublicKeyPemPath = "ArchLucidAuth:JwtSigningPublicKeyPemPath";
    public const string ArchLucidAuthAuthority = "ArchLucidAuth:Authority";
    public const string AuthenticationApiKeyEnabled = "Authentication:ApiKey:Enabled";
    public const string AgentExecutionMode = "AgentExecution:Mode";
    public const string AgentExecutionCompletionClient = "AgentExecution:CompletionClient";
    public const string LlmPromptRedactionEnabled = "LlmPromptRedaction:Enabled";
    public const string ProductionValidationRequireTelemetryExport = "ProductionValidation:RequireTelemetryExport";
    public const string ObservabilityOtlpEndpoint = "Observability:Otlp:Endpoint";
    public const string ObservabilityOtlpEnabled = "Observability:Otlp:Enabled";
    public const string ApplicationInsightsConnectionStringEnv = "APPLICATIONINSIGHTS_CONNECTION_STRING";
    public const string ApplicationInsightsConnectionString = "ApplicationInsights:ConnectionString";
    public const string ObservabilityAzureMonitorApplicationInsightsConnectionString =
        "Observability:AzureMonitor:ApplicationInsightsConnectionString";
    public const string ObservabilityPrometheusEnabled = "Observability:Prometheus:Enabled";

    /// <summary>Every colon-notation (or catalog-style) key consulted by production-profile fail-fast validation.</summary>
    public static IReadOnlySet<string> KeysConsultedByDescribeFailFastFindings { get; } =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            AuthenticationApiKeyDevelopmentBypassAll,
            ArchLucidAuthMode,
            ArchLucidAuthJwtSigningPublicKeyPemPath,
            ArchLucidAuthAuthority,
            AuthenticationApiKeyEnabled,
            AgentExecutionMode,
            AgentExecutionCompletionClient,
            LlmPromptRedactionEnabled,
            ProductionValidationRequireTelemetryExport,
            ObservabilityOtlpEndpoint,
            ObservabilityOtlpEnabled,
            ApplicationInsightsConnectionStringEnv,
            ApplicationInsightsConnectionString,
            ObservabilityAzureMonitorApplicationInsightsConnectionString,
            ObservabilityPrometheusEnabled,
        };
}
