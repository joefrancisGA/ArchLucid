namespace ArchLucid.Cli.Commands;

/// <summary>
///     Result of writing a buyer-safe proof-packet folder for a committed run.
/// </summary>
internal sealed record PilotProofPacketWriteOutcome(int ExitCode, string OutputDirectory);
