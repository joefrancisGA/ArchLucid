namespace ArchLucid.Cli.Commands;

/// <summary>Interactive answers for <see cref="ConfigBootstrapCommand" /> (SQL + Azure OpenAI host keys).</summary>
public sealed class ConfigBootstrapAnswers
{
    public required string ConnectionStringsArchLucid { get; init; }

    public required string AzureOpenAiEndpoint { get; init; }

    public required string AzureOpenAiApiKey { get; init; }

    public required string AzureOpenAiDeploymentName { get; init; }
}
