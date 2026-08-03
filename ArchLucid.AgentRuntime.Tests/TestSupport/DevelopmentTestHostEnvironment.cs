using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.AgentRuntime.Tests.TestSupport;

/// <summary>Non-production-like host for RealAgentExecutor unit tests (TB-950 empty AllowedTools still unrestricted).</summary>
internal sealed class DevelopmentTestHostEnvironment : IHostEnvironment
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
    } = ".";

    public IFileProvider ContentRootFileProvider
    {
        get;
        set;
    } = new NullFileProvider();
}
