using System.Text.RegularExpressions;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Line-based parser for Bicep <c>.bicepparam</c> assignment files (not a Bicep compiler).
/// </summary>
internal static class BicepParamFileParser
{
    private static readonly Regex UsingRegex = new(
        """
        using\s+['"](?<path>[^'"]+)['"]
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ParamRegex = new(
        """
        ^\s*param\s+(?<name>[\w-]+)\s*=\s*(?<value>.+?)\s*$
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    internal static bool TryParse(
        string content,
        out string? bicepRelativePath,
        out Dictionary<string, string> parameters)
    {
        bicepRelativePath = null;
        parameters = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(content))
        {
            return false;
        }

        Match usingMatch = UsingRegex.Match(content);

        if (!usingMatch.Success)
        {
            return false;
        }

        bicepRelativePath = usingMatch.Groups["path"].Value.Trim();

        if (string.IsNullOrWhiteSpace(bicepRelativePath))
        {
            return false;
        }

        foreach (string line in content.Split('\n'))
        {
            Match paramMatch = ParamRegex.Match(line);

            if (!paramMatch.Success)
            {
                continue;
            }

            string name = paramMatch.Groups["name"].Value.Trim();
            string rawValue = paramMatch.Groups["value"].Value.Trim();
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingSlashSlashComment(rawValue);
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingBlockComment(rawValue);
            string value = CanonicalInfrastructurePropertyBag.UnquoteInfrastructureScalar(rawValue);

            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            parameters[name] = value;
        }

        return parameters.Count > 0;
    }
}
