namespace ArchLucid.Cli.Commands;

/// <summary>Outcome of a lightweight Azure OpenAI REST probe (list models).</summary>
public sealed class AzureOpenAiBootstrapProbeResult
{
    public required bool Succeeded { get; init; }

    public int? HttpStatusCode { get; init; }

    public string? Error { get; init; }
}
