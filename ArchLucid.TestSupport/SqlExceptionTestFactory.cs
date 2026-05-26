using System.Reflection;
using System.Runtime.Serialization;

using Microsoft.Data.SqlClient;

namespace ArchLucid.TestSupport;

/// <summary>Builds <see cref="SqlException" /> instances for tests (no public constructor on the exception type).</summary>
public static class SqlExceptionTestFactory
{
    /// <summary>Creates a <see cref="SqlException" /> with the given SQL Server error <paramref name="number" />.</summary>
#pragma warning disable SYSLIB0050 // FormatterServices is obsolete
    public static SqlException Create(int number)
    {
        SqlError error = (SqlError)FormatterServices.GetUninitializedObject(typeof(SqlError));
        FieldInfo? numberField = typeof(SqlError).GetField("_infoNumber", BindingFlags.NonPublic | BindingFlags.Instance)
            ?? typeof(SqlError).GetField("infoNumber", BindingFlags.NonPublic | BindingFlags.Instance);
        if (numberField != null)
        {
            numberField.SetValue(error, number);
        }

        SqlErrorCollection errors = (SqlErrorCollection)FormatterServices.GetUninitializedObject(typeof(SqlErrorCollection));
        FieldInfo? errorsListField = typeof(SqlErrorCollection).GetField("_errors", BindingFlags.NonPublic | BindingFlags.Instance)
            ?? typeof(SqlErrorCollection).GetField("errors", BindingFlags.NonPublic | BindingFlags.Instance);
        
        if (errorsListField != null)
        {
            var list = new System.Collections.ArrayList { error };
            errorsListField.SetValue(errors, list);
        }
        else
        {
            // Try Add method if field not found
            typeof(SqlErrorCollection)
                .GetMethod("Add", BindingFlags.NonPublic | BindingFlags.Instance)?
                .Invoke(errors, [error]);
        }

        SqlException ex = (SqlException)Activator.CreateInstance(
            typeof(SqlException),
            BindingFlags.NonPublic | BindingFlags.Instance,
            null,
            [
                "Test SQL exception",
                errors,
                null,
                Guid.Empty
            ],
            null)!;

        return ex;
    }
#pragma warning restore SYSLIB0050
}
