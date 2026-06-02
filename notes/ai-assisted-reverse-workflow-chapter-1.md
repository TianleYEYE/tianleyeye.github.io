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

---

## 七、PIX BasePass Shader 计算方案落地（2026-06-03）

这次继续从 `E:\PIX\PIX_Shader_Computation_Reference.md` 出发，不再只复现单个 drawcall，而是尝试把 BasePass shader 计算方案里能稳定观察的部分落到项目材质里。资料中完整路径包含 BasePass、GBuffer 6 个 MRT、Final Albedo / F0、体积间接光等内容；当前阶段只优先实现材质侧可验证项，避免把渲染管线层逻辑强行塞进普通材质球。

### 7.1 可优先落地的计算

| 计算项 | 本次处理 |
|--------|----------|
| Base Color / Alpha | 沿用主色贴图和材质参数，作为稳定输入 |
| World Normal | 修复 `pixNormal` 只计算不输出的问题 |
| Metallic / Roughness | 从 Packed M/R/V 纹理与参数恢复，避免被默认参数压掉 |
| Final Albedo / F0 | 做材质侧近似，并通过 Debug View 暴露 |
| Volume Indirect / 完整 GBuffer Packing | 暂不落地，后续放到渲染管线层处理 |

### 7.2 项目内修改

本次集中修改 Cloud 的 DreamShader 父材质与共享 shader include：

| 文件 | 作用 |
|------|------|
| `DShader/Cloud/CloudStandard_PIX.dsm` | 不透明父材质 |
| `DShader/Cloud/CloudStandard_PIX_Masked.dsm` | 遮罩父材质 |
| `Shaders/FF7Reverse/Cloud/CloudStandardTextureCommon.ush` | 新增法线强度、金属度、Final Albedo、Debug View helper |
| `Shaders/FF7Reverse/Cloud/CloudStandardTextures.usf` | 接入 PIX 计算参数与调试输出 |

关键修复包括：

1. 将 detail normal 的混合从固定 `0.0` 改为 `saturate(mask * DetailNormalStrength)`。
2. 将已经计算出的 `pixNormal` 写入 `Attrs.Normal`。
3. 新增 `PIXMetallicStrength`、`PIXNormalStrength`、`PIXFinalAlbedoMix`、`PIXDebugView`。
4. 增加 Final Albedo / F0 的材质侧近似，用于和 PIX 捕获逐步对照。

### 7.3 材质球拆分状态

项目内仍然按身体部位拆成材质实例，便于单独检查 body、eye、face、hair 等区域。12 个 `MI_Cloud_Dream_PIX_PC0000_00_*` 实例共用两个父材质：

| 父材质 | 用途 |
|--------|------|
| `M_Cloud_Dream_PIX_Standard` | 不透明部位 |
| `M_Cloud_Dream_PIX_Masked` | 需要 opacity mask 的部位 |

这样可以保留部位级调试能力，同时避免每个部位都复制一套父材质逻辑。

### 7.4 编译报错与修复

这次两个父材质都遇到过编译报错，主要不是 HLSL 数学本身，而是 UE 材质图生成与纹理采样约束：

| 问题 | 修复 |
|------|------|
| DreamShader 中的 `if (PIXDebugView > ...)` 生成 UE `If` 节点后路径不稳定 | 改成 arithmetic debug weights |
| 部分 M/R/V、Occlusion、DetailNormal 贴图提示 “should be Color” | sampler 改为 `Color` |
| `PC0000_00_Hair_A` 提示 “should be Masks” | 覆盖遮罩贴图保持 `Masks` |
| 旧逻辑里 `MetallicScale = 0` 导致金属度被压掉 | 增加 `PIXMetallicStrength` 控制 |

最终使用 DreamShader commandlet 重新生成并加载：

```text
/Game/Mesh/CloudTexture/DreamShaderMaterials/M_Cloud_Dream_PIX_Standard
/Game/Mesh/CloudTexture/DreamShaderMaterials/M_Cloud_Dream_PIX_Masked
```

加载结果为 `0 error(s), 0 warning(s)`。另一次 DataValidation 中的 Skeleton 不兼容问题来自 `Rem_v1_0_2_79.uasset`，与本次 PIX 父材质无关。

### 7.5 本次结论

AI 在这一步的作用更接近“证据整合 + 编译日志驱动排障”：先把 PIX 资料拆成可验证的材质计算，再落到已有 DreamShader 父材质，最后根据 Unreal 的真实编译错误修正 sampler、节点分支和参数默认值。下一步如果继续深入，应把体积间接光、完整 GBuffer packing 和 BasePass 输出编码放到渲染管线层，而不是继续扩大普通材质球的职责。
