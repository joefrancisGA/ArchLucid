namespace ArchLucid.TestSupport;

/// <summary>
/// Resets static <see cref="Console.Out" /> / <see cref="Console.Error" /> after tests that redirect output.
/// Prevents cascade <see cref="ObjectDisposedException" /> when a disposed <see cref="StringWriter" /> remains hooked.
/// </summary>
public static class CliConsoleTestReset
{
    /// <summary>Rebinds console writers to the process standard streams (auto-flush).</summary>
    public static void ResetStandardConsoleStreams()
    {
        Console.SetOut(new StreamWriter(Console.OpenStandardOutput()) { AutoFlush = true });
        Console.SetError(new StreamWriter(Console.OpenStandardError()) { AutoFlush = true });
    }
}
