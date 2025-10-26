# 🔥 上不上 AI 评分系统 (Smash or Pass AI)

一个基于 **Google Gemini API** 的图片分析项目 —— 上传任意图片，让 AI 判断它的「可操性」并打分。  
本项目主要用于 **AI Prompt Engineering 实验与图像理解接口演示**，并不提倡或支持不当使用。

> ⚠️ **免责声明**：本项目由Gemini辅助生成，包含成人向词汇，仅供研究与演示用途。请勿将其用于非法、骚扰或违反平台政策的行为。

---

## 👉**项目作者[𝕏@Yamada_Ryoooo](https://x.com/Yamada_Ryoooo)**


---

## 🌐 在线演示
> [在线演示链接](https://fuck-or-not.pages.dev/)
> 
> 本地演示也完全支持，只需打开 `index.html`

---

## 🧩 项目结构

```
├── index.html           # 主页面结构（UI入口）
├── styles.css           # 玻璃拟态风格 + 响应式布局
├── main.js              # 应用主逻辑（上传/事件绑定/AI调用）
├── ui.js                # UI 管理模块（显示结果、保存等）
├── api.js               # Google Gemini API 调用封装
├── prompts.js           # 不同模式的 AI 提示词（Prompt 模板）
├── config.js            # 常量配置（API 基础路径）
├── settings.js          # 用户设置（API Key、本地存储）
├── store.js             # 保存历史评分结果到 LocalStorage
├── script.js            # 已弃用入口文件，仅作历史参考
```

---

## ⚙️ 功能说明

- 🧠 **三种AI模式**
  - `简短模式 (brief)`：一句话快速评价  
  - `详细模式 (descriptive)`：露骨三句以上的详细分析  
  - `小说模式 (novel)`：生成一段长篇、露骨的故事文本  

- 🖼️ **上传图片**  
  拖拽或点击上传任意图片，支持自动压缩到 10MB 内。

- ⚡ **即时分析**  
  使用你提供的 Google Gemini API Key 调用大模型。

- 💾 **结果保存与查看**  
  本地存储最多 50 条评分记录，可随时查看或删除。

- 🔗 **一键分享**  
  自动复制结果文本到剪贴板。

- 🪟 **玻璃拟态 UI**  
  采用高级玻璃视觉风格、动态阴影与动画特效。

---

## 🚀 快速开始

### 1️⃣ 克隆仓库
```bash
git clone https://github.com/Yamada-Ryo4/Fuck-or-not
cd Fuck-or-not
```

### 2️⃣ 启动本地服务
推荐使用 VSCode + Live Server 插件，或运行以下命令：
```bash
python3 -m http.server 8080
```
然后访问 `http://localhost:8080`

### 3️⃣ 输入 API Key
打开页面后，在顶部输入你的 **Google API Key**，选择模型（推荐 `gemini-2.5-flash`）。

---

## 🧠 技术栈

| 模块 | 技术 |
|------|------|
| 前端框架 | 原生 JavaScript + ES Modules |
| 样式风格 | CSS Glassmorphism 玻璃拟态 |
| 存储 | LocalStorage |
| AI 接口 | Google Gemini 2.5 Flash / Pro |
| 图片压缩 | Canvas + Base64 处理 |

---

## 🧩 模块说明

- **`prompts.js`**  
  定义三种 AI 性格提示词 (`brief`, `descriptive`, `novel`)。

- **`api.js`**  
  使用 `fetch` 调用 Google Gemini API 接口，构造请求体并返回 JSON 解析结果。

- **`ui.js`**  
  管理所有前端交互与 DOM 状态（如加载动画、结果显示、保存记录等）。

- **`store.js`**  
  负责本地保存、删除评分结果。

- **`settings.js`**  
  保存 API Key 与选中模型到 LocalStorage，随页面加载自动恢复。

---

## 🧑‍💻 开发者提示

- 所有逻辑均模块化设计，可轻松移植到 Vue/React 前端。
- 可替换 `api.js` 中的请求逻辑以支持自建代理或自定义模型。
- `prompts.js` 可作为 Prompt Engineering 实验模板。
- **重要提示：当出现：错误! ERROR 分析失败: 从API返回的响应格式无效或内容为空/错误! ERROR 分析失败: 请求被安全策略阻止: OTHER  时，为触发了Google官方的安全策略警告，是 Google API 本身的内容限制策略，并非程序Bug**

---

## ⚠️ 免责声明

- 本项目仅供 **AI 行为研究与演示**。  
- 生成内容具有明显成人语言与虚构性质，不代表作者立场。  
- 使用者须自行承担使用本项目造成的后果。

---

## 🪪 许可证

MIT License © 2025 Yamada-Ryo4
