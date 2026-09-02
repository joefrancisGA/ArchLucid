using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationPremiseConflictClassifierTests
{
    [Fact]
    public void Classify_detects_private_network_conflict_on_narrow_applicability()
    {
        GraphNode topology = CreateTopology("docs", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        });

        GraphNode baseline = CreateIntent("baseline-private", "Private only network access required");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, true)]);

        signals.Should().ContainSingle();
        signals[0].ConflictKind.Should().Be(DeclarationPremiseConflictClassifier.PrivateNetworkConflictKind);
        signals[0].DeclarationPropertyKey.Should().Be("tf.public_network_access");
        signals[0].IsNarrowApplicability.Should().BeTrue();
    }

    [Fact]
    public void Classify_detects_https_tls_conflict()
    {
        GraphNode topology = CreateTopology("api", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.https_only"] = "false",
        });

        GraphNode baseline = CreateIntent("baseline-https", "Require HTTPS only for all app services");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, true)]);

        signals.Should().ContainSingle();
        signals[0].ConflictKind.Should().Be(DeclarationPremiseConflictClassifier.HttpsTlsConflictKind);
    }

    [Fact]
    public void Classify_detects_admin_ingress_conflict()
    {
        GraphNode topology = CreateTopology("nsg", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.ingress"] = "0.0.0.0/0:22",
        });

        GraphNode baseline = CreateIntent("baseline-admin", "Restricted ingress — no SSH from internet");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, true)]);

        signals.Should().ContainSingle();
        signals[0].ConflictKind.Should().Be(DeclarationPremiseConflictClassifier.AdminIngressConflictKind);
    }

    [Fact]
    public void Classify_marks_broad_applicability_when_not_narrow()
    {
        GraphNode topology = CreateTopology("docs", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        });

        GraphNode baseline = CreateIntent("baseline-private", "Private endpoint required");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, false)]);

        signals.Should().ContainSingle();
        signals[0].IsNarrowApplicability.Should().BeFalse();
    }

    [Fact]
    public void Classify_returns_empty_when_no_intent_nodes()
    {
        GraphNode topology = CreateTopology("docs", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        });

        IReadOnlyList<DeclarationPremiseConflictSignal> signals =
            DeclarationPremiseConflictClassifier.Classify(topology, []);

        signals.Should().BeEmpty();
    }

    [Fact]
    public void Classify_returns_empty_when_intent_does_not_lexically_match()
    {
        GraphNode topology = CreateTopology("docs", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        });

        GraphNode baseline = CreateIntent("baseline-generic", "Enable monitoring and logging");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, true)]);

        signals.Should().BeEmpty();
    }

    [Fact]
    public void Classify_does_not_fire_private_network_conflict_for_negated_disable_public_phrase()
    {
        GraphNode topology = CreateTopology("docs", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        });

        GraphNode baseline = CreateIntent("baseline-private", "Do not disable public access for this dev sandbox");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, true)]);

        signals.Should().BeEmpty();
    }

    [Fact]
    public void Classify_returns_empty_when_declaration_properties_missing()
    {
        GraphNode topology = CreateTopology("docs", new Dictionary<string, string>());
        GraphNode baseline = CreateIntent("baseline-private", "Private only network access");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, true)]);

        signals.Should().BeEmpty();
    }

    [Fact]
    public void Classify_does_not_match_negated_disable_public_intent()
    {
        GraphNode topology = CreateTopology("docs", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        });

        GraphNode baseline = CreateIntent("baseline-flex", "Do not disable public access for partner integrations");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, true)]);

        signals.Should().BeEmpty();
    }

    [Fact]
    public void Classify_does_not_fire_private_network_conflict_for_optional_disable_public_phrase()
    {
        GraphNode topology = CreateTopology("docs", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        });

        GraphNode baseline = CreateIntent(
            "baseline-optional",
            "No requirement to disable public network access for this integration subnet");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, true)]);

        signals.Should().BeEmpty();
    }

    [Fact]
    public void Classify_still_matches_affirmative_disable_public_intent()
    {
        GraphNode topology = CreateTopology("docs", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        });

        GraphNode baseline = CreateIntent("baseline-private", "Organizations must disable public network access");

        IReadOnlyList<DeclarationPremiseConflictSignal> signals = DeclarationPremiseConflictClassifier.Classify(
            topology,
            [new ApplicableIntentNode(baseline, true)]);

        signals.Should().ContainSingle();
        signals[0].ConflictKind.Should().Be(DeclarationPremiseConflictClassifier.PrivateNetworkConflictKind);
    }

    private static GraphNode CreateTopology(string label, Dictionary<string, string> properties) =>
        new()
        {
            NodeId = $"topo-{label}",
            NodeType = "TopologyResource",
            Label = label,
            Properties = properties,
        };

    private static GraphNode CreateIntent(string nodeId, string requirementText) =>
        new()
        {
            NodeId = nodeId,
            NodeType = "SecurityBaseline",
            Label = requirementText,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["description"] = requirementText,
            },
        };
}
