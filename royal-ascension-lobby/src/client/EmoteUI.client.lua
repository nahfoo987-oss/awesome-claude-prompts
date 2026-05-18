-- EmoteUI | StarterPlayerScripts > LocalScript
-- Radial emote menu. Opens when server fires EmotePlay("OPEN_MENU").
-- Player picks emote → fires EmoteRequest back to server.
-- Also displays emote name toasts when other players emote.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local UserInputService  = game:GetService("UserInputService")

local localPlayer = Players.LocalPlayer
local playerGui   = localPlayer:WaitForChild("PlayerGui")
local Remotes     = ReplicatedStorage:WaitForChild("Remotes")

local GOLD   = Color3.fromRGB(255, 215, 0)
local PURPLE = Color3.fromRGB(100, 20, 180)
local BG     = Color3.fromRGB(12, 8, 2)
local WHITE  = Color3.new(1, 1, 1)

-------------------------------------------------
-- EMOTE DEFINITIONS  (matches server EMOTE_ANIMS)
-------------------------------------------------
local EMOTES = {
    { id = "pose_toss",  label = "Crown Toss",    icon = "👑" },
    { id = "pose_bow",   label = "Royal Bow",      icon = "🫅" },
    { id = "pose_laugh", label = "Tyrant Laugh",   icon = "😈" },
    { id = "wave",       label = "Wave",            icon = "👋" },
    { id = "point",      label = "Point",           icon = "👆" },
    { id = "cheer",      label = "Cheer",           icon = "🎉" },
}

-------------------------------------------------
-- SCREEN
-------------------------------------------------
local screen = Instance.new("ScreenGui")
screen.Name           = "EmoteUI"
screen.ResetOnSpawn   = false
screen.IgnoreGuiInset = true
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent         = playerGui

-------------------------------------------------
-- RADIAL MENU
-------------------------------------------------
local menuOpen = false

local overlay = Instance.new("Frame")
overlay.Size                   = UDim2.fromScale(1, 1)
overlay.BackgroundColor3       = Color3.new(0, 0, 0)
overlay.BackgroundTransparency = 0.7
overlay.BorderSizePixel        = 0
overlay.Visible                = false
overlay.Parent                 = screen

local centerLabel = Instance.new("TextLabel")
centerLabel.Size                   = UDim2.new(0, 200, 0, 40)
centerLabel.Position               = UDim2.new(0.5, -100, 0.5, -20)
centerLabel.BackgroundTransparency = 1
centerLabel.Text                   = "🎭 Choose an Emote"
centerLabel.TextColor3             = GOLD
centerLabel.Font                   = Enum.Font.GothamBold
centerLabel.TextSize               = 16
centerLabel.Parent                 = overlay

-- Build radial buttons
local BUTTON_RADIUS = 120   -- pixels from center
local buttons       = {}

local function openMenu()
    if menuOpen then return end
    menuOpen = true
    overlay.Visible = true

    for i, emote in ipairs(EMOTES) do
        local angle = math.pi * 2 * (i - 1) / #EMOTES - math.pi / 2
        local cx    = math.cos(angle) * BUTTON_RADIUS
        local cy    = math.sin(angle) * BUTTON_RADIUS

        local btn = Instance.new("TextButton")
        btn.Size             = UDim2.new(0, 90, 0, 70)
        btn.Position         = UDim2.new(0.5, cx - 45, 0.5, cy - 35)
        btn.BackgroundColor3 = PURPLE
        btn.BackgroundTransparency = 0.15
        btn.BorderSizePixel  = 0
        btn.AutoButtonColor  = false
        btn.Text             = emote.icon .. "\n" .. emote.label
        btn.TextColor3       = WHITE
        btn.Font             = Enum.Font.GothamBold
        btn.TextSize         = 12
        btn.Parent           = overlay

        local c = Instance.new("UICorner")
        c.CornerRadius = UDim.new(0, 10)
        c.Parent = btn

        -- Hover highlight
        btn.MouseEnter:Connect(function()
            TweenService:Create(btn, TweenInfo.new(0.1), {
                BackgroundColor3 = GOLD,
                TextColor3       = Color3.fromRGB(30, 20, 5),
            }):Play()
        end)
        btn.MouseLeave:Connect(function()
            TweenService:Create(btn, TweenInfo.new(0.1), {
                BackgroundColor3 = PURPLE,
                TextColor3       = WHITE,
            }):Play()
        end)

        btn.MouseButton1Click:Connect(function()
            closeMenu()
            Remotes.EmoteRequest:FireServer(emote.id)
        end)

        -- Animate in from center
        btn.Position = UDim2.new(0.5, -45, 0.5, -35)
        TweenService:Create(btn, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
            Position = UDim2.new(0.5, cx - 45, 0.5, cy - 35)
        }):Play()

        table.insert(buttons, btn)
    end
end

function closeMenu()
    if not menuOpen then return end
    menuOpen = false
    overlay.Visible = false
    for _, btn in ipairs(buttons) do btn:Destroy() end
    buttons = {}
end

-- Close on click outside or Escape
overlay.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        closeMenu()
    end
end)

UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.Escape and menuOpen then
        closeMenu()
    end
end)

-------------------------------------------------
-- SERVER EVENT HANDLERS
-------------------------------------------------
Remotes:WaitForChild("EmotePlay").OnClientEvent:Connect(function(event, player, emoteId, emoteLabel)
    if event == "OPEN_MENU" then
        openMenu()
    elseif event == "PLAY" then
        -- Show a toast when someone else emotes
        if player and player ~= localPlayer then
            local toast = Instance.new("Frame")
            toast.Size                   = UDim2.new(0, 260, 0, 40)
            toast.Position               = UDim2.new(0.5, -130, 0, -50)
            toast.BackgroundColor3       = BG
            toast.BackgroundTransparency = 0.2
            toast.BorderSizePixel        = 0
            toast.Parent                 = screen

            local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0,8); c.Parent = toast
            local lbl = Instance.new("TextLabel")
            lbl.Size                   = UDim2.fromScale(1, 1)
            lbl.BackgroundTransparency = 1
            lbl.Text                   = "🎭 " .. player.Name .. " — " .. (emoteLabel or emoteId)
            lbl.TextColor3             = Color3.fromRGB(200, 160, 255)
            lbl.Font                   = Enum.Font.Gotham
            lbl.TextSize               = 13
            lbl.Parent                 = toast

            TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
                Position = UDim2.new(0.5, -130, 0, 10)
            }):Play()

            task.delay(2.5, function()
                TweenService:Create(toast, TweenInfo.new(0.2), {
                    Position = UDim2.new(0.5, -130, 0, -50)
                }):Play()
                task.wait(0.25)
                toast:Destroy()
            end)
        end
    end
end)

print("[CrownChaos] EmoteUI loaded.")
