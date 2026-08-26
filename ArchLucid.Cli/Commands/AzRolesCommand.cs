using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text.RegularExpressions;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid az-roles</c> emits copy-ready <c>az role assignment create</c> lines for Tier-2 Azure Extractor principals:
///     built-in <c>Reader</c> and <c>Cost Management Reader</c>.
/// </summary>
internal static partial class AzRolesCommand
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

        ArgumentNullException.ThrowIfNull(opts);

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

            if (!scope.StartsWith("/", StringComparison.Ordinal))
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

        options = hasSub
            ? AzRolesOptions.ForSubscription(shellKind, assignee, Guid.Parse(subscription!, CultureInfo.InvariantCulture))
            : AzRolesOptions.ForScope(shellKind, assignee, scope!);

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

        value = args[index].Trim();

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
}
