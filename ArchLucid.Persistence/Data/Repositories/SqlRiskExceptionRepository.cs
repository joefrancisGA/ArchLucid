using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlRiskExceptionRepository(ISqlConnectionFactory connectionFactory) : IRiskExceptionRepository;
