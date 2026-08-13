namespace ArchLucid.Core.Agents;

/// <summary>Fail-closed offerability for catalog rows (TB-2109 disclosure gate).</summary>
public static class AgentModelCatalogOfferability
{
    public static bool IsRegistryVisible(AgentModelCatalogRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (row.LifecycleStatus is AgentModelCatalogLifecycleStatus.Retired)
        {
            return false;
        }

        return IsDisclosureSatisfied(row);
    }

    public static bool IsDisclosureSatisfied(AgentModelCatalogRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (row.DataBoundary is not AgentModelDataBoundaryKind.ExternalSubprocessor)
        {
            return true;
        }

        return row.ExternalSubprocessorDisclosureComplete;
    }

    public static void EnsureOfferable(AgentModelCatalogRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (!IsDisclosureSatisfied(row))
        {
            throw new InvalidOperationException(
                $"External-subprocessor alias '{row.AliasId}' cannot be offered until subprocessor disclosure is complete.");
        }
    }
}
