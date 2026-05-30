#requires -Version 5.1
Set-StrictMode -Version Latest

Describe 'ApiIntegrationTestShardSupport' {
    BeforeAll {
        . (Join-Path (Split-Path $PSScriptRoot -Parent) 'ApiIntegrationTestShardSupport.ps1')
    }

    It 'parses dotnet test --list-tests lines into unique class names' {
        $lines = @(
            'The following Tests are available:',
            '    ArchLucid.Api.Tests.FooTests.Method_one',
            '    ArchLucid.Api.Tests.FooTests.Method_two',
            '    ArchLucid.Api.Tests.BarTests.Method_alpha'
        )

        $classes = ConvertFrom-DotNetTestListOutput -Lines $lines

        $classes.Count | Should Be 2
        $classes[0] | Should Be 'ArchLucid.Api.Tests.BarTests'
        $classes[1] | Should Be 'ArchLucid.Api.Tests.FooTests'
    }

    It 'assigns classes round-robin across shards deterministically' {
        $all = @('A', 'B', 'C', 'D', 'E')

        $shard0 = Get-ApiIntegrationTestShardClassNames -AllClassNames $all -ShardIndex 0 -ShardCount 3
        $shard0.Count | Should Be 2
        $shard0[0] | Should Be 'A'
        $shard0[1] | Should Be 'D'

        $shard1 = Get-ApiIntegrationTestShardClassNames -AllClassNames $all -ShardIndex 1 -ShardCount 3
        $shard1.Count | Should Be 2
        $shard1[0] | Should Be 'B'
        $shard1[1] | Should Be 'E'

        $shard2 = Get-ApiIntegrationTestShardClassNames -AllClassNames $all -ShardIndex 2 -ShardCount 3
        $shard2.Count | Should Be 1
        $shard2[0] | Should Be 'C'
    }

    It 'builds a combined Category and FullyQualifiedName filter' {
        $filter = New-ApiIntegrationTestClassFilter `
            -ClassNames @('ArchLucid.Api.Tests.FooTests') `
            -BaseFilter 'Category!=Slow&Category=Integration'

        $filter | Should Be 'Category!=Slow&Category=Integration&(FullyQualifiedName~ArchLucid.Api.Tests.FooTests)'
    }
}
