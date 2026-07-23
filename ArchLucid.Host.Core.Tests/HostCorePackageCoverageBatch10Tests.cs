using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Host.Core.Startup.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch10Tests
{
    [Fact]
    public void DraftIntakeReasoningContextBuilder_serializes_draft_document_fields()
    {
        DraftRequestDocument document = new()
        {
            FreeTextIntent = "Modernize claims intake",
            SystemName = "Claims API",
            BusinessOutcome = "Reduce manual review time",
            ActorSet = new ActorSet
            {
                Actors = [new ActorDescriptor { Label = "Claims adjuster" }],
            },
            QuestionAnswers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["region"] = "us-east" },
            RequiredMustQuestionKeys = ["data-classification"],
            TransparencyTrail = new TransparencyTrail
            {
                Asserted =
                [
                    new AssertedTrailEntry
                    {
                        Key = "businessOutcome",
                        Value = "Reduce manual review time",
                    },
                ],
            },
        };

        string json = DraftIntakeReasoningContextBuilder.BuildContextJson(document);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("freeTextIntent").GetString().Should().Be("Modernize claims intake");
        root.GetProperty("systemName").GetString().Should().Be("Claims API");
        root.GetProperty("businessOutcome").GetString().Should().Be("Reduce manual review time");
        root.GetProperty("questionAnswers").GetProperty("region").GetString().Should().Be("us-east");
        root.GetProperty("requiredMustQuestionKeys").EnumerateArray().Should().ContainSingle();
        root.GetProperty("transparencyTrail").GetProperty("asserted").GetArrayLength().Should().Be(1);

        Action nullDocument = () => DraftIntakeReasoningContextBuilder.BuildContextJson(null!);
        nullDocument.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(OpenAiCircuitBreakerKeys.Completion, "completion")]
    [InlineData(OpenAiCircuitBreakerKeys.CompletionFallback, "completion_fallback")]
    [InlineData(OpenAiCircuitBreakerKeys.Embedding, "embedding")]
    [InlineData("CustomGate", "unknown")]
    public void OpenAiCircuitBreakerHealthMetadata_resolves_roles(string gateName, string expectedRole)
    {
        OpenAiCircuitBreakerHealthMetadata.Provider.Should().Be("AzureOpenAI");
        OpenAiCircuitBreakerHealthMetadata.ResolveRole(gateName).Should().Be(expectedRole);
    }

    [Fact]
    public void StartupConfigurationDiagnostics_skips_when_disabled()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Hosting:LogStartupConfigurationSummary"] = "false" })
            .Build();

        TestLogger logger = new();
        IHostEnvironment environment = new TestHostEnvironment();

        StartupConfigurationDiagnostics.LogIfEnabled(
            logger,
            configuration,
            environment,
            typeof(HostCorePackageCoverageBatch10Tests).Assembly);

        logger.Messages.Should().BeEmpty();
    }

    [Fact]
    public void StartupConfigurationDiagnostics_emits_snapshot_when_enabled()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Hosting:LogStartupConfigurationSummary"] = "true",
                    ["ArchLucid:StorageProvider"] = "InMemory",
                    ["ArchLucid:AgentExecutionMode"] = "Simulator",
                })
            .Build();

        TestLogger logger = new();
        IHostEnvironment environment = new TestHostEnvironment();

        StartupConfigurationDiagnostics.LogIfEnabled(
            logger,
            configuration,
            environment,
            typeof(HostCorePackageCoverageBatch10Tests).Assembly);

        logger.Messages.Should().ContainSingle(message => message.Contains("Pilot/support configuration snapshot", StringComparison.Ordinal));
        logger.Messages[0].Should().Contain("InMemory");
    }

    private sealed class TestLogger : ILogger
    {
        public List<string> Messages { get; } = [];

        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullDisposable.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Messages.Add(formatter(state, exception));
        }
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class NullDisposable : IDisposable
    {
        public static readonly NullDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
