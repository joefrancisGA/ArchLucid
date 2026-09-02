using System.Text.Json;

using ArchLucid.Cli;
using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuyerPacketFolderWriterTests : IDisposable
{
    private readonly string _dir;

    public BuyerPacketFolderWriterTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), "BuyerPacketFolderWriterTests." + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_dir))
            Directory.Delete(_dir, true);
    }

    [Fact]
    public void PrettyPrintJson_indents_payload()
    {
        string pretty = BuyerPacketFolderWriter.PrettyPrintJson("""{"a":1}""");

        pretty.Should().Contain(Environment.NewLine);
        pretty.Should().Contain("\"a\"");
    }

    [Fact]
    public async Task WriteJsonRawAsync_writes_indented_file()
    {
        await BuyerPacketFolderWriter.WriteJsonRawAsync(_dir, "sample.json", """{"x":true}""");

        string text = await File.ReadAllTextAsync(Path.Combine(_dir, "sample.json"));

        text.Should().Contain("\"x\"");
    }

    [Fact]
    public void TryReadText_returns_null_when_missing()
    {
        BuyerPacketFolderWriter.TryReadText(Path.Combine(_dir, "missing.txt")).Should().BeNull();
    }

    [Fact]
    public void RunClaimLintOrFail_fails_on_unsafe_claim()
    {
        string unsafePath = Path.Combine(_dir, "bad.md");
        File.WriteAllText(unsafePath, "This pilot delivered guaranteed savings for the sponsor.");

        using StringWriter errors = new();
        int exit = BuyerPacketFolderWriter.RunClaimLintOrFail(_dir, skipClaimLint: false, errors);

        exit.Should().Be(CliExitCode.OperationFailed);
        errors.ToString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void RunClaimLintOrFail_skips_when_requested()
    {
        File.WriteAllText(Path.Combine(_dir, "bad.md"), "This pilot delivered guaranteed savings for the sponsor.");

        using StringWriter errors = new();
        int exit = BuyerPacketFolderWriter.RunClaimLintOrFail(_dir, skipClaimLint: true, errors);

        exit.Should().Be(CliExitCode.Success);
    }
}
