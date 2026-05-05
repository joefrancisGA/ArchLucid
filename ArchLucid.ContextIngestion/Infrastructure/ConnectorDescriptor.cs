using ArchLucid.ContextIngestion.Interfaces;

namespace ArchLucid.ContextIngestion.Infrastructure;

public sealed class ConnectorDescriptor : IConnectorDescriptor
{
    private readonly IContextConnector _connector;

    public ConnectorDescriptor(int pipelineOrder, IContextConnector connector)
    {
        ArgumentNullException.ThrowIfNull(connector);
        PipelineOrder = pipelineOrder;
        _connector = connector;
    }

    public int PipelineOrder
    {
        get;
    }

    public IContextConnector Connector => _connector;
}
