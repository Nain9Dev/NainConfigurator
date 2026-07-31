[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Net.Http

$baseUri = "http://127.0.0.1:5187"
$httpClient = [System.Net.Http.HttpClient]::new()

function Invoke-JsonRequest {
    param(
        [Parameter(Mandatory)]
        [System.Net.Http.HttpMethod] $Method,

        [Parameter(Mandatory)]
        [string] $Path,

        [object] $Body
    )

    $request = [System.Net.Http.HttpRequestMessage]::new(
        $Method,
        "$baseUri$Path"
    )

    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 8 -Compress
        $request.Content = [System.Net.Http.StringContent]::new(
            $json,
            [System.Text.Encoding]::UTF8,
            "application/json"
        )
    }

    $response = $httpClient.SendAsync($request).GetAwaiter().GetResult()
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()

    if (-not $response.IsSuccessStatusCode) {
        throw "Request $Path failed with $([int]$response.StatusCode): $content"
    }

    return $content | ConvertFrom-Json
}

try {
    $shell = $httpClient.GetAsync("$baseUri/").GetAwaiter().GetResult()
    if (-not $shell.IsSuccessStatusCode) {
        throw "The packaged Web shell is unavailable."
    }

    $desk = Invoke-JsonRequest `
        -Method ([System.Net.Http.HttpMethod]::Get) `
        -Path "/api/v1/companies/naindev-demo/products/DESK-001"
    $bicycle = Invoke-JsonRequest `
        -Method ([System.Net.Http.HttpMethod]::Get) `
        -Path "/api/v1/companies/nain-cycle-demo/products/BIKE-001"

    $selectedOptions = @(
        "SIZE_160_80",
        "FINISH_OAK",
        "LEG_ELECTRIC_STANDING"
    )
    $validation = Invoke-JsonRequest `
        -Method ([System.Net.Http.HttpMethod]::Post) `
        -Path "/api/v1/configurations/validate" `
        -Body @{
            companySlug = "naindev-demo"
            productCode = "DESK-001"
            catalogVersion = 1
            selectedOptionCodes = $selectedOptions
        }
    if (-not $validation.data.isValid) {
        throw "The authoritative validation smoke failed."
    }

    $configuration = Invoke-JsonRequest `
        -Method ([System.Net.Http.HttpMethod]::Post) `
        -Path "/api/v1/configurations" `
        -Body @{
            clientRequestId = [Guid]::NewGuid()
            companySlug = "naindev-demo"
            productCode = "DESK-001"
            catalogVersion = 1
            selectedOptionCodes = $selectedOptions
            visualState = $null
        }
    $saved = Invoke-JsonRequest `
        -Method ([System.Net.Http.HttpMethod]::Get) `
        -Path "/api/v1/configurations/$($configuration.data.configurationCode)"
    $quote = Invoke-JsonRequest `
        -Method ([System.Net.Http.HttpMethod]::Post) `
        -Path "/api/v1/quote-requests" `
        -Body @{
            clientRequestId = [Guid]::NewGuid()
            configurationCode = $configuration.data.configurationCode
            contact = @{
                name = "Synthetic Demo User"
                email = "synthetic.demo@example.invalid"
                phone = $null
            }
            message = "Synthetic LocalDemo smoke request"
            privacyPolicy = @{
                acknowledged = $true
                version = "2026-07-30"
            }
        }

    [ordered]@{
        status = "Passed"
        firstProduct = $desk.data.product.code
        secondProduct = $bicycle.data.product.code
        configurationCode = $saved.data.configurationCode
        quoteRequestCode = $quote.data.quoteRequestCode
        externalNotificationSent = $false
        containsRealData = $false
    } | ConvertTo-Json
}
finally {
    $httpClient.Dispose()
}
