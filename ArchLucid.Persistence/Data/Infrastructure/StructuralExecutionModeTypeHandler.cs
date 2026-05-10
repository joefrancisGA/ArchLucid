using System.Data;

using ArchLucid.Contracts.Common;

using Dapper;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>Maps <see cref="StructuralExecutionMode" /> to <c>NVARCHAR</c> values on <c>dbo.Runs</c>.</summary>
public sealed class StructuralExecutionModeTypeHandler : SqlMapper.TypeHandler<StructuralExecutionMode>
{
    private static bool registered;

    public static void Register()
    {
        if (registered)
            return;

        SqlMapper.AddTypeHandler(new StructuralExecutionModeTypeHandler());
        registered = true;
    }

    public override StructuralExecutionMode Parse(object value)
    {
        if (value is null || value is DBNull)
            throw new DataException("StructuralExecutionMode cannot be null.");

        string text = value.ToString()?.Trim() ?? "";

        if (!Enum.TryParse(text, ignoreCase: false, out StructuralExecutionMode parsed))
            throw new DataException($"Unrecognised StructuralExecutionMode '{text}'.");

        return parsed;
    }

    public override void SetValue(IDbDataParameter parameter, StructuralExecutionMode value)
    {
        parameter.Value = value.ToString();
    }
}
