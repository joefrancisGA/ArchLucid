$policy = Get-AzFirewallPolicy -ResourceGroupName 'rg-network' -Name 'afwp-hub'

$firewallRules = foreach ($groupRef in $policy.RuleCollectionGroups) {
    $groupName = ($groupRef.Id -split '/')[-1]
    $group = Get-AzFirewallPolicyRuleCollectionGroup -Name $groupName `
        -ResourceGroupName $policy.ResourceGroupName -AzureFirewallPolicyName $policy.Name

    foreach ($collection in $group.Properties.RuleCollection) {
        foreach ($rule in $collection.Rules) {
            [pscustomobject]@{
                policyId             = $policy.Id
                group                = $groupName
                collection           = $collection.Name
                action               = $collection.Action.Type
                rule                 = $rule.Name
                ruleType             = $rule.RuleType
                sourceAddresses      = $rule.SourceAddresses -join ','
                destinationAddresses = $rule.DestinationAddresses -join ','
                destinationPorts     = $rule.DestinationPorts -join ','
                protocols            = $rule.Protocols -join ','
            }
        }
    }
}
