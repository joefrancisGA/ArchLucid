using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Canonical Deduplicator.
/// </summary>
[Trait("Suite", "Core")]
public sealed class CanonicalDeduplicatorTests
{
    private readonly CanonicalDeduplicator _sut = new();

    [Fact]
    public void Deduplicate_UsesReferenceFingerprint_WhenTextMissing()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "PolicyControl",
                Name = "same-label",
                SourceType = "PolicyReference",
                SourceId = "ref-a",
                Properties = new Dictionary<string, string>
                {
                    ["reference"] = "ORG-POL-001", ["status"] = "referenced"
                }
            },

            new()
            {
                ObjectType = "PolicyControl",
                Name = "same-label",
                SourceType = "PolicyReference",
                SourceId = "ref-b",
                Properties = new Dictionary<string, string>
                {
                    ["reference"] = "ORG-POL-001", ["status"] = "referenced"
                }
            }
        ];

        IReadOnlyList<CanonicalObject> result = _sut.Deduplicate(items);

        result.Should().HaveCount(1);
    }

    [Fact]
    public void Deduplicate_PrefersTextOverReference_ForFingerprint()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "PolicyControl",
                Name = "x",
                SourceType = "A",
                SourceId = "a",
                Properties = new Dictionary<string, string> { ["text"] = "alpha", ["reference"] = "R1" }
            },

            new()
            {
                ObjectType = "PolicyControl",
                Name = "x",
                SourceType = "B",
                SourceId = "b",
                Properties = new Dictionary<string, string> { ["text"] = "beta", ["reference"] = "R1" }
            }
        ];

        IReadOnlyList<CanonicalObject> result = _sut.Deduplicate(items);

        result.Should().HaveCount(2);
    }

    [Fact]
    public void Deduplicate_KeepsInfrastructureResourcesFromDifferentDeclarations()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "TopologyResource",
                Name = "hub-vnet",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-a",
                Properties = new Dictionary<string, string>
                {
                    ["resourceType"] = "vnet", ["region"] = "eastus"
                }
            },

            new()
            {
                ObjectType = "TopologyResource",
                Name = "hub-vnet",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-b",
                Properties = new Dictionary<string, string>
                {
                    ["resourceType"] = "vnet", ["region"] = "westus"
                }
            }
        ];

        IReadOnlyList<CanonicalObject> result = _sut.Deduplicate(items);

        result.Should().HaveCount(2);
    }

    [Fact]
    public void Deduplicate_KeepsJsonResourcesWithSameTypeNameDifferentSubtype()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "TopologyResource",
                Name = "hub",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-json",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["resourceType"] = "vnet",
                    ["subtype"] = "hub",
                    ["region"] = "eastus",
                },
            },

            new()
            {
                ObjectType = "TopologyResource",
                Name = "hub",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-json",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["resourceType"] = "vnet",
                    ["subtype"] = "spoke",
                    ["region"] = "westus",
                },
            },
        ];

        IReadOnlyList<CanonicalObject> result = _sut.Deduplicate(items);

        result.Should().HaveCount(2);
    }

    [Fact]
    public void Deduplicate_KeepsKubernetesResourcesWithSameNameDifferentKind()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "TopologyResource",
                Name = "api",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-k8s",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["k8s.kind"] = "deployment",
                },
            },

            new()
            {
                ObjectType = "TopologyResource",
                Name = "api",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-k8s",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["k8s.kind"] = "service",
                },
            },
        ];

        IReadOnlyList<CanonicalObject> result = _sut.Deduplicate(items);

        result.Should().HaveCount(2);
    }

    [Fact]
    public void Deduplicate_KeepsDuplicateKubernetesManifestsWithOccurrence()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "TopologyResource",
                Name = "prod/api",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-k8s",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["k8s.kind"] = "deployment",
                    ["k8sOccurrence"] = "1",
                },
            },

            new()
            {
                ObjectType = "TopologyResource",
                Name = "prod/api",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-k8s",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["k8s.kind"] = "deployment",
                    ["k8sOccurrence"] = "2",
                },
            },
        ];

        IReadOnlyList<CanonicalObject> result = _sut.Deduplicate(items);

        result.Should().HaveCount(2);
    }
}
