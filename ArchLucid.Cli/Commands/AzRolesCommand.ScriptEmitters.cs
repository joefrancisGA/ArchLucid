using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArchLucid.Cli.Commands;

internal static partial class AzRolesCommand
{
    private static void WriteOutput(AzRolesOptions opts)
    {
        if (CliExecutionContext.JsonOutput)
        {
            JsonObject root = new()
            {
                ["ok"] = true,
                ["roles"] = new JsonArray(ReaderRole, CostManagementReaderRole),
                ["scope"] = opts.ScopePath,
                ["shell"] = ShellKindJsonLabel(opts.ShellKind),
            };

            if (opts.ShellKind is AzRolesShellKind.Bash or AzRolesShellKind.Both)
                root["bashScript"] = BuildBash(opts);

            if (opts.ShellKind is AzRolesShellKind.PowerShell or AzRolesShellKind.Both)
                root["powershellScript"] = BuildPowerShell(opts);

            Console.WriteLine(root.ToJsonString(JsonWriteOptions()));

            return;
        }

        if (opts.ShellKind == AzRolesShellKind.Both)
        {
            EmitPlainSection("Bash / sh / zsh", BuildBash(opts));
            EmitPlainSection("PowerShell", BuildPowerShell(opts));

            return;
        }

        Console.Write(opts.ShellKind == AzRolesShellKind.Bash ? BuildBash(opts) : BuildPowerShell(opts));
    }

    private static JsonSerializerOptions JsonWriteOptions()
    {
        JsonSerializerOptions o =
            new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = CliExecutionContext.JsonOutput };

        return o;
    }

    private static string ShellKindJsonLabel(AzRolesShellKind kind)
    {
        return kind switch
        {
            AzRolesShellKind.Bash => "bash",
            AzRolesShellKind.PowerShell => "powershell",
            AzRolesShellKind.Both => "both",
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null),
        };
    }

    private static void EmitPlainSection(string heading, string body)
    {
        Console.WriteLine("# ------------------------------------------------------------------------------");
        Console.Write("# ");
        Console.WriteLine(heading);
        Console.WriteLine("# ------------------------------------------------------------------------------");
        Console.Write(body);

        if (!body.EndsWith(Environment.NewLine, StringComparison.Ordinal))
            Console.WriteLine();

        Console.WriteLine();
    }

    private static string BuildBash(AzRolesOptions opts)
    {
        string qAssignee = QuoteBashSingle(opts.Assignee);
        string qScope = QuoteBashSingle(opts.ScopePath);
        CultureInfo invariant = CultureInfo.InvariantCulture;

        StringBuilder sb = new();
        sb.AppendLine("# Tier-2 Azure Extractor RBAC — Reader + Cost Management Reader (read-only only)");
        sb.AppendLine("# References: docs/library/V1_SCOPE.md (Tier 2 continuous extractor principals).");

        sb.Append(invariant,
            $"{Environment.NewLine}az role assignment create --assignee {qAssignee} --role 'Reader' --scope {qScope}{Environment.NewLine}");

        sb.Append(invariant,
            $"az role assignment create --assignee {qAssignee} --role 'Cost Management Reader' --scope {qScope}{Environment.NewLine}");

        return sb.ToString();
    }

    /// <remarks>Embeds POSIX <c>'...'</c> quoting; internal single-quotes split with <c>'"'"'</c> concatenation.</remarks>
    internal static string QuoteBashSingle(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        const string escape = "'" + "\"" + "'" + "\"" + "'";

        return "'" + string.Join(escape, value.Split('\'')) + "'";
    }

    private static string BuildPowerShell(AzRolesOptions opts)
    {
        string a = EscapePoShSingleQuoted(opts.Assignee);
        string s = EscapePoShSingleQuoted(opts.ScopePath);
        CultureInfo invariant = CultureInfo.InvariantCulture;

        StringBuilder sb = new();
        sb.AppendLine("# Tier-2 Azure Extractor RBAC — Reader + Cost Management Reader (read-only only)");
        sb.AppendLine("# References: docs/library/V1_SCOPE.md (Tier 2 continuous extractor principals).");

        sb.Append(invariant,
            $"{Environment.NewLine}az role assignment create --assignee '{a}' --role 'Reader' --scope '{s}'{Environment.NewLine}");

        sb.Append(invariant,
            $"az role assignment create --assignee '{a}' --role 'Cost Management Reader' --scope '{s}'{Environment.NewLine}");

        return sb.ToString();
    }

    private static string EscapePoShSingleQuoted(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        return value.Replace("'", "''", StringComparison.Ordinal);
    }
}
