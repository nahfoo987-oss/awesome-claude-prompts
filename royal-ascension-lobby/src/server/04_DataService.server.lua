-- DataService | ServerScriptService
-- Crown Coins, XP, leveling, cosmetic ownership, battle pass, Robux purchases.
-- FIX: AddCoins BindableFunction now created in RemoteSetup (no race).
--      OnInvoke handler set here at top so it's ready before PlayerAdded fires.
--      totalWins and totalSteals now incremented via attribute change signals.

local Players            = game:GetService("Players")
local DataStoreService   = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage  = game:GetService("ReplicatedStorage")

local Remotes    = ReplicatedStorage:WaitForChild("Remotes")
local PlayerData = DataStoreService:GetDataStore("CrownChaos_PlayerData_v1")

-- FIX: BindableFunction exists (created in RemoteSetup), we just set the handler
local AddCoinsFunc = ReplicatedStorage:WaitForChild("AddCoins")

-------------------------------------------------
-- PRODUCT IDs  (replace with real IDs from Roblox Creator Hub)
-------------------------------------------------
local PRODUCTS = {
    COINS_500   = 123456001,
    COINS_1500  = 123456002,
    COINS_5000  = 123456003,
    TIER_SKIP   = 123456004,
}
local GAMEPASSES = {
    BATTLE_PASS = 987654001,
    VIP         = 987654002,
}

-------------------------------------------------
-- DEFAULT DATA TEMPLATE
-------------------------------------------------
local function defaultData()
    return {
        coins            = 0,
        xp               = 0,
        level            = 1,
        cosmetics        = { "crown_default", "aura_none", "kill_default", "trail_none", "pet_none", "pose_default" },
        equipped         = {
            crown = "crown_default",
            aura  = "aura_none",
            kill  = "kill_default",
            trail = "trail_none",
            pet   = "pet_none",
            pose  = "pose_default",
        },
        passOwned        = false,
        passTier         = 0,
        totalWins        = 0,
        totalSteals      = 0,
        tyrantCount      = 0,
        kingdom          = nil,
        dailyLoginDate   = "",
        dailyLoginStreak = 0,
    }
end

-------------------------------------------------
-- COSMETIC PRICES
-------------------------------------------------
local COIN_PRICES = {
    crown_rose_gold = 500,
    crown_silver    = 500,
    crown_obsidian  = 800,
    trail_sparks    = 200,
    trail_embers    = 300,
    trail_frost     = 350,
}
local ROBUX_PRICES = {
    crown_diamond   = { price = 200, productId = 123456010 },
    crown_lava      = { price = 250, productId = 123456011 },
    crown_void      = { price = 300, productId = 123456012 },
    crown_brainrot  = { price = 275, productId = 123456013 },
    aura_phantom    = { price = 175, productId = 123456020 },
    aura_flame      = { price = 200, productId = 123456021 },
    aura_ice        = { price = 225, productId = 123456022 },
    aura_holy       = { price = 250, productId = 123456023 },
    aura_void       = { price = 275, productId = 123456024 },
    aura_rainbow    = { price = 300, productId = 123456025 },
    kill_confetti   = { price = 125, productId = 123456030 },
    kill_lightning  = { price = 175, productId = 123456031 },
    kill_shatter    = { price = 200, productId = 123456032 },
    kill_goldstatue = { price = 225, productId = 123456033 },
    kill_sandvortex = { price = 150, productId = 123456034 },
    trail_thunder   = { price = 200, productId = 123456040 },
    pet_crown       = { price = 250, productId = 123456050 },
    pet_dragon      = { price = 350, productId = 123456051 },
    pet_jester      = { price = 400, productId = 123456052 },
    pet_knight      = { price = 450, productId = 123456053 },
    pose_toss       = { price = 75,  productId = 123456060 },
    pose_bow        = { price = 75,  productId = 123456061 },
    pose_laugh      = { price = 100, productId = 123456062 },
    pose_throne     = { price = 400, productId = 123456063 },
    pose_chariot    = { price = 500, productId = 123456064 },
}

local productToCosmeticId = {}
for cosmeticId, data in pairs(ROBUX_PRICES) do
    productToCosmeticId[data.productId] = cosmeticId
end
productToCosmeticId[PRODUCTS.COINS_500]  = "coins_500"
productToCosmeticId[PRODUCTS.COINS_1500] = "coins_1500"
productToCosmeticId[PRODUCTS.COINS_5000] = "coins_5000"
productToCosmeticId[PRODUCTS.TIER_SKIP]  = "tier_skip"

-------------------------------------------------
-- BATTLE PASS REWARDS
-------------------------------------------------
local PASS_REWARDS = {
    [2]  = { type = "cosmetic", id = "trail_sparks",  freeOk = true  },
    [4]  = { type = "cosmetic", id = "aura_phantom",  freeOk = false },
    [5]  = { type = "cosmetic", id = "trail_embers",  freeOk = false },
    [10] = { type = "cosmetic", id = "pose_bow",       freeOk = false },
    [15] = { type = "cosmetic", id = "kill_shatter",   freeOk = false },
    [20] = { type = "cosmetic", id = "aura_void",      freeOk = false },
    [25] = { type = "cosmetic", id = "pet_dragon",     freeOk = false },
    [30] = { type = "cosmetic", id = "crown_season1",  freeOk = false },
}
local PASS_COIN_REWARDS = {
    100, 0, 200, 0, 0, 300, 0, 350, 0, 0,
    400, 0, 450, 0, 0, 500, 0, 500, 0, 0,
    600, 0, 600, 0, 0, 700, 0, 700, 0, 0,
}

-------------------------------------------------
-- IN-MEMORY CACHE
-------------------------------------------------
local cache = {}

local function getData(player)
    return cache[player.UserId]
end

-------------------------------------------------
-- SAVE / LOAD
-------------------------------------------------
local function saveData(player)
    local d = getData(player)
    if not d then return end
    pcall(function()
        PlayerData:SetAsync("uid_" .. player.UserId, d)
    end)
end

local function loadData(player)
    local ok, stored = pcall(function()
        return PlayerData:GetAsync("uid_" .. player.UserId)
    end)

    local d = defaultData()
    if ok and stored then
        for k, v in pairs(stored) do d[k] = v end
    end

    if not d.kingdom then
        local kingdoms = { "Iron", "Gold", "Stone", "Ash" }
        d.kingdom = kingdoms[math.random(1, 4)]
    end

    cache[player.UserId] = d

    -- Daily login bonus
    local today = os.date("%Y-%m-%d")
    if d.dailyLoginDate ~= today then
        d.dailyLoginDate   = today
        d.dailyLoginStreak = d.dailyLoginStreak + 1
        local bonus = 50 + (d.dailyLoginStreak * 5)
        d.coins = d.coins + bonus
        Remotes.CoinReward:FireClient(player, bonus, "Daily Login Bonus!")
    end

    -- Check battle pass ownership
    local passOk, ownsPass = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, GAMEPASSES.BATTLE_PASS)
    end)
    if passOk and ownsPass then d.passOwned = true end

    Remotes.InitClient:FireClient(player, d)
    return d
end

-------------------------------------------------
-- UTILITY
-------------------------------------------------
local XP_PER_LEVEL = 500

local function addCoins(player, amount)
    local d = getData(player)
    if not d then return end
    -- FIX: VIP gamepass gives 1.5x coins (was defined but never used)
    local mult = 1
    if d.passOwned then
        local vipOk, ownsVIP = pcall(function()
            return MarketplaceService:UserOwnsGamePassAsync(player.UserId, GAMEPASSES.VIP)
        end)
        if vipOk and ownsVIP then mult = 1.5 end
    end
    local finalAmount = math.floor(amount * mult)
    d.coins = d.coins + finalAmount
    Remotes.CoinReward:FireClient(player, finalAmount, "")
end

local function addXP(player, amount)
    local d = getData(player)
    if not d then return end
    d.xp = d.xp + amount
    local leveled = false
    while d.xp >= XP_PER_LEVEL do
        d.xp    = d.xp - XP_PER_LEVEL
        d.level = d.level + 1
        leveled = true
    end
    if leveled then addCoins(player, 100) end
end

local function grantCosmetic(player, cosmeticId)
    local d = getData(player)
    if not d then return end
    if not table.find(d.cosmetics, cosmeticId) then
        table.insert(d.cosmetics, cosmeticId)
        Remotes.CosmeticUnlocked:FireClient(player, cosmeticId)
    end
end

-------------------------------------------------
-- FIX: AddCoins BindableFunction handler
-- CrownService calls this to persist coins AND show the popup.
-------------------------------------------------
AddCoinsFunc.OnInvoke = function(player, amount)
    addCoins(player, amount)
end

-------------------------------------------------
-- FIX: Track totalWins and totalSteals via attribute signals from CrownService
-- CrownService sets StealsThisSession / WinsThisSession attributes on the player.
-- DataService listens and increments the persistent counters.
-------------------------------------------------
Players.PlayerAdded:Connect(function(player)
    loadData(player)

    player:GetAttributeChangedSignal("StealsThisSession"):Connect(function()
        local d = getData(player)
        if d then
            d.totalSteals = (d.totalSteals or 0) + 1
        end
    end)

    player:GetAttributeChangedSignal("WinsThisSession"):Connect(function()
        local d = getData(player)
        if d then
            d.totalWins   = (d.totalWins or 0) + 1
            d.tyrantCount = d.tyrantCount or 0
            -- If they won via Tyrant (stage 5), CrownService can set TyrantWin attribute
        end
    end)

    player:GetAttributeChangedSignal("TyrantWin"):Connect(function()
        local d = getData(player)
        if d then
            d.tyrantCount = (d.tyrantCount or 0) + 1
        end
    end)
end)

-------------------------------------------------
-- REMOTE HANDLERS
-------------------------------------------------

-- Buy with coins
Remotes.BuyCosmeticCoins.OnServerEvent:Connect(function(player, cosmeticId)
    local price = COIN_PRICES[cosmeticId]
    if not price then return end
    local d = getData(player)
    if not d then return end
    if d.coins < price then
        Remotes.CoinReward:FireClient(player, 0, "Not enough coins!")
        return
    end
    if table.find(d.cosmetics, cosmeticId) then return end
    d.coins = d.coins - price
    grantCosmetic(player, cosmeticId)
end)

-- Equip cosmetic
Remotes.EquipCosmetic.OnServerEvent:Connect(function(player, slot, cosmeticId)
    local d = getData(player)
    if not d then return end
    local validSlots = { "crown", "aura", "kill", "trail", "pet", "pose" }
    if not table.find(validSlots, slot) then return end
    if cosmeticId ~= "default" and cosmeticId ~= "none"
        and not table.find(d.cosmetics, cosmeticId) then return end
    d.equipped[slot] = cosmeticId
    for _, p in Players:GetPlayers() do
        Remotes.PlayerEquipChanged:FireClient(p, player, slot, cosmeticId)
    end
end)

-- Claim battle pass tier
Remotes.ClaimPassTier.OnServerEvent:Connect(function(player, tier)
    local d = getData(player)
    if not d then return end
    if tier ~= d.passTier + 1 then return end

    local reward  = PASS_REWARDS[tier]
    local coinAmt = PASS_COIN_REWARDS[tier] or 0

    local premiumTiers = { 4, 5, 10, 15, 20, 25, 30 }
    if table.find(premiumTiers, tier) and not d.passOwned then return end

    d.passTier = tier

    if coinAmt > 0 then addCoins(player, coinAmt) end
    if reward and reward.type == "cosmetic" then
        grantCosmetic(player, reward.id)
    end
end)

-------------------------------------------------
-- MARKETPLACE RECEIPT HANDLER
-------------------------------------------------
MarketplaceService.ProcessReceipt = function(info)
    local player = Players:GetPlayerByUserId(info.PlayerId)
    if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end

    local id = info.ProductId

    if id == PRODUCTS.COINS_500 then
        addCoins(player, 500)
    elseif id == PRODUCTS.COINS_1500 then
        addCoins(player, 1500)
    elseif id == PRODUCTS.COINS_5000 then
        addCoins(player, 5000)
    elseif id == PRODUCTS.TIER_SKIP then
        local d = getData(player)
        if d and d.passOwned then
            d.passTier = math.min(d.passTier + 1, 30)
        end
    else
        local cosmeticId = productToCosmeticId[id]
        if cosmeticId then grantCosmetic(player, cosmeticId) end
    end

    saveData(player)
    return Enum.ProductPurchaseDecision.PurchaseGranted
end

-------------------------------------------------
-- PLAYER LIFECYCLE
-------------------------------------------------
Players.PlayerRemoving:Connect(function(player)
    saveData(player)
    cache[player.UserId] = nil
end)

-- Auto-save every 60 seconds
task.spawn(function()
    while true do
        task.wait(60)
        for _, player in Players:GetPlayers() do
            saveData(player)
        end
    end
end)

print("[CrownChaos] DataService loaded.")
