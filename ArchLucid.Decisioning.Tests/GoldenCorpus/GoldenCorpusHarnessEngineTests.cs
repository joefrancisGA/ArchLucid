using System.Reflection;

using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Guards the merge-blocking harness engine registration contract (WK-06).</summary>
[Trait("Suite", "Core")]
public sealed class GoldenCorpusHarnessEngineTests
{
    [Fact]
    public void CreateEngines_registers_declaration_engines()
    {
        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        File.Exists(compliance).Should().BeTrue();

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        GoldenCorpusHarness harness = new(compliance, clock);

        MethodInfo? createEngines = typeof(GoldenCorpusHarness).GetMethod(
            "CreateEngines",
            BindingFlags.Instance | BindingFlags.NonPublic);

        createEngines.Should().NotBeNull();

        Mock<IGraphSnapshotRepository> graphSnapshotRepository = new();
        object? enginesObject = createEngines!.Invoke(harness, [graphSnapshotRepository.Object]);
        enginesObject.Should().BeAssignableTo<IFindingEngine[]>();

        IFindingEngine[] engines = (IFindingEngine[])enginesObject!;
        IReadOnlyList<Type> engineTypes = engines.Select(static engine => engine.GetType()).ToList();

        engineTypes.Should().Contain(typeof(DeclarationSecurityBaselineFindingEngine));
        engineTypes.Should().Contain(typeof(DeclarationPremiseConflictFindingEngine));
        engineTypes.Should().Contain(typeof(TrustBoundaryFindingEngine));
        engineTypes.Should().Contain(typeof(PrivilegedAccessFindingEngine));
        engineTypes.Should().Contain(typeof(ExternalExposureFindingEngine));
        engineTypes.Should().Contain(typeof(DanglingDeclarationReferenceFindingEngine));
        engineTypes.Should().Contain(typeof(RequirementSkuTierFindingEngine));
        engineTypes.Should().Contain(typeof(DataFlowTrustBoundaryFindingEngine));
        engineTypes.Should().Contain(typeof(SecurityBaselineExpectationFindingEngine));
        engineTypes.Should().Contain(typeof(RequiredCapabilityCoverageFindingEngine));
        engineTypes.Should().Contain(typeof(TopologySecurityDriftFindingEngine));
        engineTypes.Count.Should().Be(26, "harness graph engine registration is a merge-blocking contract (WK-06 + DX-24/25/36/49 golden fixtures + topology-anti-pattern + topology-security-drift)");
    }
}
