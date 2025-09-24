# --- CONFIG ---
$acrName = "huntrouteacr43776"
$imageName = "huntroute-backend"
$tag = "latest"
$fullImage = "${acrName}.azurecr.io/${imageName}:${tag}"
$deploymentName = "backend-deployment"
$namespace = "default"
# ----------------

function Write-Step($text, $color="White") {
    Write-Host "=== $text ===" -ForegroundColor $color
}

# 1️⃣ Docker build
Write-Step "Docker image build ediliyor..." "Cyan"
if (docker build -t "${imageName}:${tag}" .) {
    Write-Step "✅ Docker build tamam" "Green"
} else { Write-Step "❌ Docker build başarısız" "Red"; exit 1 }

# 2️⃣ Tag
Write-Step "Image ACR'ye tag ediliyor..." "Cyan"
if (docker tag "${imageName}:${tag}" $fullImage) {
    Write-Step "✅ Image tag tamam" "Green"
} else { Write-Step "❌ Image tag başarısız" "Red"; exit 1 }

# 3️⃣ ACR login
Write-Step "Azure ACR login..." "Cyan"
if (az acr login --name $acrName) {
    Write-Step "✅ ACR login tamam" "Green"
} else { Write-Step "❌ ACR login başarısız" "Red"; exit 1 }

# 4️⃣ Push
Write-Step "Image push ediliyor..." "Cyan"
if (docker push $fullImage) {
    Write-Step "✅ Image push tamam" "Green"
} else { Write-Step "❌ Image push başarısız" "Red"; exit 1 }

# 5️⃣ AKS update
Write-Step "AKS deployment güncelleniyor..." "Cyan"
if (kubectl set image deployment/$deploymentName $imageName=$fullImage -n $namespace) {
    Write-Step "✅ Deployment güncellendi" "Green"
} else { Write-Step "❌ Deployment update başarısız" "Red"; exit 1 }

# 6️⃣ Rollout kontrol
Write-Step "Rollout durumu izleniyor..." "Cyan"
if (kubectl rollout status deployment/$deploymentName -n $namespace) {
    Write-Step "✅ Rollout tamam" "Green"
} else { Write-Step "❌ Rollout başarısız" "Red"; exit 1 }

# 7️⃣ Pod logları
Write-Step "Pod logları izleniyor..." "Yellow"
$podName = kubectl get pods -n $namespace -l app=$imageName -o jsonpath="{.items[0].metadata.name}"
kubectl logs -f $podName -n $namespace
