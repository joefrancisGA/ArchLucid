$tags = Get-AzNetworkServiceTag -Location 'eastus2'
$tags.ChangeNumber
$tags.Values | Select-Object Name, @{ n = 'prefixes'; e = { $_.Properties.AddressPrefixes } }
