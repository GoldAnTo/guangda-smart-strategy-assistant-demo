# Demo 启动方式（稳定版）

## 当前建议

如果本机 `dev/watch` 进程容易自动退出，优先使用下面方式。

## 后端

### 开发监听模式
```bash
cd E:\code\guangda-smart-strategy-assistant-demo\server
npm run dev
```

### 单次稳定启动模式
```bash
cd E:\code\guangda-smart-strategy-assistant-demo\server
npm run dev:once
```

如果只是想先联调接口，优先用：
- `npm run dev:once`

## 前端

### 默认模式
```bash
cd E:\code\guangda-smart-strategy-assistant-demo\frontend
npm run dev
```

### 指定 host 模式
```bash
cd E:\code\guangda-smart-strategy-assistant-demo\frontend
npm run dev:host
```

如果你需要预览构建结果：
```bash
cd E:\code\guangda-smart-strategy-assistant-demo\frontend
npm run build
npm run preview
```

## 推荐调试顺序

1. 先起后端：`npm run dev:once`
2. 先测 `/health`
3. 再起前端：`npm run dev:host`
4. 再做页面联调

## 备注

- 当前本机环境下，`watch/dev` 进程存在偶发退出情况
- 所以优先使用“单次稳定启动模式”做接口联调
