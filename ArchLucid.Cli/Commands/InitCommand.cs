using System.Diagnostics.CodeAnalysis;
using System.Text;

using Spectre.Console;

namespace ArchLucid.Cli.Commands;

/// <summary><c>archlucid init</c> — interactive Spectre.Console wizard for Api appsettings (SQL + auth).</summary>
[ExcludeFromCodeCoverage(Justification = "Console prompts and ANSI rendering.")]
internal static class InitCommand
{
    internal static Task<int> RunAsync(string[] args)
    {
        if (CliExecutionContext.JsonOutput)
        {
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Interactive init does not support the leading global --json flag.");

            return Task.FromResult(CliExitCode.UsageError);
        }

        if (!TryParseArgs(args, out string? outputPath, out bool force, out string? parseError))
        {
            if (!string.IsNullOrEmpty(parseError))
                Console.Error.WriteLine(parseError);

            Console.WriteLine("Usage: archlucid init [--out <path>] [--force]");

            return Task.FromResult(CliExitCode.UsageError);
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(outputPath);

        AnsiConsole.Write(
            new Panel(
                    "[bold]ArchLucid host bootstrap[/] — generates JSON you can merge into [grey]ArchLucid.Api/appsettings*.json[/].")
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

        InitAuthWizardKind authKind = AnsiConsole.Prompt(
            new SelectionPrompt<InitAuthWizardKind>()
                .Title("Authentication mode [grey](ArchLucidAuth)[/]")
                .PageSize(10)
                .UseConverter(KindLabel)
                .AddChoices(
                    InitAuthWizardKind.JwtBearer,
                    InitAuthWizardKind.ApiKey,
                    InitAuthWizardKind.DevelopmentBypass));

        string? jwtAuthority = null;
        string? jwtAudience = null;
        string? jwtNameClaimType = null;
        string? apiAdminKey = null;
        string devUserId = "dev-user";
        string devUserName = "Developer";
        string devRole = "Admin";

        switch (authKind)
        {
            case InitAuthWizardKind.JwtBearer:
                jwtAuthority = AnsiConsole.Prompt(
                    new TextPrompt<string>(
                            "Entra [grey]Authority[/] [dim](issuer URL; example ends with /v2.0)[/]")
                        .PromptStyle("grey")
                        .Validate(raw =>
                            string.IsNullOrWhiteSpace(raw)
                                ? ValidationResult.Error("Authority URL is required.")
                                : ValidationResult.Success()));

                jwtAudience = AnsiConsole.Prompt(
                    new TextPrompt<string>("JWT [grey]Audience[/] (API application ID URI, e.g. api://archlucid-api)")
                        .PromptStyle("grey")
                        .Validate(raw =>
                            string.IsNullOrWhiteSpace(raw)
                                ? ValidationResult.Error("Audience is required.")
                                : ValidationResult.Success()));

                jwtNameClaimType = AnsiConsole.Prompt(
                    new TextPrompt<string>("JWT [grey]NameClaimType[/]")
                        .PromptStyle("grey")
                        .DefaultValue("preferred_username"));

                break;

            case InitAuthWizardKind.ApiKey:
                apiAdminKey = AnsiConsole.Prompt(
                    new TextPrompt<string>("[grey]Authentication:ApiKey:AdminKey[/]")
                        .PromptStyle("grey")
                        .Secret()
                        .Validate(raw =>
                            string.IsNullOrWhiteSpace(raw)
                                ? ValidationResult.Error("Admin API key is required.")
                                : ValidationResult.Success()));

                break;

            case InitAuthWizardKind.DevelopmentBypass:
                devUserId = AnsiConsole.Prompt(
                    new TextPrompt<string>("Development [grey]DevUserId[/]").PromptStyle("grey").DefaultValue(devUserId));

                devUserName = AnsiConsole.Prompt(
                    new TextPrompt<string>("Development [grey]DevUserName[/]").PromptStyle("grey").DefaultValue(devUserName));

                devRole = AnsiConsole.Prompt(
                    new TextPrompt<string>("Development [grey]DevRole[/] (Admin | Operator | Reader)")
                        .PromptStyle("grey")
                        .DefaultValue(devRole));

                break;

            default:
                throw new ArgumentOutOfRangeException(nameof(authKind), authKind, null);
        }

        InitWizardAnswers answers = new()
        {
            ConnectionStringsArchLucid = connectionString,
            AuthKind = authKind,
            JwtAuthority = jwtAuthority,
            JwtAudience = jwtAudience,
            JwtNameClaimType = jwtNameClaimType,
            ApiAdminKey = apiAdminKey,
            DevUserId = devUserId,
            DevUserName = devUserName,
            DevRole = devRole,
        };

        Table preview = new Table().Expand().Border(TableBorder.Simple);
        preview.AddColumn("Setting");
        preview.AddColumn("Value");
        preview.AddRow("Output path", Markup.Escape(outputPath));
        preview.AddRow("SQL target", Markup.Escape(InitAppsettingsDocumentBuilder.DescribeSqlConnection(connectionString)));
        preview.AddRow("Auth mode", KindLabel(authKind));

        if (authKind == InitAuthWizardKind.JwtBearer)
        {
            preview.AddRow("Authority", Markup.Escape(jwtAuthority ?? string.Empty));
            preview.AddRow("Audience", Markup.Escape(jwtAudience ?? string.Empty));
            preview.AddRow("Name claim", Markup.Escape(jwtNameClaimType ?? string.Empty));
        }

        if (authKind == InitAuthWizardKind.ApiKey)
            preview.AddRow("Admin API key", "[grey](masked — stored verbatim in JSON)[/]");

        if (authKind == InitAuthWizardKind.DevelopmentBypass)
        {
            preview.AddRow("Dev user id", Markup.Escape(devUserId));
            preview.AddRow("Dev user name", Markup.Escape(devUserName));
            preview.AddRow("Dev role", Markup.Escape(devRole));
        }

        AnsiConsole.Write(preview);

        if (!AnsiConsole.Confirm("Write appsettings JSON?", true))
        {
            AnsiConsole.MarkupLine("[yellow]Cancelled — no files written.[/]");

            return Task.FromResult(CliExitCode.Success);
        }

        if (File.Exists(outputPath) && !force)
        {
            if (!AnsiConsole.Confirm($"Overwrite existing file '{outputPath}'?", false))
            {
                AnsiConsole.MarkupLine("[yellow]Cancelled — file already exists.[/]");

                return Task.FromResult(CliExitCode.Success);
            }
        }

        string json = InitAppsettingsDocumentBuilder.BuildIndentedJson(answers);
        UTF8Encoding utf8NoBom = new(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: true);

        File.WriteAllText(outputPath, json, utf8NoBom);

        AnsiConsole.MarkupLine($"[green]Wrote[/] {Markup.Escape(outputPath)}");

        return Task.FromResult(CliExitCode.Success);
    }

    private static bool TryParseArgs(string[] args, out string? outputPath, out bool force, out string? parseError)
    {
        outputPath = null;
        force = false;
        parseError = null;

        string resolvedOut = Path.GetFullPath(Path.Combine(Environment.CurrentDirectory, "appsettings.json"));

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--json", StringComparison.Ordinal))
            {
                parseError = "init does not support --json (interactive wizard only).";

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

    private static string KindLabel(InitAuthWizardKind kind) =>
        kind switch
        {
            InitAuthWizardKind.JwtBearer => "JwtBearer (Microsoft Entra ID)",
            InitAuthWizardKind.ApiKey => "ApiKey (shared secret header)",
            InitAuthWizardKind.DevelopmentBypass => "DevelopmentBypass (local/dev only)",
            _ => kind.ToString(),
        };
}
