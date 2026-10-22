using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Core")]
public sealed class CommandRegistryTests
{
    [Fact]
    public void TryResolve_known_command_returns_handler()
    {
        bool resolved = CommandRegistry.Default.TryResolve("health", out CliCommandHandler? handler);

        resolved.Should().BeTrue();
        handler.Should().NotBeNull();
        CommandRegistry.Default.TryResolve("health", out CliCommandHandler? again).Should().BeTrue();
        handler.Should().BeSameAs(again);
    }

    [Fact]
    public void TryResolve_alias_maps_to_same_handler()
    {
        CommandRegistry.Default.TryResolve("doctor", out CliCommandHandler? doctorHandler).Should().BeTrue();
        CommandRegistry.Default.TryResolve("check", out CliCommandHandler? checkHandler).Should().BeTrue();
        doctorHandler.Should().BeSameAs(checkHandler);

        CommandRegistry.Default.TryResolve("reference-evidence", out CliCommandHandler? referenceHandler).Should().BeTrue();
        CommandRegistry.Default.TryResolve("proof-pack", out CliCommandHandler? proofPackHandler).Should().BeTrue();
        referenceHandler.Should().BeSameAs(proofPackHandler);
    }

    [Fact]
    public void TryResolve_unknown_command_returns_false()
    {
        bool resolved = CommandRegistry.Default.TryResolve("not-a-real-command", out CliCommandHandler? handler);

        resolved.Should().BeFalse();
        handler.Should().BeNull();
    }

    [Fact]
    public async Task DispatchAsync_unknown_command_returns_usage_error_and_prints_message()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut, out TextWriter prevErr);
        try
        {
            int exitCode = await CommandRegistry.Default.DispatchAsync(["invalid-command"]);

            exitCode.Should().Be(CliExitCode.UsageError);
            (outWriter + errWriter.ToString()).Should().Contain("Unknown command: invalid-command");
        }
        finally
        {
            RestoreConsole(prevOut, prevErr);
        }
    }

    [Fact]
    public void Descriptors_include_registered_commands_for_help()
    {
        IReadOnlyList<CommandDescriptor> descriptors = CommandRegistry.Default.Descriptors;

        descriptors.Should().NotBeEmpty();
        descriptors.Select(d => d.Name).Should().Contain("health");
        descriptors.Select(d => d.Name).Should().Contain("pilot");
        descriptors.Should().OnlyContain(d => !string.IsNullOrWhiteSpace(d.Usage));
    }

    private static void RedirectConsole(
        out StringWriter outWriter,
        out StringWriter errWriter,
        out TextWriter prevOut,
        out TextWriter prevErr)
    {
        outWriter = new StringWriter();
        errWriter = new StringWriter();
        prevOut = Console.Out;
        prevErr = Console.Error;
        Console.SetOut(outWriter);
        Console.SetError(errWriter);
    }

    private static void RestoreConsole(TextWriter prevOut, TextWriter prevErr)
    {
        Console.SetOut(prevOut);
        Console.SetError(prevErr);
    }
}
