namespace ArchLucid.Core.Findings;

/// <summary>
///     Appends package-resolvable citation strings to <see cref="ArchLucid.Contracts.Findings.Finding.EvidenceRefs" />
///     using prefixes already accepted by <see cref="GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation" />.
/// </summary>
public static class FindingEvidenceRefs
{
    private static readonly string[] TopologyResourceIdPropertyKeys =
    [
        "resourceId",
        "azureResourceId",
        "armResourceId",
        "id",
        "tf.id",
        "tf.resource_id",
        "arn",
    ];

    public static void TryAppendDistinct(List<string> evidenceRefs, string? value)
    {
        ArgumentNullException.ThrowIfNull(evidenceRefs);

        if (string.IsNullOrWhiteSpace(value))
            return;

        string trimmed = value.Trim();

        if (IsGenericEvidenceRef(trimmed))
            return;

        if (evidenceRefs.Any(existing => existing.Equals(trimmed, StringComparison.OrdinalIgnoreCase)))
            return;

        evidenceRefs.Add(trimmed);
    }

    public static void TryAppendInventoryResourceId(List<string> evidenceRefs, string? resourceId)
    {
        ArgumentNullException.ThrowIfNull(evidenceRefs);

        string? formatted = TryFormatInventoryResourceId(resourceId);

        if (formatted is not null)
            TryAppendDistinct(evidenceRefs, formatted);
    }

    public static void TryAppendPolicyRuleId(List<string> evidenceRefs, string? policyRuleId)
    {
        ArgumentNullException.ThrowIfNull(evidenceRefs);

        if (string.IsNullOrWhiteSpace(policyRuleId))
            return;

        TryAppendDistinct(evidenceRefs, $"policy-rule:{policyRuleId.Trim()}");
    }

    public static void TryAppendDiagramCitation(
        List<string> evidenceRefs,
        string? evidenceItemId,
        string? shapeOrEdgeId)
    {
        ArgumentNullException.ThrowIfNull(evidenceRefs);

        if (string.IsNullOrWhiteSpace(shapeOrEdgeId))
        {
            return;
        }

        TryAppendDistinct(evidenceRefs, DiagramEvidenceCitationRefs.Format(evidenceItemId, shapeOrEdgeId));
    }

    public static void TryAppendInventoryResourceIds(List<string> evidenceRefs, IEnumerable<string>? resourceIds)
    {
        ArgumentNullException.ThrowIfNull(evidenceRefs);

        if (resourceIds is null)
            return;

        foreach (string resourceId in resourceIds)
            TryAppendInventoryResourceId(evidenceRefs, resourceId);
    }

    public static void TryCollectFromNodeProperties(List<string> evidenceRefs, IReadOnlyDictionary<string, string>? properties)
    {
        ArgumentNullException.ThrowIfNull(evidenceRefs);

        if (properties is null)
            return;

        foreach (string key in TopologyResourceIdPropertyKeys)
        {
            if (properties.TryGetValue(key, out string? value))
                TryAppendInventoryResourceId(evidenceRefs, value);
        }
    }

    /// <summary>
    ///     DX-70: <c>doc:</c> citations are concrete for demotion only when they include a
    ///     <c>#L</c> line anchor plus at least one digit (for example <c>doc:architecture.md#L12</c>
    ///     or <c>doc:architecture.md#L12-18</c>). Heading fragments such as <c>#services</c> are not line anchors.
    /// </summary>
    public static bool HasLineAnchoredDocRef(string? evidenceRef)
    {
        if (string.IsNullOrWhiteSpace(evidenceRef))
            return false;

        string trimmed = evidenceRef.Trim();

        if (!trimmed.StartsWith("doc:", StringComparison.OrdinalIgnoreCase))
            return false;

        int hashIndex = trimmed.IndexOf('#');

        if (hashIndex < 0 || hashIndex + 2 >= trimmed.Length)
            return false;

        if (trimmed[hashIndex + 1] is not ('L' or 'l'))
            return false;

        ReadOnlySpan<char> afterL = trimmed.AsSpan(hashIndex + 2);

        foreach (char character in afterL)
        {
            if (char.IsAsciiDigit(character))
                return true;

            if (character == '-')
                continue;

            break;
        }

        return false;
    }

    internal static string? TryFormatInventoryResourceId(string? resourceId)
    {
        if (string.IsNullOrWhiteSpace(resourceId))
            return null;

        string trimmed = resourceId.Trim();

        if (trimmed.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            && trimmed.Contains("resourceGroups/", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        if (trimmed.StartsWith("aws:arn:", StringComparison.OrdinalIgnoreCase))
            return trimmed.Length > "aws:arn:".Length ? trimmed : null;

        if (trimmed.StartsWith("arn:aws", StringComparison.OrdinalIgnoreCase))
            return $"aws:arn:{trimmed}";

        if (trimmed.Contains("projects/", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        return null;
    }

    /// <summary>
    ///     True for ARM/ARN/GCP resource names or cloud product type tokens
    ///     (<c>Microsoft.Web/sites</c>, <c>AWS::Lambda::Function</c>, <c>google_compute_instance</c>).
    /// </summary>
    public static bool IsProductShapedInventoryToken(string? value)
    {
        if (TryFormatInventoryResourceId(value) is not null)
            return true;

        if (string.IsNullOrWhiteSpace(value))
            return false;

        return IsCloudProviderResourceTypeName(value.Trim());
    }

    private static bool IsCloudProviderResourceTypeName(string trimmed)
    {
        if (trimmed.StartsWith("Microsoft.", StringComparison.OrdinalIgnoreCase))
        {
            int slash = trimmed.IndexOf('/');

            if (slash <= "Microsoft.".Length || slash >= trimmed.Length - 1)
                return false;

            if (trimmed.Contains(' ', StringComparison.Ordinal))
                return false;

            return true;
        }

        if (trimmed.StartsWith("AWS::", StringComparison.OrdinalIgnoreCase))
        {
            string[] parts = trimmed.Split(["::"], StringSplitOptions.None);

            if (parts.Length < 3)
                return false;

            return parts.All(static part => part.Length > 0);
        }

        if (!trimmed.StartsWith("google_", StringComparison.OrdinalIgnoreCase) || trimmed.Length <= "google_".Length)
            return false;

        foreach (char character in trimmed)
        {
            if (char.IsAsciiLetterOrDigit(character) || character == '_')
                continue;

            return false;
        }

        return true;
    }

    private static bool IsGenericEvidenceRef(string normalized) =>
        normalized.Equals("request", StringComparison.OrdinalIgnoreCase)
        || normalized.Equals("critic-checklist", StringComparison.OrdinalIgnoreCase)
        || normalized.Equals("architecture-request", StringComparison.OrdinalIgnoreCase);
}
