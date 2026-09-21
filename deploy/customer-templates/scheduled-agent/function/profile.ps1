# Connect with the Function App managed identity before the timer fires.
if ($env:MSI_SECRET -and (Get-Command Connect-AzAccount -ErrorAction SilentlyContinue))
{
    Connect-AzAccount -Identity | Out-Null
}
