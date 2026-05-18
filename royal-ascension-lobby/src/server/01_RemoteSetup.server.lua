-- RemoteSetup | ServerScriptService
-- Idempotent: safe to run multiple times if Studio reloads scripts.
-- Creates all RemoteEvents in ReplicatedStorage.Remotes and
-- all BindableEvents directly in ReplicatedStorage.

local RS = game:GetService("ReplicatedStorage")

local remotesFolder = RS:FindFirstChild("Remotes")
if not remotesFolder then
    remotesFolder        = Instance.new("Folder")
    remotesFolder.Name   = "Remotes"
    remotesFolder.Parent = RS
end

local remoteNames = {
    -- Crown core
    "CrownPickup", "CrownDrop", "CrownStolen", "StageChanged",
    "UpdateTimer", "RoundEnd",

    -- Economy
    "CoinReward", "InitClient", "AddCoins",

    -- Power-ups
    "PowerUpCollected", "PowerUpSpawned", "ActivateHammer",

    -- Shop / cosmetics
    "BuyCosmeticCoins", "EquipCosmetic", "CosmeticUnlocked",
    "PlayerEquipChanged", "UpdateShop", "OpenShop",

    -- Battle Pass
    "UpdateBattlePass", "ClaimPassTier",

    -- Crowd / events
    "CrowdEvent", "CorruptionStageChanged",

    -- Lobby
    "PreRoundLobbyUpdate", "ReadyUp", "MapVote",

    -- Royal Slam
    "RoyalSlam",

    -- Kingdom Wars
    "KingdomScoreUpdate",

    -- Bandit system
    "BanditModeStart", "BanditModeEnd", "BanditReclaim",

    -- Challenges
    "ChallengeUpdate", "ChallengeComplete",

    -- Reward Wheel
    "RewardWheelSpin",

    -- Guild system
    "GuildUpdate", "GuildCreate", "GuildJoin",

    -- Match history
    "MatchHistoryUpdate",

    -- Dynamic weather
    "WeatherEvent",

    -- Emote system
    "EmotePlay", "EmoteRequest",

    -- Trophy wall
    "TrophyUpdate",

    -- Throne sit
    "ThroneSitResult",

    -- Founder system
    "FounderGranted",
}

for _, name in remoteNames do
    if not remotesFolder:FindFirstChild(name) then
        local re    = Instance.new("RemoteEvent")
        re.Name     = name
        re.Parent   = remotesFolder
    end
end

local bindableNames = {
    "StageChangedBindable",
    "CrownPickupBindable",
    "RoundEndBindable",
    "CoinShowerBindable",
    "CrownDropBindable",
    "Final30",
}

for _, name in bindableNames do
    if not RS:FindFirstChild(name) then
        local be    = Instance.new("BindableEvent")
        be.Name     = name
        be.Parent   = RS
    end
end

print("[CrownChaos] RemoteSetup complete.")
