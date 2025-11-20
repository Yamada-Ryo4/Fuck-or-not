# 🔥 上不上 AI 评分系统 (Smash or Pass AI)

一个基于 **Google Gemini API** 的图片分析项目 —— 上传任意图片，让 AI 判断它的「可操性」并打分。  
本项目主要用于 **AI Prompt Engineering 实验与图像理解接口演示**，并不提倡或支持不当使用。

> ⚠️ **免责声明**：本项目由 Gemini 辅助生成，包含成人向词汇，仅供研究与演示用途。请勿将其用于非法、骚扰或违反平台政策的行为。

---

## 👉 项目作者 [𝕏 @Yamada_Ryoooo](https://x.com/Yamada_Ryoooo)

---

## 🌐 在线演示

> [**点击这里查看在线演示**](https://fuck-or-not.pages.dev/)
> 
> *如果不放心 API Key 安全，推荐下载源码在本地运行*

---

## 🧩 项目结构

本项目采用原生 ES Modules 开发，无构建流程，解压即用。

```text
├── index.html           # 主页面结构（UI入口）
├── styles.css           # 玻璃拟态风格 + 响应式布局
├── main.js              # 应用主逻辑（上传/事件绑定/AI调用）
├── ui.js                # UI 管理模块（显示结果、保存等）
├── api.js               # Google Gemini API 调用封装（含安全策略配置）
├── prompts.js           # 不同模式的 AI 提示词（Prompt 模板）
├── config.js            # 常量配置（API 基础路径）
├── settings.js          # 用户设置（API Key、本地存储）
├── store.js             # 保存历史评分结果到 LocalStorage
├── script.js            # 已弃用入口文件，仅作历史参考
````

-----

## ⚙️ 功能说明

  - **🧠 三种 AI 模式**

      - `简短模式 (brief)`：一句话快速评价，直击灵魂。
      - `详细模式 (descriptive)`：露骨三句以上的详细分析，从头到脚。
      - `小说模式 (novel)`：生成一段长篇、纯硬核的剧情文本（400字+）。

  - **🖼️ 智能图片处理** 拖拽或点击上传任意图片，前端自动压缩至 10MB 以内，无需担心流量消耗。

  - **⚡ 强力去拦截** 代码已配置 `BLOCK_NONE` 策略，最大程度降低 AI 的拒绝率（视 Google 风控而定）。

  - **💾 结果保存与查看** 利用 LocalStorage 本地存储最多 50 条评分记录，可随时回味。

  - **🪟 极致 UI 体验** 采用高级 Glassmorphism（玻璃拟态）视觉风格，配合动态噪点与光影特效。

  - 🌏 **无障碍访问** 内置反向代理服务，中国大陆用户无需魔法即可直接连接 API。
  

-----

## 🚀 快速开始

### 方式一：Cloudflare Pages 部署（推荐）

本项目完全兼容 Cloudflare Pages，可免费托管且访问速度快。

1.  Fork 本仓库。
2.  在 Cloudflare Dashboard 中选择 `Pages` -\> `Connect to Git`。
3.  **构建设置留空**（无需 build command，输出目录留空）。
4.  点击部署即可。

### 方式二：本地运行

推荐使用 VSCode + Live Server 插件，或者使用 Python 快速启动：

1.  克隆仓库

    ```bash
    git clone [https://github.com/Yamada-Ryo4/Fuck-or-not](https://github.com/Yamada-Ryo4/Fuck-or-not)
    cd Fuck-or-not
    ```

2.  启动服务

    ```bash
    # Python 3
    python3 -m http.server 8080
    ```

3.  访问
    打开浏览器访问 `http://localhost:8080`

-----

## 🛠️ 配置指南

### 1\. 输入 API Key

打开页面后，点击设置图标，输入你的 **Google Gemini API Key**。

  - Key 仅保存在你浏览器的本地缓存中，不会上传至任何服务器。
  - [点击这里获取 Google API Key](https://aistudio.google.com/app/api-keys)

### 2\. 模型选择

推荐使用 **`gemini-2.5-flash`**，该模型在响应速度和“敢说”程度上表现最均衡。

-----

## 🧠 技术栈

| 模块 | 技术 |
|------|------|
| **核心框架** | Native JavaScript (ES Modules) |
| **视觉风格** | CSS Glassmorphism (玻璃拟态) |
| **数据存储** | Browser LocalStorage |
| **AI 模型** | Google Gemini 2.5 Flash / Pro |
| **网络请求** | Fetch API + Streaming (可选) |

-----

## 🚨 常见问题与错误

**Q: 为什么提示 "分析失败: 请求被安全策略阻止"？**

> **重要提示：** \> 当出现 `错误! ERROR 分析失败: 从API返回的响应格式无效或内容为空` 或 `错误! ERROR 分析失败: 请求被安全策略阻止: OTHER` 时，**这代表触发了 Google 官方的底层安全红线（如 CSAM 或极端暴力）。**
>
> 虽然程序已设置为“不拦截”，但 Google API 仍保留了最终解释权。这是模型侧的限制，**并非程序 Bug**。建议更换图片或尝试切换模型（Flash 模型通常比 Pro 宽松）。

-----

## 🧑‍💻 开发者提示

  - **模块化设计**：所有逻辑分离，`prompts.js` 可独立修改以适配其他角色扮演场景。
  - **API 代理**：本项目已内置反向代理，**中国大陆用户可直接直连使用**，无需任何网络配置。如需使用自定义反代，可修改 `api.js` 中的 `GOOGLE_API_URL`。
  - **移植性**：代码无框架依赖，可轻松移植到 Vue/React/Next.js 项目中。

-----

## 🪪 许可证

MIT License © 2025 Yamada-Ryo4

```
```
