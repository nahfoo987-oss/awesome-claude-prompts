-- ChallengeService | ServerScriptService
-- Daily and weekly challenges with coin/XP rewards.
-- Progress tracked in memory; persisted via DataService's AddCoins on completion.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService  = game:GetService("DataStoreService")

local Remotes   = ReplicatedStorage:WaitForChild("Remotes")
local Bindables = {
    CrownPickup  = ReplicatedStorage:WaitForChild("CrownPickupBindable"),
    RoundEnd     = ReplicatedStorage:WaitForChild("RoundEndBindable"),
    StageChanged = ReplicatedStorage:WaitForChild("StageChangedBindable"),
}

local RE = {
    ChallengeUpdate  = Remotes:WaitForChild("ChallengeUpdate"),
    ChallengeComplete= Remotes:WaitForChild("ChallengeComplete"),
}

local AddCoins = ReplicatedStorage:WaitForChild("AddCoins")
local ChallengeStore = DataStoreService:GetDataStore("CrownChaos_Challenges_v1")

-------------------------------------------------
-- CHALLENGE DEFINITIONS
-------------------------------------------------
local DAILY_CHALLENGES = {
    { id = "hold_60",    label = "Hold the Crown for 60s",   goal = 60,  reward = 150, type = "holdTime" },
    { id = "steal_3",    label = "Steal the Crown 3 times",  goal = 3,   reward = 100, type = "steals"   },
    { id = "win_round",  label = "Win a Round",              goal = 1,   reward = 200, type = "wins"     },
    { id = "stage_4",    label = "Reach Stage 4 as Holder",  goal = 1,   reward = 175, type = "stage4"   },
}

local WEEKLY_CHALLENGES = {
    { id = "win_5",      label = "Win 5 Rounds",             goal = 5,   reward = 750, type = "wins"     },
    { id = "steal_15",   label = "Steal the Crown 15 times", goal = 15,  reward = 500, type = "steals"   },
    { id = "hold_300",   label = "Hold the Crown for 300s",  goal = 300, reward = 600, type = "holdTime" },
    { id = "stage4_2",   label = "Reach Stage 4 Twice",      goal = 2,   reward = 650, type = "stage4"   },
}

-- key: "d" = daily window, "w" = weekly window (unix day / week number)
local function getDayKey()   return math.floor(os.time() / 86400)        end
local function getWeekKey()  return math.floor(os.time() / (86400 * 7))  end

-------------------------------------------------
-- PLAYER SESSION DATA
-------------------------------------------------
-- progress[userId] = { daily={id->{ progress, completed }}, weekly={...}, holdStart=nil, holdAcc=0 }
local playerData = {}

local function initPlayer(player)
    local uid = player.UserId
    local key = "ch_" .. uid

    local stored = nil
    pcall(function()
        stored = ChallengeStore:GetAsync(key)
    end)

    local dayKey  = getDayKey()
    local weekKey = getWeekKey()

    local daily  = {}
    local weekly = {}

    for _, ch in ipairs(DAILY_CHALLENGES) do
        local existing = stored and stored.daily and stored.daily[ch.id]
        if existing and existing.dayKey == dayKey then
            daily[ch.id] = existing
        else
            daily[ch.id] = { progress = 0, completed = false, dayKey = dayKey }
        end
    end

    for _, ch in ipairs(WEEKLY_CHALLENGES) do
        local existing = stored and stored.weekly and stored.weekly[ch.id]
        if existing and existing.weekKey == weekKey then
            weekly[ch.id] = existing
        else
            weekly[ch.id] = { progress = 0, completed = false, weekKey = weekKey }
        end
    end

    playerData[uid] = { daily = daily, weekly = weekly, holdAcc = 0, holding = false }
end

local function savePlayer(player)
    local uid  = player.UserId
    local data = playerData[uid]
    if not data then return end
    pcall(function()
        ChallengeStore:SetAsync("ch_" .. uid, {
            daily  = data.daily,
            weekly = data.weekly,
        })
    end)
end

local function pushToClient(player)
    local uid  = player.UserId
    local data = playerData[uid]
    if not data then return end

    local payload = { daily = {}, weekly = {} }
    for _, ch in ipairs(DAILY_CHALLENGES) do
        payload.daily[ch.id] = {
            label    = ch.label,
            goal     = ch.goal,
            reward   = ch.reward,
            progress = data.daily[ch.id].progress,
            completed= data.daily[ch.id].completed,
        }
    end
    for _, ch in ipairs(WEEKLY_CHALLENGES) do
        payload.weekly[ch.id] = {
            label    = ch.label,
            goal     = ch.goal,
            reward   = ch.reward,
            progress = data.weekly[ch.id].progress,
            completed= data.weekly[ch.id].completed,
        }
    end

    RE.ChallengeUpdate:FireClient(player, payload)
end

-------------------------------------------------
-- PROGRESS HELPER
-------------------------------------------------
local function addProgress(player, challengeType, amount)
    local uid  = player.UserId
    local data = playerData[uid]
    if not data then return end
    amount = amount or 1

    local function check(set, definitions)
        for _, ch in ipairs(definitions) do
            if ch.type ~= challengeType then continue end
            local entry = set[ch.id]
            if entry.completed then continue end
            entry.progress = entry.progress + amount
            if entry.progress >= ch.goal then
                entry.progress  = ch.goal
                entry.completed = true
                RE.ChallengeComplete:FireClient(player, ch.label, ch.reward)
                pcall(function() AddCoins:Invoke(player, ch.reward) end)
            end
        end
    end

    check(data.daily,  DAILY_CHALLENGES)
    check(data.weekly, WEEKLY_CHALLENGES)
    pushToClient(player)
end

-------------------------------------------------
-- HOLD TIME TICKER
-------------------------------------------------
local currentHolder  = nil

Bindables.CrownPickup.Event:Connect(function(player)
    currentHolder = player
end)

Bindables.RoundEnd.Event:Connect(function(winner)
    if winner then
        local uid  = winner.UserId
        local data = playerData[uid]
        if data then
            addProgress(winner, "wins", 1)
        end
    end
    currentHolder = nil
end)

Bindables.StageChanged.Event:Connect(function(holder, stage)
    if holder and stage >= 4 then
        addProgress(holder, "stage4", 1)
    end
end)

-- Crown steals: listen to CrownPickup and track who it was stolen from
local lastHolder = nil
Bindables.CrownPickup.Event:Connect(function(player)
    if lastHolder and lastHolder ~= player then
        -- previous holder lost it to someone → the NEW holder stole it
        addProgress(player, "steals", 1)
    end
    lastHolder = player
end)

-- Hold time accumulation (Heartbeat-lite via task.spawn loop)
task.spawn(function()
    while true do
        task.wait(1)
        if currentHolder and currentHolder.Parent then
            local uid  = currentHolder.UserId
            local data = playerData[uid]
            if data then
                addProgress(currentHolder, "holdTime", 1)
            end
        end
    end
end)

-------------------------------------------------
-- PLAYER LIFECYCLE
-------------------------------------------------
Players.PlayerAdded:Connect(function(player)
    initPlayer(player)
    task.wait(3)   -- wait for InitClient to fire first
    pushToClient(player)
end)

Players.PlayerRemoving:Connect(function(player)
    savePlayer(player)
    playerData[player.UserId] = nil
end)

print("[CrownChaos] ChallengeService loaded.")
