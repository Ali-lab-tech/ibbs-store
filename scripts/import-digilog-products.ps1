param(
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\data\digilog-products.json')
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$requestHeaders = @{
  'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36'
  'Accept' = 'application/json'
}

function Get-CatalogCategory([string]$text) {
  $rules = @(
    @{ Pattern = 'arduino|esp32|esp8266|raspberry|stm32|microcontroller|development board|devkit|pic16|pic18'; Name = 'Development Boards & Microcontrollers' },
    @{ Pattern = 'sensor|detector|transducer|thermocouple|ultrasonic|temperature|humidity'; Name = 'Sensors & Modules' },
    @{ Pattern = 'battery|18650|lifepo|bms|charger|charging|power bank'; Name = 'Batteries & Power' },
    @{ Pattern = 'motor|robot|servo|stepper|wheel|actuator'; Name = 'Motors & Robotics' },
    @{ Pattern = 'multimeter|oscilloscope|solder|test lead|measuring|tool|tweezers'; Name = 'Tools & Test Equipment' },
    @{ Pattern = '3d print|cnc|filament|nozzle|extruder|stepper driver'; Name = '3D Printing & CNC' },
    @{ Pattern = 'relay|switch|mosfet|transistor|resistor|capacitor|diode|ic |integrated circuit|connector|led|display|lcd|oled|module|converter|regulator|power supply'; Name = 'Electronic Components' }
  )
  foreach ($rule in $rules) {
    if ($text -match $rule.Pattern) { return $rule.Name }
  }
  return 'Electronics & Accessories'
}

function ConvertTo-PlainDescription([string]$html) {
  if ([string]::IsNullOrWhiteSpace($html)) { return '' }
  $plain = [regex]::Replace($html, '(?is)<(script|style)[^>]*>.*?</\1>', ' ')
  $plain = [regex]::Replace($plain, '(?i)<\s*br\s*/?>|</\s*(p|div|li|tr|h[1-6])\s*>', ' ')
  $plain = [regex]::Replace($plain, '<[^>]+>', ' ')
  $plain = [Net.WebUtility]::HtmlDecode($plain)
  return [regex]::Replace($plain, '\s+', ' ').Trim()
}

$products = [System.Collections.Generic.List[object]]::new()
$pageSize = 250
$emptyPages = 0
for ($page = 1; $page -le 80; $page++) {
  $uri = "https://digilog.pk/products.json?limit=$pageSize&page=$page"
  $response = $null
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
      $response = Invoke-RestMethod -Uri $uri -Headers $requestHeaders -TimeoutSec 60
      break
    } catch {
      if ($attempt -eq 3) { throw "Could not fetch DigiLog product page $page`: $($_.Exception.Message)" }
      Start-Sleep -Seconds ($attempt * 2)
    }
  }

  $batch = @($response.products)
  if ($batch.Count -eq 0) { break }

  foreach ($product in $batch) {
    $name = ([string]$product.title).Trim()
    if (-not $name) { continue }
    $description = ConvertTo-PlainDescription ([string]$product.body_html)
    if ($description.Length -gt 2400) { $description = $description.Substring(0, 2397).TrimEnd() + '...' }
    $short = $description
    if ($short.Length -gt 250) {
      $cut = $short.LastIndexOf(' ', 247)
      if ($cut -lt 120) { $cut = 247 }
      $short = $short.Substring(0, $cut).TrimEnd() + '…'
    }
    if (-not $short) { $short = "Product details and specifications for $name. Contact IBBS to confirm suitability and current availability." }

    $imageList = [System.Collections.Generic.List[object]]::new()
    if ($product.images) {
      $imageNumber = 0
      foreach ($sourceImage in $product.images) {
        $imageNumber++
        $imageAlt = "$name product photo, view $imageNumber."
        $imageList.Add([pscustomobject]@{ src = [string]$sourceImage.src; alt = $imageAlt })
      }
    }
    $imageUrl = ''
    if ($imageList.Count -gt 0) { $imageUrl = [string]$imageList[0].src }
    $tags = @()
    if ($product.tags) { $tags = @(([string]$product.tags -split ',\s*') | Where-Object { $_ }) }
    $categoryText = "$name $($tags -join ' ')"
    $sku = ''
    if ($product.variants -and $product.variants.Count -gt 0) { $sku = [string]$product.variants[0].sku }
    $handle = ([string]$product.handle).Trim()
    if (-not $handle) { $handle = [guid]::NewGuid().ToString('N') }

    $products.Add([pscustomobject]@{
      id = "digilog-$handle"
      handle = $handle
      name = $name
      style = Get-CatalogCategory $categoryText
      shortDesc = $short
      fullDesc = $description
      sku = $sku
      tags = $tags
      image = $imageUrl
      imageAlt = if ($imageList.Count -gt 0) { [string]$imageList[0].alt } else { "$name product photo from DigiLog's electronics catalog." }
      images = @($imageList.ToArray())
      detailFile = ('data/digilog-details/digilog-details-{0:D3}.json' -f $page)
      sourceUrl = "https://digilog.pk/products/$handle"
    })
  }
  Write-Host ("Fetched page {0}: {1} products (total {2})" -f $page, $batch.Count, $products.Count)
  if ($batch.Count -lt $pageSize) { break }
}

$result = [ordered]@{
  source = 'https://digilog.pk'
  fetchedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  productCount = $products.Count
  products = @($products | Select-Object id, handle, name, style, shortDesc, sku, tags, image, imageAlt, detailFile, sourceUrl)
}
$json = ConvertTo-Json -InputObject $result -Depth 8 -Compress
$absoluteOutput = [IO.Path]::GetFullPath($OutputPath)
$parent = Split-Path -Parent $absoluteOutput
if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
[IO.File]::WriteAllText($absoluteOutput, $json, [Text.UTF8Encoding]::new($false))

$detailDirectory = Join-Path $parent 'digilog-details'
if (-not (Test-Path -LiteralPath $detailDirectory)) { New-Item -ItemType Directory -Path $detailDirectory -Force | Out-Null }
$detailPages = @($products | Group-Object detailFile)
foreach ($detailPage in $detailPages) {
  $relativeName = [IO.Path]::GetFileName([string]$detailPage.Name)
  $detailPath = Join-Path $detailDirectory $relativeName
  $detailJson = ConvertTo-Json -InputObject @($detailPage.Group | Select-Object id, fullDesc, images, sourceUrl) -Depth 8 -Compress
  [IO.File]::WriteAllText($detailPath, $detailJson, [Text.UTF8Encoding]::new($false))
}
Write-Host ("Saved {0} indexed products to {1} ({2:N1} MB) and {3} lazy detail files." -f $products.Count, $absoluteOutput, (([Text.Encoding]::UTF8.GetByteCount($json)) / 1MB), $detailPages.Count)
& (Join-Path $PSScriptRoot 'build-digilog-product-pages.ps1') -CatalogPath $absoluteOutput -DetailsDirectory $detailDirectory -OutputDirectory (Join-Path $PSScriptRoot '..\electronics') -SitemapPath (Join-Path $PSScriptRoot '..\sitemap.xml')
