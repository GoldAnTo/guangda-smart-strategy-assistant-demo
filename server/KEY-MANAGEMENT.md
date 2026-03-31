# API Key 管理建议

## 当前建议

当前 demo 阶段可使用本地 `.env`，但必须满足：
- `.env` 不提交到仓库
- 真实 key 不写入 README、文档或截图
- `.env.example` 只保留占位符

## 更稳的做法

后续建议将真实 key 放到以下位置之一：
- Windows 用户环境变量
- 独立 secrets 文件（放在代码目录外）
- 企业内部配置中心 / secret manager（正式阶段）

## 当前项目最小要求

- 保留 `.env.example`
- 本地使用 `.env`
- 通过 `.gitignore` 忽略 `.env`
- 不再在聊天或文档中重复暴露真实 key
