#!/usr/bin/env python3
"""
策略数据导出脚本
从 Oracle 数据库查询策略列表数据，导出为 JSON 文件供前端使用
"""

import json
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# 添加项目根目录到路径
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from lib.oracle import OracleClient, OracleConfig


# SQL 查询语句 - 基于 getStrategyList
QUERY_SQL = """
SELECT 
    A.SK_STRATEGY,
    A.STRATEGY_NAME,
    A.FIRST_CATEGORY,
    A.SECOND_CATEGORY,
    A.STRATEGY_STRUCTURE,
    A.STRATEGY_EXPECT,
    A.MANAGER_USER,
    A.START_DATE,
    A.STRATEGY_LOGIC,
    A.FALLBACK_CONTROL,
    A.SUIT_MARKET,
    A.SK_FILE,
    A.STRATEGY_LABEL,
    A.INDEX_NAME,
    F.STRATEGY_CALMAR,
    A.STRATEGY_STYLE,
    F.STRATEGY_QUARTER_RATE,
    F.STRATEGY_YEAR_RATE,
    F.STRATEGY_YEAR_YIELD,
    F.STRATEGY_VOL,
    F.STRATEGY_MAX_DRAWDOWN,
    F.STRATEGY_WEEK_YIELD,
    F.STRATEGY_MONTH_YIELD,
    F.STRATEGY_3MONTH_YIELD,
    F.STRATEGY_HALF_YEAR_YIELD,
    F.STRATEGY_1YEAR_YIELD,
    F.STRATEGY_3YEAR_YIELD,
    F.STRATEGY_ESTABLISH_YIELD,
    F.STRATEGY_THIS_YEAR_YIELD,
    F.SK_DATE,
    C.FILE_NAME,
    C.FILE_DATE,
    C.FILE_URL
FROM app_pms.TSTRATEGY_MARKET_INFO@LK_APP_33 A
LEFT JOIN app_pms.TSTRATEGY_MARKET_FILE@LK_APP_33 C
    ON A.SK_FILE = C.SK_FILE
LEFT JOIN (
    SELECT A.*,
        RANK() OVER(PARTITION BY A.SK_STRATEGY ORDER BY A.SK_DATE DESC) RANK_NUM
    FROM app_pms.TSTRATEGY_MARKET_DAILY_PERFM@LK_APP_33 A
) F ON A.SK_STRATEGY = F.SK_STRATEGY AND RANK_NUM = 1
WHERE A.STATUS = 1
ORDER BY A.SK_STRATEGY
"""

# 分类映射：数据库值 -> 前端显示值
CATEGORY_MAPPING = {
    "股指期货": "股指期货",
    "股基FOF": "股基 FOF",
    "股基 FOF": "股基 FOF",
    "商品": "商品",
    "ETF": "ETF",
    "混合型": "混合型",
    "转债": "转债",
    "股票": "股票",
}

# 默认分类顺序（与前端 CATEGORY_ORDER 保持一致）
DEFAULT_CATEGORY_ORDER = ["股指期货", "股基 FOF", "商品", "ETF", "混合型", "转债", "股票"]


def parse_config(config_path: Path) -> OracleConfig:
    """解析配置文件"""
    config_dict = {}
    current_section = None

    with open(config_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if line.startswith('[') and line.endswith(']'):
                current_section = line[1:-1]
            elif '=' in line and current_section:
                key, value = line.split('=', 1)
                config_dict[f"{current_section}.{key.strip()}"] = value.strip()

    # 使用 db_45 配置
    return OracleConfig(
        user=config_dict.get('db_45.db_user', ''),
        password=config_dict.get('db_45.db_pass', ''),
        dsn=config_dict.get('db_45.db_dsn', '')
    )


def safe_float(value: Any, default: float = 0.0) -> float:
    """安全转换为浮点数"""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    """安全转换为整数"""
    if value is None:
        return default
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default


def parse_tags(tag_string: Optional[str]) -> List[str]:
    """解析标签字符串为数组"""
    if not tag_string:
        return []
    # 按逗号分隔，去除空白
    tags = [tag.strip() for tag in tag_string.split(',') if tag.strip()]
    return tags


def map_category(db_category: Optional[str]) -> str:
    """映射数据库分类到前端分类"""
    if not db_category:
        return "股票"  # 默认分类
    return CATEGORY_MAPPING.get(db_category, db_category)


def map_outlook_stars(expect_value: Optional[int]) -> int:
    """映射预期收益等级到星级 (1-5)"""
    value = safe_int(expect_value, 3)
    # 确保在 1-5 范围内
    return max(1, min(5, value))


def transform_row(row: tuple, columns: List[str]) -> Dict[str, Any]:
    """将数据库行转换为前端需要的格式"""
    # 创建字段名到值的映射
    data = dict(zip(columns, row))

    # 获取 SK_STRATEGY 作为种子
    sk_strategy = safe_int(data.get('SK_STRATEGY'), 0)

    # 计算年化收益率（转百分比）
    year_yield = safe_float(data.get('STRATEGY_YEAR_YIELD'), 0.0)
    annual_return = round(year_yield * 100, 2)

    # 计算胜率（转百分比）
    year_rate = safe_float(data.get('STRATEGY_YEAR_RATE'), 0.0)
    win_rate = round(year_rate * 100, 2)

    # 映射分类
    first_category = data.get('FIRST_CATEGORY', '')
    nav_category = map_category(first_category)

    # 构建前端需要的结构
    strategy = {
        # 基础信息
        "name": data.get('STRATEGY_NAME') or "未命名策略",
        "navCategory": nav_category,
        "category": nav_category,
        "tags": parse_tags(data.get('STRATEGY_LABEL')),

        # 绩效指标
        "annualReturn": annual_return,
        "winRate": win_rate,
        "outlookStars": map_outlook_stars(data.get('STRATEGY_EXPECT')),

        # 策略详情
        "structure": data.get('SECOND_CATEGORY') or data.get('STRATEGY_STRUCTURE') or "单策略",
        "owner": data.get('MANAGER_USER') or "未指定",
        "logicSummary": data.get('STRATEGY_LOGIC') or "暂无策略说明",
        "benchmarkName": data.get('INDEX_NAME') or "理财收益",
        "positioning": data.get('SUIT_MARKET') or "适用于多种市场环境",

        # 用于生成曲线的种子
        "seed": sk_strategy,

        # 原始数据（可选，用于调试）
        "_sk_strategy": sk_strategy,
        "_sk_date": data.get('SK_DATE'),
    }

    return strategy


def sort_strategies_by_category(strategies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """按分类顺序排序策略列表"""
    category_order = {cat: idx for idx, cat in enumerate(DEFAULT_CATEGORY_ORDER)}

    def get_sort_key(s):
        cat = s.get('navCategory', '股票')
        return (category_order.get(cat, 999), s.get('_sk_strategy', 0))

    return sorted(strategies, key=get_sort_key)


def export_strategies(output_path: Optional[Path] = None) -> bool:
    """导出策略数据到 JSON 文件"""
    if output_path is None:
        output_path = PROJECT_ROOT / "data" / "strategies.json"

    # 确保输出目录存在
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 读取配置
    config_path = PROJECT_ROOT / "config.ini"
    if not config_path.exists():
        print(f"错误: 配置文件不存在: {config_path}")
        return False

    try:
        config = parse_config(config_path)
    except Exception as e:
        print(f"解析配置失败: {e}")
        return False

    # 连接数据库并查询
    client = OracleClient(config)

    print("正在连接数据库...")
    if not client.test_connection():
        print("数据库连接失败")
        return False

    print("正在查询策略数据...")
    try:
        columns, rows = client.execute_query_with_columns(QUERY_SQL)
    except Exception as e:
        print(f"查询失败: {e}")
        return False

    print(f"查询到 {len(rows)} 条策略记录")

    # 转换数据
    strategies = []
    for row in rows:
        try:
            strategy = transform_row(row, columns)
            strategies.append(strategy)
        except Exception as e:
            print(f"转换数据行失败: {e}")
            continue

    # 按分类排序
    strategies = sort_strategies_by_category(strategies)

    # 导出为 JSON
    output_data = {
        "exported_at": None,  # 可以添加时间戳
        "count": len(strategies),
        "strategies": strategies
    }

    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        print(f"成功导出 {len(strategies)} 条策略到: {output_path}")
        return True
    except Exception as e:
        print(f"导出 JSON 失败: {e}")
        return False


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description='导出策略数据到 JSON')
    parser.add_argument(
        '-o', '--output',
        type=Path,
        default=None,
        help='输出文件路径 (默认: data/strategies.json)'
    )

    args = parser.parse_args()

    success = export_strategies(args.output)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
