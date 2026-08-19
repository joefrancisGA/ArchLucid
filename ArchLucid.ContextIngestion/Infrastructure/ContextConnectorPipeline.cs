using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.Interfaces;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Canonical definition of the context-ingestion <see cref="IContextConnector" /> pipeline order.
/// </summary>
/// <remarks>
///     <para>
///         <b>Why order matters:</b> <see cref="Services.DefaultConnectorPipelineOrchestrator" /> runs fetch+normalize in
///         parallel, then applies delta and <see cref="Models.ContextSnapshot.DeltaSummary" /> segments in
///         <see cref="IConnectorDescriptor.PipelineOrder" /> (see <see cref="Summaries.IContextDeltaSummaryBuilder" />).
///         Operators read that string as a stable narrative—reordering connectors changes segment order and wording
///         expectations without changing underlying object merge semantics (enrichment and deduplication run after all connectors).
///     </para>
///     <para>
///         <b>Single source of truth:</b> The host registers <see cref="IReadOnlyList{T}" /> of
///         <see cref="IConnectorDescriptor" /> only via <see cref="CreateOrderedConnectorDescriptors" />.
///         <see cref="CreateOrderedContextConnectorPipeline" /> derives <c>IEnumerable&lt;IContextConnector&gt;</c> from that list for
///         callers that only need connectors without orchestration metadata.
///     </para>
///     <para>Keep <c>docs/CONTEXT_INGESTION.md</c> (numbered pipeline list) aligned with the sequence below.</para>
/// </remarks>
public static class ContextConnectorPipeline
{
    /// <summary>
    ///     Builds ordered <see cref="IConnectorDescriptor" /> slots for DI. Call only from composition root registration.
    /// </summary>
    public static IReadOnlyList<IConnectorDescriptor> CreateOrderedConnectorDescriptors(IServiceProvider services)
    {
        ArgumentNullException.ThrowIfNull(services);

        return
        [
            // 1 — Primary description → Requirement ("Primary Request").
            new ConnectorDescriptor(1, services.GetRequiredService<StaticRequestContextConnector>()),
            // 2 — Inline requirement strings → Requirements.
            new ConnectorDescriptor(2, services.GetRequiredService<InlineRequirementsConnector>()),
            // 3 — Pasted documents → parsed canonical objects (see IContextDocumentParser).
            new ConnectorDescriptor(3, services.GetRequiredService<DocumentConnector>()),
            // 4 — Policy reference strings → PolicyControl.
            new ConnectorDescriptor(4, services.GetRequiredService<PolicyReferenceConnector>()),
            // 5 — Topology hints → TopologyResource.
            new ConnectorDescriptor(5, services.GetRequiredService<TopologyHintsConnector>()),
            // 6 — Security baseline hints → SecurityBaseline.
            new ConnectorDescriptor(6, services.GetRequiredService<SecurityBaselineHintsConnector>()),
            // 7 — Structured IaC snippets (json / simple-terraform).
            new ConnectorDescriptor(7, services.GetRequiredService<InfrastructureDeclarationConnector>())
        ];
    }

    /// <summary>
    ///     Builds the ordered connector list for DI (projection of <see cref="CreateOrderedConnectorDescriptors" />).
    /// </summary>
    /// <param name="services">Service provider with all concrete connector types registered.</param>
    /// <returns>Connectors in pipeline order.</returns>
    public static IReadOnlyList<IContextConnector> CreateOrderedContextConnectorPipeline(IServiceProvider services)
    {
        return CreateOrderedConnectorDescriptors(services).Select(static d => d.Connector).ToArray();
    }
}
