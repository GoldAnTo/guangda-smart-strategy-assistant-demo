$body = @{
    riskLevel = "stable"
    investmentHorizon = "medium_term"
    liquidityNeed = "medium"
    returnExpectation = "stable_enhancement"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3003/api/recommend" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
