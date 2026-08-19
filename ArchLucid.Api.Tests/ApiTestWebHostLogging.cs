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

        // Serilog reads Serilog:* independently of Microsoft.Extensions.Logging levels.
        settings["Serilog:MinimumLevel:Default"] = "Warning";
        settings["Serilog:MinimumLevel:Override:Microsoft.AspNetCore"] = "Warning";
        settings["Serilog:MinimumLevel:Override:Microsoft.AspNetCore.Hosting.Diagnostics"] = "Warning";
        settings["Serilog:MinimumLevel:Override:Microsoft.Hosting.Lifetime"] = "Warning";
        settings["Serilog:MinimumLevel:Override:Microsoft.Extensions.Http"] = "Warning";
        settings["Serilog:MinimumLevel:Override:Polly"] = "Warning";
        settings["Serilog:MinimumLevel:Override:StackExchange.Redis"] = "Warning";
        settings["Serilog:MinimumLevel:Override:Azure"] = "Warning";
        settings["Serilog:MinimumLevel:Override:Azure.Core"] = "Warning";
        settings["Serilog:MinimumLevel:Override:Azure.Messaging.ServiceBus"] = "Warning";
    }
}
