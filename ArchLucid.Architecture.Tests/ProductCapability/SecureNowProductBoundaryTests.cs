using ArchLucid.Application.Runs.Orchestration;

using FluentAssertions;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>
/// Protects the SecureNow implementation seam while both products share an Application assembly.
/// Cross-product contracts belong in Core or Contracts, rather than in the operational engine.
/// </summary>
[Trait("Suite", "Architecture")]
public sealed class SecureNowProductBoundaryTests
{
    private static readonly string[] SecureNowImplementationNamespaces =
    [
        "ArchLucid.Application.InfraEvidence.SecureNowArchitect",
        "ArchLucid.Application.InfraEvidence.OperationalSecurityFindings",
        "ArchLucid.Application.InfraEvidence.OperationalSecurityExceptions",
        "ArchLucid.Application.InfraEvidence.RemediationInstances",
        "ArchLucid.Application.InfraEvidence.RemediationPrioritization",
        "ArchLucid.Application.InfraEvidence.RemediationWaves",
        "ArchLucid.Application.InfraEvidence.SecurityAssetAssertions",
    ];

    [Fact]
    [Trait("Category", "Unit")]
    public void SecureNow_implementation_namespaces_remain_classified_as_infra_evidence()
    {
        ProductCapabilityMapDocument map = ProductCapabilityMapLoader.Load();
        Type[] applicationTypes = typeof(ArchitectureRunCreateOrchestrator).Assembly.GetTypes();

        foreach (string protectedNamespace in SecureNowImplementationNamespaces)
        {
            applicationTypes.Should().Contain(type => type.Namespace == protectedNamespace
                || type.Namespace?.StartsWith(protectedNamespace + ".", StringComparison.Ordinal) == true,
                "remove or update obsolete boundary entries when a SecureNow namespace moves: {0}", protectedNamespace);

            ProductCapabilityMapApplicationNamespaceEntry? owner = map.ApplicationNamespaces
                .Where(entry => protectedNamespace == entry.NamespacePrefix
                    || protectedNamespace.StartsWith(entry.NamespacePrefix + ".", StringComparison.Ordinal))
                .OrderByDescending(static entry => entry.NamespacePrefix.Length)
                .FirstOrDefault();

            owner.Should().NotBeNull("the protected namespace must have an explicit capability owner: {0}", protectedNamespace);
            owner!.Capability.Should().Be("infra-evidence", "SecureNow internals must remain in the infra-evidence capability");
            owner.Status.Should().Be("assigned");
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Authority_and_platform_types_must_not_depend_on_SecureNow_implementation()
    {
        ProductCapabilityMapDocument map = ProductCapabilityMapLoader.Load();
        var applicationAssembly = typeof(ArchitectureRunCreateOrchestrator).Assembly;
        List<string> violations = [];

        foreach (string implementationNamespace in SecureNowImplementationNamespaces)
        {
            TestResult result = Types.InAssembly(applicationAssembly)
                .That()
                .ResideInNamespace("ArchLucid.Application")
                .ShouldNot()
                .HaveDependencyOnAny(implementationNamespace)
                .GetResult();

            foreach (Type type in result.FailingTypes ?? [])
            {
                string? sourceNamespace = type.Namespace;

                if (sourceNamespace is null)
                    continue;

                ProductCapabilityMapApplicationNamespaceEntry? owner = map.ApplicationNamespaces
                    .Where(entry => sourceNamespace == entry.NamespacePrefix
                        || sourceNamespace.StartsWith(entry.NamespacePrefix + ".", StringComparison.Ordinal))
                    .OrderByDescending(static entry => entry.NamespacePrefix.Length)
                    .FirstOrDefault();

                if (owner?.Capability is "authority" or "platform")
                    violations.Add($"{type.FullName} -> {implementationNamespace} ({owner.Capability})");
            }
        }

        violations.Should().BeEmpty(
            "architecture and platform use shared Core/Contracts ports rather than SecureNow operational types. Offenders: {0}",
            string.Join(Environment.NewLine, violations.Distinct().OrderBy(static value => value, StringComparer.Ordinal)));
    }
}
