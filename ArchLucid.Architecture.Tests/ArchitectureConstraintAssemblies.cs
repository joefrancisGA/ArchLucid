using System.Reflection;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Backfill.Cli;
using ArchLucid.Cli;
using ArchLucid.ContextIngestion;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Integration;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Integrations.AzureDevOps;
using ArchLucid.Integrations.AzureExtractor;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Mcp.Tools;
using ArchLucid.Notifications;
using ArchLucid.Notifications.Email.RazorLight;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Queries;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Assemblies under architecture test, resolved from an anchor type so the constraint manifests stay
///     declarative (assembly name strings) instead of repeating <c>typeof(...).Assembly</c> per rule.
/// </summary>
internal static class ArchitectureConstraintAssemblies
{
    private static readonly IReadOnlyDictionary<string, Assembly> AnchoredAssemblies =
        new Dictionary<string, Assembly>(StringComparer.Ordinal)
        {
            ["ArchLucid.AgentRuntime"] = typeof(RealAgentExecutor).Assembly,
            ["ArchLucid.Api"] = typeof(ArchLucid.Api.Program).Assembly,
            ["ArchLucid.Application"] = typeof(ArchitectureRunCreateOrchestrator).Assembly,
            ["ArchLucid.ArtifactSynthesis"] = typeof(ArtifactSynthesisService).Assembly,
            ["ArchLucid.Backfill.Cli"] = typeof(BackfillCliAssemblyAnchor).Assembly,
            ["ArchLucid.Capabilities.Cost"] = typeof(ArchLucid.Capabilities.Cost.CostAgentHandler).Assembly,
            ["ArchLucid.Cli"] = typeof(ManifestValidator).Assembly,
            ["ArchLucid.ContextIngestion"] = typeof(SupportedContextDocumentContentTypes).Assembly,
            ["ArchLucid.Contracts"] = typeof(ArchitectureRun).Assembly,
            ["ArchLucid.Core"] = typeof(IntegrationEventTypes).Assembly,
            ["ArchLucid.Decisioning"] = typeof(AlertEvaluator).Assembly,
            ["ArchLucid.Integrations.AzureDevOps"] = typeof(AzureDevOpsCommitStatusPublisher).Assembly,
            ["ArchLucid.Integrations.AzureExtractor"] = typeof(HostedAzureExtractorClient).Assembly,
            ["ArchLucid.Jobs.Cli"] = typeof(ArchLucid.Jobs.Cli.Program).Assembly,
            ["ArchLucid.KnowledgeGraph"] = typeof(GraphNodeTypes).Assembly,
            ["ArchLucid.Mcp"] = typeof(RetrievalTools).Assembly,
            ["ArchLucid.Notifications"] = typeof(IWebhookPoster).Assembly,
            ["ArchLucid.Notifications.Email.RazorLight"] = typeof(RazorLightEmailTemplateRenderer).Assembly,
            ["ArchLucid.Persistence"] = typeof(SqlRunRepository).Assembly,
            ["ArchLucid.Provenance"] = typeof(ProvenanceBuilder).Assembly,
            ["ArchLucid.Retrieval"] = typeof(RetrievalQueryService).Assembly,
            ["ArchLucid.Worker"] = typeof(ArchLucid.Worker.Program).Assembly,
        };

    /// <summary>Registered assembly names (rule manifests may only reference these).</summary>
    internal static IEnumerable<string> RegisteredNames => AnchoredAssemblies.Keys;

    /// <summary>Assembly registered under <paramref name="assemblyName"/>.</summary>
    internal static Assembly Resolve(string assemblyName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(assemblyName);

        if (!AnchoredAssemblies.TryGetValue(assemblyName, out Assembly? assembly))
        {
            throw new KeyNotFoundException(
                $"No anchor type is registered for assembly '{assemblyName}' in {nameof(ArchitectureConstraintAssemblies)}.");
        }

        return assembly;
    }

    /// <summary>Simple names of the assemblies referenced by <paramref name="assemblyName"/> at compile time.</summary>
    internal static IReadOnlyList<string> ReferencedAssemblyNames(string assemblyName)
        => Resolve(assemblyName)
            .GetReferencedAssemblies()
            .Select(static reference => reference.Name)
            .Where(static name => name is not null)
            .Select(static name => name!)
            .ToArray();

    /// <summary>Simple type names declared by <paramref name="assemblyName"/> within <paramref name="scope"/>.</summary>
    internal static IReadOnlyList<string> TypeNames(string assemblyName, ArchitectureTypeVisibilityScope scope)
    {
        Assembly assembly = Resolve(assemblyName);

        Type[] types = scope switch
        {
            ArchitectureTypeVisibilityScope.Exported => assembly.GetExportedTypes(),
            ArchitectureTypeVisibilityScope.All => assembly.GetTypes(),
            _ => throw new ArgumentOutOfRangeException(nameof(scope), scope, "Unhandled type visibility scope."),
        };

        return types.Select(static type => type.Name).ToArray();
    }
}
