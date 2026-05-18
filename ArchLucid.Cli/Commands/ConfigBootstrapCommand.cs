using System.Diagnostics.CodeAnalysis;
using System.Text;

using Spectre.Console;

namespace ArchLucid.Cli.Commands;

/// <summary><c>archlucid config bootstrap</c> — prompts for SQL + Azure OpenAI and merges into development appsettings.</summary>
[ExcludeFromCodeCoverage(Justification = "Console prompts and ANSI rendering.")]
internal static class ConfigBootstrapCommand
{
    internal static async Task<int> RunAsync(string[] args, HttpClient? httpClient = null)
    {
        if (CliExecutionContext.JsonOutput)
        {
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Interactive config bootstrap does not support the leading global --json flag.");

            return CliExitCode.UsageError;
        }

        if (!TryParseArgs(args, out string? outputPath, out bool force, out string? parseError))
        {
            if (!string.IsNullOrEmpty(parseError))
                await Console.Error.WriteLineAsync(parseError);

            Console.WriteLine("Usage: archlucid config bootstrap [--out <path>] [--force]");

            return CliExitCode.UsageError;
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(outputPath);

        AnsiConsole.Write(
            new Panel(
                    "[bold]ArchLucid development bootstrap[/] — merges SQL + [grey]AzureOpenAI[/] into [grey]appsettings.Development.json[/].")
                .Border(BoxBorder.Rounded));

        string connectionString = AnsiConsole.Prompt(
            new TextPrompt<string>("SQL [grey]ConnectionStrings:ArchLucid[/]")
                .PromptStyle("grey")
                .Secret()
                .Validate(raw =>
                {
                    try
                    {
                        InitAppsettingsDocumentBuilder.ValidateSqlConnectionString(raw);

                        return ValidationResult.Success();
                    }
                    catch (Exception ex)
                    {
                        return ValidationResult.Error($"Not a valid SQL connection string ({ex.Message}).");
                    }
                }));

        string endpoint = AnsiConsole.Prompt(
            new TextPrompt<string>("Azure OpenAI [grey]Endpoint[/] [dim](https://{resource}.openai.azure.com/)[/]")
                .PromptStyle("grey")
                .Validate(raw =>
                {
                    try
                    {
                        ConfigBootstrapDocumentMerger.ValidateHttpsResourceEndpoint(raw);

                        return ValidationResult.Success();
                    }
                    catch (ArgumentException ex)
                    {
                        return ValidationResult.Error(ex.Message);
                    }
                }));

        string apiKey = AnsiConsole.Prompt(
            new TextPrompt<string>("Azure OpenAI [grey]ApiKey[/] [dim](hidden; not echoed)[/]")
                .PromptStyle("grey")
                .Secret()
                .Validate(raw =>
                    string.IsNullOrWhiteSpace(raw)
                        ? ValidationResult.Error("API key is required.")
                        : ValidationResult.Success()));

        string deploymentName = AnsiConsole.Prompt(
            new TextPrompt<string>("Azure OpenAI [grey]DeploymentName[/] (chat completion deployment)")
                .PromptStyle("grey")
                .Validate(raw =>
                    string.IsNullOrWhiteSpace(raw)
                        ? ValidationResult.Error("Deployment name is required.")
                        : ValidationResult.Success()));

        ConfigBootstrapAnswers answers = new()
        {
            ConnectionStringsArchLucid = connectionString,
            AzureOpenAiEndpoint = endpoint,
            AzureOpenAiApiKey = apiKey,
            AzureOpenAiDeploymentName = deploymentName,
        };

        Table preview = new Table().Expand().Border(TableBorder.Simple);
        preview.AddColumn("Setting");
        preview.AddColumn("Value");
        preview.AddRow("Output path", Markup.Escape(outputPath));
        preview.AddRow("SQL target", Markup.Escape(InitAppsettingsDocumentBuilder.DescribeSqlConnection(connectionString)));
        preview.AddRow("Azure OpenAI endpoint", Markup.Escape(endpoint.Trim()));
        preview.AddRow("Deployment", Markup.Escape(deploymentName.Trim()));
        preview.AddRow("API key", "[grey](stored in JSON; not shown here)[/]");

        AnsiConsole.Write(preview);

        bool ownsClient = httpClient is null;

        httpClient ??= new HttpClient { Timeout = TimeSpan.FromSeconds(30) };

        try
        {
            AzureOpenAiBootstrapProbeResult probe = await AzureOpenAiBootstrapConnectivityProbe.ProbeAsync(
                httpClient,
                answers.AzureOpenAiEndpoint,
                answers.AzureOpenAiApiKey).ConfigureAwait(false);

            if (!probe.Succeeded)
            {
                AnsiConsole.MarkupLine($"[red]{Markup.Escape(probe.Error ?? "Azure OpenAI probe failed.")}[/]");

                return CliExitCode.OperationFailed;
            }

            AnsiConsole.MarkupLine(
                $"[green]Azure OpenAI connectivity OK[/] [dim](HTTP {probe.HttpStatusCode})[/]");
        }
        finally
        {
            if (ownsClient)
                httpClient.Dispose();
        }

        if (!AnsiConsole.Confirm("Write appsettings JSON?"))
        {
            AnsiConsole.MarkupLine("[yellow]Cancelled — no files written.[/]");

            return CliExitCode.Success;
        }

        if (File.Exists(outputPath) && !force)
        {
            if (!AnsiConsole.Confirm($"Overwrite existing file '{outputPath}'?", false))
            {
                AnsiConsole.MarkupLine("[yellow]Cancelled — file already exists.[/]");

                return CliExitCode.Success;
            }
        }

        string? existing = File.Exists(outputPath) ? await File.ReadAllTextAsync(outputPath) : null;

        string json;
        try
        {
            json = ConfigBootstrapDocumentMerger.MergeToIndentedJson(existing, answers);
        }
        catch (Exception ex)
        {
            AnsiConsole.MarkupLine($"[red]{Markup.Escape($"Could not build JSON: {ex.Message}")}[/]");

            return CliExitCode.OperationFailed;
        }

        UTF8Encoding utf8NoBom = new(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: true);
        await File.WriteAllTextAsync(outputPath, json, utf8NoBom);

        AnsiConsole.MarkupLine($"[green]Wrote[/] {Markup.Escape(outputPath)}");

        return CliExitCode.Success;
    }

    private static bool TryParseArgs(string[] args, out string? outputPath, out bool force, out string? parseError)
    {
        outputPath = null;
        force = false;
        parseError = null;

        string resolvedOut = Path.GetFullPath(Path.Combine(Environment.CurrentDirectory, "appsettings.Development.json"));

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--json", StringComparison.Ordinal))
            {
                parseError = "config bootstrap does not support --json (interactive wizard only).";

                return false;
            }

            if (string.Equals(token, "--force", StringComparison.Ordinal))
            {
                force = true;

                continue;
            }

            if (string.Equals(token, "--out", StringComparison.Ordinal))
            {
                if (i + 1 >= args.Length || args[i + 1].StartsWith('-'))
                {
                    parseError = "Expected a file path after --out.";

                    return false;
                }

                resolvedOut = Path.GetFullPath(args[++i]);

                continue;
            }

            if (token.StartsWith('-'))
            {
                parseError = $"Unknown flag: {token}";

                return false;
            }

            parseError = $"Unexpected argument: {token}";

            return false;
        }

        outputPath = resolvedOut;

        return true;
    }
}
