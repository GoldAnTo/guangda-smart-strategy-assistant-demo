// 策略数据 - 由 Python 脚本从 Oracle 数据库导出
// 导出时间: 2025-03-30
// 使用方法: 在 HTML 中通过 <script src="data/strategies.js"></script> 加载
// 加载后可通过 window.STRATEGIES_DATA 访问

const STRATEGIES_DATA = {
  "exported_at": null,
  "count": 20,
  "strategies": [
    {
      "name": "股指多头轮动",
      "navCategory": "股指期货",
      "category": "股指期货",
      "tags": [
        "相对收益",
        "高频信号",
        "风格跟随",
        "指数增强"
      ],
      "annualReturn": 9.85,
      "winRate": 60.0,
      "outlookStars": 5,
      "structure": "1",
      "owner": "衍生品-楼宝梁",
      "logicSummary": "1.首先构建个股行为金融价量因子，然后基于成分股等权合成宽基指数的价量因子。\n2.根据价量因子打分构建IF,IC,IM三个股指期货的多空组合。\n3.对多个多空组合信号按照一定的权重叠加。4.选择因子值最大的宽基指数配置。",
      "benchmarkName": "理财收益",
      "positioning": "股票市场高波动行情中超额收益更高。\n大小盘风格差异较大时超额收益较高。",
      "seed": 78,
      "_sk_strategy": 78,
      "_sk_date": 20230803
    },
    {
      "name": "股指多空",
      "navCategory": "股指期货",
      "category": "股指期货",
      "tags": [
        "绝对收益",
        "高频信号",
        "风格趋势跟随",
        "无权益净敞口"
      ],
      "annualReturn": 18.08,
      "winRate": 100.0,
      "outlookStars": 5,
      "structure": "1",
      "owner": "衍生品-李辰",
      "logicSummary": "1.首先构建个股行为金融价量因子，然后基于成分股等权合成宽基指数的价量因子。\n2.根据价量因子打分构建IF,IC,IM三个股指期货的多空组合。\n3.对多个多空组合信号按照一定的权重叠加。",
      "benchmarkName": "理财收益",
      "positioning": "股票市场高波动行情中预期收益更高。\n大小盘风格差异较大时收益较高。",
      "seed": 84,
      "_sk_strategy": 84,
      "_sk_date": 20230803
    },
    {
      "name": "期指复制看涨期权",
      "navCategory": "股指期货",
      "category": "股指期货",
      "tags": [
        "期权复制",
        "股指择时",
        "防御型策略"
      ],
      "annualReturn": 4.42,
      "winRate": 60.0,
      "outlookStars": 5,
      "structure": "1",
      "owner": "衍生品-李辰",
      "logicSummary": "1.根据指数波动率及涨跌幅，构建基于Delta仓位变化的股指复制买入平值看涨期权仓位。2,根据股指多周期技术指标、期权合约相关指标、市场结构相关指标等，构建择时增强信号。",
      "benchmarkName": "理财收益",
      "positioning": "适合熊市",
      "seed": 85,
      "_sk_strategy": 85,
      "_sk_date": 20230803
    },
    {
      "name": "逆向股基优选",
      "navCategory": "股基 FOF",
      "category": "股基 FOF",
      "tags": [
        "股基优选",
        "低beta",
        "低波",
        "逆向",
        "garp风格"
      ],
      "annualReturn": 10.0,
      "winRate": 66.67,
      "outlookStars": 5,
      "structure": "1",
      "owner": "多策略-赵浩",
      "logicSummary": "1.首先构建股基特征因子(低beta、低波、隐性交易、择时选股因子等)，\n2.然后基于持仓和净值对全市场股基，滚动计算时序因子暴露。\n3.根据因子暴露与打分，优选逆向策略股基。\n4.在打分前50只基金进行基金经理调研评估，剔除投资策略、经理管理等负向影响因素，确定20-30只基金，构建FOF组合。",
      "benchmarkName": "万得偏股混合型基金指数",
      "positioning": "震荡、下跌市以及价值风格占优市场",
      "seed": 86,
      "_sk_strategy": 86,
      "_sk_date": 20230803
    },
    {
      "name": "多因子轮动股基FOF",
      "navCategory": "股基 FOF",
      "category": "股基 FOF",
      "tags": [
        "风格轮动、股基优选、garp风格、高夏普"
      ],
      "annualReturn": 0.0,
      "winRate": 0.0,
      "outlookStars": 5,
      "structure": "1",
      "owner": "多策略-赵浩",
      "logicSummary": "基于宏观因子、风格因子、行业偏离因子和beta因子进行大类股基品种比较，通过多因子优选股基，实现不同风格、高低beta间切换，实现相对中证800的稳定超额表现。",
      "benchmarkName": "中证800",
      "positioning": "适用于任何市场",
      "seed": 90,
      "_sk_strategy": 90,
      "_sk_date": null
    },
    {
      "name": "黄金择时",
      "navCategory": "商品",
      "category": "商品",
      "tags": [
        "低股债相关性收益来源",
        "更多超额收益",
        "且最大回撤可控"
      ],
      "annualReturn": 9.44,
      "winRate": 42.86,
      "outlookStars": 5,
      "structure": "1",
      "owner": "多策略-夏莉",
      "logicSummary": "根据美债、汇率与VIX等指标，根据利率和汇率方向，和避险指标的阈值构建黄金的择时框架",
      "benchmarkName": "华安黄金ETF",
      "positioning": "适用于预期联储降息时期（降息美元扩张时期），基本面对应非危机的正常衰退时期",
      "seed": 82,
      "_sk_strategy": 82,
      "_sk_date": 20230803
    },
    {
      "name": "行业轮动相对收益",
      "navCategory": "ETF",
      "category": "ETF",
      "tags": [
        "相对收益",
        "周频换仓",
        "行业轮动"
      ],
      "annualReturn": 14.43,
      "winRate": 83.33,
      "outlookStars": 5,
      "structure": "1",
      "owner": "多策略-姚育婷",
      "logicSummary": "策略根据各行业景气度变化、机构资金偏好、市场微观结构、拥挤度等维度指标，优选高景气度、资金追逐、趋势强且拥挤度低的行业，选择相应的ETF进行轮动配置。",
      "benchmarkName": "中证800",
      "positioning": "策略适用于beta行情，高波动行情收益更高。",
      "seed": 80,
      "_sk_strategy": 80,
      "_sk_date": 20230803
    },
    {
      "name": "行业轮动绝对收益",
      "navCategory": "ETF",
      "category": "ETF",
      "tags": [
        "多头绝对收益",
        "卡玛高",
        "稳健权益型策略"
      ],
      "annualReturn": 15.64,
      "winRate": 66.67,
      "outlookStars": 5,
      "structure": "1",
      "owner": "多策略-姚育婷",
      "logicSummary": "策略是指数的时序策略，通过反弹指标、拥挤度等维度刻画指数超跌反弹区间、趋势动量区间，获取绝对收益。",
      "benchmarkName": "中证800",
      "positioning": "策略适用于beta行情，高波动行情收益更高。",
      "seed": 81,
      "_sk_strategy": 81,
      "_sk_date": 20230803
    },
    {
      "name": "行业轮动月频",
      "navCategory": "ETF",
      "category": "ETF",
      "tags": [
        "相对收益",
        "月频换仓",
        "行业轮动"
      ],
      "annualReturn": 0.0,
      "winRate": 0.0,
      "outlookStars": 5,
      "structure": "1",
      "owner": "多策略-姚育婷",
      "logicSummary": "策略根据各行业景气度变化、机构资金偏好、市场微观结构、拥挤度等维度指标，优选高景气度、资金追逐、趋势强且拥挤度低的行业，选择相应的ETF进行轮动配置。",
      "benchmarkName": "中证800",
      "positioning": "策略适用于beta行情，高波动行情收益更高。",
      "seed": 89,
      "_sk_strategy": 89,
      "_sk_date": null
    },
    {
      "name": "ETF风格轮动",
      "navCategory": "ETF",
      "category": "ETF",
      "tags": [
        "相对收益，每天跟踪，不定期换仓"
      ],
      "annualReturn": 0.0,
      "winRate": 0.0,
      "outlookStars": 5,
      "structure": "1",
      "owner": "多策略-姚育婷",
      "logicSummary": "大盘板块、价值板块与经济景气度相关性较高，小盘板块、成长板块与流动性相关性较高。市场风格通常会在一段时间内出现持续强势现象。综合宏观、中观等指标，从经济景气、流动性、市场情绪等维度构建大小盘轮动策略与价值成长轮动策略。",
      "benchmarkName": "中证800",
      "positioning": "策略适用于beta行情，高波动行情收益更高。",
      "seed": 91,
      "_sk_strategy": 91,
      "_sk_date": null
    },
    {
      "name": "全天候",
      "navCategory": "混合型",
      "category": "混合型",
      "tags": [
        "高夏普",
        "回撤可控",
        "全天候收益"
      ],
      "annualReturn": 6.91,
      "winRate": 100.0,
      "outlookStars": 5,
      "structure": "2",
      "owner": "多策略-夏莉",
      "logicSummary": "1、全天候策略的投资范围涉及股债商三类，首先从风险平价的角度确定股、债、商三类资产的中枢仓位。2、其次，为了在提高胜率的同时降低波动性，策略在第二层根据宏观指标进行择时提高胜率。",
      "benchmarkName": "一级债基指数",
      "positioning": "适合于任何时间",
      "seed": 83,
      "_sk_strategy": 83,
      "_sk_date": 20230803
    },
    {
      "name": "低价转债",
      "navCategory": "转债",
      "category": "转债",
      "tags": [
        "量化",
        "中低波动",
        "低价券"
      ],
      "annualReturn": 12.28,
      "winRate": 60.0,
      "outlookStars": 5,
      "structure": "低价转债",
      "owner": "固收-陈侃",
      "logicSummary": "以绝对阈值筛选转债标的，低转股溢价且低纯债溢价标的，等待个券正股波动率上行。基于符合条件的个股数设仓位。",
      "benchmarkName": "理财收益",
      "positioning": "适用于多种市场环境",
      "seed": 55,
      "_sk_strategy": 55,
      "_sk_date": 20230803
    },
    {
      "name": "超预期精选",
      "navCategory": "股票",
      "category": "股票",
      "tags": [
        "量化",
        "中盘动量",
        "机构风格"
      ],
      "annualReturn": 21.08,
      "winRate": 100.0,
      "outlookStars": 5,
      "structure": "成长",
      "owner": "固收-陈侃",
      "logicSummary": "关注业绩披露时点后的分析师点评，筛选超预期个股。质量、增速、估值综合评选，并剔除短期极端动量、分析师高频次覆盖，优选Top25。",
      "benchmarkName": "中证500",
      "positioning": "机构风格、增量博弈市场",
      "seed": 56,
      "_sk_strategy": 56,
      "_sk_date": 20230803
    },
    {
      "name": "小盘新星",
      "navCategory": "股票",
      "category": "股票",
      "tags": [
        "量化",
        "小盘反转",
        "基本面"
      ],
      "annualReturn": 25.72,
      "winRate": 83.33,
      "outlookStars": 5,
      "structure": "成长",
      "owner": "固收-陈侃",
      "logicSummary": "以定量手段定期更新的卖方新关注冷门股，基于质量、估值、成长，三因素进一步优选。基于符合条件的个股数设仓位。",
      "benchmarkName": "中证500",
      "positioning": "小微盘、反转风格",
      "seed": 57,
      "_sk_strategy": 57,
      "_sk_date": 20230803
    },
    {
      "name": "非周期行业红利",
      "navCategory": "股票",
      "category": "股票",
      "tags": [
        "量化",
        "低股债相关性",
        "基本面"
      ],
      "annualReturn": 16.3,
      "winRate": 83.33,
      "outlookStars": 5,
      "structure": "价值",
      "owner": "固收-陈侃",
      "logicSummary": "弱周期行业内选择分红稳定、股息率高、盈利趋势好的公司。\n单票设置权重上限，自下而上形成动态仓位。",
      "benchmarkName": "理财收益",
      "positioning": "适合震荡下行周期、红利风格行情，无产业主线的周期\n",
      "seed": 58,
      "_sk_strategy": 58,
      "_sk_date": 20230803
    },
    {
      "name": "大盘雪球",
      "navCategory": "股票",
      "category": "股票",
      "tags": [
        "量化",
        "低估值",
        "低Beta"
      ],
      "annualReturn": 15.37,
      "winRate": 83.33,
      "outlookStars": 5,
      "structure": "价值",
      "owner": "固收-陈韵骋",
      "logicSummary": "在大盘股内选择低级估值、稳定Roe个股。根据个股估值变化和低估值样本整体时序变化设定仓位，低买高卖。极低估值守住下行风险，波动中获取低买高卖收益。",
      "benchmarkName": "理财收益",
      "positioning": "适合于任何时间\n",
      "seed": 59,
      "_sk_strategy": 59,
      "_sk_date": 20230803
    },
    {
      "name": "小盘雪球",
      "navCategory": "股票",
      "category": "股票",
      "tags": [
        "价值",
        "小盘",
        "高抛低吸"
      ],
      "annualReturn": 14.84,
      "winRate": 83.33,
      "outlookStars": 5,
      "structure": "价值",
      "owner": "固收-陈韵骋",
      "logicSummary": "通过DCF模型选取价值稳定的个股，通过雪球机制对组合进行仓位管理。",
      "benchmarkName": "理财收益",
      "positioning": "小盘价值行情（市场上该策略稀缺）",
      "seed": 60,
      "_sk_strategy": 60,
      "_sk_date": 20230803
    },
    {
      "name": "中证1000深度学习",
      "navCategory": "股票",
      "category": "股票",
      "tags": [
        "AI",
        "小盘成长",
        "高流动性",
        "高估值",
        "高波动"
      ],
      "annualReturn": 46.53,
      "winRate": 100.0,
      "outlookStars": 5,
      "structure": "成长",
      "owner": "固收-陈韵骋",
      "logicSummary": "基于基本面、价量及主观因子，通过神经网络深度学习，确定个股及仓位配置。",
      "benchmarkName": "中证1000",
      "positioning": "适用于多种市场环境",
      "seed": 61,
      "_sk_strategy": 61,
      "_sk_date": 20230803
    },
    {
      "name": "纯粹价值",
      "navCategory": "股票",
      "category": "股票",
      "tags": [
        "量化",
        "低估值",
        "低Beta"
      ],
      "annualReturn": 0.0,
      "winRate": 0.0,
      "outlookStars": 5,
      "structure": "价值",
      "owner": "固收-陈侃",
      "logicSummary": "从中期视角审视公司，选择盈利稳定、长期高分红意愿的公司构成选股池，择其中估值极低的个券构成最终组合",
      "benchmarkName": "理财收益",
      "positioning": "适合于任何时间",
      "seed": 87,
      "_sk_strategy": 87,
      "_sk_date": null
    },
    {
      "name": "红利低波",
      "navCategory": "股票",
      "category": "股票",
      "tags": [
        "红利",
        "低股债相关性",
        "稳健"
      ],
      "annualReturn": 0.0,
      "winRate": 0.0,
      "outlookStars": 5,
      "structure": "价值",
      "owner": "衍生品-楼宝梁",
      "logicSummary": "1.选出连续多年分红稳定，红利支付率适中且股息率正增长的股票得到红利股票池。\n2.从红利股票池中精选高股息、低波动的50只股票作为样本，以股息率加权构建组合。其中波动率使用基于分钟数据计算的高频波动率因子。",
      "benchmarkName": "理财收益",
      "positioning": "适合震荡下行周期、红利风格行情，无产业主线的周期",
      "seed": 88,
      "_sk_strategy": 88,
      "_sk_date": null
    }
  ]
};

// 兼容方式：将数据挂载到 window 对象
if (typeof window !== 'undefined') {
  window.STRATEGIES_DATA = STRATEGIES_DATA;
}
