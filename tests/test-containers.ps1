Write-Host "=== Container Composition Testing ==="

# Show container status
docker-compose ps

Write-Host "`n--- FRONTEND TEST ---"
try {
    $frontend = Invoke-WebRequest http://localhost:8080 -UseBasicParsing
    Write-Host "Frontend OK - Status:" $frontend.StatusCode
} catch {
    Write-Host "Frontend FAILED"
}

Write-Host "`n--- BACKEND TEST ---"

$backendUrls = @(
    "http://localhost:4000/api/health",
    "http://localhost:4000/"
)

$backendOK = $false

foreach ($url in $backendUrls) {
    try {
        $res = Invoke-WebRequest $url -UseBasicParsing
        Write-Host "Backend OK at $url - Status:" $res.StatusCode
        $backendOK = $true
        break
    } catch {
        Write-Host "Failed: $url"
    }
}

if (-not $backendOK) {
    Write-Host "Backend FAILED"
}

Write-Host "`n--- MONGODB TEST ---"
docker logs brainbytes-aitutoring-platform-mongo-1 --tail 5

Write-Host "`n=== DONE ==="