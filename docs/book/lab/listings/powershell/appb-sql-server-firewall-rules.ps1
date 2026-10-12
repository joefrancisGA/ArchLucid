$serverArgs = @{ ResourceGroupName = $server.ResourceGroupName; ServerName = $server.ServerName }
Get-AzSqlServerFirewallRule @serverArgs |
    Select-Object FirewallRuleName, StartIpAddress, EndIpAddress
