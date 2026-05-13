using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>
///     Minimal <see cref="IHostEnvironment" /> for composition DI tests (no generic host builder).
/// </summary>
public sealed class CompositionTestHostEnvironment(string environmentName) : IHostEnvironment
{
    public string EnvironmentName
    {
        get;
        set;
    } = environmentName ?? throw new ArgumentNullException(nameof(environmentName));

    public string ApplicationName
    {
        get;
        set;
    } = "ArchLucid.Host.Composition.Tests";

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
