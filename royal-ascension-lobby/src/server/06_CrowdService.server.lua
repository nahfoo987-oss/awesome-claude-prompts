-- CrowdService | ServerScriptService
-- Crowd reactions: coin shower, crowd favorite, eruption, and ambient events.
-- Audio placeholder comments mark where real asset IDs go.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local RE = {
    CrowdEvent = Remotes:WaitForChild("CrowdEvent"),
    RoundEnd   = Remotes:WaitForChild("RoundEnd"),
}
local Bindables = {
    CoinShower   = ReplicatedStorage:WaitForChild("CoinShowerBindable"),
    RoundEnd     = ReplicatedStorage:WaitForChild("RoundEndBindable"),
    StageChanged = ReplicatedStorage:WaitForChild("StageChangedBindable"),
    CrownPickup  = ReplicatedStorage:WaitForChild("CrownPickupBindable"),
}

local function fireAll(eventType, data)
    for _, p in Players:GetPlayers() do
        RE.CrowdEvent:FireClient(p, eventType, data)
    end
end

-- Coin shower → crowd goes wild
Bindables.CoinShower.Event:Connect(function(player)
    fireAll("COIN_SHOWER", player)
    -- Real audio: play crowd cheer sound ID here
end)

-- Crown pickup → brief crowd reaction
Bindables.CrownPickup.Event:Connect(function(player)
    if math.random() < 0.4 then
        fireAll("CROWD_FAVORITE", player)
    end
end)

-- Stage 4/5 → crowd eruption build-up
Bindables.StageChanged.Event:Connect(function(holder, stage)
    if stage == 4 then
        fireAll("ANNOUNCE", "⚡ THE CROWD SENSES POWER RISING...")
    elseif stage == 5 then
        fireAll("ANNOUNCE", "🏟️ THE CROWD IS IN FRENZY!")
    end
end)

-- Round end → eruption
Bindables.RoundEnd.Event:Connect(function(winner)
    if winner then
        task.wait(1)
        fireAll("ERUPTION", winner)
        -- Real audio: play crowd eruption sound ID here
    end
end)

-- Ambient crowd pulse every 45 seconds (low-frequency energy)
task.spawn(function()
    while true do
        task.wait(45 + math.random() * 30)
        local events = { "ANNOUNCE" }
        local messages = {
            "🏟️ The crowd watches...",
            "🏟️ The arena breathes...",
            "⚡ Power stirs in the arena...",
        }
        fireAll("ANNOUNCE", messages[math.random(#messages)])
    end
end)

print("[CrownChaos] CrowdService loaded.")
