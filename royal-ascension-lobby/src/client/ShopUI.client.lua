-- ShopUI | StarterGui > LocalScript
-- Shop screen: browse and buy cosmetics with Crown Coins.
-- Toggle with [B] key. Reads player data from InitClient.
-- Fires BuyCosmeticCoins and EquipCosmetic remotes (handled by DataService).

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local UserInputService  = game:GetService("UserInputService")

local localPlayer = Players.LocalPlayer
local playerGui   = localPlayer:WaitForChild("PlayerGui")
local Remotes     = ReplicatedStorage:WaitForChild("Remotes")

-------------------------------------------------
-- COLORS (match UIClient palette)
-------------------------------------------------
local BG      = Color3.fromRGB(12, 8, 2)
local GOLD    = Color3.fromRGB(255, 215, 0)
local DIM_GOLD= Color3.fromRGB(180, 150, 60)
local PURPLE  = Color3.fromRGB(80, 0, 80)
local STONE   = Color3.fromRGB(50, 42, 35)
local WHITE   = Color3.new(1, 1, 1)

-------------------------------------------------
-- PLAYER DATA (populated by InitClient)
-------------------------------------------------
local playerData = { coins = 0, cosmetics = {}, equipped = {} }

Remotes:WaitForChild("InitClient").OnClientEvent:Connect(function(data)
    playerData = data
    -- Refresh shop if open
end)

Remotes:WaitForChild("CosmeticUnlocked").OnClientEvent:Connect(function(id)
    table.insert(playerData.cosmetics, id)
end)

Remotes:WaitForChild("CoinReward").OnClientEvent:Connect(function(amount)
    playerData.coins = (playerData.coins or 0) + (amount or 0)
end)

-------------------------------------------------
-- SHOP CATALOG
-------------------------------------------------
local CATALOG = {
    { id = "crown_rose_gold", label = "Rose Gold Crown", price = 500,  slot = "crown",  coinBuy = true  },
    { id = "crown_silver",    label = "Silver Crown",    price = 500,  slot = "crown",  coinBuy = true  },
    { id = "crown_obsidian",  label = "Obsidian Crown",  price = 800,  slot = "crown",  coinBuy = true  },
    { id = "trail_sparks",    label = "Sparks Trail",    price = 200,  slot = "trail",  coinBuy = true  },
    { id = "trail_embers",    label = "Embers Trail",    price = 300,  slot = "trail",  coinBuy = true  },
    { id = "trail_frost",     label = "Frost Trail",     price = 350,  slot = "trail",  coinBuy = true  },
    { id = "pose_toss",       label = "Crown Toss",      price = 75,   slot = "pose",   coinBuy = true  },
    { id = "pose_bow",        label = "Royal Bow",       price = 75,   slot = "pose",   coinBuy = true  },
    { id = "pose_laugh",      label = "Tyrant Laugh",    price = 100,  slot = "pose",   coinBuy = true  },
    { id = "crown_diamond",   label = "💎 Diamond Crown", price = 200,  slot = "crown",  coinBuy = false, robux = true },
    { id = "aura_phantom",    label = "👻 Phantom Aura",  price = 175,  slot = "aura",   coinBuy = false, robux = true },
    { id = "pet_crown",       label = "🐾 Crown Pet",     price = 250,  slot = "pet",    coinBuy = false, robux = true },
}

-------------------------------------------------
-- BUILD UI
-------------------------------------------------
local screen = Instance.new("ScreenGui")
screen.Name           = "ShopUI"
screen.ResetOnSpawn   = false
screen.IgnoreGuiInset = true
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Enabled        = false
screen.Parent         = playerGui

local overlay = Instance.new("Frame")
overlay.Size                   = UDim2.fromScale(1, 1)
overlay.BackgroundColor3       = Color3.new(0,0,0)
overlay.BackgroundTransparency = 0.5
overlay.BorderSizePixel        = 0
overlay.Parent                 = screen

local card = Instance.new("Frame")
card.Size                   = UDim2.new(0, 640, 0, 480)
card.Position               = UDim2.new(0.5, -320, 0.5, -240)
card.BackgroundColor3       = BG
card.BackgroundTransparency = 0.05
card.BorderSizePixel        = 0
card.Parent                 = overlay

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 14)
corner.Parent = card

local stroke = Instance.new("UIStroke")
stroke.Color     = GOLD
stroke.Thickness = 2
stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
stroke.Parent = card

-- Header
local header = Instance.new("Frame")
header.Size             = UDim2.new(1, 0, 0, 54)
header.BackgroundColor3 = PURPLE
header.BackgroundTransparency = 0.3
header.BorderSizePixel  = 0
header.Parent           = card

local headerTitle = Instance.new("TextLabel")
headerTitle.Size                   = UDim2.new(0.7, 0, 1, 0)
headerTitle.BackgroundTransparency = 1
headerTitle.Text                   = "🏪  ROYAL SHOP"
headerTitle.TextColor3             = GOLD
headerTitle.Font                   = Enum.Font.GothamBold
headerTitle.TextSize               = 24
headerTitle.TextXAlignment         = Enum.TextXAlignment.Left
headerTitle.Position               = UDim2.new(0, 16, 0, 0)
headerTitle.Parent                 = header

local coinsDisplay = Instance.new("TextLabel")
coinsDisplay.Size                   = UDim2.new(0.25, 0, 1, 0)
coinsDisplay.Position               = UDim2.new(0.7, 0, 0, 0)
coinsDisplay.BackgroundTransparency = 1
coinsDisplay.Text                   = "🪙 0"
coinsDisplay.TextColor3             = GOLD
coinsDisplay.Font                   = Enum.Font.GothamBold
coinsDisplay.TextSize               = 18
coinsDisplay.TextXAlignment         = Enum.TextXAlignment.Right
coinsDisplay.Parent                 = header

local closeBtn = Instance.new("TextButton")
closeBtn.Size                   = UDim2.new(0, 40, 0, 40)
closeBtn.Position               = UDim2.new(1, -48, 0, 7)
closeBtn.BackgroundColor3       = Color3.fromRGB(120, 20, 20)
closeBtn.BackgroundTransparency = 0.2
closeBtn.Text                   = "✕"
closeBtn.TextColor3             = WHITE
closeBtn.Font                   = Enum.Font.GothamBold
closeBtn.TextSize               = 20
closeBtn.BorderSizePixel        = 0
closeBtn.Parent                 = card

local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 6)
closeCorner.Parent = closeBtn

-- Scrolling item grid
local scrollFrame = Instance.new("ScrollingFrame")
scrollFrame.Size            = UDim2.new(1, -16, 1, -70)
scrollFrame.Position        = UDim2.new(0, 8, 0, 62)
scrollFrame.BackgroundTransparency = 1
scrollFrame.BorderSizePixel = 0
scrollFrame.ScrollBarThickness = 6
scrollFrame.ScrollBarImageColor3 = DIM_GOLD
scrollFrame.CanvasSize      = UDim2.new(0, 0, 0, 0)
scrollFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
scrollFrame.Parent          = card

local gridLayout = Instance.new("UIGridLayout")
gridLayout.CellSize      = UDim2.new(0, 190, 0, 100)
gridLayout.CellPadding   = UDim2.new(0, 8, 0, 8)
gridLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left
gridLayout.SortOrder     = Enum.SortOrder.LayoutOrder
gridLayout.Parent        = scrollFrame

local gridPadding = Instance.new("UIPadding")
gridPadding.PaddingLeft = UDim.new(0, 6)
gridPadding.PaddingTop  = UDim.new(0, 6)
gridPadding.Parent      = scrollFrame

local statusLabel = Instance.new("TextLabel")
statusLabel.Size                   = UDim2.new(1, -16, 0, 28)
statusLabel.Position               = UDim2.new(0, 8, 1, -32)
statusLabel.BackgroundTransparency = 1
statusLabel.Text                   = ""
statusLabel.TextColor3             = GOLD
statusLabel.Font                   = Enum.Font.Gotham
statusLabel.TextSize               = 14
statusLabel.Parent                 = card

local function showStatus(msg, color)
    statusLabel.Text       = msg
    statusLabel.TextColor3 = color or GOLD
    task.delay(3, function()
        if statusLabel.Text == msg then statusLabel.Text = "" end
    end)
end

-------------------------------------------------
-- POPULATE GRID
-------------------------------------------------
local function buildGrid()
    for _, child in scrollFrame:GetChildren() do
        if child:IsA("Frame") then child:Destroy() end
    end

    coinsDisplay.Text = "🪙 " .. (playerData.coins or 0)

    for i, item in ipairs(CATALOG) do
        local owned    = table.find(playerData.cosmetics or {}, item.id) ~= nil
        local equipped = (playerData.equipped or {})[item.slot] == item.id

        local cell = Instance.new("Frame")
        cell.Size                   = UDim2.fromScale(1, 1)
        cell.BackgroundColor3       = equipped and Color3.fromRGB(40,30,5) or STONE
        cell.BackgroundTransparency = 0.3
        cell.BorderSizePixel        = 0
        cell.LayoutOrder            = i
        cell.Parent                 = scrollFrame

        local cellCorner = Instance.new("UICorner")
        cellCorner.CornerRadius = UDim.new(0, 8)
        cellCorner.Parent = cell

        if equipped then
            local equippedStroke = Instance.new("UIStroke")
            equippedStroke.Color     = GOLD
            equippedStroke.Thickness = 2
            equippedStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
            equippedStroke.Parent = cell
        end

        local nameLabel = Instance.new("TextLabel")
        nameLabel.Size                   = UDim2.new(1, -8, 0, 36)
        nameLabel.Position               = UDim2.new(0, 4, 0, 4)
        nameLabel.BackgroundTransparency = 1
        nameLabel.Text                   = item.label
        nameLabel.TextColor3             = WHITE
        nameLabel.Font                   = Enum.Font.GothamBold
        nameLabel.TextSize               = 13
        nameLabel.TextWrapped            = true
        nameLabel.TextXAlignment         = Enum.TextXAlignment.Left
        nameLabel.Parent                 = cell

        local priceLabel = Instance.new("TextLabel")
        priceLabel.Size                   = UDim2.new(1, -8, 0, 22)
        priceLabel.Position               = UDim2.new(0, 4, 0, 42)
        priceLabel.BackgroundTransparency = 1
        priceLabel.Text                   = item.robux and ("R$ " .. item.price)
                                            or ("🪙 " .. item.price)
        priceLabel.TextColor3             = owned and Color3.fromRGB(100, 200, 100) or DIM_GOLD
        priceLabel.Font                   = Enum.Font.Gotham
        priceLabel.TextSize               = 12
        priceLabel.TextXAlignment         = Enum.TextXAlignment.Left
        priceLabel.Parent                 = cell

        local actionBtn = Instance.new("TextButton")
        actionBtn.Size                   = UDim2.new(1, -8, 0, 26)
        actionBtn.Position               = UDim2.new(0, 4, 1, -30)
        actionBtn.BorderSizePixel        = 0
        actionBtn.Font                   = Enum.Font.GothamBold
        actionBtn.TextSize               = 12
        actionBtn.Parent                 = cell

        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 5)
        btnCorner.Parent = actionBtn

        if equipped then
            actionBtn.Text             = "EQUIPPED"
            actionBtn.BackgroundColor3 = Color3.fromRGB(60, 48, 10)
            actionBtn.TextColor3       = GOLD
            actionBtn.Active           = false
        elseif owned then
            actionBtn.Text             = "EQUIP"
            actionBtn.BackgroundColor3 = Color3.fromRGB(30, 80, 30)
            actionBtn.TextColor3       = Color3.fromRGB(150, 255, 150)
            actionBtn.MouseButton1Click:Connect(function()
                Remotes.EquipCosmetic:FireServer(item.slot, item.id)
                if playerData.equipped then
                    playerData.equipped[item.slot] = item.id
                end
                buildGrid()
            end)
        elseif item.coinBuy then
            actionBtn.Text             = "BUY  🪙 " .. item.price
            actionBtn.BackgroundColor3 = Color3.fromRGB(100, 70, 10)
            actionBtn.TextColor3       = GOLD
            actionBtn.MouseButton1Click:Connect(function()
                if (playerData.coins or 0) < item.price then
                    showStatus("Not enough coins!", Color3.fromRGB(255,80,80))
                    return
                end
                Remotes.BuyCosmeticCoins:FireServer(item.id)
                playerData.coins = (playerData.coins or 0) - item.price
                table.insert(playerData.cosmetics, item.id)
                showStatus("Purchased: " .. item.label, GOLD)
                buildGrid()
            end)
        else
            actionBtn.Text             = "ROBUX"
            actionBtn.BackgroundColor3 = Color3.fromRGB(0, 100, 0)
            actionBtn.TextColor3       = WHITE
            actionBtn.MouseButton1Click:Connect(function()
                -- MarketplaceService prompt handled by DataService on purchase
                showStatus("Opening Roblox purchase prompt...", DIM_GOLD)
            end)
        end
    end
end

-------------------------------------------------
-- TOGGLE
-------------------------------------------------
local isOpen = false

local function openShop()
    if isOpen then return end
    isOpen = true
    buildGrid()
    screen.Enabled = true
    card.Size = UDim2.new(0, 0, 0, 0)
    card.Position = UDim2.new(0.5, 0, 0.5, 0)
    TweenService:Create(card,
        TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        { Size = UDim2.new(0, 640, 0, 480), Position = UDim2.new(0.5, -320, 0.5, -240) }
    ):Play()
end

local function closeShop()
    if not isOpen then return end
    isOpen = false
    TweenService:Create(card,
        TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
        { Size = UDim2.new(0, 0, 0, 0), Position = UDim2.new(0.5, 0, 0.5, 0) }
    ):Play()
    task.delay(0.25, function() screen.Enabled = false end)
end

closeBtn.MouseButton1Click:Connect(closeShop)
overlay.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        closeShop()
    end
end)
card.InputBegan:Connect(function(input)
    input:Handled()  -- stop click-through to overlay
end)

UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.B then
        if isOpen then closeShop() else openShop() end
    end
end)

-- Also allow opening via a RemoteEvent (WorkspaceSetup can fire this from ProximityPrompt)
local openShopEvent = Instance.new("RemoteEvent")
openShopEvent.Name   = "OpenShop"
openShopEvent.Parent = ReplicatedStorage:WaitForChild("Remotes", 10) or ReplicatedStorage

openShopEvent.OnClientEvent:Connect(openShop)

print("[CrownChaos] ShopUI loaded. Press [B] to toggle.")
