using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests.Embedding;

internal static class OptionsMonitorTestExtensions
{
    public static IOptionsMonitor<T> ToMonitor<T>(this IOptions<T> options)
        where T : class
    {
        Mock<IOptionsMonitor<T>> monitor = new();
        monitor.SetupGet(m => m.CurrentValue).Returns(options.Value);

        return monitor.Object;
    }
}
