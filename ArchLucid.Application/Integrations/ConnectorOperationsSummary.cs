namespace ArchLucid.Application.Integrations;

/// <summary>Aggregated connector and integration-bus posture for one workspace scope.</summary>
public sealed class ConnectorOperationsSummary
{
    public IReadOnlyList<ConnectorSurfaceSummary> Surfaces
    {
        get;
        init;
    } = [];

    public IntegrationEventBusSummary IntegrationEventBus
    {
        get;
        init;
    } = new();
}

/// <summary>One downstream or channel surface (Teams, Jira, …).</summary>
public sealed class ConnectorSurfaceSummary
{
    public string ConnectorKey
    {
        get;
        init;
    } = "";

    public string DisplayName
    {
        get;
        init;
    } = "";

    public bool IsConfigured
    {
        get;
        init;
    }

    /// <summary>Deterministic, credential-free readiness (see smoke docs).</summary>
    public string SmokeReadiness
    {
        get;
        init;
    } = "";

    public string Summary
    {
        get;
        init;
    } = "";

    public string? ConfigurationHref
    {
        get;
        init;
    }
}

/// <summary>Azure Service Bus / outbox posture (names only; never connection strings).</summary>
public sealed class IntegrationEventBusSummary
{
    public bool PublisherConfigured
    {
        get;
        init;
    }

    public bool TransactionalOutboxEnabled
    {
        get;
        init;
    }

    public bool ConsumerConfigured
    {
        get;
        init;
    }

    public string? QueueOrTopicName
    {
        get;
        init;
    }

    public string? FullyQualifiedNamespace
    {
        get;
        init;
    }

    public bool UsesLegacyConnectionString
    {
        get;
        init;
    }

    public string SmokeReadiness
    {
        get;
        init;
    } = "";
}
