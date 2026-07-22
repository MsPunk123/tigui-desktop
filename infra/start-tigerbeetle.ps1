$ErrorActionPreference = "Stop"

Push-Location $PSScriptRoot
try {
  $requiredFiles = @(
    "data/0_0.tigerbeetle",
    "data/0_1.tigerbeetle",
    "data/0_2.tigerbeetle"
  )

  $missingFiles = $requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_) }

  if ($missingFiles.Count -gt 0) {
    Write-Host "TigerBeetle data files missing. Formatting replicas..."
    docker run --rm --security-opt seccomp=unconfined --cap-add IPC_LOCK -v ${PWD}/data:/data ghcr.io/tigerbeetle/tigerbeetle format --cluster=0 --replica=0 --replica-count=3 /data/0_0.tigerbeetle
    docker run --rm --security-opt seccomp=unconfined --cap-add IPC_LOCK -v ${PWD}/data:/data ghcr.io/tigerbeetle/tigerbeetle format --cluster=0 --replica=1 --replica-count=3 /data/0_1.tigerbeetle
    docker run --rm --security-opt seccomp=unconfined --cap-add IPC_LOCK -v ${PWD}/data:/data ghcr.io/tigerbeetle/tigerbeetle format --cluster=0 --replica=2 --replica-count=3 /data/0_2.tigerbeetle
  }

  Write-Host "Starting TigerBeetle cluster..."
  docker compose up -d tigerbeetle_0 tigerbeetle_1 tigerbeetle_2
}
finally {
  Pop-Location
}
