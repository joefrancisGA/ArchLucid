#Requires -Version 7.0
Set-StrictMode -Version Latest

Describe 'ArchLucid.ExtractorArmProperties.helpers.ps1' {

    BeforeAll {
        [string]$scriptDir = Split-Path -Parent $PSScriptRoot
        . (Join-Path $scriptDir 'ArchLucid.ExtractorArmProperties.helpers.ps1')
    }

    It 'redacts sensitive property keys in ARM JSON' {
        $props = [ordered]@{
            keyVaultUri = 'https://kv-edw-hi-ppd.vault.azure.net/'
            sqlPassword = 'super-secret'
        }

        $result = ConvertTo-ArchLucidRedactedArmPropertiesJson -Properties $props

        $result.json | Should -Match 'kv-edw-hi-ppd'
        $result.json | Should -Match '\[REDACTED\]'
        $result.json | Should -Not -Match 'super-secret'
    }

    It 'writes armPropertiesRedactedJson onto a resource properties bag' {
        $bag = [ordered]@{ provisioningState = 'Succeeded' }
        $arm = [ordered]@{
            encryption = [ordered]@{
                keyVaultProperties = [ordered]@{
                    keyVaultUri = 'https://kv-edw-hi-ppd.vault.azure.net/keys/edw-cmk/guid'
                }
            }
        }

        Add-ArchLucidRedactedArmPropertiesToResourceRecord -Properties $bag -ArmProperties $arm | Out-Null

        $bag.armPropertiesRedactedJson | Should -Match 'kv-edw-hi-ppd'
        $bag.armPropertiesRedactedJson | Should -Not -Match 'edw-cmk'
    }
}
