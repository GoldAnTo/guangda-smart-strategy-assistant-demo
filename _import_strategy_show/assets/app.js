(function () {
  const DEBUG_LOG_LIMIT = 200;

  function createDebugLogger(scope) {
    return function log(event, payload) {
      const store = (window.__strategyShowDebug = window.__strategyShowDebug || []);
      const entry = {
        time: new Date().toISOString(),
        scope: scope,
        event: event,
        payload: payload || null,
      };
      store.push(entry);
      if (store.length > DEBUG_LOG_LIMIT) {
        store.shift();
      }
      if (window.console && typeof window.console.log === "function") {
        window.console.log("[StrategyShow][" + scope + "] " + event, payload || "");
      }
    };
  }

  const globalDebug = createDebugLogger("global");

  window.addEventListener("error", function (event) {
    globalDebug("window:error", {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", function (event) {
    const reason = event.reason;
    globalDebug("window:unhandledrejection", {
      message: reason && reason.message ? reason.message : String(reason),
    });
  });

  const CATEGORY_ORDER = ["股指期货", "股基 FOF", "商品", "ETF", "混合型", "转债", "股票"];
  const SLOT_COUNT = 8;
  const PERIOD_DEFS = [
    { key: "m1", label: "近一月", points: 24, cadence: "day" },
    { key: "m3", label: "近三月", points: 64, cadence: "day" },
    { key: "y1", label: "近一年", points: 52, cadence: "week" },
    { key: "ytd", label: "今年以来", points: 56, cadence: "week" },
    { key: "all", label: "成立以来", points: 96, cadence: "month" },
  ];

  const DURATIONS = {
    gridHold: 2000,
    detailHold: 6200,
    transition: 760,
  };

  const DEFAULT_THEME = {
    brandTitle: "基金策略全景展示",
    colors: {
      product: "#ff9b5b",
      benchmark: "#57c7ff",
      panelGlow: "#6ee7ff",
    },
  };

  // 从全局变量加载策略数据（由 data/strategies.js 提供）
  function loadStrategiesFromJSON() {
    try {
      if (typeof STRATEGIES_DATA !== 'undefined' && STRATEGIES_DATA.strategies) {
        console.log('成功加载策略数据，共', STRATEGIES_DATA.strategies.length, '条');
        return STRATEGIES_DATA.strategies;
      }
      console.warn('STRATEGIES_DATA 未定义，使用后备数据');
      return [];
    } catch (error) {
      console.error('加载策略数据失败:', error);
      return [];
    }
  }

  // 保留的示例策略数据（作为后备）
  const FALLBACK_STRATEGIES = [
    {
      name: "数据加载中...",
      navCategory: "股票",
      tags: ["加载中"],
      annualReturn: 0,
      winRate: 0,
      outlookStars: 3,
      structure: "加载中",
      category: "股票",
      owner: "系统",
      logicSummary: "正在从服务器加载策略数据，请稍候...",
      benchmarkName: "加载中",
      positioning: "数据加载中",
      seed: 1,
    },
  ];

  // 原始硬编码数据已移除，改为从 JSON 加载
  // 如需查看原始数据，请参考 doc/TStrategyMarketInfoMapper_SQL.md

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function round(num, digits) {
    return Number(num.toFixed(digits || 2));
  }

  function pseudo(seed, index, shift) {
    return Math.sin(seed * 0.73 + index * 0.47 + (shift || 0) * 1.13);
  }

  function formatPercent(value, alwaysSign) {
    const sign = alwaysSign && value > 0 ? "+" : "";
    return sign + value.toFixed(2) + "%";
  }

  function makeDateLabels(points, cadence) {
    const labels = [];
    const start = new Date(2018, 0, 1);

    for (let i = 0; i < points; i += 1) {
      const date = new Date(start);
      if (cadence === "day") {
        date.setDate(date.getDate() + i * 4);
      } else if (cadence === "week") {
        date.setDate(date.getDate() + i * 7);
      } else {
        date.setMonth(date.getMonth() + i);
      }
      labels.push(
        `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
          date.getDate()
        ).padStart(2, "0")}`
      );
    }

    return labels;
  }

  function buildSeries(seed, points, annualReturn, intensity) {
    const product = [];
    const benchmark = [];
    let productValue = 0;
    let benchmarkValue = 0;
    const drift = annualReturn / points / 1.7;
    const benchmarkDrift = annualReturn / points / 2.45;
    const amplitude = intensity || 1;

    for (let i = 0; i < points; i += 1) {
      const productMove =
        drift +
        pseudo(seed, i, 1) * (0.95 * amplitude) +
        pseudo(seed, i, 2) * (0.38 * amplitude) +
        (i % 15 === 0 ? pseudo(seed, i, 5) * 1.85 : 0);
      const benchmarkMove =
        benchmarkDrift +
        pseudo(seed, i, 3) * (0.62 * amplitude) +
        pseudo(seed, i, 4) * (0.2 * amplitude) -
        (i % 19 === 0 ? 0.72 : 0);

      productValue = round(productValue + productMove, 2);
      benchmarkValue = round(benchmarkValue + benchmarkMove, 2);
      product.push(productValue);
      benchmark.push(benchmarkValue);
    }

    return { product: product, benchmark: benchmark };
  }

  function buildStrategySeries(item) {
    const performanceSeries = [];
    const benchmarkSeries = [];
    const periodLabels = PERIOD_DEFS.map(function (period) {
      return period.label;
    });

    PERIOD_DEFS.forEach(function (period, index) {
      const scale = period.key === "all" ? 1.45 : period.key === "y1" ? 1.18 : 0.96;
      const curves = buildSeries(item.seed + index * 7, period.points, item.annualReturn * scale, 1 + index * 0.08);

      performanceSeries.push({
        key: period.key,
        label: period.label,
        dates: makeDateLabels(period.points, period.cadence),
        values: curves.product,
      });

      benchmarkSeries.push({
        key: period.key,
        label: period.label,
        dates: makeDateLabels(period.points, period.cadence),
        values: curves.benchmark,
      });
    });

    return Object.assign({}, item, {
      periodLabels: periodLabels,
      performanceSeries: performanceSeries,
      benchmarkSeries: benchmarkSeries,
    });
  }

  function buildSampleStrategies() {
    // 使用后备数据作为示例
    return FALLBACK_STRATEGIES.map(buildStrategySeries);
  }

  // 构建策略数据（从全局变量加载）
  function buildStrategiesFromJSON() {
    const strategies = loadStrategiesFromJSON();
    if (!strategies || strategies.length === 0) {
      console.warn('无法从 JSON 加载策略，使用后备数据');
      return FALLBACK_STRATEGIES.map(buildStrategySeries);
    }
    return strategies.map(buildStrategySeries);
  }

  function calcMaxDrawdown(values) {
    let peak = values[0] || 0;
    let maxDrawdown = 0;
    values.forEach(function (value) {
      peak = Math.max(peak, value);
      maxDrawdown = Math.min(maxDrawdown, value - peak);
    });
    return round(maxDrawdown, 2);
  }

  function calcVolatility(values) {
    if (!values.length) return 0;
    const mean =
      values.reduce(function (sum, value) {
        return sum + value;
      }, 0) / values.length;
    const variance =
      values.reduce(function (sum, value) {
        return sum + Math.pow(value - mean, 2);
      }, 0) / values.length;
    return round(Math.sqrt(variance), 2);
  }

  function createStars(count) {
    let html = "";
    for (let i = 0; i < 5; i += 1) {
      html += `<span class="${i < count ? "filled" : ""}">★</span>`;
    }
    return html;
  }

  function createSparkline(values, color) {
    if (!values || values.length < 2) return "";
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const range = max - min || 1;
    const width = 100;
    const height = 24;
    const padding = 2;
    const points = values.map(function (v, i) {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return x + "," + y;
    }).join(" ");
    return '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">' +
      '<polyline fill="none" stroke="' + (color || "#ff975f") + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="' + points + '"/>' +
      '</svg>';
  }

  function updateWinrateRing(winrate) {
    var ring = document.getElementById("winrate-ring");
    var valueEl = document.getElementById("winrate-value");
    if (!ring) return;
    var progress = ring.querySelector(".ring-progress");
    if (!progress) return;
    var circumference = 2 * Math.PI * 42;
    var offset = circumference - (winrate / 100) * circumference;
    progress.style.strokeDashoffset = offset;
    progress.classList.remove("winrate-high", "winrate-medium", "winrate-low");
    if (winrate >= 80) {
      progress.classList.add("winrate-high");
    } else if (winrate >= 60) {
      progress.classList.add("winrate-medium");
    } else {
      progress.classList.add("winrate-low");
    }
    if (valueEl) {
      valueEl.textContent = winrate.toFixed(0) + "%";
    }
  }

  function animateValue(el, start, end, duration, suffix) {
    if (!el) return;
    var startTime = null;
    var isNegative = end < 0;
    var absEnd = Math.abs(end);
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easeProgress = 1 - Math.pow(1 - progress, 3);
      var current = start + (absEnd - start) * easeProgress;
      var sign = isNegative ? "-" : (end >= 0 && suffix ? "+" : "");
      var suffixStr = suffix === true ? "%" : (suffix || "%");
      el.textContent = sign + current.toFixed(2) + suffixStr;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function getDerivedStats(strategy, periodIndex) {
    const performance = strategy.performanceSeries[periodIndex];
    const benchmark = strategy.benchmarkSeries[periodIndex];
    const productEnd = performance.values[performance.values.length - 1] || 0;
    const benchmarkEnd = benchmark.values[benchmark.values.length - 1] || 0;
    const excess = round(productEnd - benchmarkEnd, 2);
    const maxDrawdown = calcMaxDrawdown(performance.values);
    const volatility = calcVolatility(performance.values);
    const beatRatio = round(
      (performance.values.filter(function (value, index) {
        return value >= benchmark.values[index];
      }).length /
        performance.values.length) *
        100,
      2
    );

    return [
      { label: "区间收益", value: formatPercent(productEnd, true), rawValue: productEnd, tone: "positive" },
      { label: "超额收益", value: formatPercent(excess, true), rawValue: excess, tone: excess >= 0 ? "positive" : "negative" },
      { label: "最大回撤", value: formatPercent(maxDrawdown, false), rawValue: maxDrawdown, tone: "negative" },
      { label: "波动幅度", value: formatPercent(volatility, false), rawValue: volatility, tone: "" },
      { label: "跑赢基准占比", value: formatPercent(beatRatio, false), rawValue: beatRatio, tone: beatRatio >= 50 ? "positive" : "negative" },
    ];
  }

  function mergeTheme(theme) {
    const output = JSON.parse(JSON.stringify(DEFAULT_THEME));
    if (!theme) return output;

    Object.keys(theme).forEach(function (key) {
      if (theme[key] && typeof theme[key] === "object" && !Array.isArray(theme[key])) {
        output[key] = Object.assign({}, output[key] || {}, theme[key]);
      } else if (theme[key] !== undefined) {
        output[key] = theme[key];
      }
    });

    return output;
  }

  function setThemeVariables(theme) {
    const root = document.documentElement;
    root.style.setProperty("--aqua", theme.colors.panelGlow);
    root.style.setProperty("--cyan", theme.colors.benchmark);
    root.style.setProperty("--orange", theme.colors.product);
  }

  function createBackgroundController(canvas) {
    if (!canvas) {
      return {
        resize: function () {},
        setView: function () {},
        destroy: function () {},
      };
    }

    var ctx = canvas.getContext("2d");
    var width = canvas.clientWidth || canvas.parentElement.clientWidth;
    var height = canvas.clientHeight || canvas.parentElement.clientHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var animationFrame = null;
    var time = 0;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    var dataLines = [];
    var lineCount = 12;
    for (var i = 0; i < lineCount; i++) {
      var points = [];
      var pointCount = 80 + Math.floor(Math.random() * 40);
      var baseY = (i / lineCount) * height;
      var amplitude = 30 + Math.random() * 50;
      var speed = 0.3 + Math.random() * 0.4;
      var phase = Math.random() * Math.PI * 2;
      for (var j = 0; j < pointCount; j++) {
        points.push({
          x: (j / (pointCount - 1)) * width * 1.5 - width * 0.25,
          baseY: baseY,
          y: baseY,
          amplitude: amplitude,
          speed: speed,
          phase: phase + j * 0.05
        });
      }
      dataLines.push({
        points: points,
        color: i % 3 === 0 ? "rgba(255, 155, 91, 0.12)" : "rgba(110, 199, 255, 0.08)",
        lineWidth: 1 + Math.random() * 0.5
      });
    }

    var gridLines = [];
    var gridSpacing = 80;
    for (var x = 0; x < width + gridSpacing; x += gridSpacing) {
      gridLines.push({ x: x, type: "vertical" });
    }
    for (var y = 0; y < height + gridSpacing; y += gridSpacing) {
      gridLines.push({ y: y, type: "horizontal" });
    }

    var particles = [];
    var particleCount = 50;
    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: 0.2 + Math.random() * 0.3
      });
    }

    var klineShapes = [];
    var klineCount = 8;
    for (var i = 0; i < klineCount; i++) {
      klineShapes.push({
        x: Math.random() * width,
        y: height * 0.2 + Math.random() * height * 0.6,
        width: 4 + Math.random() * 6,
        height: 20 + Math.random() * 60,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: 0.2 + Math.random() * 0.3,
        opacity: 0.03 + Math.random() * 0.05
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(110, 180, 255, 0.04)";
      ctx.lineWidth = 1;
      gridLines.forEach(function(line) {
        ctx.beginPath();
        if (line.type === "vertical") {
          ctx.moveTo(line.x, 0);
          ctx.lineTo(line.x, height);
        } else {
          ctx.moveTo(0, line.y);
          ctx.lineTo(width, line.y);
        }
        ctx.stroke();
      });

      klineShapes.forEach(function(kl) {
        kl.x -= kl.speed;
        if (kl.x < -20) {
          kl.x = width + 20;
          kl.y = height * 0.2 + Math.random() * height * 0.6;
          kl.height = 20 + Math.random() * 60;
          kl.direction = Math.random() > 0.5 ? 1 : -1;
        }
        ctx.fillStyle = kl.direction > 0 
          ? "rgba(255, 155, 91, " + kl.opacity + ")" 
          : "rgba(110, 199, 255, " + kl.opacity + ")";
        ctx.fillRect(kl.x, kl.y, kl.width, kl.height * kl.direction);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(kl.x + kl.width / 2, kl.y - 10);
        ctx.lineTo(kl.x + kl.width / 2, kl.y + kl.height * kl.direction + 10);
        ctx.stroke();
      });

      dataLines.forEach(function(line) {
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.lineWidth;
        line.points.forEach(function(point, idx) {
          point.y = point.baseY + Math.sin(time * point.speed + point.phase) * point.amplitude;
          if (idx === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      });

      particles.forEach(function(p) {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(110, 199, 255, " + p.opacity + ")";
        ctx.fill();
      });

      var gradient = ctx.createRadialGradient(width * 0.3, height * 0.3, 0, width * 0.3, height * 0.3, width * 0.5);
      gradient.addColorStop(0, "rgba(110, 199, 255, 0.03)");
      gradient.addColorStop(1, "rgba(110, 199, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      var gradient2 = ctx.createRadialGradient(width * 0.7, height * 0.7, 0, width * 0.7, height * 0.7, width * 0.4);
      gradient2.addColorStop(0, "rgba(255, 155, 91, 0.02)");
      gradient2.addColorStop(1, "rgba(255, 155, 91, 0)");
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);
    }

    function tick() {
      animationFrame = requestAnimationFrame(tick);
      time += 0.016;
      draw();
    }

    function resize() {
      width = canvas.clientWidth || canvas.parentElement.clientWidth;
      height = canvas.clientHeight || canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    tick();

    return {
      resize: resize,
      setView: function () {},
      destroy: function () {
        cancelAnimationFrame(animationFrame);
      },
    };
  }

  function initStrategyShow(config) {
    const options = config || {};
    const theme = mergeTheme(options.theme);
    const debug = createDebugLogger("app");

    // 加载策略数据
    let strategies;
    if (options.strategies && options.strategies.length) {
      strategies = options.strategies.map(function (strategy) {
        return strategy.performanceSeries ? strategy : buildStrategySeries(strategy);
      });
    } else {
      // 从 JS 数据文件加载，失败则使用后备数据
      try {
        strategies = buildStrategiesFromJSON();
      } catch (error) {
        console.error('加载策略失败:', error);
        strategies = buildSampleStrategies();
      }
    }

    setThemeVariables(theme);

    const grouped = {};
    CATEGORY_ORDER.forEach(function (category) {
      grouped[category] = [];
    });
    strategies.forEach(function (strategy) {
      if (!grouped[strategy.navCategory]) {
        grouped[strategy.navCategory] = [];
      }
      grouped[strategy.navCategory].push(strategy);
    });

    const nonEmptyCategoryIndexes = CATEGORY_ORDER.map(function (category, index) {
      return grouped[category] && grouped[category].length ? index : null;
    }).filter(function (value) {
      return value !== null;
    });

    const refs = {
      shell: document.getElementById("strategy-show"),
      categoryTabs: document.getElementById("category-tabs"),
      gridTitle: document.getElementById("grid-title"),
      gridNote: document.getElementById("grid-note"),
      matrixWall: document.getElementById("matrix-wall"),
      detailName: document.getElementById("detail-name"),
      detailStars: document.getElementById("detail-stars"),
      detailTags: document.getElementById("detail-tags"),
      detailLogic: document.getElementById("detail-logic"),
      detailReturn: document.getElementById("detail-return"),
      detailWinrate: document.getElementById("detail-winrate"),
      detailStructure: document.getElementById("detail-structure"),
      detailType: document.getElementById("detail-type"),
      detailOwner: document.getElementById("detail-owner"),
      detailBenchmark: document.getElementById("detail-benchmark"),
      chartStrategyName: document.getElementById("chart-strategy-name"),
      periodTabs: document.getElementById("period-tabs"),
      derivedStats: document.getElementById("derived-stats"),
      chartMain: document.getElementById("chart-main"),
      canvas: document.getElementById("bg-canvas"),
    };

    const state = {
      activeCategoryIndex: nonEmptyCategoryIndexes.length ? nonEmptyCategoryIndexes[0] : 0,
      activeProductIndexInCategory: 0,
      view: "grid",
      periodIndex: PERIOD_DEFS.length - 1,
      pausedByUser: false,
      pausedByHover: false,
      hoveredCardIndex: null,
      transitioning: false,
      timers: {
        step: null,
        transition: null,
      },
    };

    function getStateSnapshot() {
      return {
        view: state.view,
        activeCategoryIndex: state.activeCategoryIndex,
        activeCategoryName: getCurrentCategoryName(),
        activeProductIndexInCategory: state.activeProductIndexInCategory,
        pausedByUser: state.pausedByUser,
        pausedByHover: state.pausedByHover,
        hoveredCardIndex: state.hoveredCardIndex,
        transitioning: state.transitioning,
        periodIndex: state.periodIndex,
      };
    }

    debug("init:start", {
      strategyCount: strategies.length,
      hasThree: !!window.THREE,
      hasEcharts: !!window.echarts,
      hasEchartsGraphic: !!(window.echarts && window.echarts.graphic),
      refsReady: {
        shell: !!refs.shell,
        matrixWall: !!refs.matrixWall,
        detailView: !!document.getElementById("detail-view"),
        chartMain: !!refs.chartMain,
      },
    });

    let chart = null;
    if (window.echarts) {
      try {
        chart = window.echarts.init(refs.chartMain, null, { renderer: "canvas" });
        debug("chart:init:success");
      } catch (error) {
        debug("chart:init:error", {
          message: error.message,
        });
      }
    } else {
      debug("chart:init:skip", { reason: "window.echarts missing" });
    }
    const background = createBackgroundController(refs.canvas);

    function getCurrentCategoryName() {
      return CATEGORY_ORDER[state.activeCategoryIndex];
    }

    function getCategoryItems(categoryIndex) {
      return grouped[CATEGORY_ORDER[categoryIndex]] || [];
    }

    function getCurrentCategoryItems() {
      return getCategoryItems(state.activeCategoryIndex);
    }

    function getCurrentStrategy() {
      const items = getCurrentCategoryItems();
      return items[state.activeProductIndexInCategory] || items[0] || null;
    }

    function isAutoplayPaused() {
      return state.pausedByUser || state.pausedByHover || state.transitioning;
    }

    function clearTimers() {
      clearTimeout(state.timers.step);
      clearTimeout(state.timers.transition);
    }

    function clearStepTimer() {
      clearTimeout(state.timers.step);
    }

    function findNextNonEmptyCategoryIndex(startIndex, step) {
      const direction = step || 1;
      for (let offset = 1; offset <= CATEGORY_ORDER.length; offset += 1) {
        const candidate = (startIndex + direction * offset + CATEGORY_ORDER.length) % CATEGORY_ORDER.length;
        if (getCategoryItems(candidate).length) {
          return candidate;
        }
      }
      return startIndex;
    }

    function getNextPlaybackTarget(step) {
      const direction = step || 1;
      const categoryItems = getCurrentCategoryItems();
      let nextCategoryIndex = state.activeCategoryIndex;
      let nextProductIndex = state.activeProductIndexInCategory + direction;

      if (direction > 0) {
        if (nextProductIndex >= categoryItems.length) {
          nextCategoryIndex = findNextNonEmptyCategoryIndex(state.activeCategoryIndex, 1);
          nextProductIndex = 0;
        }
      } else if (nextProductIndex < 0) {
        nextCategoryIndex = findNextNonEmptyCategoryIndex(state.activeCategoryIndex, -1);
        nextProductIndex = getCategoryItems(nextCategoryIndex).length - 1;
      }

      return {
        categoryIndex: nextCategoryIndex,
        productIndex: nextProductIndex,
      };
    }

    function getDisplaySlots() {
      const items = getCurrentCategoryItems();
      const slots = [];
      for (let index = 0; index < items.length; index += 1) {
        slots.push({
          type: "product",
          strategy: items[index],
          productIndex: index,
        });
      }
      return slots;
    }

    function renderCategoryTabs() {
      refs.categoryTabs.innerHTML = CATEGORY_ORDER.map(function (category, index) {
        const isActive = index === state.activeCategoryIndex;
        const isEmpty = !getCategoryItems(index).length;
        const classes = ["category-tab"];
        if (isActive) classes.push("is-active");
        if (isEmpty) classes.push("is-empty");
        return `<button type="button" class="${classes.join(" ")}" data-index="${index}">
            <span>${category}</span>
          </button>`;
      }).join("");
    }

    function renderStatus() {
      // Status bar removed, no-op
    }

    function renderGrid() {
      const categoryName = getCurrentCategoryName();
      const items = getCurrentCategoryItems();
      const currentStrategy = getCurrentStrategy();

      refs.gridTitle.textContent = categoryName;
      refs.gridNote.textContent = currentStrategy
        ? `当前高亮产品将在 2 秒后自动进入业绩展示，点击任一卡片可立即查看对应详情。`
        : "该分类暂无产品，自动轮播将跳过。";

      refs.matrixWall.innerHTML = getDisplaySlots()
        .map(function (slot) {
          const classes = ["matrix-card"];
          if (slot.productIndex === state.activeProductIndexInCategory) classes.push("is-current");
          if (slot.productIndex === state.hoveredCardIndex) classes.push("is-hovered");

          return `<article class="${classes.join(" ")}" data-product-index="${slot.productIndex}">
              <div class="matrix-card-body">
                <div class="matrix-card-head">
                  <div>
                    <span class="chip">${slot.strategy.navCategory}</span>
                    <h3>${slot.strategy.name}</h3>
                  </div>
                  <div class="star-row">${createStars(slot.strategy.outlookStars)}</div>
                </div>
                <div class="tag-row">${slot.strategy.tags
                  .map(function (tag) {
                    return `<span class="tag">${tag}</span>`;
                  })
                  .join("")}</div>
                <div class="matrix-metrics">
                  <div class="matrix-metric">
                    <span>年化收益</span>
                    <strong class="positive">${formatPercent(slot.strategy.annualReturn, true)}</strong>
                  </div>
                  <div class="matrix-metric">
                    <span>年度胜率</span>
                    <strong>${formatPercent(slot.strategy.winRate, false)}</strong>
                  </div>
                </div>
                <div class="matrix-foot">
                  <span>${slot.strategy.structure}</span>
                  <span>${slot.strategy.owner}</span>
                </div>
              </div>
            </article>`;
        })
        .join("");

      if (!items.length) {
        refs.gridNote.textContent = "该分类暂无产品，自动轮播将跳过。";
      }
    }

    function renderDerivedStats(strategy) {
      var stats = getDerivedStats(strategy, state.periodIndex);
      var maxAbs = Math.max.apply(null, stats.map(function(s) { return Math.abs(s.rawValue || 0); }));
      refs.derivedStats.innerHTML = stats.map(function (item) {
        var barWidth = maxAbs > 0 ? Math.min(Math.abs(item.rawValue || 0) / maxAbs * 100, 100) : 0;
        var barClass = item.rawValue >= 0 ? "positive" : "negative";
        return '<div class="derived-stat glass-panel">' +
            '<div class="derived-stat-visual">' +
              '<span>' + item.label + '</span>' +
              '<strong class="' + item.tone + '">' + item.value + '</strong>' +
            '</div>' +
            '<div class="derived-bar">' +
              '<div class="derived-bar-fill ' + barClass + '" style="width: ' + barWidth + '%"></div>' +
            '</div>' +
          '</div>';
      }).join("");
    }

    function renderPeriodTabs() {
      refs.periodTabs.innerHTML = PERIOD_DEFS.map(function (period, index) {
        const active = index === state.periodIndex ? "active" : "";
        return `<button type="button" class="period-tab ${active}" data-index="${index}">${period.label}</button>`;
      }).join("");
    }

    function renderChart(strategy) {
      const productSeries = strategy.performanceSeries[state.periodIndex];
      const benchmarkSeries = strategy.benchmarkSeries[state.periodIndex];
      const gradientSupported = !!(
        window.echarts &&
        window.echarts.graphic &&
        typeof window.echarts.graphic.LinearGradient === "function"
      );

      refs.chartStrategyName.textContent = strategy.name;
      renderPeriodTabs();
      renderDerivedStats(strategy);

      if (!chart) {
        debug("chart:render:skip", {
          reason: "chart unavailable",
          strategy: strategy.name,
          state: getStateSnapshot(),
        });
        return;
      }

      debug("chart:render:start", {
        strategy: strategy.name,
        period: productSeries.label,
        gradientSupported: gradientSupported,
      });

      try {
        chart.setOption(
          {
          backgroundColor: "transparent",
          animationDuration: 700,
          textStyle: {
            color: "rgba(227, 240, 255, 0.82)",
            fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
          },
          grid: {
            top: 72,
            left: 58,
            right: 28,
            bottom: 64,
          },
          legend: {
            top: 18,
            itemWidth: 24,
            itemHeight: 3,
            textStyle: {
              color: "rgba(227, 240, 255, 0.82)",
            },
            data: ["本产品", strategy.benchmarkName],
          },
          tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(5, 14, 28, 0.9)",
            borderColor: "rgba(110, 231, 255, 0.2)",
            textStyle: {
              color: "#eff7ff",
            },
          },
          xAxis: {
            type: "category",
            boundaryGap: false,
            data: productSeries.dates,
            axisLine: {
              lineStyle: {
                color: "rgba(121, 181, 255, 0.18)",
              },
            },
            axisLabel: {
              color: "rgba(200, 219, 255, 0.7)",
              margin: 14,
              formatter: function (value, index) {
                const interval = Math.ceil(productSeries.dates.length / 6);
                return index % interval === 0 ? value : "";
              },
            },
            splitLine: { show: false },
          },
          yAxis: {
            type: "value",
            axisLabel: {
              color: "rgba(200, 219, 255, 0.7)",
              formatter: "{value}%",
            },
            axisLine: { show: false },
            splitLine: {
              lineStyle: {
                color: "rgba(121, 181, 255, 0.12)",
              },
            },
          },
          series: [
            {
              name: "本产品",
              type: "line",
              smooth: true,
              symbol: "none",
              data: productSeries.values,
              lineStyle: {
                width: 3,
                color: theme.colors.product,
              },
              areaStyle: {
                color: gradientSupported
                  ? new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: "rgba(255, 155, 91, 0.36)" },
                      { offset: 1, color: "rgba(255, 155, 91, 0.02)" },
                    ])
                  : "rgba(255, 155, 91, 0.18)",
              },
            },
            {
              name: strategy.benchmarkName,
              type: "line",
              smooth: true,
              symbol: "none",
              data: benchmarkSeries.values,
              lineStyle: {
                width: 2.5,
                color: theme.colors.benchmark,
              },
            },
          ],
          },
          true
        );
        debug("chart:render:success", {
          strategy: strategy.name,
          period: productSeries.label,
        });
      } catch (error) {
        debug("chart:render:error", {
          strategy: strategy.name,
          message: error.message,
        });
      }
    }

    function renderDetail() {
      const strategy = getCurrentStrategy();
      if (!strategy) {
        debug("detail:render:skip", {
          reason: "no current strategy",
          state: getStateSnapshot(),
        });
        return;
      }

      debug("detail:render:start", {
        strategy: strategy.name,
        state: getStateSnapshot(),
      });
      refs.detailName.textContent = strategy.name;
      refs.detailStars.innerHTML = createStars(strategy.outlookStars);
      refs.detailTags.innerHTML = strategy.tags
        .map(function (tag) {
          return `<span class="tag">${tag}</span>`;
        })
        .join("");
      refs.detailLogic.textContent = strategy.logicSummary;
      
      var returnEl = document.getElementById("detail-return");
      if (returnEl) {
        animateValue(returnEl, 0, strategy.annualReturn, 800, true);
      }
      
      var sparklineEl = document.getElementById("return-sparkline");
      if (sparklineEl && strategy.performanceSeries && strategy.performanceSeries.length > 0) {
        sparklineEl.innerHTML = createSparkline(strategy.performanceSeries[state.periodIndex].values, "#ff975f");
      }
      
      updateWinrateRing(strategy.winRate);
      
      refs.detailStructure.textContent = strategy.structure;
      refs.detailType.textContent = strategy.category;
      refs.detailOwner.textContent = strategy.owner;
      refs.detailBenchmark.textContent = strategy.benchmarkName;
      renderChart(strategy);
      debug("detail:render:done", {
        strategy: strategy.name,
      });
    }

    function renderAll() {
      refs.shell.dataset.view = state.view;
      debug("renderAll", getStateSnapshot());
      renderCategoryTabs();
      renderStatus();
      renderGrid();
      renderDetail();
      background.setView(state.view);
    }

    function scheduleCurrentView() {
      clearTimeout(state.timers.step);
      if (isAutoplayPaused()) return;

      if (state.view === "grid") {
        state.timers.step = setTimeout(function () {
          requestDetailTransition();
        }, DURATIONS.gridHold);
      } else {
        state.timers.step = setTimeout(function () {
          returnToGrid(getNextPlaybackTarget(1));
        }, DURATIONS.detailHold);
      }
    }

    function requestDetailTransition(force) {
      const strategy = getCurrentStrategy();
      if (state.view !== "grid" || !strategy || state.transitioning) {
        debug("detailTransition:blocked", {
          force: !!force,
          reason: !strategy ? "no strategy" : state.transitioning ? "already transitioning" : "not in grid",
          state: getStateSnapshot(),
        });
        return;
      }
      if (!force && isAutoplayPaused()) {
        debug("detailTransition:blocked", {
          force: !!force,
          reason: "autoplay paused",
          state: getStateSnapshot(),
        });
        return;
      }
      debug("detailTransition:start", {
        force: !!force,
        strategy: strategy.name,
        state: getStateSnapshot(),
      });
      state.transitioning = true;
      refs.shell.dataset.transition = "to-detail";
      renderStatus();

      state.timers.transition = setTimeout(function () {
        state.view = "detail";
        state.transitioning = false;
        refs.shell.dataset.transition = "idle";
        debug("detailTransition:commit", {
          strategy: strategy.name,
          state: getStateSnapshot(),
        });
        renderAll();
        if (chart) {
          chart.resize();
        }
        scheduleCurrentView();
      }, DURATIONS.transition);
    }

    function returnToGrid(target) {
      if (state.transitioning) {
        debug("returnToGrid:blocked", {
          reason: "already transitioning",
          state: getStateSnapshot(),
        });
        return;
      }
      debug("returnToGrid:start", {
        target: target,
        state: getStateSnapshot(),
      });
      state.transitioning = true;
      refs.shell.dataset.transition = "to-grid";
      renderStatus();

      state.timers.transition = setTimeout(function () {
        state.activeCategoryIndex = target.categoryIndex;
        state.activeProductIndexInCategory = target.productIndex;
        state.hoveredCardIndex = null;
        state.view = "grid";
        state.periodIndex = PERIOD_DEFS.length - 1;
        state.transitioning = false;
        refs.shell.dataset.transition = "idle";
        debug("returnToGrid:commit", getStateSnapshot());
        renderAll();
        scheduleCurrentView();
      }, DURATIONS.transition);
    }

    function jumpToTarget(target) {
      clearTimers();
      state.hoveredCardIndex = null;
      state.pausedByHover = false;
      state.pausedByUser = false;
      state.activeCategoryIndex = target.categoryIndex;
      state.activeProductIndexInCategory = target.productIndex;
      state.view = "grid";
      refs.shell.dataset.transition = "idle";
      state.transitioning = false;
      renderAll();
      scheduleCurrentView();
    }

    function handleCardEnter(productIndex) {
      if (state.view !== "grid" || productIndex === null || productIndex === undefined || state.transitioning) return;
      if (state.hoveredCardIndex === productIndex && state.pausedByHover) return;
      debug("card:hover", {
        productIndex: productIndex,
        state: getStateSnapshot(),
      });
      clearStepTimer();
      if (state.hoveredCardIndex !== productIndex) {
        state.hoveredCardIndex = null;
        state.pausedByHover = false;
      }
      state.pausedByHover = true;
      state.hoveredCardIndex = productIndex;
      state.activeProductIndexInCategory = productIndex;
      renderAll();
    }

    function handleCardLeave() {
      if (state.view !== "grid" || state.transitioning) return;
      if (!state.pausedByHover && state.hoveredCardIndex === null) return;
      debug("card:hover:end", getStateSnapshot());
      state.pausedByHover = false;
      state.hoveredCardIndex = null;
      renderAll();
      scheduleCurrentView();
    }

    function handleCardSelect(productIndex) {
      if (state.view !== "grid" || productIndex === null || productIndex === undefined || state.transitioning) {
        debug("card:select:blocked", {
          productIndex: productIndex,
          reason:
            state.view !== "grid"
              ? "not in grid"
              : productIndex === null || productIndex === undefined
                ? "invalid productIndex"
                : state.transitioning
                  ? "already transitioning"
                  : "unknown",
          state: getStateSnapshot(),
        });
        return;
      }
      debug("card:select", {
        productIndex: productIndex,
        state: getStateSnapshot(),
      });
      clearTimers();
      state.activeProductIndexInCategory = productIndex;
      state.hoveredCardIndex = null;
      state.pausedByHover = false;
      state.pausedByUser = false;
      renderAll();
      requestDetailTransition(true);
    }

    function bindEvents() {
      refs.categoryTabs.addEventListener("click", function (event) {
        const button = event.target.closest(".category-tab");
        if (!button) return;
        const index = Number(button.dataset.index);
        if (!getCategoryItems(index).length) return;
        jumpToTarget({
          categoryIndex: index,
          productIndex: 0,
        });
      });

      refs.matrixWall.addEventListener(
        "mouseenter",
        function (event) {
          const card = event.target.closest(".matrix-card");
          if (!card || card.classList.contains("is-empty")) return;
          var productIndex = Number(card.dataset.productIndex);
          if (state.view !== "grid" || productIndex === null || productIndex === undefined || state.transitioning) return;
          if (state.hoveredCardIndex === productIndex && state.pausedByHover) return;
          debug("card:hover", {
            productIndex: productIndex,
            state: getStateSnapshot(),
          });
          clearStepTimer();
          state.pausedByHover = true;
          state.hoveredCardIndex = productIndex;
          state.activeProductIndexInCategory = productIndex;
          renderAll();
        },
        true
      );

      refs.matrixWall.addEventListener(
        "mouseleave",
        function (event) {
          if (state.view !== "grid" || state.transitioning) return;
          if (!state.pausedByHover) return;
          debug("card:hover:end", getStateSnapshot());
          state.pausedByHover = false;
          state.hoveredCardIndex = null;
          renderAll();
          scheduleCurrentView();
        },
        true
      );

      refs.matrixWall.addEventListener("pointerup", function (event) {
        const card = event.target.closest(".matrix-card");
        if (!card || card.classList.contains("is-empty")) return;
        debug("card:pointerup", {
          productIndex: Number(card.dataset.productIndex),
          state: getStateSnapshot(),
        });
        handleCardSelect(Number(card.dataset.productIndex));
      });

      refs.matrixWall.addEventListener("click", function (event) {
        const card = event.target.closest(".matrix-card");
        if (!card || card.classList.contains("is-empty")) return;
        debug("card:click", {
          productIndex: Number(card.dataset.productIndex),
          state: getStateSnapshot(),
        });
        handleCardSelect(Number(card.dataset.productIndex));
      });

      refs.periodTabs.addEventListener("click", function (event) {
        const target = event.target.closest(".period-tab");
        if (!target) return;
        state.periodIndex = Number(target.dataset.index);
        renderDetail();
      });

      window.addEventListener("keydown", function (event) {
        if (event.code === "Space") {
          event.preventDefault();
          state.pausedByUser = !state.pausedByUser;
          renderStatus();
          if (!state.pausedByUser) {
            scheduleCurrentView();
          } else {
            clearTimers();
          }
        }

        if (event.code === "ArrowRight") {
          event.preventDefault();
          jumpToTarget(getNextPlaybackTarget(1));
        }

        if (event.code === "ArrowLeft") {
          event.preventDefault();
          jumpToTarget(getNextPlaybackTarget(-1));
        }
      });

      window.addEventListener("resize", function () {
        background.resize();
        if (chart) {
          chart.resize();
        }
      });
    }

    renderAll();
    bindEvents();
    scheduleCurrentView();
    debug("init:ready", getStateSnapshot());

    return {
      next: function () {
        jumpToTarget(getNextPlaybackTarget(1));
      },
      prev: function () {
        jumpToTarget(getNextPlaybackTarget(-1));
      },
      pause: function () {
        if (!state.pausedByUser) {
          state.pausedByUser = true;
          clearTimers();
          renderStatus();
        }
      },
      play: function () {
        if (state.pausedByUser) {
          state.pausedByUser = false;
          renderStatus();
          scheduleCurrentView();
        }
      },
      destroy: function () {
        clearTimers();
        background.destroy();
        if (chart) {
          chart.dispose();
        }
      },
    };
  }

  window.initStrategyShow = initStrategyShow;

  // 初始化
  function asyncInit() {
    try {
      initStrategyShow();
    } catch (error) {
      console.error('策略展示初始化失败:', error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      asyncInit();
    });
  } else {
    asyncInit();
  }
})();
