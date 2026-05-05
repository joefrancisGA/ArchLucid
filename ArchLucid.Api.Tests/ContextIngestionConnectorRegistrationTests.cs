using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Parsing;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Locks DI registration for the context-ingestion connector pipeline to the order defined in
///     <see
///         cref="ArchLucid.ContextIngestion.Infrastructure.ContextConnectorPipeline.CreateOrderedConnectorDescriptors" />
///     (canonical slots) and
///     <see
///         cref="ArchLucid.ContextIngestion.Infrastructure.ContextConnectorPipeline.CreateOrderedContextConnectorPipeline" />
///     (connector projection), plus
///     <see
///         cref="ArchLucid.ContextIngestion.Infrastructure.ContextDocumentParserPipeline.CreateOrderedContextDocumentParsers" />
///     .
/// </summary>
[Trait("Category", "Integration")]
public sealed class ContextIngestionConnectorRegistrationTests(ArchLucidApiFactory factory)
    : IClassFixture<ArchLucidApiFactory>
{
    [SkippableFact]
    public void Services_Resolve_IEnumerable_IContextConnector_InPipelineOrder()
    {
        using IServiceScope scope = factory.Services.CreateScope();
        IEnumerable<IContextConnector> connectors = scope.ServiceProvider
            .GetRequiredService<IEnumerable<IContextConnector>>();

        Type[] types = connectors.Select(c => c.GetType()).ToArray();

        types.Should().Equal(
            typeof(StaticRequestContextConnector),
            typeof(InlineRequirementsConnector),
            typeof(DocumentConnector),
            typeof(PolicyReferenceConnector),
            typeof(TopologyHintsConnector),
            typeof(SecurityBaselineHintsConnector),
            typeof(InfrastructureDeclarationConnector));
    }

    /// <summary>
    ///     Catches accidental duplicate registrations (e.g. <c>AddSingleton&lt;IContextConnector, X&gt;</c>
    ///     alongside the pipeline factory) that would silently alter enumeration count or order.
    /// </summary>
    [SkippableFact]
    public void Services_Resolve_IEnumerable_IContextConnector_CountMatchesPipelineFactory()
    {
        using IServiceScope scope = factory.Services.CreateScope();
        IEnumerable<IContextConnector> connectors = scope.ServiceProvider
            .GetRequiredService<IEnumerable<IContextConnector>>();

        int expected = ContextConnectorPipeline
            .CreateOrderedContextConnectorPipeline(scope.ServiceProvider)
            .Count;

        connectors.Count().Should().Be(expected,
            "IEnumerable<IContextConnector> must come only from CreateOrderedContextConnectorPipeline; " +
            "a direct AddSingleton<IContextConnector, ...> would break this invariant");
    }

    [SkippableFact]
    public void Services_Resolve_IReadOnlyList_IConnectorDescriptor_InPipelineOrder()
    {
        using IServiceScope scope = factory.Services.CreateScope();
        IReadOnlyList<IConnectorDescriptor> descriptors = scope.ServiceProvider
            .GetRequiredService<IReadOnlyList<IConnectorDescriptor>>();

        descriptors.Select(d => d.Connector.GetType()).Should().Equal(
            typeof(StaticRequestContextConnector),
            typeof(InlineRequirementsConnector),
            typeof(DocumentConnector),
            typeof(PolicyReferenceConnector),
            typeof(TopologyHintsConnector),
            typeof(SecurityBaselineHintsConnector),
            typeof(InfrastructureDeclarationConnector));

        descriptors.Select(d => d.PipelineOrder).Should().Equal(1, 2, 3, 4, 5, 6, 7);
    }

    [SkippableFact]
    public void Services_Resolve_IReadOnlyList_IContextDocumentParser_InPipelineOrder()
    {
        using IServiceScope scope = factory.Services.CreateScope();
        IReadOnlyList<IContextDocumentParser> parsers = scope.ServiceProvider
            .GetRequiredService<IReadOnlyList<IContextDocumentParser>>();

        parsers.Select(p => p.GetType()).Should().Equal(typeof(PlainTextContextDocumentParser));
    }
}
