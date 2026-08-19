using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureDevOps.Tests.Support;

/// <summary>Single formatted log entry captured by <see cref="RecordingLogger{T}" />.</summary>
internal sealed record RecordedLogEntry(LogLevel Level, string Message, Exception? Exception);
