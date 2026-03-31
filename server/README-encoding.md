# UTF-8 调试说明

## 当前情况

Demo 后端接口已经能正确返回中文内容。
如果在 PowerShell 里看到中文乱码，通常是终端输出编码问题，不一定是接口本身编码错误。

## 建议做法

在当前 PowerShell 窗口先执行：

```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
```

然后再测接口。

## 示例

```powershell
$body = @{
  customerType = 'high_net_worth'
  riskPreference = 'stable'
  investmentHorizon = '6-12m'
  liquidityNeed = 'medium'
  returnGoal = 'enhanced_stable'
  fundSize = 3000000
  currentAllocation = 'bank_wealth_management_majority'
  notes = '想比银行理财高一点，但别波动太大'
} | ConvertTo-Json -Depth 6

Invoke-RestMethod 'http://127.0.0.1:3001/api/analyze-demand' -Method Post -ContentType 'application/json; charset=utf-8' -Body $body | ConvertTo-Json -Depth 6
```

## 代码侧处理

后端已统一设置：
- `Content-Type: application/json; charset=utf-8`

这可以减少客户端误判编码的概率。
