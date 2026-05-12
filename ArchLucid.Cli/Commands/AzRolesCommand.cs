using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid az-roles</c> emits copy-ready <c>az role assignment create</c> lines for Tier-2 Azure Extractor principals:
///     built-in <c>Reader</c> and <c>Cost Management Reader</c>.
/// </summary>
internal static class AzRolesCommand
{
    internal const string ReaderRole = "Reader";

    internal const string CostManagementReaderRole = "Cost Management Reader";

    public static Task<int> RunAsync(string[] args)
    {
        if (!TryParseArgs(args, out AzRolesOptions? opts, out string? usageError))
        {

            WriteUsageFailure(usageError ?? "Invalid arguments.");

            return Task.FromResult(CliExitCode.UsageError);
        }

        WriteOutput(opts);

        return Task.FromResult(CliExitCode.Success);
    }

    private static bool TryParseArgs(string[] args, out AzRolesOptions? options, out string? error)
    {

        options = null;
        error = null;
        string? subscription = null;
        string? scope = null;
        string? assignee = null;

        AzRolesShellKind shellKind = AzRolesShellKind.Both;

        for (int i = 0; i < args.Length; i++)
        {
            string a = args[i];
            string sw = SwitchName(a);

            if (sw.Length == 0)
            {

                error = $"Unexpected positional argument '{a}'. Use flags only.";

                return false;

            }

            switch (sw)
            {
                case "subscription":
                case "s":
                    if (!TryConsume(args, ref i, out subscription))

                        error = "--subscription requires a value.";

                    break;

                case "assignee":
                case "a":
                    if (!TryConsume(args, ref i, out assignee))

                        error = "--assignee requires a value.";

                    break;

                case "scope":
                    if (!TryConsume(args, ref i, out scope))

                        error = "--scope requires a value.";

                    break;

                case "shell":
                case "format":
                    if (!TryConsume(args, ref i, out string? shellVal))

                        error = "--shell requires a value (bash | powershell | both).";

                    else if (!TryParseShellKind(shellVal, out shellKind))

                        error = $"Invalid --shell value '{shellVal}'. Use bash, powershell, or both.";

                    break;

                default:

                    error = $"Unknown argument '{a}'.";

                    break;

            }

            if (error is not null)

                return false;

        }

        if (string.IsNullOrWhiteSpace(assignee))

        {

            error = "Missing required --assignee <object-id-or-app-id>.";

            return false;

        }

        assignee = assignee.Trim();

        bool hasSub = !string.IsNullOrWhiteSpace(subscription);
        bool hasScope = !string.IsNullOrWhiteSpace(scope);

        if (hasSub && hasScope)

        {

            error = "Specify either --subscription or --scope (not both).";

            return false;

        }

        if (!hasSub && !hasScope)

        {

            error = "Provide either --subscription <guid> or --scope <full-arm-scope>.";

            return false;

        }

        if (hasSub)

        {

            subscription = subscription!.Trim();

            if (!Guid.TryParse(subscription, out _))
            {

                error =
                    $"--subscription '{subscription}' is not a valid GUID. Fix the literal or switch to --scope with a full ARM path.";

                return false;

            }

        }

        if (hasScope)

        {

            scope = NormalizeArmScope(scope!.Trim());

            if (!scope.StartsWith('/', StringComparison.Ordinal))

            {

                error =
                    "--scope must start with '/', e.g. /subscriptions/{guid} or /providers/Microsoft.Management/managementGroups/{id}.";

                return false;

            }

            if (scope.Contains("..", StringComparison.Ordinal) || scope.Contains('\\', StringComparison.Ordinal))

            {

                error = "--scope must be a canonical ARM scope path.";

                return false;

            }

        }

        options = hasSub ? AzRolesOptions.ForSubscription(shellKind, assignee, Guid.Parse(subscription!, CultureInfo.InvariantCulture)) :
            AzRolesOptions.ForScope(shellKind, assignee, scope!);

        return true;

    }

    private static bool TryConsume(string[] args, ref int index, [NotNullWhen(true)] out string? value)
    {

        if (index + 1 >= args.Length)
        {

            value = null;

            return false;

        }

        index++;

        value = args[index]?.Trim();

        return !string.IsNullOrEmpty(value);

    }

    private static string SwitchName(string raw)

    {

        if (raw.StartsWith("--", StringComparison.Ordinal))

            return raw[2..].ToLowerInvariant();

        if (raw.StartsWith('-') && raw.Length == 2)

            return raw[1..].ToLowerInvariant();

        return string.Empty;

    }

    private static bool TryParseShellKind(string value, out AzRolesShellKind shellKind)

    {

        shellKind = AzRolesShellKind.Both;

        switch (value.Trim().ToLowerInvariant())
        {

            case "bash":

            case "sh":

            case "zsh":

                shellKind = AzRolesShellKind.Bash;

                return true;

            case "powershell":

            case "pwsh":

                shellKind = AzRolesShellKind.PowerShell;

                return true;

            case "both":

            case "all":

                shellKind = AzRolesShellKind.Both;

                return true;

            default:

                return false;

        }

    }

    private static string NormalizeArmScope(string scope)

    {

        scope = Uri.UnescapeDataString(scope);

        return Regex.Replace(scope, "//+", "/", RegexOptions.None);

    }

    private static void WriteUsageFailure(string message)

    {

        string hint =
            "Usage: archlucid az-roles --subscription <subscription-guid> --assignee <principal> [--shell bash|powershell|both]"
            + Environment.NewLine + "   or: archlucid az-roles --scope <full-arm-scope> --assignee <principal> [--shell bash|powershell|both]"
            + Environment.NewLine + "principal: managed identity principal id / service principal object id / application (client) id." + Environment.NewLine
            + "scope examples: /subscriptions/{guid}; /providers/Microsoft.Management/managementGroups/{id}";

        if (CliExecutionContext.JsonOutput)

            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", $"{message}{Environment.NewLine}{hint}");

        else

            Console.Error.WriteLine($"az-roles: {message}{Environment.NewLine}{hint}");

    }

    private static void WriteOutput(AzRolesOptions opts)

    {

        if (CliExecutionContext.JsonOutput)

        {

            JsonObject root = new()

            {

                ["ok"] = true,
                ["roles"] = new JsonArray(ReaderRole, CostManagementReaderRole),
                ["scope"] = opts.ScopePath,
                ["shell"] = ShellKindJsonLabel(opts.ShellKind)
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

        if (opts.ShellKind == AzRolesShellKind.Bash)

            Console.Write(BuildBash(opts));

        else

            Console.Write(BuildPowerShell(opts));

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
        sb.AppendLine(invariant, "# Tier-2 Azure Extractor RBAC — Reader + Cost Management Reader (read-only only)");
        sb.AppendLine(invariant, "# References: docs/library/V1_SCOPE.md (Tier 2 continuous extractor principals).");

        sb.Append(invariant,

            $"{Environment.NewLine}az role assignment create --assignee {qAssignee} --role 'Reader' --scope {qScope}{Environment.NewLine}");

        sb.Append(invariant,

            $"az role assignment create --assignee {qAssignee} --role 'Cost Management Reader' --scope {qScope}{Environment.NewLine}");

        return sb.ToString();

    }

    /// <remarks>Embeds POSIX <c>'...'</c> quoting; internal single-quotes split with <c>'"'"'</c> concatenation.</remarks>
    private static string QuoteBashSingle(string value)
    {

        ArgumentNullException.ThrowIfNull(value);

        string escape = "'" + "\"" + "'" + "\"" + "'";

        return "'" + string.Join(escape, value.Split('\'')) + "'";
    }

    private static string BuildPowerShell(AzRolesOptions opts)

    {

        string a = EscapePoShSingleQuoted(opts.Assignee);

        string s = EscapePoShSingleQuoted(opts.ScopePath);
        CultureInfo invariant = CultureInfo.InvariantCulture;

        StringBuilder sb = new();
        sb.AppendLine(invariant, "# Tier-2 Azure Extractor RBAC — Reader + Cost Management Reader (read-only only)");
        sb.AppendLine(invariant, "# References: docs/library/V1_SCOPE.md (Tier 2 continuous extractor principals).");

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

    private sealed class AzRolesOptions

    {

        private AzRolesOptions(AzRolesShellKind shellKind, string assignee, string scopePath)

        {

            ShellKind = shellKind;

            Assignee = assignee;

            ScopePath = scopePath;

        }

        internal AzRolesShellKind ShellKind

        {

            get;

        }

        internal string Assignee

        {

            get;

        }

        internal string ScopePath

        {

            get;

        }

        internal static AzRolesOptions ForSubscription(AzRolesShellKind shellKind, string assignee, Guid subscriptionId)

        {

            string scope = FormattableString.Invariant($"/subscriptions/{subscriptionId:D}");

            return new AzRolesOptions(shellKind, assignee, NormalizeArmScope(scope));

        }

        internal static AzRolesOptions ForScope(AzRolesShellKind shellKind, string assignee, string scopePath)

        {

            return new AzRolesOptions(shellKind, assignee, scopePath);

        }

    }

    private enum AzRolesShellKind
    {

        Bash,

        PowerShell,

        Both,

    }

}
