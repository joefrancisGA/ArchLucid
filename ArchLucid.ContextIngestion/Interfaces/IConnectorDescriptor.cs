namespace ArchLucid.ContextIngestion.Interfaces;

/// <summary>
///     Metadata binding one <see cref="IContextConnector" /> to a stable pipeline slot (Phase 2 orchestration).
/// </summary>
public interface IConnectorDescriptor
{
    /// <summary>1-based ordering; lower runs earlier for delta segments and warning concatenation.</summary>
    int PipelineOrder
    {
        get;
    }

    IContextConnector Connector
    {
        get;
    }
}
