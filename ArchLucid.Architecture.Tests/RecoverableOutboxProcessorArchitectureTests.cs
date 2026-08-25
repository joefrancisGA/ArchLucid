using System.Reflection;

using ArchLucid.Host.Core.Coordination;
using ArchLucid.Host.Core.Coordination.Cosmos;
using ArchLucid.Host.Core.Coordination.Export;
using ArchLucid.Host.Core.Coordination.Projection;
using ArchLucid.Host.Core.Coordination.Retrieval;
using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-920: recoverable outbox processors and hosted services must extend the shared bases.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RecoverableOutboxProcessorArchitectureTests
{
    private static readonly (Type ProcessorType, Type ExpectedBase)[] MigratedProcessors =
    [
        (typeof(CosmosGraphSnapshotOutboxProcessor), typeof(RecoverableOutboxProcessorBase<,,>)),
        (typeof(RunExportBlobPushOutboxProcessor), typeof(RecoverableOutboxProcessorBase<,,>)),
        (typeof(PostCommitProjectionOutboxProcessor), typeof(RecoverableOutboxProcessorBase<,,>)),
        (typeof(AuthorityPipelineWorkProcessor), typeof(RecoverableOutboxProcessorBase<,,>)),
        (typeof(RetrievalIndexingOutboxProcessor), typeof(RecoverableOutboxProcessorBase<,,>)),
    ];

    private static readonly (Type HostedServiceType, Type ExpectedBase)[] MigratedHostedServices =
    [
        (typeof(CosmosGraphSnapshotOutboxHostedService), typeof(LeaderElectedOutboxHostedServiceBase)),
        (typeof(RunExportBlobPushOutboxHostedService), typeof(LeaderElectedOutboxHostedServiceBase)),
        (typeof(PostCommitProjectionOutboxHostedService), typeof(LeaderElectedOutboxHostedServiceBase)),
        (typeof(AuthorityPipelineWorkHostedService), typeof(LeaderElectedOutboxHostedServiceBase)),
    ];

    [Theory]
    [MemberData(nameof(ProcessorBaseCases))]
    public void Recoverable_outbox_processors_extend_shared_base(Type processorType, Type expectedOpenBase)
    {
        Type? baseType = processorType.BaseType;

        while (baseType is not null)
        {
            if (baseType.IsGenericType && baseType.GetGenericTypeDefinition() == expectedOpenBase)
                return;

            baseType = baseType.BaseType;
        }

        processorType.BaseType.Should().NotBeNull(
            because: "{0} must inherit RecoverableOutboxProcessorBase<,,> (TB-920).",
            processorType.FullName);
    }

    [Theory]
    [MemberData(nameof(HostedServiceBaseCases))]
    public void Recoverable_outbox_hosted_services_extend_shared_base(Type hostedServiceType, Type expectedBase)
    {
        hostedServiceType.BaseType.Should().Be(
            expectedBase,
            because: "{0} must inherit LeaderElectedOutboxHostedServiceBase (TB-920).",
            hostedServiceType.FullName);
    }

    [Fact]
    public void New_outbox_processors_in_host_core_must_extend_recoverable_base()
    {
        Assembly hostCore = typeof(RecoverableOutboxProcessorBase<,,>).Assembly;

        IEnumerable<Type> offenders = hostCore.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract)
            .Where(t => t.Name.EndsWith("OutboxProcessor", StringComparison.Ordinal))
            .Where(t => !ExtendsRecoverableOutboxProcessorBase(t))
            .Where(t => t != typeof(RecoverableOutboxProcessorBase<,,>))
            .Where(t => !IsExplicitlyExemptOutboxProcessor(t));

        offenders.Should().BeEmpty(
            because: "new *OutboxProcessor types must extend RecoverableOutboxProcessorBase unless listed as IntegrationEvent/Retrieval exempt (TB-920).");
    }

    public static IEnumerable<object[]> ProcessorBaseCases()
    {
        foreach ((Type processorType, Type expectedBase) in MigratedProcessors)
            yield return [processorType, expectedBase];
    }

    public static IEnumerable<object[]> HostedServiceBaseCases()
    {
        foreach ((Type hostedServiceType, Type expectedBase) in MigratedHostedServices)
            yield return [hostedServiceType, expectedBase];
    }

    private static bool ExtendsRecoverableOutboxProcessorBase(Type type)
    {
        for (Type? current = type.BaseType; current is not null; current = current.BaseType)
        {
            if (current.IsGenericType &&
                current.GetGenericTypeDefinition() == typeof(RecoverableOutboxProcessorBase<,,>))
                return true;
        }

        return false;
    }

    private static bool IsExplicitlyExemptOutboxProcessor(Type type) =>
        type.FullName is "ArchLucid.Host.Core.Coordination.Integration.IntegrationEventOutboxProcessor";
}
