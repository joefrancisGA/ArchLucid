using System.Data;

namespace ArchiForge.Data.Infrastructure;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
