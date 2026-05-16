namespace ArchLucid.Api.Tests;

/// <summary>
///     Shared defaults for <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> hosts so API
///     integration runs do not flood the test console with Information-level application logs.
/// </summary>
internal static class ApiTestWebHostLogging
{
    /// <summary>Raises the default host log threshold for xUnit console output.</summary>
    internal static void AddQuietDefaultLogLevel(IDictionary<string, string?> settings)
    {
        ArgumentNullException.ThrowIfNull(settings);
        settings["Logging:LogLevel:Default"] = "Warning";
    }
}
