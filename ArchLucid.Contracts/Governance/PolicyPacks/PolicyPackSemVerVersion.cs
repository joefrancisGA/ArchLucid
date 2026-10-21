using System.Text.RegularExpressions;

namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>
///     Canonical policy-pack semver label after boundary normalization (trim + pattern validation).
///     Validation and downstream forwarding must use the same <see cref="Value" /> by construction.
/// </summary>
public readonly record struct PolicyPackSemVerVersion : IEquatable<PolicyPackSemVerVersion>
{
    public const int MaxLength = 50;

    public const string SemVerMessage =
        "Version must be SemVer 2 style (e.g. 1.0.0, 2.1.0-rc.1, optional leading 'v').";

#pragma warning disable SYSLIB1045
    private static readonly Regex SemVerPattern = new(
        @"^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);
#pragma warning restore SYSLIB1045

    public string Value { get; }

    private PolicyPackSemVerVersion(string value) => Value = value;

    /// <summary>Returns whether <paramref name="raw" /> is a valid policy-pack version after trim.</summary>
    public static bool TryParse(string? raw, out PolicyPackSemVerVersion result)
    {
        result = default;

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        string trimmed = raw.Trim();

        if (trimmed.Length > MaxLength)
            return false;

        if (!SemVerPattern.IsMatch(trimmed))
            return false;

        result = new PolicyPackSemVerVersion(trimmed);
        return true;
    }

    /// <inheritdoc cref="TryParse" />
    public static PolicyPackSemVerVersion Parse(string? raw)
    {
        if (!TryParse(raw, out PolicyPackSemVerVersion result))
            throw new ArgumentException(SemVerMessage, nameof(raw));

        return result;
    }

    /// <summary>Trims surrounding whitespace for repository lookup keys (case-insensitive match remains downstream).</summary>
    public static string NormalizeLookupKey(string version)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(version);

        return version.Trim();
    }

    public bool Equals(PolicyPackSemVerVersion other) =>
        string.Equals(Value, other.Value, StringComparison.OrdinalIgnoreCase);

    public override int GetHashCode() =>
        StringComparer.OrdinalIgnoreCase.GetHashCode(Value);

    public override string ToString() => Value;
}
