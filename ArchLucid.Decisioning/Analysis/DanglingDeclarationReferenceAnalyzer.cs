using System.Text.RegularExpressions;

using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Detects property values that reference resources not present on this graph snapshot (DX-24).
/// </summary>
public static partial class DanglingDeclarationReferenceAnalyzer
{
    public const int MaxFindings = 20;

    private static readonly HashSet<string> IdentityPropertyKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "resourceid",
        "id",
        "armid",
        "name",
    };

    [GeneratedRegex(
        @"/subscriptions/[^/]+/resourceGroups/[^/]+/providers/[^/]+/[^/]+/[^/]+",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex ArmResourceIdRegex();

    public static IReadOnlyList<DanglingDeclarationReference> Analyze(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return [];
        }

        HashSet<string> knownIdentities = BuildKnownIdentities(graphSnapshot.Nodes);
        List<DanglingDeclarationReference> danglingReferences = [];

        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (node.Properties is null || node.Properties.Count == 0)
            {
                continue;
            }

            foreach (KeyValuePair<string, string> property in node.Properties)
            {
                if (danglingReferences.Count >= MaxFindings)
                {
                    return danglingReferences;
                }

                string propertyName = property.Key ?? string.Empty;
                string propertyValue = property.Value ?? string.Empty;

                if (string.IsNullOrWhiteSpace(propertyValue))
                {
                    continue;
                }

                if (IsUnevaluatedExpression(propertyValue))
                {
                    continue;
                }

                TryAddArmReference(node, propertyName, propertyValue, knownIdentities, danglingReferences);
                TryAddKeyVaultReference(node, propertyName, propertyValue, knownIdentities, danglingReferences);
                TryAddSubnetReference(node, propertyName, propertyValue, knownIdentities, danglingReferences);
                TryAddIdentityReference(node, propertyName, propertyValue, knownIdentities, danglingReferences);
            }
        }

        return danglingReferences;
    }

    private static HashSet<string> BuildKnownIdentities(IReadOnlyList<GraphNode> nodes)
    {
        HashSet<string> identities = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in nodes)
        {
            AddIdentity(identities, node.NodeId);
            AddIdentity(identities, node.Label);

            if (node.Properties is null)
            {
                continue;
            }

            foreach (KeyValuePair<string, string> property in node.Properties)
            {
                if (!IsIdentityPropertyKey(property.Key))
                {
                    continue;
                }

                AddIdentity(identities, property.Value);
                AddArmResourceNameSegment(identities, property.Value);
            }
        }

        return identities;
    }

    private static bool IsIdentityPropertyKey(string? propertyKey)
    {
        if (string.IsNullOrWhiteSpace(propertyKey))
        {
            return false;
        }

        string normalized = propertyKey.Replace("_", string.Empty, StringComparison.Ordinal);

        return IdentityPropertyKeys.Contains(normalized);
    }

    private static void TryAddArmReference(
        GraphNode node,
        string propertyName,
        string propertyValue,
        HashSet<string> knownIdentities,
        List<DanglingDeclarationReference> danglingReferences)
    {
        Match match = ArmResourceIdRegex().Match(propertyValue);

        if (!match.Success)
        {
            return;
        }

        string armId = match.Value.Trim();

        if (IsKnownReference(armId, knownIdentities))
        {
            return;
        }

        danglingReferences.Add(
            new DanglingDeclarationReference(
                node.NodeId,
                node.Label ?? node.NodeId,
                propertyName,
                armId,
                DanglingDeclarationReferenceKind.ArmId));
    }

    private static void TryAddKeyVaultReference(
        GraphNode node,
        string propertyName,
        string propertyValue,
        HashSet<string> knownIdentities,
        List<DanglingDeclarationReference> danglingReferences)
    {
        if (!propertyValue.Contains("vault.azure.net", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string? vaultName = TryExtractKeyVaultName(propertyValue);

        if (string.IsNullOrWhiteSpace(vaultName))
        {
            return;
        }

        if (IsKnownReference(vaultName, knownIdentities)
            || IsKnownReference(propertyValue.Trim(), knownIdentities))
        {
            return;
        }

        danglingReferences.Add(
            new DanglingDeclarationReference(
                node.NodeId,
                node.Label ?? node.NodeId,
                propertyName,
                propertyValue.Trim(),
                DanglingDeclarationReferenceKind.KeyVaultUri));
    }

    private static void TryAddSubnetReference(
        GraphNode node,
        string propertyName,
        string propertyValue,
        HashSet<string> knownIdentities,
        List<DanglingDeclarationReference> danglingReferences)
    {
        if (!propertyName.Contains("subnet", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string token = propertyValue.Trim();

        if (token.Length == 0 || !token.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (IsKnownReference(token, knownIdentities))
        {
            return;
        }

        danglingReferences.Add(
            new DanglingDeclarationReference(
                node.NodeId,
                node.Label ?? node.NodeId,
                propertyName,
                token,
                DanglingDeclarationReferenceKind.Subnet));
    }

    private static void TryAddIdentityReference(
        GraphNode node,
        string propertyName,
        string propertyValue,
        HashSet<string> knownIdentities,
        List<DanglingDeclarationReference> danglingReferences)
    {
        if (!propertyName.Contains("identity", StringComparison.OrdinalIgnoreCase)
            && !propertyName.Contains("principal", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string token = propertyValue.Trim();

        if (token.Length == 0 || IsUnevaluatedExpression(token))
        {
            return;
        }

        if (IsKnownReference(token, knownIdentities))
        {
            return;
        }

        danglingReferences.Add(
            new DanglingDeclarationReference(
                node.NodeId,
                node.Label ?? node.NodeId,
                propertyName,
                token,
                DanglingDeclarationReferenceKind.Identity));
    }

    private static bool IsKnownReference(string token, HashSet<string> knownIdentities)
    {
        if (knownIdentities.Contains(token))
        {
            return true;
        }

        string trimmed = token.Trim();
        int lastSlash = trimmed.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= trimmed.Length - 1)
        {
            return false;
        }

        return knownIdentities.Contains(trimmed[(lastSlash + 1)..]);
    }

    private static void AddIdentity(HashSet<string> identities, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        identities.Add(value.Trim());
        AddArmResourceNameSegment(identities, value);
    }

    private static void AddArmResourceNameSegment(HashSet<string> identities, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        string trimmed = value.Trim();
        int lastSlash = trimmed.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= trimmed.Length - 1)
        {
            return;
        }

        identities.Add(trimmed[(lastSlash + 1)..]);
    }

    private static string? TryExtractKeyVaultName(string propertyValue)
    {
        string trimmed = propertyValue.Trim();
        int schemeIndex = trimmed.IndexOf("://", StringComparison.Ordinal);

        if (schemeIndex >= 0)
        {
            trimmed = trimmed[(schemeIndex + 3)..];
        }

        int dotIndex = trimmed.IndexOf('.', StringComparison.Ordinal);

        if (dotIndex <= 0)
        {
            return null;
        }

        return trimmed[..dotIndex];
    }

    private static bool IsUnevaluatedExpression(string value)
    {
        return value.Contains("[parameters(", StringComparison.OrdinalIgnoreCase)
            || value.Contains("[variables(", StringComparison.OrdinalIgnoreCase)
            || value.Contains("${", StringComparison.Ordinal)
            || value.Contains("var.", StringComparison.OrdinalIgnoreCase)
            || value.Contains("local.", StringComparison.OrdinalIgnoreCase)
            || value.Contains("module.", StringComparison.OrdinalIgnoreCase);
    }
}
