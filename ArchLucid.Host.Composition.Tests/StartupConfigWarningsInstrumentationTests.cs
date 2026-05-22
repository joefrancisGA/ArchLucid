using System.Diagnostics.Metrics;

using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>TB-002: startup advisory paths increment <see cref="ArchLucidInstrumentation.StartupConfigWarningsTotal"/>.</summary>
[Collection("StartupConfigWarningsInstrumentation")]
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StartupConfigWarningsInstrumentationTests
{
    [Fact]
    public void AuthSafetyGuard_development_bypass_in_development_increments_startup_config_warning_metric()
    {
        _ = ArchLucidInstrumentation.StartupConfigWarningsTotal;

        using StartupConfigWarningsCapture capture = StartupConfigWarningsCapture.Start();

        List<string> warnings = [];
        ILogger logger = new WarningCaptureLogger(warnings);
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
                ["ArchLucidAuth:DevUserId"] = "metric-dev-user",
            })
            .Build();
        IHostEnvironment environment = new StubHostEnvironment(Environments.Development);

        AuthSafetyGuard.GuardAllDevelopmentBypasses(configuration, environment, logger);

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_startup_config_warnings_total"
            && m.Value == 1
            && m.Tags.Any(t =>
                t.Key == "rule_name"
                && string.Equals(t.Value as string, StartupValidationWarningRuleNames.DevelopmentBypassAuthModeActive, StringComparison.Ordinal)));
    }

    [Fact]
    public void LlmPromptRedaction_PostConfigure_when_disabled_on_production_like_increments_metric()
    {
        _ = ArchLucidInstrumentation.StartupConfigWarningsTotal;

        using StartupConfigWarningsCapture capture = StartupConfigWarningsCapture.Start();

        IHostEnvironment hostEnvironment = new StubHostEnvironment(Environments.Staging);
        IConfiguration configuration = new ConfigurationBuilder().Build();

        LlmPromptRedactionProductionWarningPostConfigure sut = new(
            hostEnvironment,
            configuration,
            NullLogger<LlmPromptRedactionProductionWarningPostConfigure>.Instance);

        sut.PostConfigure(null, new LlmPromptRedactionOptions { Enabled = false });

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_startup_config_warnings_total"
            && m.Value == 1
            && m.Tags.Any(t =>
                t.Key == "rule_name"
                && string.Equals(
                    t.Value as string,
                    StartupValidationWarningRuleNames.LlmPromptRedactionDisabledProductionLike,
                    StringComparison.Ordinal)));
    }

    [Fact]
    public void AgentResult_SchemaValidation_PostConfigure_when_enforce_off_on_production_like_increments_metric()
    {
        _ = ArchLucidInstrumentation.StartupConfigWarningsTotal;

        using StartupConfigWarningsCapture capture = StartupConfigWarningsCapture.Start();

        IHostEnvironment hostEnvironment = new StubHostEnvironment(Environments.Staging);
        IConfiguration configuration = new ConfigurationBuilder().Build();

        AgentResultSchemaValidationProductionWarningPostConfigure sut = new(
            hostEnvironment,
            configuration,
            NullLogger<AgentResultSchemaValidationProductionWarningPostConfigure>.Instance);

        sut.PostConfigure(null, new AgentResultSchemaValidationOptions { EnforceOnParse = false });

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_startup_config_warnings_total"
            && m.Value == 1
            && m.Tags.Any(t =>
                t.Key == "rule_name"
                && string.Equals(
                    t.Value as string,
                StartupValidationWarningRuleNames.AgentResultSchemaEnforceOnParseDisabledProductionLike,
                StringComparison.Ordinal)));
    }

    [Fact]
    public void ContentSafetyConfigurationWarnings_when_fail_open_in_staging_emits_metric_and_log()
    {
        _ = ArchLucidInstrumentation.StartupConfigWarningsTotal;

        using StartupConfigWarningsCapture capture = StartupConfigWarningsCapture.Start();

        List<string> warnings = [];
        ILogger logger = new WarningCaptureLogger(warnings);
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucid:ContentSafety:FailClosedOnSdkError"] = "false",
            })
            .Build();
        IHostEnvironment environment = new StubHostEnvironment(Environments.Staging);

        ContentSafetyConfigurationWarnings.LogIfProductionLikeFailOpenSdkSettingIsIgnored(
            configuration,
            environment,
            logger);

        warnings.Should().ContainSingle()
            .Which.Should()
            .Contain("ArchLucid:ContentSafety:FailClosedOnSdkError");

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_startup_config_warnings_total"
            && m.Value == 1
            && m.Tags.Any(t =>
                t.Key == "rule_name"
                && string.Equals(
                    t.Value as string,
                    ContentSafetyStartupWarningRuleNames.ProductionLikeFailClosedOnSdkSettingOverridden,
                    StringComparison.Ordinal)));
    }

    [Fact]
    public void ContentSafetyConfigurationWarnings_when_archlucid_environment_staging_emits_metric()
    {
        _ = ArchLucidInstrumentation.StartupConfigWarningsTotal;

        using StartupConfigWarningsCapture capture = StartupConfigWarningsCapture.Start();

        List<string> warnings = [];
        ILogger logger = new WarningCaptureLogger(warnings);
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ARCHLUCID_ENVIRONMENT"] = "Staging",
                ["ArchLucid:ContentSafety:FailClosedOnSdkError"] = "false",
            })
            .Build();
        IHostEnvironment environment = new StubHostEnvironment(Environments.Development);

        ContentSafetyConfigurationWarnings.LogIfProductionLikeFailOpenSdkSettingIsIgnored(
            configuration,
            environment,
            logger);

        warnings.Should().ContainSingle();
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_startup_config_warnings_total"
            && m.Value == 1
            && m.Tags.Any(t =>
                t.Key == "rule_name"
                && string.Equals(
                    t.Value as string,
                    ContentSafetyStartupWarningRuleNames.ProductionLikeFailClosedOnSdkSettingOverridden,
                    StringComparison.Ordinal)));
    }

    [Fact]
    public void ContentSafetyConfigurationWarnings_development_no_warning_when_fail_open_in_config()
    {
        using StartupConfigWarningsCapture capture = StartupConfigWarningsCapture.Start();

        List<string> warnings = [];
        ILogger logger = new WarningCaptureLogger(warnings);
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                // Pin ArchLucid environment: HostEnvironmentClassification falls back to process env when absent.
                ["ARCHLUCID_ENVIRONMENT"] = "Development",
                ["ArchLucid:ContentSafety:FailClosedOnSdkError"] = "false",
            })
            .Build();
        IHostEnvironment environment = new StubHostEnvironment(Environments.Development);

        ContentSafetyConfigurationWarnings.LogIfProductionLikeFailOpenSdkSettingIsIgnored(
            configuration,
            environment,
            logger);

        warnings.Should().BeEmpty();
        capture.LongMeasures.Should().BeEmpty();
    }

    private sealed class StartupConfigWarningsCapture : IDisposable
    {
        private readonly MeterListener _listener = new();
        private readonly List<LongMeasurementRecord> _longMeasures = [];

        private StartupConfigWarningsCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<long>(OnLong);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public void Dispose() => _listener.Dispose();

        public static StartupConfigWarningsCapture Start() => new();

        private void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidMeterNames.Meter)
                return;

            if (instrument.Name == "archlucid_startup_config_warnings_total")
                meterListener.EnableMeasurementEvents(instrument);
        }

        private void OnLong(
            Instrument instrument,
            long measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;
            _longMeasures.Add(new LongMeasurementRecord(instrument.Name, measurement, ToList(tags)));
        }

        private static List<KeyValuePair<string, object?>> ToList(ReadOnlySpan<KeyValuePair<string, object?>> tags)
        {
            List<KeyValuePair<string, object?>> list = [];

            foreach (KeyValuePair<string, object?> t in tags)
                list.Add(t);

            return list;
        }
    }

    private readonly record struct LongMeasurementRecord(
        string Name,
        long Value,
        IReadOnlyList<KeyValuePair<string, object?>> Tags);

    private sealed class WarningCaptureLogger : ILogger
    {
        private readonly List<string> _warnings;

        public WarningCaptureLogger(List<string> warnings)
        {
            _warnings = warnings;
        }

        public IDisposable BeginScope<TState>(TState state)
            where TState : notnull => NullScope.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (logLevel == LogLevel.Warning)
                _warnings.Add(formatter(state, exception));
        }
    }

    private sealed class NullScope : IDisposable
    {
        public static readonly NullScope Instance = new();

        public void Dispose()
        {
        }
    }

    private sealed class StubHostEnvironment : IHostEnvironment
    {
        public StubHostEnvironment(string environmentName)
        {
            EnvironmentName = environmentName;
        }

        public string EnvironmentName
        {
            get;
            set;
        }

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
}
