namespace ArchLucid.Api.Tests;

/// <summary>
///     Optional slow-shard diagnostics (CI #2377): set <c>ARCHLUCID_INTEGRATION_TEST_DIAG=1</c> on the slow-API job.
/// </summary>
internal static class IntegrationTestDiagnosticEnvironment
{
    internal static bool IsEnabled =>
        string.Equals(
            Environment.GetEnvironmentVariable("ARCHLUCID_INTEGRATION_TEST_DIAG"),
            "1",
            StringComparison.Ordinal);

    internal static void LogThreadPoolSnapshot(string context, TimeSpan elapsed)
    {
        ThreadPool.GetAvailableThreads(out int workerAvailable, out int ioAvailable);
        ThreadPool.GetMaxThreads(out int workerMax, out int ioMax);

        Console.Error.WriteLine(
            "[IntegrationTestDiag] "
            + context
            + " elapsed="
            + elapsed.TotalSeconds.ToString("N0", System.Globalization.CultureInfo.InvariantCulture)
            + "s threadPool="
            + workerAvailable.ToString(System.Globalization.CultureInfo.InvariantCulture)
            + "/"
            + workerMax.ToString(System.Globalization.CultureInfo.InvariantCulture)
            + " io="
            + ioAvailable.ToString(System.Globalization.CultureInfo.InvariantCulture)
            + "/"
            + ioMax.ToString(System.Globalization.CultureInfo.InvariantCulture)
            + " at "
            + DateTime.UtcNow.ToString("HH:mm:ss.fff", System.Globalization.CultureInfo.InvariantCulture)
            + "Z");
    }
}
