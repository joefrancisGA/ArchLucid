using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reduces NR-02 NSG attachments into effective data-flow connector annotations (NR-08).
/// </summary>
public static class InventoryDiagramDataFlowNsgEffectiveRuleReducer
{
    private const string OutboundDirection = "Outbound";

    private const string InboundDirection = "Inbound";

    public static InventoryDiagramDataFlowNsgConnectorAnnotation? Reduce(
        GraphSnapshot graph,
        string sourceGraphNodeId,
        string targetGraphNodeId)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceGraphNodeId);
        ArgumentException.ThrowIfNullOrWhiteSpace(targetGraphNodeId);

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        if (!graphNodesById.TryGetValue(sourceGraphNodeId, out GraphNode? sourceNode)
            || !graphNodesById.TryGetValue(targetGraphNodeId, out GraphNode? targetNode))
        {
            return null;
        }

        Dictionary<string, List<InventoryDiagramDataFlowNsgEndpointAttachment>> attachmentsByEndpointArmId =
            InventoryDiagramDataFlowNsgAttachmentIndex.Build(graph);

        IReadOnlyList<InventoryDiagramDataFlowNsgEndpointAttachment> sourceAttachments =
            InventoryDiagramDataFlowNsgAttachmentIndex.ResolveEndpointAttachments(
                graph,
                sourceNode,
                attachmentsByEndpointArmId);
        IReadOnlyList<InventoryDiagramDataFlowNsgEndpointAttachment> targetAttachments =
            InventoryDiagramDataFlowNsgAttachmentIndex.ResolveEndpointAttachments(
                graph,
                targetNode,
                attachmentsByEndpointArmId);

        InventoryDiagramDataFlowNsgDirectionalEvaluation? outboundEvaluation =
            EvaluateDirection(sourceAttachments, OutboundDirection);
        InventoryDiagramDataFlowNsgDirectionalEvaluation? inboundEvaluation =
            EvaluateDirection(targetAttachments, InboundDirection);

        if (outboundEvaluation is null && inboundEvaluation is null)
        {
            return null;
        }

        bool isBlocked = outboundEvaluation?.IsBlocked == true || inboundEvaluation?.IsBlocked == true;
        List<string> connectorDisplayLabels = BuildConnectorDisplayLabels(
            outboundEvaluation,
            inboundEvaluation,
            isBlocked);
        List<string> supportingRuleDetailLines = BuildSupportingRuleDetailLines(
            outboundEvaluation,
            inboundEvaluation);

        List<InventoryDiagramDataFlowNsgDirectionalEvaluation> directionalEvaluations = [];

        if (outboundEvaluation is not null)
        {
            directionalEvaluations.Add(outboundEvaluation);
        }

        if (inboundEvaluation is not null)
        {
            directionalEvaluations.Add(inboundEvaluation);
        }

        return new InventoryDiagramDataFlowNsgConnectorAnnotation
        {
            IsBlocked = isBlocked,
            ConnectorDisplayLabels = connectorDisplayLabels,
            SupportingRuleDetailLines = supportingRuleDetailLines,
            DirectionalEvaluations = directionalEvaluations,
        };
    }

    private static InventoryDiagramDataFlowNsgDirectionalEvaluation? EvaluateDirection(
        IReadOnlyList<InventoryDiagramDataFlowNsgEndpointAttachment> attachments,
        string direction)
    {
        if (attachments.Count == 0)
        {
            return null;
        }

        List<(AzureInventoryNsgSecurityRule Rule, InventoryDiagramDataFlowNsgEndpointAttachment Attachment)> matchingRules = [];

        foreach (InventoryDiagramDataFlowNsgEndpointAttachment attachment in attachments)
        {
            foreach (AzureInventoryNsgSecurityRule rule in attachment.Rules)
            {
                if (!string.Equals(rule.Direction, direction, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                matchingRules.Add((rule, attachment));
            }
        }

        if (matchingRules.Count == 0)
        {
            return null;
        }

        List<(AzureInventoryNsgSecurityRule Rule, InventoryDiagramDataFlowNsgEndpointAttachment Attachment)> orderedRules =
            matchingRules
                .OrderBy(entry => ParsePriority(entry.Rule.Priority))
                .ThenBy(entry => entry.Rule.RuleName, StringComparer.OrdinalIgnoreCase)
                .ToList();

        (AzureInventoryNsgSecurityRule firstRule, InventoryDiagramDataFlowNsgEndpointAttachment firstAttachment) = orderedRules[0];
        bool firstRuleIsDeny = string.Equals(firstRule.Access, "Deny", StringComparison.OrdinalIgnoreCase);
        string? effectiveDisplayLabel = BuildEffectiveDisplayLabel(firstRule);

        if (firstRuleIsDeny)
        {
            return new InventoryDiagramDataFlowNsgDirectionalEvaluation
            {
                Direction = direction,
                IsBlocked = true,
                EffectiveDisplayLabel = effectiveDisplayLabel,
                SupportingRules =
                [
                    ToRuleReference(firstRule, firstAttachment, direction),
                ],
            };
        }

        List<InventoryDiagramDataFlowNsgRuleReference> supportingRules = orderedRules
            .Where(entry => string.Equals(entry.Rule.Access, "Allow", StringComparison.OrdinalIgnoreCase)
                && string.Equals(BuildEffectiveDisplayLabel(entry.Rule), effectiveDisplayLabel, StringComparison.OrdinalIgnoreCase))
            .Select(entry => ToRuleReference(entry.Rule, entry.Attachment, direction))
            .ToList();

        return new InventoryDiagramDataFlowNsgDirectionalEvaluation
        {
            Direction = direction,
            IsBlocked = false,
            EffectiveDisplayLabel = effectiveDisplayLabel,
            SupportingRules = supportingRules,
        };
    }

    private static List<string> BuildConnectorDisplayLabels(
        InventoryDiagramDataFlowNsgDirectionalEvaluation? outboundEvaluation,
        InventoryDiagramDataFlowNsgDirectionalEvaluation? inboundEvaluation,
        bool isBlocked)
    {
        List<string> labels = [];

        string? outboundLabel = outboundEvaluation?.EffectiveDisplayLabel;
        string? inboundLabel = inboundEvaluation?.EffectiveDisplayLabel;

        if (!string.IsNullOrWhiteSpace(outboundLabel)
            && !string.IsNullOrWhiteSpace(inboundLabel)
            && string.Equals(outboundLabel, inboundLabel, StringComparison.OrdinalIgnoreCase)
            && outboundEvaluation?.IsBlocked != true
            && inboundEvaluation?.IsBlocked != true)
        {
            labels.Add(outboundLabel);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(outboundLabel))
            {
                labels.Add($"{OutboundDirection} {outboundLabel}");
            }

            if (!string.IsNullOrWhiteSpace(inboundLabel))
            {
                labels.Add($"{InboundDirection} {inboundLabel}");
            }
        }

        if (isBlocked)
        {
            labels.Add("blocked");
        }

        return labels;
    }

    private static List<string> BuildSupportingRuleDetailLines(
        InventoryDiagramDataFlowNsgDirectionalEvaluation? outboundEvaluation,
        InventoryDiagramDataFlowNsgDirectionalEvaluation? inboundEvaluation)
    {
        List<string> detailLines = [];

        AppendSupportingRuleDetailLines(detailLines, outboundEvaluation);
        AppendSupportingRuleDetailLines(detailLines, inboundEvaluation);

        return detailLines;
    }

    private static void AppendSupportingRuleDetailLines(
        List<string> detailLines,
        InventoryDiagramDataFlowNsgDirectionalEvaluation? evaluation)
    {
        if (evaluation is null)
        {
            return;
        }

        foreach (InventoryDiagramDataFlowNsgRuleReference ruleReference in evaluation.SupportingRules)
        {
            string priority = string.IsNullOrWhiteSpace(ruleReference.Priority) ? "?" : ruleReference.Priority.Trim();
            string ruleName = string.IsNullOrWhiteSpace(ruleReference.RuleName) ? "rule" : ruleReference.RuleName.Trim();

            detailLines.Add(
                $"{ruleReference.NsgName} / {ruleName} ({ruleReference.Direction}, priority {priority}, {ruleReference.AssociationKind})");
        }
    }

    private static InventoryDiagramDataFlowNsgRuleReference ToRuleReference(
        AzureInventoryNsgSecurityRule rule,
        InventoryDiagramDataFlowNsgEndpointAttachment attachment,
        string direction)
    {
        return new InventoryDiagramDataFlowNsgRuleReference
        {
            NsgName = attachment.NsgName,
            RuleName = rule.RuleName ?? string.Empty,
            Priority = rule.Priority,
            Direction = direction,
            AssociationKind = attachment.AssociationKind,
        };
    }

    private static string? BuildEffectiveDisplayLabel(AzureInventoryNsgSecurityRule rule)
    {
        string? protocol = NormalizeToken(rule.Protocol);
        string? port = NormalizeToken(rule.DestinationPortRange) ?? NormalizeToken(rule.SourcePortRange);

        if (string.IsNullOrWhiteSpace(protocol) && string.IsNullOrWhiteSpace(port))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(protocol))
        {
            return port;
        }

        if (string.IsNullOrWhiteSpace(port))
        {
            return protocol;
        }

        return $"{protocol} {port}";
    }

    private static string? NormalizeToken(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static int ParsePriority(string? priority)
    {
        if (int.TryParse(priority, out int parsed))
        {
            return parsed;
        }

        return int.MaxValue;
    }
}
