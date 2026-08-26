using System.Globalization;

namespace ArchLucid.Cli.Commands;

internal static partial class AzRolesCommand
{
    private sealed class AzRolesOptions
    {
        private AzRolesOptions(AzRolesShellKind shellKind, string assignee, string scopePath)
        {
            ShellKind = shellKind;
            Assignee = assignee;
            ScopePath = scopePath;
        }

        internal AzRolesShellKind ShellKind { get; }

        internal string Assignee { get; }

        internal string ScopePath { get; }

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
