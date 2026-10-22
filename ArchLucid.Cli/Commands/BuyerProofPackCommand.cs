namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid buyer-proof-pack</c> — email-sized ZIP after a committed pilot run (see assessment recorded decisions).
/// </summary>
internal static class BuyerProofPackCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        BuyerProofPackCommandOptions? options = BuyerProofPackCommandArgParser.Parse(args, out string? parseError);

        if (options is null)
        {
            await Console.Error.WriteLineAsync(parseError);

            return CliExitCode.UsageError;
        }

        (BuyerProofPackCommandFetch.Success? fetch, int fetchExit, string? fetchError) =
            await BuyerProofPackCommandFetch.RunAsync(options, cancellationToken);

        if (fetch is null)
        {
            if (fetchError is not null)
                await Console.Error.WriteLineAsync(fetchError);

            return fetchExit;
        }

        return await BuyerProofPackZipWriter.WriteAsync(fetch, options.OutZip, cancellationToken);
    }
}
