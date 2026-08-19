using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.AgentRuntime.Tests.Support;

/// <summary>
///     Minimal non-production <see cref="IHostEnvironment" /> for unit tests (avoids Moq on extension methods).
/// </summary>
internal sealed class NonProductionTestHostEnvironment : IHostEnvironment
{
    public string EnvironmentName
    {
        get;
        set;
    } = Environments.Development;

    public string ApplicationName
    {
        get;
        set;
    } = "ArchLucid.AgentRuntime.Tests";

    public string ContentRootPath
    {
        get;
        set;
    } = "/";

    public IFileProvider ContentRootFileProvider
    {
        get;
        set;
    } = new NullFileProvider();
}
