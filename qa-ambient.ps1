$ErrorActionPreference = "Stop"

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$profile = "C:\Users\agnef\AppData\Local\Temp\opencode\fjord-cdp-profile"
$port = 9337
$url = "file:///C:/Users/agnef/Documents/Default%20Project/index.html"
$process = Start-Process -FilePath $edge -ArgumentList @(
  "--headless=new",
  "--disable-gpu",
  "--allow-file-access-from-files",
  "--remote-debugging-port=$port",
  "--user-data-dir=$profile",
  "about:blank"
) -PassThru

$socket = New-Object System.Net.WebSockets.ClientWebSocket
$id = 0

function Send-Cdp {
  param([string]$Method, [hashtable]$Params = @{})

  $script:id += 1
  $message = @{ id = $script:id; method = $Method; params = $Params } | ConvertTo-Json -Compress -Depth 20
  $bytes = [Text.Encoding]::UTF8.GetBytes($message)
  $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
  $socket.SendAsync($segment, [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).Wait()

  while ($true) {
    $builder = New-Object Text.StringBuilder
    do {
      $buffer = New-Object byte[] 65536
      $receiveSegment = New-Object System.ArraySegment[byte] -ArgumentList @(,$buffer)
      $result = $socket.ReceiveAsync($receiveSegment, [Threading.CancellationToken]::None).Result
      [void]$builder.Append([Text.Encoding]::UTF8.GetString($buffer, 0, $result.Count))
    } while (-not $result.EndOfMessage)

    $response = $builder.ToString() | ConvertFrom-Json
    if ($response.id -eq $script:id) {
      if ($response.error) { throw "$Method failed: $($response.error.message)" }
      return $response.result
    }
  }
}

function Evaluate {
  param([string]$Expression)
  $result = Send-Cdp "Runtime.evaluate" @{
    expression = $Expression
    returnByValue = $true
    awaitPromise = $true
  }
  if ($result.exceptionDetails) { throw $result.exceptionDetails.text }
  return $result.result.value
}

function Set-Viewport {
  param([int]$Width, [int]$Height, [bool]$Mobile = $false)
  [void](Send-Cdp "Emulation.setDeviceMetricsOverride" @{
    width = $Width
    height = $Height
    deviceScaleFactor = 1
    mobile = $Mobile
    screenWidth = $Width
    screenHeight = $Height
  })
  [void](Send-Cdp "Emulation.setTouchEmulationEnabled" @{ enabled = $Mobile; maxTouchPoints = 1 })
}

function Navigate {
  [void](Send-Cdp "Page.navigate" @{ url = $url })
  Start-Sleep -Milliseconds 700
}

function Move-Mouse {
  param([double]$X, [double]$Y)
  [void](Send-Cdp "Input.dispatchMouseEvent" @{ type = "mouseMoved"; x = $X; y = $Y; button = "none" })
}

$results = [ordered]@{}

try {
  $target = $null
  for ($attempt = 0; $attempt -lt 40 -and -not $target; $attempt += 1) {
    try {
      $targets = Invoke-RestMethod "http://127.0.0.1:$port/json"
      $target = $targets | Where-Object { $_.type -eq "page" } | Select-Object -First 1
    } catch {
      Start-Sleep -Milliseconds 100
    }
  }
  if (-not $target) { throw "Could not connect to Edge DevTools." }

  $socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait()
  [void](Send-Cdp "Page.enable")
  [void](Send-Cdp "Runtime.enable")
  [void](Send-Cdp "Page.addScriptToEvaluateOnNewDocument" @{
    source = 'window.__qaErrors=[];addEventListener("error",e=>__qaErrors.push(e.message));addEventListener("unhandledrejection",e=>__qaErrors.push(String(e.reason)));'
  })

  $matrix = @()
  foreach ($viewport in @(
    @{ w = 1366; h = 768; mobile = $false },
    @{ w = 1440; h = 900; mobile = $false },
    @{ w = 1920; h = 1080; mobile = $false },
    @{ w = 375; h = 812; mobile = $true }
  )) {
    Set-Viewport $viewport.w $viewport.h $viewport.mobile
    [void](Send-Cdp "Emulation.setEmulatedMedia" @{ features = @() })
    Navigate
    $matrix += Evaluate @'
(() => {
  const root = document.documentElement;
  const measure = theme => {
    root.dataset.theme = theme;
    return {
      theme,
      overflow: root.scrollWidth > root.clientWidth,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth
    };
  };
  return {
    viewport: [innerWidth, innerHeight],
    finePointer: matchMedia("(hover: hover) and (pointer: fine)").matches,
    pixels: document.querySelectorAll(".hero-pixel").length,
    graphicsPointerEvents: getComputedStyle(document.querySelector(".hero-graphics")).pointerEvents,
    desktopProcess: getComputedStyle(document.querySelector(".process-connector--desktop")).display,
    mobileProcess: getComputedStyle(document.querySelector(".process-connector--mobile")).display,
    themes: [measure("dark"), measure("light")],
    errors: window.__qaErrors
  };
})()
'@
  }
  $results.matrix = $matrix

  Set-Viewport 1366 768 $false
  Navigate
  $heroRect = Evaluate '(() => { const r=document.querySelector(".hero").getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}; })()'
  for ($step = 1; $step -le 5; $step += 1) {
    Move-Mouse ($heroRect.x + $heroRect.w * (0.18 + $step * 0.08)) ($heroRect.y + $heroRect.h * (0.3 + $step * 0.035))
    Start-Sleep -Milliseconds 85
  }
  Start-Sleep -Milliseconds 220
  $slowResponse = Evaluate @'
(() => {
  const offsets=[...document.querySelectorAll(".hero-pixel")].map(el=>{
    const s=el.style;
    return Math.hypot(parseFloat(s.getPropertyValue("--pixel-offset-x"))||0,parseFloat(s.getPropertyValue("--pixel-offset-y"))||0);
  });
  const g=document.querySelector("[data-hero-grid]").style;
  return {maxPixel:Math.max(...offsets),grid:[g.getPropertyValue("--grid-x"),g.getPropertyValue("--grid-y")]};
})()
'@

  Move-Mouse ($heroRect.x + 40) ($heroRect.y + 100)
  Move-Mouse ($heroRect.x + $heroRect.w - 40) ($heroRect.y + $heroRect.h - 80)
  Start-Sleep -Milliseconds 100
  $fastResponse = Evaluate @'
Math.max(...[...document.querySelectorAll(".hero-pixel")].map(el=>Math.hypot(parseFloat(el.style.getPropertyValue("--pixel-offset-x"))||0,parseFloat(el.style.getPropertyValue("--pixel-offset-y"))||0)))
'@
  Move-Mouse 10 760
  Start-Sleep -Milliseconds 900
  $returnResponse = Evaluate @'
Math.max(...[...document.querySelectorAll(".hero-pixel")].map(el=>Math.hypot(parseFloat(el.style.getPropertyValue("--pixel-offset-x"))||0,parseFloat(el.style.getPropertyValue("--pixel-offset-y"))||0)))
'@
  $results.heroPointer = @{ slow = $slowResponse; fastMax = $fastResponse; returnMax = $returnResponse }

  Move-Mouse ($heroRect.x + $heroRect.w / 2) ($heroRect.y + $heroRect.h / 2)
  Start-Sleep -Milliseconds 180
  [void](Evaluate 'document.documentElement.style.scrollBehavior="auto";scrollTo(0,document.querySelector("#performance").offsetTop+300);true')
  Start-Sleep -Milliseconds 350
  $results.stationaryScroll = Evaluate @'
({heroVisible:document.querySelector(".hero").classList.contains("is-in-view"),maxPixel:Math.max(...[...document.querySelectorAll(".hero-pixel")].map(el=>Math.hypot(parseFloat(el.style.getPropertyValue("--pixel-offset-x"))||0,parseFloat(el.style.getPropertyValue("--pixel-offset-y"))||0)))})
'@

  [void](Evaluate 'document.querySelector(".channel-metrics").scrollIntoView({block:"center",behavior:"instant"});true')
  Start-Sleep -Milliseconds 500
  $metricPoint = Evaluate '(() => { const r=document.querySelector(".channel-metrics li:nth-child(2)").getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()'
  Move-Mouse $metricPoint.x $metricPoint.y
  Start-Sleep -Milliseconds 100
  $metricFirst = Evaluate '({metrics:document.querySelectorAll(".channel-metrics .is-signal-active").length,paths:document.querySelectorAll("[data-network-path].is-active").length,nodes:document.querySelectorAll("[data-network-node].is-active").length,pulses:document.querySelectorAll("[data-network-pulse].is-active").length})'
  $metricPoint2 = Evaluate '(() => { const r=document.querySelector(".channel-metrics li:nth-child(4)").getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()'
  Move-Mouse $metricPoint2.x $metricPoint2.y
  Move-Mouse $metricPoint.x $metricPoint.y
  Start-Sleep -Milliseconds 100
  $metricRepeated = Evaluate '({metrics:document.querySelectorAll(".channel-metrics .is-signal-active").length,paths:document.querySelectorAll("[data-network-path].is-active").length,nodes:document.querySelectorAll("[data-network-node].is-active").length,pulses:document.querySelectorAll("[data-network-pulse].is-active").length})'
  $results.metricPointer = @{ first = $metricFirst; repeated = $metricRepeated }

  [void](Evaluate 'document.querySelector(".thumbnail-gallery figure").scrollIntoView({block:"center",behavior:"instant"});true')
  Start-Sleep -Milliseconds 500
  $framePoint = Evaluate '(() => { const r=document.querySelector(".thumbnail-gallery figure").getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()'
  Move-Mouse $framePoint.x $framePoint.y
  Start-Sleep -Milliseconds 320
  $results.frameHover = Evaluate @'
(() => { const f=document.querySelector(".thumbnail-gallery figure"),i=f.querySelector("img"); return {figure:getComputedStyle(f).transform,image:getComputedStyle(i).transform,frameOpacity:getComputedStyle(f,"::before").opacity,caption:getComputedStyle(f.querySelector("figcaption")).color}; })()
'@

  [void](Evaluate 'document.querySelector("[data-process-flow]").scrollIntoView({block:"center",behavior:"instant"});true')
  Start-Sleep -Milliseconds 1600
  $processPoint = Evaluate '(() => { const r=document.querySelector("[data-process-flow] li:nth-child(3)").getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()'
  Move-Mouse $processPoint.x $processPoint.y
  Start-Sleep -Milliseconds 120
  $results.process = Evaluate @'
({drawn:document.querySelector("[data-process-flow]").classList.contains("is-drawn"),activeSteps:document.querySelectorAll(".process-list li.is-active").length,activeNodes:document.querySelectorAll("[data-process-node].is-active").length,adjacentSegments:document.querySelectorAll("[data-process-segment].is-adjacent").length,forwardSegments:document.querySelectorAll("[data-process-segment].is-forward").length})
'@

  [void](Send-Cdp "Emulation.setEmulatedMedia" @{ features = @(@{ name = "prefers-reduced-motion"; value = "reduce" }) })
  Navigate
  $reducedRect = Evaluate '(() => { const r=document.querySelector(".hero").getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()'
  Move-Mouse $reducedRect.x $reducedRect.y
  Start-Sleep -Milliseconds 180
  $results.reducedMotion = Evaluate @'
(() => {
  const pixel=document.querySelector(".hero-pixel");
  return {
    matches:matchMedia("(prefers-reduced-motion: reduce)").matches,
    pixelAnimation:getComputedStyle(pixel,"::before").animationName,
    gridAnimation:getComputedStyle(document.querySelector(".hero-grid-plane"),"::before").animationName,
    diagnosticAnimation:getComputedStyle(document.querySelector(".diagnostic-note"),"::after").animationName,
    pixelOffset:[pixel.style.getPropertyValue("--pixel-offset-x"),pixel.style.getPropertyValue("--pixel-offset-y")],
    processDash:getComputedStyle(document.querySelector(".process-connector__base")).strokeDashoffset,
    revealCount:document.querySelectorAll("[data-reveal]").length
  };
})()
'@

  [void](Send-Cdp "Emulation.setEmulatedMedia" @{ features = @() })
  Set-Viewport 375 812 $true
  Navigate
  $results.mobile = Evaluate @'
(() => {
  document.querySelector("[data-process-flow]").scrollIntoView({block:"center"});
  return {
    viewport:[innerWidth,innerHeight],
    overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
    finePointer:matchMedia("(hover: hover) and (pointer: fine)").matches,
    pixels:document.querySelectorAll(".hero-pixel").length,
    desktopConnector:getComputedStyle(document.querySelector(".process-connector--desktop")).display,
    mobileConnector:getComputedStyle(document.querySelector(".process-connector--mobile")).display,
    brokenImages:[...document.images].filter(img=>img.hasAttribute("src")&&img.complete&&!img.naturalWidth).length,
    duplicateIds:[...document.querySelectorAll("[id]")].filter((el,i,a)=>a.findIndex(x=>x.id===el.id)!==i).length,
    brokenHashes:[...document.querySelectorAll("a[href^=\"#\"]")].filter(a=>!document.querySelector(a.getAttribute("href"))).length,
    errors:window.__qaErrors
  };
})()
'@

  $results | ConvertTo-Json -Depth 20
} finally {
  if ($socket.State -eq [Net.WebSockets.WebSocketState]::Open) {
    $socket.CloseAsync([Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "QA complete", [Threading.CancellationToken]::None).Wait()
  }
  $socket.Dispose()
  if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force }
}
