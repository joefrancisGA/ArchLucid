using System.Diagnostics;
using System.Reflection;
using System.Text;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Capabilities.Cost;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-952: agent handler assemblies must not expose raw HTTP, shell, or non-allowlisted integration egress.</summary>
[Trait("Suite", "Architecture")]
[Trait("Category", "Unit")]
public sealed class AgentSideEffectSurfaceArchitectureTests
{
    private static readonly Assembly[] HandlerAssemblies =
    [
        typeof(ComplianceAgentHandler).Assembly,
        typeof(ArchLucid.Capabilities.Cost.CostAgentHandler).Assembly,
    ];

    private static readonly HashSet<Type> ForbiddenHandlerDependencyTypes =
    [
        typeof(JiraOutboundIssueClient),
        typeof(ServiceNowOutboundIncidentClient),
        typeof(AzureBoardsOutboundIssueClient),
        typeof(Process),
        typeof(ProcessStartInfo),
    ];

    private static readonly string[] HandlerAssemblyRelativeRoots =
    [
        "ArchLucid.AgentRuntime",
        "ArchLucid.Capabilities.Cost",
    ];

    [Fact]
    public void Agent_handler_assemblies_do_not_construct_HttpClient_directly()
    {
        string root = FindRepoRoot();
        List<string> violations = [];

        foreach (string rel in HandlerAssemblyRelativeRoots)
        {
            string dir = Path.Combine(root, rel);

            if (!Directory.Exists(dir))
                continue;

            foreach (string path in Directory.EnumerateFiles(dir, "*.cs", SearchOption.AllDirectories))
            {
                if (IsBuildOutput(path))
                    continue;

                string text = File.ReadAllText(path, Encoding.UTF8);

                if (text.Contains("new HttpClient(", StringComparison.Ordinal))
                    violations.Add(Path.GetRelativePath(root, path));
            }
        }

        violations.Should().BeEmpty(
            "TB-952 / INV-010: agent handler assemblies register IHttpClientFactory instead of new HttpClient(): "
            + string.Join("; ", violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    [Fact]
    public void Agent_handlers_do_not_inject_forbidden_outbound_integration_or_shell_types()
    {
        List<string> violations = [];

        foreach (Assembly assembly in HandlerAssemblies)
        {
            foreach (Type handlerType in assembly.GetTypes()
                         .Where(static type => type.IsClass && type.Name.EndsWith("AgentHandler", StringComparison.Ordinal)))
            {
                violations.AddRange(FindForbiddenTypeReferences(handlerType));
            }
        }

        violations.Should().BeEmpty(
            "TB-952: agent handlers must not reference outbound vendor HTTP or shell types: "
            + string.Join("; ", violations));
    }

    [Fact]
    public void Agent_handler_inventory_lists_production_handler_types()
    {
        HashSet<string> handlerNames = HandlerAssemblies
            .SelectMany(static assembly => assembly.GetTypes())
            .Where(static type => type.IsClass && type.Name.EndsWith("AgentHandler", StringComparison.Ordinal))
            .Select(static type => type.Name)
            .ToHashSet(StringComparer.Ordinal);

        handlerNames.Should().Contain("TopologyAgentHandler");
        handlerNames.Should().Contain("CostAgentHandler");
        handlerNames.Should().Contain("ComplianceAgentHandler");
        handlerNames.Should().Contain("CriticAgentHandler");
    }

    private static IEnumerable<string> FindForbiddenTypeReferences(Type handlerType)
    {
        foreach (ConstructorInfo constructor in handlerType.GetConstructors(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
        {
            foreach (ParameterInfo parameter in constructor.GetParameters())
            {
                if (ReferencesForbiddenType(parameter.ParameterType))
                    yield return $"{handlerType.FullName}..ctor({parameter.Name})";
            }
        }

        foreach (FieldInfo field in handlerType.GetFields(BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic))
        {
            if (ReferencesForbiddenType(field.FieldType))
                yield return $"{handlerType.FullName}.{field.Name} field";
        }
    }

    private static bool ReferencesForbiddenType(Type candidate)
    {
        if (ForbiddenHandlerDependencyTypes.Contains(candidate))
            return true;

        if (!candidate.IsGenericType)
            return false;

        return candidate.GetGenericArguments().Any(ReferencesForbiddenType);
    }

    private static bool IsBuildOutput(string path) =>
        path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase)
        || path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase);

    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string sln = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }
}
