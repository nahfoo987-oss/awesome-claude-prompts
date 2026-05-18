-- RemoteSetup | ServerScriptService
-- Run once on server start. Creates all RemoteEvents and BindableEvents.
-- PASTE INTO: ServerScriptService > Script

local RS = game:GetService("ReplicatedStorage")

local remotesFolder = Instance.new("Folder")
remotesFolder.Name   = "Remotes"
remotesFolder.Parent = RS

local remoteNames = {
    -- Crown core
    "CrownPickup",
    "CrownDrop",
    "CrownStolen",
    "StageChanged",
    "UpdateTimer",
    "RoundEnd",

    -- Economy
    "CoinReward",
    "InitClient",

    -- Power-ups
    "PowerUpCollected",
    "PowerUpSpawned",
    "ActivateHammer",

    -- Shop
    "BuyCosmeticCoins",
    "EquipCosmetic",
    "CosmeticUnlocked",
    "PlayerEquipChanged",
    "UpdateShop",

    -- Battle Pass
    "UpdateBattlePass",
    "ClaimPassTier",

    -- Crowd / Events
    "CrowdEvent",
    "CorruptionStageChanged",

    -- Lobby
    "PreRoundLobbyUpdate",
    "ReadyUp",
    "MapVote",

    -- Royal Slam
    "RoyalSlam",

    -- Kingdom Wars
    "KingdomScoreUpdate",

    -- Bandit system
    "BanditModeStart",
    "BanditModeEnd",
    "BanditReclaim",

    -- Challenges
    "ChallengeUpdate",
    "ChallengeComplete",

    -- Reward Wheel
    "RewardWheelSpin",

    -- Guild system
    "GuildUpdate",
    "GuildCreate",
    "GuildJoin",

    -- Match history
    "MatchHistoryUpdate",

    -- Dynamic weather
    "WeatherEvent",

    -- Emote system
    "EmotePlay",
    "EmoteRequest",

    -- Trophy wall
    "TrophyUpdate",

    -- Throne sit
    "ThroneSitResult",
    "OpenShop",
}

for _, name in remoteNames do
    local re    = Instance.new("RemoteEvent")
    re.Name     = name
    re.Parent   = remotesFolder
end

local bindableNames = {
    "StageChangedBindable",
    "CrownPickupBindable",
    "RoundEndBindable",
    "CoinShowerBindable",
    "Final30",
}

for _, name in bindableNames do
    local be    = Instance.new("BindableEvent")
    be.Name     = name
    be.Parent   = RS
end

-- AddCoins BindableFunction (created HERE so it exists before any other script needs it)
-- DataService will set its OnInvoke handler once it loads.
-- FIX: was created at the bottom of DataService, causing race conditions.
local addCoinsFunc    = Instance.new("BindableFunction")
addCoinsFunc.Name     = "AddCoins"
addCoinsFunc.Parent   = RS

print("[CrownChaos] All remotes and bindables created successfully.")
