-- BanditSystem | ServerScriptService
-- When the crown changes hands, the previous holder becomes a "bandit" for 60s.
-- Bandits get a speed boost and a red visual state. Reclaiming earns bonus coins.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes   = ReplicatedStorage:WaitForChild("Remotes")
local Bindables = {
    CrownPickup = ReplicatedStorage:WaitForChild("CrownPickupBindable"),
    RoundEnd    = ReplicatedStorage:WaitForChild("RoundEndBindable"),
}

local RE = {
    BanditModeStart = Remotes:WaitForChild("BanditModeStart"),
    BanditModeEnd   = Remotes:WaitForChild("BanditModeEnd"),
    BanditReclaim   = Remotes:WaitForChild("BanditReclaim"),
}

local AddCoins = ReplicatedStorage:WaitForChild("AddCoins")

local BANDIT_DURATION     = 60
local BANDIT_SPEED_BONUS  = 8
local RECLAIM_COIN_BONUS  = 75

-------------------------------------------------
-- STATE
-------------------------------------------------
local lastHolder  = nil   -- Player | nil
local activeBandit= nil   -- Player | nil
local banditThread= nil   -- task thread

local function clearBandit(player, reclaimed)
    if not player or player ~= activeBandit then return end

    -- Remove speed bonus
    local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
    if hum then
        hum.WalkSpeed = math.max(16, hum.WalkSpeed - BANDIT_SPEED_BONUS)
    end

    -- Remove red highlight
    local char = player.Character
    if char then
        local hl = char:FindFirstChild("BanditHighlight")
        if hl then hl:Destroy() end
        local nameTag = char:FindFirstChild("Head") and
                        char.Head:FindFirstChild("BanditTag")
        if nameTag then nameTag:Destroy() end
    end

    RE.BanditModeEnd:FireClient(player, reclaimed)
    activeBandit = nil

    if banditThread then
        task.cancel(banditThread)
        banditThread = nil
    end
end

local function activateBandit(player)
    -- Clear any existing bandit state first
    if activeBandit then clearBandit(activeBandit, false) end

    activeBandit = player

    -- Speed boost
    local char = player.Character
    if not char then return end
    local hum = char:FindFirstChildOfClass("Humanoid")
    if not hum then return end
    hum.WalkSpeed = hum.WalkSpeed + BANDIT_SPEED_BONUS

    -- Red highlight
    local hl = Instance.new("Highlight")
    hl.Name          = "BanditHighlight"
    hl.FillColor     = Color3.fromRGB(200, 30, 30)
    hl.OutlineColor  = Color3.fromRGB(255, 80, 80)
    hl.FillTransparency    = 0.5
    hl.OutlineTransparency = 0
    hl.Parent        = char

    -- Bandit tag above head
    local head = char:FindFirstChild("Head")
    if head then
        local bb = Instance.new("BillboardGui")
        bb.Name        = "BanditTag"
        bb.Size        = UDim2.new(0, 160, 0, 30)
        bb.StudsOffset = Vector3.new(0, 3.5, 0)
        bb.AlwaysOnTop = false
        bb.Parent      = head

        local lbl = Instance.new("TextLabel")
        lbl.Size                   = UDim2.fromScale(1, 1)
        lbl.BackgroundTransparency = 1
        lbl.Text                   = "⚔️ BANDIT"
        lbl.TextColor3             = Color3.fromRGB(255, 80, 80)
        lbl.Font                   = Enum.Font.GothamBold
        lbl.TextScaled             = true
        lbl.TextStrokeTransparency = 0.3
        lbl.Parent                 = bb
    end

    RE.BanditModeStart:FireClient(player, BANDIT_DURATION)

    -- Auto-expire after 60s
    banditThread = task.delay(BANDIT_DURATION, function()
        clearBandit(player, false)
    end)
end

-------------------------------------------------
-- CROWN TRACKING
-------------------------------------------------
Bindables.CrownPickup.Event:Connect(function(player)
    local prev = lastHolder

    -- If the bandit reclaimed the crown
    if player == activeBandit then
        clearBandit(player, true)
        RE.BanditReclaim:FireClient(player)
        pcall(function() AddCoins:Invoke(player, RECLAIM_COIN_BONUS) end)
    elseif prev and prev ~= player and prev.Parent then
        -- Crown changed hands → old holder becomes bandit
        task.defer(function()
            -- Small delay so CrownService fully updates first
            activateBandit(prev)
        end)
    end

    lastHolder = player
end)

Bindables.RoundEnd.Event:Connect(function(_winner)
    if activeBandit then clearBandit(activeBandit, false) end
    lastHolder = nil
end)

print("[CrownChaos] BanditSystem loaded.")
