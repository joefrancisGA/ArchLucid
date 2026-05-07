namespace ArchLucid.Api.Models.Tenancy;

public sealed class IntegrationEventBusStatusResponse
{
    public bool PublisherConfigured
    {
        get;
        set;
    }

    public bool TransactionalOutboxEnabled
    {
        get;
        set;
    }

    public bool ConsumerConfigured
    {
        get;
        set;
    }

    public string? QueueOrTopicName
    {
        get;
        set;
    }

    public string? FullyQualifiedNamespace
    {
        get;
        set;
    }

    public bool UsesLegacyConnectionString
    {
        get;
        set;
    }

    public string SmokeReadiness
    {
        get;
        set;
    } = "";
}
