using System.Reflection;

using ArchLucid.AgentRuntime;
using ArchLucid.Core.Retrieval;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     RAG-V1-006: agent handlers that query retrieval must also persist grounding traces for sponsor-safe forensics.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentRetrievalGroundingTraceArchitectureTests
{
    [Fact]
    public void Agent_handlers_that_inject_IRetrievalQueryService_also_inject_IRetrievalGroundingTraceWriter()
    {
        Assembly agentRuntime = typeof(ComplianceAgentHandler).Assembly;

        List<string> violations = [];

        foreach (Type handlerType in agentRuntime.GetTypes()
                     .Where(static type => type.IsClass && type.Name.EndsWith("AgentHandler", StringComparison.Ordinal)))
        {
            ConstructorInfo? primaryConstructor = handlerType
                .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
                .OrderByDescending(static constructor => constructor.GetParameters().Length)
                .FirstOrDefault();

            if (primaryConstructor is null)
                continue;

            bool usesRetrievalQuery = primaryConstructor.GetParameters()
                .Any(static parameter => parameter.ParameterType == typeof(IRetrievalQueryService));

            if (!usesRetrievalQuery)
                continue;

            bool writesGroundingTrace = primaryConstructor.GetParameters()
                .Any(static parameter => parameter.ParameterType == typeof(IRetrievalGroundingTraceWriter));

            if (!writesGroundingTrace)
                violations.Add(handlerType.FullName ?? handlerType.Name);
        }

        violations.Should().BeEmpty(
            "Agent handlers that invoke IRetrievalQueryService must inject IRetrievalGroundingTraceWriter: "
            + string.Join(", ", violations));
    }
}
