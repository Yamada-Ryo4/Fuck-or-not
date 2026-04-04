# 🔥 上不上 AI 评分系统 (Smash or Pass AI)

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Deployment](https://img.shields.io/badge/Deployment-Cloudflare%20Pages-orange)
![AI Model](https://img.shields.io/badge/AI-NVIDIA%20API-76b900)

一个基于 **NVIDIA Vision API** 的图片分析项目 —— 上传任意图片，让 AI 判断它的「可操性」并打分。

本项目采用 **Cloudflare Pages 全栈架构**，支持 NVIDIA 多模型选择、后端密钥轮询、连通性健康监测以及自定义 Key 功能。

> ⚠️ **免责声明**：本项目包含成人向/粗俗词汇，仅供 AI Prompt Engineering 研究与演示用途。请勿将其用于非法、骚扰或违反平台政策的行为。

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
├── index.html        # 主页面 (仪表盘 UI + 模型选择器)
├── styles.css        # 玻璃拟态风格 + 响应式布局
├── main.js           # 核心逻辑 (UI交互、自动测试、事件监听)
├── api.js            # 前端 API 通信模块 (指向 /submit)
├── _worker.js        # [核心] Cloudflare 后端 (代理、轮询、BYOK)
├── settings.js       # 设置管理 (LocalStorage)
├── store.js          # 历史记录管理
├── ui.js             # UI 渲染辅助函数
├── prompts.js        # AI 提示词模板 (System Prompts)
└── manifest.json     # PWA 配置
```

---

## ⚙️ 核心功能

### 🤖 多模型 AI 分析

经过对 NVIDIA API 上多款视觉模型的实测基准测试，内置以下推荐模型：

| 模型 | 推荐度 | 特点 |
|------|--------|------|
| **Ministral 14B** ⚡ | ★★★★★ | 最快响应，风格最粗俗直接，**首推** |
| **Mistral Medium 3** 🔥 | ★★★★★ | 细节描写精准，词汇量丰富 |
| **Qwen 3.5 397B** 🐢 | ★★★★ | 质量极高但生成慢（~2分钟/次） |
| **Gemma 3 27B** 🌶️ | ★★★ | 偶尔放开，体验不稳定 |
| **Gemma 4 31B** ❌ | ★ | 道德过滤极强，基本全拒 |

### 📝 三种分析模式
- **简短模式 (Brief)**：一句话快速评价，直击灵魂。
- **详细模式 (Descriptive)**：露骨三句以上的详细分析，从头到脚。
- **小说模式 (Novel)**：生成 400 字以上、纯硬核的黄色文本。

### 🛡️ 后端能力
- **🔄 API Key 轮询池**：配置多个 Key，429 额度耗尽时自动切换，保证高可用。
- **⚡ 连通性健康监测**：切换模型或修改 Key 时自动 Ping，状态栏实时反馈 Ready / ERR。
- **🔑 BYOK (Bring Your Own Key)**：在"高级设置"填入自己的 NVIDIA Key，优先使用不消耗共享额度。
- **🔒 隐私安全**：后端无数据库，不保存图片，请求完成即销毁。

### 🎨 极致体验
- **🖼️ 智能图片处理**：支持拖拽上传，自动识别 HEIC 并转换，自动压缩至 10MB 以内。
- **🪟 玻璃拟态 UI**：仪表盘风格设计，动态呼吸灯状态指示，丝滑交互动画。
- **💾 历史记录**：LocalStorage 本地存储评分记录，支持回看和文字分享。

---

## 🚀 部署指南 (Cloudflare Pages)

### 1. 准备代码
Fork 本仓库或下载所有源码文件，确保根目录包含 `_worker.js`。

### 2. 创建项目
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Compute (Workers & Pages)** -> **Pages**。
3. 点击 **Create a project** -> **Upload assets**（直接上传）。
4. 输入项目名称，点击 **Create project**。

### 3. 上传代码
将项目文件夹里的所有文件拖入上传区域。

### 4. 配置环境变量（关键步骤）
上传完成后，进入 **Settings** -> **Environment variables**，添加：

| Variable Name | Value | 说明 |
|---|---|---|
| `API_KEY` | `nvapi-xxxx` | 必填，NVIDIA API Key |
| `API_KEY2` | `nvapi-yyyy` | 可选，备用 Key（支持到 `API_KEY10`） |

> 💡 **获取 NVIDIA API Key**：[https://build.nvidia.com/explore/discover](https://build.nvidia.com/explore/discover)
>
> 多个 Key 也可以空格分隔写在同一个 `API_KEY` 变量里，系统会自动解析。

### 5. 重新部署
环境变量配置后，在 **Deployments** 标签找到最新部署，点击 `...` -> **Retry deployment**。

---

## 🛠️ 配置指南

### 方式一：使用内置共享额度（默认）
部署者在 Cloudflare 后台配置 `API_KEY` 后，访问者直接使用，无需任何设置。

### 方式二：使用自定义 Key (BYOK)
1. 点击页面仪表盘下方 **⚙️ 高级设置**。
2. 填入你的 **NVIDIA API Key**（格式：`nvapi-...`）。
3. 系统自动保存并优先使用此 Key。

---

## 🧠 技术栈

| 模块 | 技术 |
|------|------|
| **后端运行时** | Cloudflare Pages Functions (`_worker.js`) |
| **前端框架** | Native JavaScript (ES Modules) |
| **视觉风格** | CSS Glassmorphism (玻璃拟态) |
| **数据存储** | Browser LocalStorage |
| **AI 服务** | NVIDIA API (OpenAI-Compatible `/v1/chat/completions`) |
| **视觉模型** | Ministral 14B / Mistral Medium 3 / Qwen 3.5 等 |

---

## 🚨 常见问题

**Q: 为什么请求失败或响应为空？**
> 通常是触发了模型的内置安全过滤。**建议优先选择 Ministral 14B 或 Mistral Medium 3**，这两个模型安全限制最宽松。Gemma 4 基本全拒，不推荐使用。

**Q: 页面状态一直显示红色 ERR？**
> 请检查：
> 1. Cloudflare 后台是否配置了 `API_KEY` 变量。
> 2. 配置后是否执行了 **Retry deployment**。
> 3. 你的 NVIDIA API Key 是否有效（可在 [build.nvidia.com](https://build.nvidia.com) 验证）。

**Q: Qwen 3.5 397B 为什么这么慢？**
> 该模型体量近 400B，NVIDIA 免费节点生成 400 字文本通常需要 1-3 分钟。如果追求速度，请改用 Ministral 14B（通常 10-20 秒完成）。

---

## 🪪 许可证

MIT License © 2025 Yamada-Ryo4
