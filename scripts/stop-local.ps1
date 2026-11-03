param([ValidateSet('dev','e02','e03','e04','qa')][string]$Environment='dev')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$runtimeFile=Join-Path $projectRoot ".local/$Environment/processes.json"
if(!(Test-Path $runtimeFile)){Write-Output 'No recorded processes';exit 0}
$state=Get-Content $runtimeFile -Raw|ConvertFrom-Json
foreach($entry in $state.processes){
 $proc=Get-Process -Id $entry.id -ErrorAction SilentlyContinue
 if($proc -and $proc.StartTime.ToUniversalTime().ToString('o') -eq $entry.startedAt){
  $cmd=(Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.id)").CommandLine
  if($cmd -notlike "*$projectRoot*" -or $proc.ProcessName -ne 'node'){throw 'Process identity mismatch; refusing stop'}
  Get-CimInstance Win32_Process -Filter "ParentProcessId=$($entry.id)" | Where-Object Name -Match '^(node|esbuild).*' | ForEach-Object {Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue}
  Stop-Process -Id $entry.id
 }
}
Write-Output "$Environment recorded processes stopped; data retained."
