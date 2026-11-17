using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

internal static class AgentModelTierResolverTestsHelper
{
    internal static AgentModelTierResolver CreateResolver(
        IReadOnlyDictionary<string, string?> configValues,
        AgentModelTierOptions options)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues!)
            .Build();

        IOptionsMonitor<AgentModelTierOptions> optionsMonitor = new TestOptionsMonitor<AgentModelTierOptions>(options);

        AgentModelTierResolver resolver = new(configuration, optionsMonitor);
        AgentModelTierDefaults.ApplyDefaults(options);

        return resolver;
    }

    private sealed class TestOptionsMonitor<T>(T value) : IOptionsMonitor<T>
    {
        public T CurrentValue { get; private set; } = value;

        public T Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            public static NullDisposable Instance { get; } = new();

            public void Dispose()
            {
            }
        }
    }
}
