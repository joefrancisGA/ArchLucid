using System.Linq;
using System.Reflection;

using Microsoft.Data.SqlClient;

namespace ArchLucid.TestSupport;

/// <summary>Builds <see cref="SqlException" /> instances for tests (no public constructor on the exception type).</summary>
public static class SqlExceptionTestFactory
{
    /// <summary>Creates a <see cref="SqlException" /> with the given SQL Server error <paramref name="number" />.</summary>
    public static SqlException Create(int number)
    {
        SqlErrorCollection errors = CreateErrorCollection();
        SqlError error = CreateSqlError(number);

        MethodInfo? addMethod = typeof(SqlErrorCollection).GetMethod(
            "Add",
            BindingFlags.NonPublic | BindingFlags.Instance);

        if (addMethod is null)
            throw new InvalidOperationException("SqlErrorCollection.Add was not found.");

        addMethod.Invoke(errors, [error]);

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

    private static SqlErrorCollection CreateErrorCollection()
    {
        ConstructorInfo? collectionCtor = typeof(SqlErrorCollection).GetConstructor(
            BindingFlags.NonPublic | BindingFlags.Instance,
            null,
            Type.EmptyTypes,
            null);

        if (collectionCtor is null)
            throw new InvalidOperationException("SqlErrorCollection parameterless constructor was not found.");

        return (SqlErrorCollection)collectionCtor.Invoke(null);
    }

    private static SqlError CreateSqlError(int number)
    {
        ConstructorInfo? sqlErrorCtor = typeof(SqlError)
            .GetConstructors(BindingFlags.NonPublic | BindingFlags.Instance)
            .OrderByDescending(static c => c.GetParameters().Length)
            .FirstOrDefault(static c => c.GetParameters().Length is 9 or 10);

        if (sqlErrorCtor is null)
            throw new InvalidOperationException("SqlError internal constructor was not found.");

        ParameterInfo[] parameters = sqlErrorCtor.GetParameters();
        object?[] args = new object?[parameters.Length];
        args[0] = number;

        for (int index = 1; index < parameters.Length; index++)
        {
            Type parameterType = parameters[index].ParameterType;

            if (parameterType == typeof(byte))
                args[index] = (byte)0;
            else if (parameterType == typeof(int))
                args[index] = 0;
            else if (parameterType == typeof(uint))
                args[index] = (uint)0;
            else if (parameterType == typeof(string))
                args[index] = string.Empty;
            else
                args[index] = null;
        }

        return (SqlError)sqlErrorCtor.Invoke(args)!;
    }
}
