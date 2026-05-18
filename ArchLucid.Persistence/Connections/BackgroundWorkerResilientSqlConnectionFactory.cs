using Polly;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     <see cref="ResilientSqlConnectionFactory" /> over the primary <see cref="SqlConnectionFactory" /> for worker DI.
/// </summary>
public sealed class BackgroundWorkerResilientSqlConnectionFactory(
    SqlConnectionFactory inner,
    ResiliencePipeline sqlOpenRetryPipeline)
    : ResilientSqlConnectionFactory(inner, sqlOpenRetryPipeline), IBackgroundWorkerSqlConnectionFactory;
