# 策略与基准对比模块

## 目标

在推荐结果页和产品对比页中增加“策略 vs 基准”的展示，让客户不只看到产品名称和文字描述，还能更直观地理解：
- 历史收益表现
- 最大回撤
- 波动水平
- 与基准相比的差异

## 第一版建议展示字段

每个产品增加：
- `benchmark.name`
- `benchmark.strategyReturn`
- `benchmark.benchmarkReturn`
- `benchmark.maxDrawdown`
- `benchmark.benchmarkDrawdown`
- `benchmark.volatilityLevel`
- `benchmark.performanceNote`

## 推荐页展示结构

### 区块名称
- 策略与基准对比

### 建议展示内容
- 策略收益率 vs 基准收益率
- 最大回撤 vs 基准回撤
- 波动水平
- 一句历史表现说明
- 风险提示：历史表现不代表未来

## 产品对比页建议

至少支持：
- 纯债 vs 固收+
- 固收+ vs 现金增强

固定对比维度：
- 产品定位
- 风险等级
- 投资期限
- 流动性
- 收益率
- 最大回撤
- 波动水平
- 当前为什么推荐/不推荐

## 合规提示

页面固定提示：
- 以下收益率、回撤等指标仅用于帮助理解策略历史风险收益特征，不构成未来表现承诺。
