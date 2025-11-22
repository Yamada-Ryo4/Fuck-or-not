# 🔥 上不上 AI 评分系统 (Smash or Pass AI)

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Deployment](https://img.shields.io/badge/Deployment-Cloudflare%20Pages-orange)
![AI Model](https://img.shields.io/badge/AI-Google%20Gemini-blue)

一个基于 **Google Gemini Vision API** 的图片分析项目 —— 上传任意图片，让 AI 判断它的「可操性」并打分。

本项目已升级为 **Cloudflare Pages 全栈架构**，支持后端密钥轮询、零消耗健康监测以及自定义 Key 功能。

> ⚠️ **免责声明**：本项目由 Gemini 辅助生成，包含成人向/粗俗词汇，仅供 AI Prompt Engineering 研究与演示用途。请勿将其用于非法、骚扰或违反平台政策的行为。

---

## 👉 项目作者 [𝕏 @Yamada_Ryoooo](https://x.com/Yamada_Ryoooo)

---

## 🌐 在线演示

> [**点击这里查看在线演示**](https://ccb-2uw.pages.dev/)
> 
> *本项目基于 Cloudflare Pages 部署，无需服务器，完全免费。*

---

## 🧩 项目结构

本项目采用 **纯静态前端 + Cloudflare Worker 后端** 架构，无需构建流程，解压即用。

```text
/
├── index.html        # 主页面 (包含新版仪表盘 UI)
├── styles.css        # 玻璃拟态风格 + 响应式布局
├── main.js           # 核心逻辑 (UI交互、自动测试、事件监听)
├── api.js            # 前端 API 通信模块 (指向 /submit)
├── _worker.js        # [核心] Cloudflare 后端 (处理代理、轮询、BYOK)
├── settings.js       # 设置管理 (LocalStorage)
├── store.js          # 历史记录管理
├── ui.js             # UI 渲染辅助函数
├── prompts.js        # AI 提示词模板 (System Prompts)
├── config.js         # 基础配置
└── manifest.json     # PWA 配置
```

-----

## ⚙️ 核心功能

### 🤖 强大的 AI 分析
- **简短模式 (Brief)**：一句话快速评价，直击灵魂。
- **详细模式 (Descriptive)**：露骨三句以上的详细分析，从头到脚。
- **小说模式 (Novel)**：生成一段长篇、纯硬核的剧情文本（400字+）。

### 🛡️ 企业级后端能力 (新功能)
- **🔄 API Key 轮询池**：在 Cloudflare 后台配置多个 API Key。当一个 Key 额度耗尽（429错误）时，系统自动无缝切换下一个，保证服务高可用。
- **⚡ 零消耗健康监测**：页面加载时自动进行连通性测试（使用 `List Models` 接口），**完全不消耗**生成额度（Token）。
- **🔑 BYOK (Bring Your Own Key)**：支持用户在前端“高级设置”中填入自己的 Key。系统会优先使用用户 Key，不消耗服务器共享额度。
- **🔒 隐私安全**：后端无数据库，不保存用户上传的图片（仅在内存中流式处理），用完即焚。

### 🎨 极致体验
- **🖼️ 智能图片处理**：支持拖拽上传，自动识别 HEIC 格式并转换，自动压缩图片至 10MB 以内。
- **🪟 玻璃拟态 UI**：全新设计的仪表盘风格，动态呼吸灯状态指示，丝滑的交互动画。
- **💾 历史记录**：利用 LocalStorage 本地存储评分记录，支持回看和分享。
- **🌏 无障碍访问**：内置反向代理，中国大陆用户无需魔法即可直接连接使用。

-----

## 🚀 部署指南 (Cloudflare Pages)

本项目专为 **Cloudflare Pages** 设计，只需几步即可免费部署。

### 1. 准备代码
确保你拥有完整的项目文件，且根目录下包含 `_worker.js`。

### 2. 创建项目
1.  登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2.  进入 **Compute (Workers & Pages)** -> **Pages**。
3.  点击 **Create a project** -> **Upload assets** (直接上传)。
4.  输入项目名称（例如 `smash-or-pass`），点击 **Create project**。

### 3. 上传代码
将包含所有文件的**项目文件夹**拖入上传区域。

### 4. 配置环境变量 (关键步骤)
上传完成后，**先不要急着访问**，需配置 API Key 池。

1.  在项目页面点击 **Settings (设置)** -> **Environment variables (环境变量)**。
2.  点击 **Add variable**。
3.  添加变量：
    *   **Variable name**: `GEMINI_API_KEY` (或 `API_KEYS`)
    *   **Value**: `AIzaSy... AIzaSy... AIzaSy...`
    *   *提示：多个 Key 请用**空格**分隔，系统会自动识别并轮询。*
4.  点击 **Save**。

### 5. 重新部署
环境变量配置后，必须重新部署才能生效。
1.  进入 **Deployments (部署)** 标签页。
2.  找到最新的部署记录，点击右侧 `...` -> **Retry deployment (重试部署)**。
3.  等待部署完成，点击生成的 URL 即可访问！

-----

## 🛠️ 配置指南

### 方式一：使用内置共享额度 (默认)
部署者在 Cloudflare 后台配置好 `GEMINI_API_KEY` 变量后，访问者无需任何配置，直接上传图片即可使用。系统会自动轮询后台的 Key 池。

### 方式二：使用自定义 Key (BYOK)
如果你想独享额度或通过本地运行：
1.  在页面仪表盘下方点击 **⚙️ 高级设置**。
2.  在输入框中填入你的 **Google Gemini API Key**。
3.  系统会自动保存配置，并优先使用你的 Key 进行请求。

-----

## 🧠 技术栈

| 模块 | 技术 |
|------|------|
| **后端运行时** | Cloudflare Pages Functions (`_worker.js`) |
| **前端框架** | Native JavaScript (ES Modules) |
| **视觉风格** | CSS Glassmorphism (玻璃拟态) |
| **数据存储** | Browser LocalStorage |
| **AI 模型** | Google Gemini 2.5 Flash / Pro |

-----

## 🚨 常见问题

**Q: 为什么提示 "分析失败: 请求被安全策略阻止"？**
> **重要提示：** 当出现此错误或“内容为空”时，代表触发了 Google 官方的安全红线（如 CSAM 或极端暴力内容）。虽然程序已设置为“不拦截”，但 Google API 仍保留了最终解释权。请更换图片重试。

**Q: 为什么页面状态一直显示红色 ERR？**
> 请检查：
> 1. Cloudflare 后台的环境变量 `GEMINI_API_KEY` 是否配置正确。
> 2. 配置变量后是否执行了 **Retry deployment**。
> 3. 你的 API Key 是否已过期或被封禁。

-----

## 🪪 许可证

MIT License © 2025 Yamada-Ryo4
