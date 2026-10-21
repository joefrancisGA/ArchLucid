using ArchLucid.Core.Scim.Models;

namespace ArchLucid.Core.Scim.Filtering;

public static class ScimFilterInMemoryEvaluator
{
    public static bool Matches(ScimUserRecord user, ScimFilterNode? filter)
    {
        return filter is null || Evaluate(user, filter);
    }

    private static bool Evaluate(ScimUserRecord user, ScimFilterNode node)
    {
        return node switch
        {
            ScimNotNode n => !Evaluate(user, n.Inner),
            ScimAndNode a => Evaluate(user, a.Left) && Evaluate(user, a.Right),
            ScimOrNode o => Evaluate(user, o.Left) || Evaluate(user, o.Right),
            ScimPresentNode p => GetString(user, p.AttributePath) is not null,
            ScimComparisonNode c => Compare(user, c),
            _ => false
        };
    }

    private static bool Compare(ScimUserRecord user, ScimComparisonNode c)
    {
        if (string.Equals(c.AttributePath, "active", StringComparison.OrdinalIgnoreCase))
            return CompareActive(user, c);

        string? left = GetString(user, c.AttributePath);
        StringComparison comparison = ScimUserFilterAttributeSemantics.StringComparisonFor(c.AttributePath);

        if (string.Equals(c.Operator, "pr", StringComparison.Ordinal))
            return left is not null;

        string right = c.Value;

        return c.Operator.ToLowerInvariant() switch
        {
            "eq" => string.Equals(left, right, comparison),
            "ne" => !string.Equals(left, right, comparison),
            "co" => left is not null && left.Contains(right, comparison),
            "sw" => left is not null && left.StartsWith(right, comparison),
            "ew" => left is not null && left.EndsWith(right, comparison),
            "gt" => LexGreater(left, right, comparison),
            "lt" => LexLess(left, right, comparison),
            "ge" => LexGreater(left, right, comparison) || string.Equals(left, right, comparison),
            "le" => LexLess(left, right, comparison) || string.Equals(left, right, comparison),
            _ => false
        };
    }

    private static bool CompareActive(ScimUserRecord user, ScimComparisonNode c)
    {
        if (string.Equals(c.Operator, "pr", StringComparison.Ordinal))
            return true;

        if (!ScimActiveFilterLiteralParser.TryParseEqualityOperand(c.Value, out bool expected))
            return false;

        bool actual = user.Active;

        return c.Operator.ToLowerInvariant() switch
        {
            "eq" => actual == expected,
            "ne" => actual != expected,
            _ => false
        };
    }

    private static bool LexGreater(string? left, string right, StringComparison comparison)
    {
        if (left is null)
            return false;

        return string.Compare(left, right, comparison) > 0;
    }

    private static bool LexLess(string? left, string right, StringComparison comparison)
    {
        if (left is null)
            return false;

        return string.Compare(left, right, comparison) < 0;
    }

    private static string? GetString(ScimUserRecord user, string path)
    {
        string p = path.Trim();

        if (string.Equals(p, "userName", StringComparison.OrdinalIgnoreCase))
            return user.UserName;

        if (string.Equals(p, "displayName", StringComparison.OrdinalIgnoreCase))
            return user.DisplayName;

        if (ScimKnownUserFilterPaths.IsEmailsWorkValuePath(p))
            return user.UserName;

        if (string.Equals(p, "externalId", StringComparison.OrdinalIgnoreCase))
            return user.ExternalId;

        if (string.Equals(p, "active", StringComparison.OrdinalIgnoreCase))
            return user.Active ? "true" : "false";

        return string.Equals(p, "id", StringComparison.OrdinalIgnoreCase) ? user.Id.ToString("D") : null;
    }
}
