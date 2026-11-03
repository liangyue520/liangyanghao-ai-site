param([ValidateSet('dev','e02','e03','e04','qa')][string]$Environment='dev',[string]$AllowedHosts='')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$ports=@{dev=@(3100,5173);e02=@(3102,5175);e03=@(3103,5177);e04=@(3104,5174);qa=@(3105,5176)}
$selected=$ports[$Environment]
if(@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -in $selected).Count){throw 'Port occupied; do not start a second environment instance'}
$dataDir=Join-Path $projectRoot ".local/$Environment"
if(!(Test-Path (Join-Path $dataDir 'site.sqlite'))){throw 'Run npm run init:local first'}
$runtimeFile=Join-Path $dataDir 'processes.json'
if(Test-Path $runtimeFile){$old=Get-Content $runtimeFile -Raw|ConvertFrom-Json;foreach($entry in $old.processes){$proc=Get-Process -Id $entry.id -ErrorAction SilentlyContinue;if($proc -and $proc.StartTime.ToUniversalTime().ToString('o') -eq $entry.startedAt){throw 'Environment already running'}}}
$node=(Get-Command node.exe).Source
$oldApi=$env:SITE_API_PORT;$oldWeb=$env:SITE_WEB_PORT;$oldEnv=$env:SITE_ENV;$oldAllowed=$env:SITE_ALLOWED_HOSTS
try{
 $env:SITE_API_PORT=[string]$selected[0];$env:SITE_WEB_PORT=[string]$selected[1];$env:SITE_ENV=$Environment;$env:SITE_ALLOWED_HOSTS=$AllowedHosts
 $api=Start-Process -FilePath $node -ArgumentList @('--import','tsx',('"'+(Join-Path $projectRoot 'server/main.ts')+'"'),'--env',$Environment) -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $dataDir 'logs/api.out.log') -RedirectStandardError (Join-Path $dataDir 'logs/api.err.log')
 $web=Start-Process -FilePath $node -ArgumentList @(('"'+(Join-Path $projectRoot 'node_modules/vite/bin/vite.js')+'"')) -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $dataDir 'logs/web.out.log') -RedirectStandardError (Join-Path $dataDir 'logs/web.err.log')
 [ordered]@{environment=$Environment;processes=@(@{id=$api.Id;startedAt=$api.StartTime.ToUniversalTime().ToString('o')},@{id=$web.Id;startedAt=$web.StartTime.ToUniversalTime().ToString('o')})}|ConvertTo-Json -Depth 4|Set-Content $runtimeFile -Encoding utf8
 Write-Output "$Environment launched: http://127.0.0.1:$($selected[1]); verify health separately."
}finally{$env:SITE_API_PORT=$oldApi;$env:SITE_WEB_PORT=$oldWeb;$env:SITE_ENV=$oldEnv;$env:SITE_ALLOWED_HOSTS=$oldAllowed}
