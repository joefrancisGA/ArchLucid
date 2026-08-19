namespace ArchLucid.Api.Validators;

internal static class WizardPilotRequestSourceValues
{
    internal const string Wizard = "wizard";
    internal const string Cli = "cli";
    internal const string Recurrence = "recurrence";

    internal static bool IsKnown(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return string.Equals(value.Trim(), Wizard, StringComparison.OrdinalIgnoreCase)
               || string.Equals(value.Trim(), Cli, StringComparison.OrdinalIgnoreCase)
               || string.Equals(value.Trim(), Recurrence, StringComparison.OrdinalIgnoreCase);
    }
}
