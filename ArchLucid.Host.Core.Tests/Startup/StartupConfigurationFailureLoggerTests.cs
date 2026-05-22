using ArchLucid.Host.Core.Startup;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Core.Tests.Startup;

[Trait("Category", "Unit")]
public sealed class StartupConfigurationFailureLoggerTests
{
    [Fact]
    public void LogCriticalAndThrow_emits_critical_for_billing_errors_and_throws()
    {
        List<string> errors =
        [
            BillingProductionSafetyRules.ErrorPrefix + "Billing:Stripe:SecretKey uses Stripe test prefix sk_test_.",
            "ConnectionStrings:ArchLucid is missing.",
        ];

        TestLogger logger = new();

        Action act = () => StartupConfigurationFailureLogger.LogCriticalAndThrow(errors, logger);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*configuration is invalid*");

        logger.CriticalMessages.Should().ContainSingle(message =>
            message.Contains("Billing production safety validation failed", StringComparison.Ordinal)
            && message.Contains("PRODUCTION_DEPLOYMENT.md", StringComparison.Ordinal));

        logger.ErrorMessages.Should().ContainSingle(message =>
            message.Contains("ConnectionStrings:ArchLucid", StringComparison.Ordinal));
    }

    private sealed class TestLogger : ILogger
    {
        public List<string> CriticalMessages { get; } = [];

        public List<string> ErrorMessages { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => NullScope.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            string message = formatter(state, exception);

            if (logLevel == LogLevel.Critical)
                CriticalMessages.Add(message);

            if (logLevel == LogLevel.Error)
                ErrorMessages.Add(message);
        }

        private sealed class NullScope : IDisposable
        {
            public static readonly NullScope Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
