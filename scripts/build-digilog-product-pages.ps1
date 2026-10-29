param(
  [string]$CatalogPath = (Join-Path $PSScriptRoot '..\data\digilog-products.json'),
  [string]$DetailsDirectory = (Join-Path $PSScriptRoot '..\data\digilog-details'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\electronics'),
  [string]$SitemapPath = (Join-Path $PSScriptRoot '..\sitemap.xml')
)

$ErrorActionPreference = 'Stop'

function Encode-Html([AllowNull()][string]$Value) {
  return [Net.WebUtility]::HtmlEncode([string]$Value)
}

function Get-MetaDescription([string]$Name, [string]$Summary) {
  $text = "$Name. $Summary Contact IBBS to confirm current availability and request a quote in Pakistan."
  $text = [regex]::Replace($text, '\s+', ' ').Trim()
  if ($text.Length -le 160) { return $text }
  $cut = $text.LastIndexOf(' ', 157)
  if ($cut -lt 120) { $cut = 157 }
  return ($text.Substring(0, $cut).TrimEnd() + '…')
}

function Get-SafeHandle([string]$Handle) {
  $slug = [regex]::Replace($Handle.ToLowerInvariant(), '[^a-z0-9-]', '').Trim('-')
  if ($slug.Length -gt 80) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
      $bytes = [Text.Encoding]::UTF8.GetBytes($Handle)
      $hash = [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').Substring(0, 10).ToLowerInvariant()
    } finally { $sha.Dispose() }
    $slug = $slug.Substring(0, 68).TrimEnd('-') + '-' + $hash
  }
  return $slug
}

if (-not (Test-Path -LiteralPath $CatalogPath)) { throw "Catalog file not found: $CatalogPath" }
if (-not (Test-Path -LiteralPath $DetailsDirectory)) { throw "Product detail files not found: $DetailsDirectory" }
if (-not (Test-Path -LiteralPath $OutputDirectory)) { New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null }

$catalog = [IO.File]::ReadAllText([IO.Path]::GetFullPath($CatalogPath)) | ConvertFrom-Json
$indexedProducts = @($catalog.products)
$detailsById = @{}
Get-ChildItem -LiteralPath $DetailsDirectory -Filter '*.json' -File | ForEach-Object {
  $detailsPage = [IO.File]::ReadAllText($_.FullName) | ConvertFrom-Json
  foreach ($detail in @($detailsPage)) { $detailsById[[string]$detail.id] = $detail }
}

$siteBase = 'https://ibbs-store.com'
$generatedAt = (Get-Date).ToString('yyyy-MM-dd')
$urls = [System.Collections.Generic.List[string]]::new()
$seenHandles = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$count = 0

foreach ($product in $indexedProducts) {
  $handle = [string]$product.handle
  $safeHandle = Get-SafeHandle $handle
  if (-not $safeHandle -or -not $seenHandles.Add($safeHandle)) { continue }
  $product | Add-Member -NotePropertyName pageSlug -NotePropertyValue $safeHandle -Force
  $detail = $detailsById[[string]$product.id]
  if (-not $detail) { continue }

  $name = [string]$product.name
  $summary = [string]$product.shortDesc
  $description = [string]$detail.fullDesc
  if (-not $description) { $description = "No detailed description was provided in the source listing for $name. Contact IBBS to confirm specifications and current availability." }
  $seoTitle = "$name | IBBS Pakistan"
  $metaDescription = Get-MetaDescription $name $summary
  $canonical = "$siteBase/electronics/$safeHandle.html"
  $nameHtml = Encode-Html $name
  $titleHtml = Encode-Html $seoTitle
  $metaHtml = Encode-Html $metaDescription
  $categoryHtml = Encode-Html ([string]$product.style)
  $summaryHtml = Encode-Html $summary
  $descriptionHtml = Encode-Html $description
  $sku = [string]$product.sku
  $skuHtml = Encode-Html $sku
  $sourceUrl = [string]$product.sourceUrl
  if ($sourceUrl -notmatch '^https://digilog\.pk/products/[a-z0-9-]+$') { $sourceUrl = 'https://digilog.pk/' }
  $sourceUrlHtml = Encode-Html $sourceUrl

  $images = [System.Collections.Generic.List[string]]::new()
  $imageUrls = [System.Collections.Generic.List[string]]::new()
  $imageNumber = 0
  foreach ($image in @($detail.images)) {
    $src = [string]$image.src
    if ($src -notmatch '^https://cdn\.shopify\.com/') { continue }
    $imageNumber++
    $imageUrls.Add($src)
    $alt = [string]$image.alt
    if (-not $alt) { $alt = "$name product photo, view $imageNumber." }
    $srcHtml = Encode-Html $src
    $altHtml = Encode-Html $alt
    $loading = if ($imageNumber -eq 1) { 'eager' } else { 'lazy' }
    $priority = if ($imageNumber -eq 1) { ' fetchpriority="high"' } else { '' }
    $images.Add("<img src=`"$srcHtml`" alt=`"$altHtml`" width=`"480`" height=`"480`" loading=`"$loading`" decoding=`"async`"$priority>")
  }
  if ($images.Count -eq 0 -and $product.image -match '^https://cdn\.shopify\.com/') {
    $srcHtml = Encode-Html ([string]$product.image)
    $altHtml = Encode-Html ([string]$product.imageAlt)
    $images.Add("<img src=`"$srcHtml`" alt=`"$altHtml`" width=`"480`" height=`"480`" loading=`"eager`" decoding=`"async`" fetchpriority=`"high`">")
    $imageUrls.Add([string]$product.image)
  }
  $galleryHtml = $images -join "`n          "
  $schema = [ordered]@{
    '@context' = 'https://schema.org'
    '@type' = 'Product'
    name = $name
    description = $description
    image = @($imageUrls.ToArray())
    category = [string]$product.style
    sku = $sku
    url = $canonical
  }
  if (-not $sku) { $schema.Remove('sku') }
  $schemaJson = (ConvertTo-Json -InputObject $schema -Depth 5 -Compress) -replace '<', '\u003c'
  $quoteText = [uri]::EscapeDataString("Hello IBBS, please quote $name" + $(if ($sku) { " (SKU: $sku)" } else { '' }) + '.')
  $quoteUrl = "https://wa.me/923092190828?text=$quoteText"
  $quoteUrlHtml = Encode-Html $quoteUrl
  $imageMeta = ''
  if ($imageUrls.Count -gt 0) { $imageMeta = "`n    <meta property=`"og:image`" content=`"$(Encode-Html $imageUrls[0])`">" }
  $skuBlock = if ($sku) { "<p class=`"electronics-detail__sku`">SKU: $skuHtml</p>" } else { '' }

  $html = @"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>$titleHtml</title>
    <meta name="description" content="$metaHtml">
    <meta name="author" content="Talha">
    <meta name="creator" content="Talha">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="$canonical">
    <meta name="theme-color" content="#14110f">$imageMeta
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Industrial Boiler &amp; Burner Services (IBBS)">
    <meta property="og:title" content="$titleHtml">
    <meta property="og:description" content="$metaHtml">
    <meta property="og:url" content="$canonical">
    <link rel="icon" type="image/svg+xml" href="../img/ibbs-seal-icon.svg">
    <link rel="stylesheet" href="../css/vendor/bootstrap.min.css">
    <link rel="stylesheet" href="../css/style.css?v=20261026-1">
    <link rel="stylesheet" href="../css/electronics-catalog.css?v=20261029-1">
    <script type="application/ld+json">$schemaJson</script>
  </head>
  <body class="electronics-page electronics-product-page">
    <a class="skip-link" href="#main">Skip to content</a>
    <nav class="hp-nav navbar" aria-label="Primary">
      <div class="container">
        <a class="navbar-brand" href="../index.html" aria-label="IBBS home"><img src="../img/ibbs-logo-seal.svg" alt="Industrial Boiler &amp; Burner Services" width="276" height="60" class="navbar-brand__logo"></a>
        <div class="electronics-product-nav"><a href="../index.html">Home</a><a href="../electronics.html">Electronics Parts</a></div>
        <a href="$quoteUrlHtml" target="_blank" rel="noopener" class="hp-btn hp-btn--teal hp-btn--sm">Request a Quote</a>
      </div>
    </nav>
    <main id="main" class="electronics-main">
      <section class="electronics-hero electronics-product-hero">
        <div class="container">
          <nav class="electronics-breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="../electronics.html">Electronics Parts</a><span aria-hidden="true">/</span><span aria-current="page">$nameHtml</span></nav>
          <span class="eyebrow">$categoryHtml</span>
          <h1>$nameHtml</h1>
          <p>$summaryHtml</p>
          $skuBlock
        </div>
      </section>
      <section class="electronics-product-detail">
        <div class="container">
          <div class="electronics-product-gallery">
          $galleryHtml
          </div>
          <div class="electronics-product-copy">
            <h2>Product details</h2>
            <p>$descriptionHtml</p>
            <p class="electronics-product-copy__note">Product descriptions and image links are included with permission from DigiLog.pk. Contact IBBS to confirm current availability, exact model, and pricing.</p>
            <div class="electronics-product-actions">
              <a class="hp-btn hp-btn--amber" href="$quoteUrlHtml" target="_blank" rel="noopener">Request an IBBS Quote</a>
              <a class="hp-btn hp-btn--ghost" href="$sourceUrlHtml" target="_blank" rel="noopener">View DigiLog Listing</a>
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer class="hp-footer"><div class="container footer-bottom"><span>&copy; 2026 Industrial Boiler &amp; Burner Services (IBBS).</span><span><a href="../electronics.html">Electronics Parts</a> &middot; <a href="../index.html">IBBS Home</a></span></div></footer>
  </body>
</html>
"@
  $filePath = Join-Path $OutputDirectory ($safeHandle + '.html')
  [IO.File]::WriteAllText($filePath, $html, [Text.UTF8Encoding]::new($false))
  $urls.Add($canonical)
  $count++
  if (($count % 500) -eq 0) { Write-Host "Generated $count product pages…" }
}

Get-ChildItem -LiteralPath $OutputDirectory -Filter '*.html' -File | ForEach-Object {
  if (-not $seenHandles.Contains($_.BaseName)) { Remove-Item -LiteralPath $_.FullName -Force }
}

$sitemapDoc = New-Object System.Xml.XmlDocument
$sitemapDoc.PreserveWhitespace = $false
if (Test-Path -LiteralPath $SitemapPath) {
  $sitemapDoc.Load([IO.Path]::GetFullPath($SitemapPath))
} else {
  $decl = $sitemapDoc.CreateXmlDeclaration('1.0', 'UTF-8', $null)
  $sitemapDoc.AppendChild($decl) | Out-Null
  $root = $sitemapDoc.CreateElement('urlset', 'http://www.sitemaps.org/schemas/sitemap/0.9')
  $sitemapDoc.AppendChild($root) | Out-Null
}
$ns = New-Object System.Xml.XmlNamespaceManager($sitemapDoc.NameTable)
$ns.AddNamespace('sm', 'http://www.sitemaps.org/schemas/sitemap/0.9')
$urlset = $sitemapDoc.DocumentElement
$catalogUrl = "$siteBase/electronics.html"
$expectedUrls = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
[void]$expectedUrls.Add($catalogUrl)
foreach ($url in $urls) { [void]$expectedUrls.Add($url) }
foreach ($urlNode in @($sitemapDoc.SelectNodes('//sm:url', $ns))) {
  $locNode = $urlNode.SelectSingleNode('sm:loc', $ns)
  if ($locNode -and $locNode.InnerText.StartsWith("$siteBase/electronics/", [StringComparison]::OrdinalIgnoreCase) -and -not $expectedUrls.Contains($locNode.InnerText)) {
    [void]$urlset.RemoveChild($urlNode)
  }
}
$existing = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($loc in $sitemapDoc.SelectNodes('//sm:loc', $ns)) { [void]$existing.Add($loc.InnerText) }
if ($existing.Add($catalogUrl)) {
  $urlNode = $sitemapDoc.CreateElement('url', $urlset.NamespaceURI)
  $locNode = $sitemapDoc.CreateElement('loc', $urlset.NamespaceURI); $locNode.InnerText = $catalogUrl; $urlNode.AppendChild($locNode) | Out-Null
  $lastModNode = $sitemapDoc.CreateElement('lastmod', $urlset.NamespaceURI); $lastModNode.InnerText = $generatedAt; $urlNode.AppendChild($lastModNode) | Out-Null
  $urlset.AppendChild($urlNode) | Out-Null
}
foreach ($url in $urls) {
  if (-not $existing.Add($url)) { continue }
  $urlNode = $sitemapDoc.CreateElement('url', $urlset.NamespaceURI)
  $locNode = $sitemapDoc.CreateElement('loc', $urlset.NamespaceURI); $locNode.InnerText = $url; $urlNode.AppendChild($locNode) | Out-Null
  $lastModNode = $sitemapDoc.CreateElement('lastmod', $urlset.NamespaceURI); $lastModNode.InnerText = $generatedAt; $urlNode.AppendChild($lastModNode) | Out-Null
  $urlset.AppendChild($urlNode) | Out-Null
}
$catalog | Add-Member -NotePropertyName products -NotePropertyValue @($indexedProducts) -Force
$catalogJson = ConvertTo-Json -InputObject $catalog -Depth 8 -Compress
[IO.File]::WriteAllText([IO.Path]::GetFullPath($CatalogPath), $catalogJson, [Text.UTF8Encoding]::new($false))
$settings = New-Object System.Xml.XmlWriterSettings
$settings.Encoding = [Text.UTF8Encoding]::new($false)
$settings.Indent = $true
$writer = [System.Xml.XmlWriter]::Create([IO.Path]::GetFullPath($SitemapPath), $settings)
try { $sitemapDoc.Save($writer) } finally { $writer.Dispose() }
Write-Host ("Generated {0} individual product pages in {1} and updated sitemap: {2}" -f $count, [IO.Path]::GetFullPath($OutputDirectory), [IO.Path]::GetFullPath($SitemapPath))
