using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>
///     Minimal <see cref="IHostEnvironment" /> / <see cref="IWebHostEnvironment" /> for composition DI tests
///     (no generic host builder).
/// </summary>
public sealed class CompositionTestHostEnvironment(string environmentName) : IWebHostEnvironment
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

    public string WebRootPath
    {
        get;
        set;
    } = "/wwwroot";

    public IFileProvider WebRootFileProvider
    {
        get;
        set;
    } = new NullFileProvider();
}
