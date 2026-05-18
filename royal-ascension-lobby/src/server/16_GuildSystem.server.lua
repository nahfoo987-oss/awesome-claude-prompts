-- GuildSystem | ServerScriptService
-- Players can create or join guilds (4-person cap, 3-char tag).
-- Guild score accumulates from crown hold time during rounds.
-- Tag shown in nameplate: [TAG] PlayerName

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService  = game:GetService("DataStoreService")

local Remotes   = ReplicatedStorage:WaitForChild("Remotes")
local Bindables = {
    CrownPickup = ReplicatedStorage:WaitForChild("CrownPickupBindable"),
    RoundEnd    = ReplicatedStorage:WaitForChild("RoundEndBindable"),
}

local RE = {
    GuildUpdate = Remotes:WaitForChild("GuildUpdate"),
    GuildCreate = Remotes:WaitForChild("GuildCreate"),
    GuildJoin   = Remotes:WaitForChild("GuildJoin"),
}

local GuildStore = DataStoreService:GetDataStore("CrownChaos_Guilds_v1")

-------------------------------------------------
-- IN-MEMORY GUILD STATE
-- guilds[tag] = { name, tag, members={userId...}, score }
-------------------------------------------------
local guilds = {}
local playerGuild = {}   -- userId → tag

local MAX_MEMBERS = 4

-------------------------------------------------
-- PERSISTENCE
-------------------------------------------------
local function saveGuild(tag)
    local g = guilds[tag]
    if not g then return end
    pcall(function()
        GuildStore:SetAsync("guild_" .. tag, {
            name    = g.name,
            tag     = g.tag,
            members = g.members,
            score   = g.score,
        })
    end)
end

local function loadGuild(tag)
    local ok, data = pcall(function()
        return GuildStore:GetAsync("guild_" .. tag)
    end)
    if ok and data then
        guilds[tag] = data
    end
end

-------------------------------------------------
-- HELPERS
-------------------------------------------------
local function broadcast(tag)
    local g = guilds[tag]
    if not g then return end
    for _, p in Players:GetPlayers() do
        if playerGuild[p.UserId] == tag then
            RE.GuildUpdate:FireClient(p, g)
        end
    end
end

local function applyNameplate(player)
    local tag = playerGuild[player.UserId]
    if tag then
        player:SetAttribute("GuildTag", "[" .. tag .. "]")
    else
        player:SetAttribute("GuildTag", "")
    end
end

-------------------------------------------------
-- GUILD CREATION
-------------------------------------------------
RE.GuildCreate.OnServerEvent:Connect(function(player, guildName, tag)
    tag = tostring(tag):upper():sub(1, 3):gsub("[^%a%d]", "")
    guildName = tostring(guildName):sub(1, 24)

    if tag == "" or #tag < 2 then
        RE.GuildCreate:FireClient(player, false, "Tag must be 2-3 letters.")
        return
    end

    if guilds[tag] then
        RE.GuildCreate:FireClient(player, false, "Tag already taken.")
        return
    end

    if playerGuild[player.UserId] then
        RE.GuildCreate:FireClient(player, false, "You're already in a guild. Leave first.")
        return
    end

    guilds[tag] = { name = guildName, tag = tag, members = { player.UserId }, score = 0 }
    playerGuild[player.UserId] = tag
    applyNameplate(player)
    saveGuild(tag)

    RE.GuildCreate:FireClient(player, true, "Guild created!")
    broadcast(tag)
end)

-------------------------------------------------
-- GUILD JOIN
-------------------------------------------------
RE.GuildJoin.OnServerEvent:Connect(function(player, tag)
    tag = tostring(tag):upper():sub(1, 3)

    if playerGuild[player.UserId] then
        RE.GuildJoin:FireClient(player, false, "Leave your current guild first.")
        return
    end

    if not guilds[tag] then
        -- Try loading from DataStore
        loadGuild(tag)
    end

    local g = guilds[tag]
    if not g then
        RE.GuildJoin:FireClient(player, false, "Guild not found.")
        return
    end

    if #g.members >= MAX_MEMBERS then
        RE.GuildJoin:FireClient(player, false, "Guild is full (max " .. MAX_MEMBERS .. ").")
        return
    end

    table.insert(g.members, player.UserId)
    playerGuild[player.UserId] = tag
    applyNameplate(player)
    saveGuild(tag)

    RE.GuildJoin:FireClient(player, true, "Joined guild [" .. tag .. "]!")
    broadcast(tag)
end)

-------------------------------------------------
-- CROWN HOLD → GUILD SCORE
-------------------------------------------------
local currentHolder = nil

Bindables.CrownPickup.Event:Connect(function(player)
    currentHolder = player
end)

Bindables.RoundEnd.Event:Connect(function(_winner)
    currentHolder = nil
end)

task.spawn(function()
    while true do
        task.wait(1)
        if currentHolder and currentHolder.Parent then
            local tag = playerGuild[currentHolder.UserId]
            if tag and guilds[tag] then
                guilds[tag].score = guilds[tag].score + 1
            end
        end
    end
end)

-------------------------------------------------
-- PLAYER LIFECYCLE
-------------------------------------------------
Players.PlayerAdded:Connect(function(player)
    -- Restore guild membership from stored attributes
    local storedTag = player:GetAttribute("GuildTag")
    if storedTag and storedTag ~= "" then
        local tag = storedTag:match("%[(.-)%]")
        if tag then
            if not guilds[tag] then loadGuild(tag) end
            local g = guilds[tag]
            if g then
                local found = false
                for _, uid in ipairs(g.members) do
                    if uid == player.UserId then found = true; break end
                end
                if found then
                    playerGuild[player.UserId] = tag
                end
            end
        end
    end

    task.wait(3)
    local tag = playerGuild[player.UserId]
    if tag and guilds[tag] then
        RE.GuildUpdate:FireClient(player, guilds[tag])
    end
end)

Players.PlayerRemoving:Connect(function(player)
    local tag = playerGuild[player.UserId]
    if tag then saveGuild(tag) end
    playerGuild[player.UserId] = nil
end)

print("[CrownChaos] GuildSystem loaded.")
