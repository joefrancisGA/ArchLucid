namespace ArchLucid.Cli.Commands;

/// <summary>Injectable seams for <see cref="DraftNewCommand" /> unit tests.</summary>
internal sealed class DraftNewCommandHooks
{
    public Func<string, CancellationToken, Task<ApiConnectionOutcome>> ConnectAsync { get; init; } =
        (baseUrl, ct) => CliCommandShared.TryConnectToApiAsync(baseUrl, CliCommandShared.TryLoadConfigFromCwd(), ct);

    public Func<string, ArchLucidProjectScaffolder.ArchLucidCliConfig?, ArchLucidApiClient> CreateApiClient { get; init; } =
        (baseUrl, config) => new ArchLucidApiClient(baseUrl, config);

    public Func<string, CancellationToken, Task<string?>> ReadLineAsync { get; init; } =
        async (_, ct) =>
        {
            ct.ThrowIfCancellationRequested();

            return await Console.In.ReadLineAsync(ct);
        };

    public Func<string, TextWriter, CancellationToken, Task<string?>> PromptRequiredAsync { get; init; } =
        async (label, output, ct) =>
        {
            while (true)
            {
                ct.ThrowIfCancellationRequested();
                await output.WriteLineAsync(label);
                string? line = await Console.In.ReadLineAsync(ct);

                if (!string.IsNullOrWhiteSpace(line))
                    return line.Trim();

                await output.WriteLineAsync("A non-empty value is required.");
            }
        };
}
