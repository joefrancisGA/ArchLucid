using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationSecurityBaselineClassifierTests
{
    [Fact]
    public void Classify_flags_public_network_access_on_storage()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        };

        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("docs", properties);

        signals.Should().ContainSingle();
        signals[0].Severity.Should().Be(FindingSeverity.Error);
    }

    [Fact]
    public void Classify_skips_when_attribute_missing()
    {
        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("docs", new Dictionary<string, string>());

        signals.Should().BeEmpty();
    }

    [Fact]
    public void Classify_flags_admin_ingress_when_internet_rule_allows_ssh_port()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.ingress"] = "0.0.0.0/0:22",
        };

        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("nsg", properties);

        signals.Should().ContainSingle(signal => signal.Theme == "network-isolation");
    }

    [Fact]
    public void Classify_does_not_flag_port_2200_as_admin_ingress()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.ingress"] = "0.0.0.0/0:2200",
        };

        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("app", properties);

        signals.Should().NotContain(signal => signal.Theme == "network-isolation");
    }

    [Fact]
    public void Classify_flags_compacted_tf_publicnetworkaccess()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.publicnetworkaccess"] = "enabled",
        };

        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("docs", properties);

        signals.Should().ContainSingle(signal => signal.Theme == "data-protection");
    }

    [Fact]
    public void Classify_flags_arm_publicNetworkAccess()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["publicNetworkAccess"] = "enabled",
        };

        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("docs", properties);

        signals.Should().ContainSingle(signal => signal.Theme == "data-protection");
    }

    [Fact]
    public void Classify_flags_k8s_privileged_workload()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["k8s.privileged"] = "true",
        };

        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("api", properties);

        signals.Should().ContainSingle(signal => signal.Theme == "workload-isolation");
    }

    [Fact]
    public void Classify_skips_cluster_ip_service_type()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["k8s.servicetype"] = "clusterip",
        };

        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify("api", properties);

        signals.Should().NotContain(signal => signal.Theme == "data-protection");
    }
}
