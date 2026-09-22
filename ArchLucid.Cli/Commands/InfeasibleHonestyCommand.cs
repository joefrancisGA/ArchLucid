using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary><c>archlucid infeasible honesty</c> — LN-023 CLI hard/soft infeasible honesty reference.</summary>
internal static class InfeasibleHonestyCommand
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    internal static Task<int> RunAsync(string[] args)
    {
        bool json = args.Any(static arg => string.Equals(arg, "--json", StringComparison.OrdinalIgnoreCase));

        if (json)
        {
            var payload = new
            {
                hardRequiresCitation = CliInfeasibleHonesty.HardRequiresCitationLine,
                softEnvelope = CliInfeasibleHonesty.SoftEnvelopeLine,
                uncitedHardRefusal = CliInfeasibleHonesty.UncitedHardRefusalLine,
                exitNotCareerComplete = CliInfeasibleHonesty.ExitNotCareerCompleteLine,
            };

            Console.WriteLine(JsonSerializer.Serialize(payload, JsonOptions));

            return Task.FromResult(0);
        }

        CliInfeasibleHonesty.WriteHelp();

        return Task.FromResult(0);
    }
}
