using Microsoft.Data.SqlClient;

// Minimal smoke/CI helper: print one scalar (or first-column row) as text.
// Usage: ArchLucid.SqlScalar <connection-string> <sql>
// PowerShell Add-Type cannot load net10 Microsoft.Data.SqlClient into the pwsh runtime on Linux.

if (args.Length < 2)
{
    Console.Error.WriteLine("Usage: ArchLucid.SqlScalar <connection-string> <sql>");
    return 2;
}

string connectionString = args[0];
string sql = args[1];

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("Connection string is required.");
    return 2;
}

if (string.IsNullOrWhiteSpace(sql))
{
    Console.Error.WriteLine("SQL text is required.");
    return 2;
}

await using SqlConnection connection = new(connectionString);
await connection.OpenAsync();

await using SqlCommand command = connection.CreateCommand();
command.CommandText = sql;

object? scalar = await command.ExecuteScalarAsync();

if (scalar is null or DBNull)
{
    Console.WriteLine(string.Empty);
    return 0;
}

Console.WriteLine(Convert.ToString(scalar, System.Globalization.CultureInfo.InvariantCulture));
return 0;
