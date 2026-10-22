using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>Composes the buyer-ready sponsor packet folder from existing proof generators (T2-7).</summary>
internal static partial class SponsorPacketWriter
{
    private static readonly UTF8Encoding Utf8NoBom = new(false);

    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };
}

/// <summary>Result of writing a sponsor packet folder.</summary>
internal sealed record SponsorPacketWriteOutcome(int ExitCode, string OutputDirectory, bool? DemoDataWarning);
