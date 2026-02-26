# MyPicks（MVP）

一个极简的外语精读笔记 Web App（单文档模式）。

技术栈：
- Next.js (App Router)
- TypeScript
- Tailwind CSS

目标：
- 划词即用
- 刷新不丢（`localStorage`）
- 可导出 Markdown
- AI 能力先用 mock，后续可替换真实 API

## 运行方式

```bash
cd /Users/max/Documents/lisavibe/mypicks
npm install
npm run dev
```

打开浏览器访问：
- [http://localhost:3000](http://localhost:3000)

建议 Node 版本：
- `18.18+` 或 `20+`

## 功能说明

### 页面结构
- TopBar
  - 全文输入框（粘贴全文）
  - `开始学习`
  - `导出 Markdown`
  - `AI 复盘（mock）`
- 主体两栏
  - 左：阅读区（保留换行）
  - 右：笔记区（NoteCard 列表）

### 单文档模式
- 只处理当前这一篇全文
- 点击 `开始学习` 会覆盖当前全文并清空现有笔记

### 划词浮层（Selection Popover）
在阅读区划选文本后出现，包含：
- `加入笔记`
- `翻译`
- `问 AI`

交互规则（已按约定实现）：
- `翻译`
  - 调用 `translateSelection({ selectedText, contextSentence })`
  - 临时展示翻译结果
  - 不入笔记、不写存储
- `加入笔记`
  - 若浮层暂无翻译结果，会先自动翻译
  - 创建完整 Note 并追加到右侧笔记区
  - 即时写入 `localStorage`
- `问 AI`
  - 展开问题输入框
  - 调用 `askAI({ selectedText, contextSentence, fullText, question })`
  - 显示回答（临时）
  - 支持 `复制到笔记`（新增一条 Note，不修改旧 Note）

### Context 抓取（MVP）
- 按 `. ! ?` 和 `。！？` 切句
- 根据选区在全文中的索引定位所在句
- 失败时 fallback 为选区前后各 `120` 字符

### Notes（右侧笔记区）
- 显示：
  - 原文（必显）
  - 原文翻译（必显）
  - 语境句（可折叠）
  - 语境翻译（可折叠）
  - 备注（多行输入，实时持久化）
- 支持删除单条
- 支持清空全部

### 导出 Markdown
- 文件名固定：`mypicks-notes.md`
- 顺序与 UI 一致

## 全文长度限制

为避免 `问 AI` 请求过长，已实现限制：
- 超过 `20000 chars` 或 `5000 words`

当前策略（已实现）：
- 允许开始学习
- 但禁用 `问 AI` 和 `AI 复盘`
- 页面会显示明确提示，建议分段学习

## 数据持久化（localStorage）

使用以下 keys：
- `mypicks:docText`
- `mypicks:notes`
- `mypicks:schemaVersion`（当前为 `1`）

相关实现：
- `/Users/max/Documents/lisavibe/mypicks/lib/storage.ts`

## 代码结构

```text
app/
  layout.tsx
  page.tsx
components/
  ReaderPane.tsx
  SelectionPopover.tsx
  NotesPane.tsx
  NoteCard.tsx
lib/
  api.ts
  storage.ts
  export.ts
  text.ts
  types.ts
```

## 后续替换真实 API（保留接口形状）

当前 mock 实现在：
- `/Users/max/Documents/lisavibe/mypicks/lib/api.ts`

你后续只需要替换函数内部实现，保持函数签名不变：

- `translateSelection({ selectedText, contextSentence })`
  - 返回 `{ selectedTranslation, contextTranslation }`
- `askAI({ selectedText, contextSentence, fullText, question })`
  - 返回 `{ answer }`
- `reviewAI({ fullText, notes })`
  - 返回 `{ summary, missingPoints, potentialIssues, practice, perNoteAdditions }`

## 开发备注

- 当前 UI 风格为简洁留白风格（偏 Notion 风）
- 未引入富文本编辑器，不做高亮染色
- TypeScript 使用严格类型，避免 `any`
