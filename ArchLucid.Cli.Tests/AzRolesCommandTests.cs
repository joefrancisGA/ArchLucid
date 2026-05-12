using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzRolesCommandTests
{
    [Fact]
    public async Task Az_roles_subscription_mode_emits_bash_az_cli_lines()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut, out TextWriter prevErr);

        try
        {
            int code = await AzRolesCommand.RunAsync(
                ["--subscription", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "--assignee", "principal-1", "--shell", "bash"]);

            code.Should().Be(CliExitCode.Success);
            errWriter.ToString().Should().BeNullOrWhiteSpace();

            string text = outWriter.ToString();
            Regex.Matches(text, "az role assignment create").Count.Should().Be(2);
            text.Should().Contain("'Reader'");
            text.Should().Contain("'Cost Management Reader'");
            text.Should().Contain("--assignee 'principal-1'");
            text.Should().Contain("/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        }
        finally
        {
            Console.SetOut(prevOut);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task Az_roles_escapes_shell_single_quote_inside_assignee_for_bash()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter _, out TextWriter prevOut, out TextWriter prevErr);

        try
        {
            Guid sub = Guid.Parse("AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE");
            await AzRolesCommand.RunAsync(["--subscription", $"{sub:D}", "--assignee", "it's-a-test", "--shell", "bash"]);

            // Avoid duplicating the '"'"' idiom in the test; assert against the same helper the command uses.
            string bashAssigneeQuoted = AzRolesCommand.QuoteBashSingle("it's-a-test");
            outWriter.ToString().Should().Contain("--assignee " + bashAssigneeQuoted);
        }
        finally
        {
            Console.SetOut(prevOut);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task Az_roles_powershell_only_emits_ps_single_quoting_for_assignee_role_scope()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut, out TextWriter prevErr);

        try
        {
            await AzRolesCommand.RunAsync(
                ["--subscription", Guid.Empty.ToString("D"), "--assignee", "O'Reilly-Sp", "--shell", "powershell"]);

            string text = outWriter.ToString();
            text.Should().Contain("--assignee 'O''Reilly-Sp'");
            text.Should().Contain("Cost Management Reader");
            errWriter.ToString().Should().BeNullOrWhiteSpace();
        }
        finally
        {
            Console.SetOut(prevOut);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task Az_roles_both_shells_print_sections_and_four_az_lines()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter _, out TextWriter prevOut, out TextWriter prevErr);

        try
        {
            Guid mgRoot = Guid.Parse("11111111-1111-1111-1111-111111111111");

            await AzRolesCommand.RunAsync(
                ["--scope", $"/providers/Microsoft.Management/managementGroups/{mgRoot:D}", "--assignee", "sp-1"]);

            string text = outWriter.ToString();
            text.Should().Contain("Bash / sh / zsh");
            text.Should().Contain("PowerShell");
            Regex.Matches(text, "az role assignment create").Count.Should().Be(4);
            text.Should().Contain($"/providers/Microsoft.Management/managementGroups/{mgRoot:D}");
        }
        finally
        {
            Console.SetOut(prevOut);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task Program_az_roles_json_contains_baseline_scripts_when_shell_defaults_to_both()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut, out TextWriter prevErr);

        try
        {
            int exit =
                await Program.RunAsync(["--json", "az-roles", "--subscription", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                    "--assignee", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]);

            exit.Should().Be(CliExitCode.Success);
            JsonObject root = JsonNode.Parse(outWriter.ToString())!.AsObject();

            root["ok"]!.GetValue<bool>().Should().BeTrue();
            root["bashScript"]!.GetValue<string>().Should().Contain("az role assignment create");
            root["powershellScript"]!.GetValue<string>().Should().Contain("az role assignment create");
            root["roles"]!.AsArray()[0]!.GetValue<string>().Should().Be(AzRolesCommand.ReaderRole);

            root["roles"]!.AsArray()[1]!.GetValue<string>().Should().Be(AzRolesCommand.CostManagementReaderRole);

            errWriter.ToString().Should().BeNullOrWhiteSpace();
        }
        finally
        {
            Console.SetOut(prevOut);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task Program_az_roles_missing_assignee_returns_usage_exit()
    {
        RedirectConsole(out StringWriter _, out StringWriter errWriter, out TextWriter prevOut, out TextWriter prevErr);

        try
        {
            int exit = await Program.RunAsync(["az-roles", "--subscription", Guid.Empty.ToString("D")]);

            exit.Should().Be(CliExitCode.UsageError);
            errWriter.ToString().Should().Contain("az-roles:");
            errWriter.ToString().Should().Contain("--assignee");
        }
        finally
        {
            Console.SetOut(prevOut);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task Program_az_roles_subscription_scope_both_given_returns_usage_exit()
    {
        RedirectConsole(out StringWriter _, out StringWriter errWriter, out TextWriter prevOut, out TextWriter prevErr);

        try
        {
            Guid subscription = Guid.Parse("aaaaaaaa-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
            int exit = await Program.RunAsync(
                ["az-roles", "--subscription", $"{subscription:D}", "--assignee", "x", "--scope", "/subscriptions/ffff"]);

            exit.Should().Be(CliExitCode.UsageError);

            errWriter.ToString().Should().Contain("--subscription or --scope");

        }

        finally

        {

            Console.SetOut(prevOut);

            Console.SetError(prevErr);

        }

    }

    private static void RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut,
        out TextWriter prevErr)
    {
        outWriter = new StringWriter();
        errWriter = new StringWriter();
        prevOut = Console.Out;
        prevErr = Console.Error;
        Console.SetOut(outWriter);
        Console.SetError(errWriter);
    }
}
