# FF7 Remake Intergrade — UE4SS + 资产提取 学习日志

## 环境

- 游戏：FINAL FANTASY VII REMAKE Intergrade (Steam)
- 引擎：Unreal Engine 4.18（Square Enix 定制版，Clang 编译）
- 游戏路径：`E:\SteamLibrary\steamapps\common\FINAL FANTASY VII REMAKE\`
- 游戏可执行文件：`End\Binaries\Win64\ff7remake_.exe`

---

## 一、UE4SS 安装与修复

### 1.1 安装

将 UE4SS v3.0.1 文件复制到游戏 Win64 目录：
```
UE4SS.dll
dwmapi.dll
UE4SS-settings.ini
Mods/  (整个文件夹)
```

### 1.2 遇到的第一个问题：RenderDoc 冲突

游戏目录下同时存在 `dwmapi.dll`（UE4SS）和 `dxgi.dll`（RenderDoc v1.44），
两者都是代理 DLL，同时加载导致游戏无法启动。

**解决**：将 `dxgi.dll` 重命名为 `dxgi.dll.bak`

### 1.3 遇到的第二个问题：GUObjectArray 扫描失败

UE4SS 日志显示：
```
[PS] Found EngineVersion: 4.18
[PS] Failed to find GUObjectArray: expected at least one value
[PS] Scan failed
```

**原因**：Square Enix 使用 Clang 编译 FF7R，生成的机器码与 UE4SS 内置的 MSVC 签名不匹配。
GUObjectArray 是所有功能的核心数据结构，找不到它就无法使用任何功能。

**解决**：从 UE4SS 官方 experimental-latest 的 `zCustomGameConfigs.zip` 中提取 FF7 Remake 专用配置：

| 文件 | 作用 |
|------|------|
| `UE4SS_Signatures/GUObjectArray.lua` | Clang 编译适配的 AOB 签名 |
| `UE4SS-settings.ini` | FF7R 专用参数（引擎 4.18，禁用 UObjectArrayCache） |
| `MemberVariableLayout.ini` | Clang 编译器下的类成员偏移 |
| `VTableLayout.ini` | Clang 编译器下的虚表布局 |

关键设置：
```ini
[EngineVersionOverride]
MajorVersion = 4
MinorVersion = 18

[General]
bUseUObjectArrayCache = false    # 防止启动崩溃

[Debug]
ConsoleEnabled = 1               # 使用外部控制台
GuiConsoleEnabled = 0            # 禁用 GUI（避免渲染冲突）
```

GUObjectArray.lua 的官方签名：
```lua
function Register()
    return "48 8B ?? ?? ?? ?? ?? 4C 8B 04 C8 4D 85 C0 74 07 ?? ?? ?? 0F 94"
end

function OnMatchFound(matchAddress)
    local nextInstr = matchAddress + 0x7
    local offset = matchAddress + 0x3
    local dataMoved = nextInstr + DerefToInt32(offset) - 0x10
    return dataMoved
end
```

---

## 二、生成 .usmap 映射文件

### 2.1 快捷键配置

小键盘不可用，将快捷键改为字母键。编辑 `Mods/Keybinds/Scripts/main.lua`：

```lua
["DumpUSMAP"] = {["Key"] = Key.M, ["ModifierKeys"] = {ModifierKey.CONTROL}},
```

### 2.2 生成

1. 启动游戏到主菜单
2. 按 `Ctrl + M`
3. 生成文件：`Mappings.usmap`（1.2 MB）

---

## 三、FModel 资产导出（失败）

### 3.1 配置

- UE Version: 4.18
- AES Key: `0x23989837645C9D28BA58072B2076E895B853A7C9E1C5591B814C4FD2A2D7B782`
- Mapping File: `Mappings.usmap`

### 3.2 现象

能浏览资产列表但保存失败：
```
[ERR] Could not save 'PC0000_00_BodyA_B'
```

**原因**：FModel 对 FF7R 定制引擎的骨骼网格体导出支持不完整。

---

## 四、UModel 资产导出（成功）

### 4.1 工具

需要使用 **FF7R Intergrade 专用版 UModel**（标准版无法处理 Square Enix 的定制 LZX 压缩）。

文件：`umodel_FFVII_intergrade.zip`（内含 v6 和 v7_test）

### 4.2 启动命令

```bat
umodel_FFVII_intergrade_v7_test.exe -game=ue4.18 -path="E:\SteamLibrary\steamapps\common\FINAL FANTASY VII REMAKE\End\Content\Paks" -aes=0x23989837645C9D28BA58072B2076E895B853A7C9E1C5591B814C4FD2A2D7B782 -gui
```

### 4.3 使用

1. 运行 Launch.bat
2. 按 `O` 打开资源浏览器
3. 导航到目标模型（如 `Character/Player/PC0000_00_Cloud_Standard/Model`）
4. 选择模型文件，`Ctrl+X` 导出，选择 PSK 或 glTF 格式

---

## 五、关键教训

| 问题 | 根因 | 解决思路 |
|------|------|---------|
| 游戏启动崩溃 | 多个代理 DLL 冲突 | 检查 Win64 目录下的非游戏 DLL |
| UE4SS 不工作 | Clang vs MSVC 签名不匹配 | 使用官方 CustomGameConfigs |
| FModel 无法保存 | 工具对定制引擎支持不足 | 换用专用版 UModel |
| UModel 解压失败 | 标准版不支持定制 LZX | 使用 Intergrade 专用编译版 |
| AES 密钥不确定 | 原版和 Intergrade 密钥相同 | 直接从官方密钥库获取 |

---

## 六、工具清单

| 工具 | 用途 | 来源 |
|------|------|------|
| UE4SS v3.0.1 | Lua 脚本系统 + .usmap 生成 | GitHub UE4SS-RE |
| FModel | UE 资产浏览 | GitHub 4sval |
| UModel FF7R 专用版 | 模型导出 | Gildor 论坛 / 百度网盘 |
| Noesis | 模型预览 | richwhitehouse.com |
| Blender PSK 插件 | 导入 PSK 模型 | GitHub Befzz |
