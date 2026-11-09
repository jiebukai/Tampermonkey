// ==UserScript==
// @name         浪潮云 CSS 工单自动转派
// @namespace    https://css.cloud.inspur.com/
// @version      1.4.0
// @description  勾选工单后，按规则表自动匹配处理人员，一键完成批量转派
// @author       jiebukai
// @match        https://css.cloud.inspur.com/platform/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/jiebukai/Tampermonkey/main/%E6%B5%AA%E6%BD%AE%E4%BA%91CSS%E5%B7%A5%E5%8D%95%E8%87%AA%E5%8A%A8%E8%BD%AC%E6%B4%BE.user.js
// @downloadURL  https://raw.githubusercontent.com/jiebukai/Tampermonkey/main/%E6%B5%AA%E6%BD%AE%E4%BA%91CSS%E5%B7%A5%E5%8D%95%E8%87%AA%E5%8A%A8%E8%BD%AC%E6%B4%BE.user.js
// ==/UserScript==

(function () {
  'use strict';

  // 防止重复注入（刷新页面或脚本被多次加载时只保留一个实例）
  if (window.__cssAutoTransferLoaded) return;
  window.__cssAutoTransferLoaded = true;

  /* ======================= 配置区（按需修改） ======================= */

  /**
   * 内置的云中心 → 主岗 / 备岗（账号），作为兜底表。
   * 主岗启用时转给主岗；在配置面板取消勾选后，该云中心的工单转给备岗。
   * 日常维护请用配置面板「数据源」导入外部表格（Excel 复制粘贴 / CSV），
   * 导入结果存在 localStorage，不会动这里的代码。
   */
  const BUILTIN_CENTERS = [
    { center: '北京大族云中心', primary: 'lixinyong', backup: 'huangchao01' },
    { center: '黑龙江省直云中心', primary: 'lixinyong', backup: 'huangchao01' },
    { center: '哈尔滨云中心', primary: 'lvbenke', backup: 'lishuangfeng' },
    { center: '佳木斯云中心', primary: 'huangchao01', backup: 'lixinyong' },
    { center: '牡丹江云中心', primary: 'lishuangfeng', backup: 'huangchao01' },
    { center: '齐齐哈尔云中心', primary: 'lishuangfeng', backup: 'huangchao01' },
    { center: '保定云中心', primary: 'lishuangfeng', backup: 'huangchao01' },
    { center: '石家庄云中心', primary: 'lishuangfeng', backup: 'lvbenke' },
    { center: '张家口云中心', primary: 'lishuangfeng', backup: 'lvbenke' },
    { center: '晋中云中心', primary: 'huangchao01', backup: 'lixinyong' },
    { center: '长治云中心', primary: 'lixinyong', backup: 'lvbenke' },
    { center: '临汾云中心', primary: 'lvbenke', backup: 'lixinyong' },
    { center: '运城云中心', primary: 'lixinyong', backup: 'lishuangfeng' },
    { center: '忻州云中心', primary: 'huangchao01', backup: 'lishuangfeng' },
    { center: '朔州云中心', primary: 'lishuangfeng', backup: 'lixinyong' },
    { center: '呼和浩特云中心', primary: 'lixinyong', backup: 'lishuangfeng' },
    { center: '乌海云中心', primary: 'lishuangfeng', backup: 'lixinyong' },
    { center: '泰州云中心', primary: 'lixinyong', backup: 'lvbenke' },
    { center: '吴中云中心', primary: 'huangchao01', backup: 'lvbenke' },
    { center: '安徽省直云中心', primary: 'lvbenke', backup: 'yulei08' },
    { center: '阜阳云中心', primary: 'lixinyong', backup: 'yulei08' },
    { center: '亳州云中心', primary: 'yulei08', backup: 'lixinyong' },
    { center: '宿州云中心', primary: 'lishuangfeng', backup: 'yulei08' },
    { center: '宣城云中心', primary: 'lixinyong', backup: 'lvbenke' },
    { center: '铜陵云中心', primary: 'yulei08', backup: 'lvbenke' },
    { center: '鹰潭云中心', primary: 'huangchao01', backup: 'yulei08' },
    { center: '抚州云中心', primary: 'yulei08', backup: 'huangchao01' },
    { center: '宜春云中心', primary: 'lvbenke', backup: 'yulei08' },
    { center: '南平云中心', primary: 'yulei08', backup: 'lishuangfeng' },
    { center: '厦门云中心', primary: 'lishuangfeng', backup: 'yulei08' },
    { center: '海南省直云中心', primary: 'yulei08', backup: 'lishuangfeng' },
    { center: '静安云中心', primary: 'lvbenke', backup: 'lishuangfeng' },
    { center: '四川省直云中心', primary: 'lvbenke', backup: 'yulei08' },
    { center: '成都云中心', primary: 'yulei08', backup: 'lvbenke' },
    { center: '绵阳云中心', primary: 'lvbenke', backup: 'huangchao01' },
    { center: '宜宾云中心', primary: 'lvbenke', backup: 'huangchao01' },
    { center: '巴中云中心', primary: 'yulei08', backup: 'huangchao01' },
    { center: '乐山云中心', primary: 'huangchao01', backup: 'lvbenke' },
    { center: '自贡云中心', primary: 'lvbenke', backup: 'huangchao01' },
    { center: '酒泉云中心', primary: 'huangchao01', backup: 'lishuangfeng' },
    { center: '乌鲁木齐云中心', primary: 'lishuangfeng', backup: 'lvbenke' },
    { center: '克拉玛依云中心', primary: 'yulei08', backup: 'lvbenke' },
    { center: '重庆云中心', primary: 'lishuangfeng', backup: 'yulei08' },
    { center: '昆明云中心', primary: 'huangchao01', backup: 'yulei08' },
    { center: '昆明呈贡云中心', primary: 'huangchao01', backup: 'yulei08' },
    { center: '西双版纳云中心', primary: 'yulei08', backup: 'huangchao01' },
    { center: '广西省直云中心', primary: 'lishuangfeng', backup: 'lixinyong' },
    { center: '河池云中心', primary: 'yulei08', backup: 'lishuangfeng' },
    { center: '防城港云中心', primary: 'lixinyong', backup: 'huangchao01' },
    { center: '长沙云中心', primary: 'lvbenke', backup: 'lishuangfeng' },
    { center: '孝感云中心', primary: 'lixinyong', backup: 'huangchao01' },
    { center: '黄冈云中心', primary: 'yulei08', backup: 'lixinyong' },
    { center: '武昌智算中心', primary: 'lixinyong', backup: 'yulei08' },
    { center: '郑州云中心', primary: 'lvbenke', backup: 'lixinyong' },
    { center: '焦作云中心', primary: 'lixinyong', backup: 'yulei08' },
    { center: '周口云中心', primary: 'lvbenke', backup: 'lixinyong' },
  ];

  /**
   * 运行时表：默认等于内置表，导入外部表格后整体替换。
   * 始终复用同一个数组（splice 改写），这样重建后所有引用依然有效。
   * backups 保留多个备岗（外部表格里「李新勇、于雷」这种写法），backup 是默认备岗。
   */
  const CENTERS = BUILTIN_CENTERS.map((c) => ({
    center: c.center,
    primary: c.primary,
    backup: c.backup,
    backups: [c.backup].filter(Boolean),
  }));

  /** 账号 → 姓名（配置页显示用） */
  const PEOPLE = {
    lixinyong: '李新勇',
    lvbenke: '吕本科',
    huangchao01: '黄超',
    lishuangfeng: '李双凤',
    yulei08: '于雷',
    tanglei01: '唐磊',
  };

  /** 显示成「姓名（账号）」，未知账号原样返回 */
  const displayName = (account) => (PEOPLE[account] ? `${PEOPLE[account]}（${account}）` : account);

  const CONFIG = {
    // 转派时填入「处理描述」的固定内容
    description: '请老师处理',

    // 由 CENTERS 自动生成：云中心 → 主岗（云中心按全等匹配）
    rules: CENTERS.map((c) => ({ match: { '云中心': c.center }, user: c.primary })),

    // 由 CENTERS 自动生成：云中心 → 备岗
    backups: CENTERS.map((c) => ({ center: c.center, user: c.backup })),

    // 有工单未命中规则时：'stop' 中止整批 / 'skip' 跳过未命中的
    onNoMatch: 'stop',
  };

  /** 按当前 CENTERS 重新生成 rules / backups（导入外部表格后必须调用） */
  function rebuildConfig() {
    CONFIG.rules = CENTERS.map((c) => ({ match: { '云中心': c.center }, user: c.primary }));
    CONFIG.backups = CENTERS.map((c) => ({ center: c.center, user: c.backup }));
  }

  /* ======================= 数据源（外部表格） ======================= */

  const CENTERS_KEY = 'css-auto-transfer-centers';
  let centerMeta = { source: 'builtin', savedAt: '' };
  let parsedTable = null;

  /** 姓名 → 账号 反查表 */
  const NAME_TO_ACCOUNT = Object.fromEntries(Object.entries(PEOPLE).map(([acc, name]) => [name, acc]));

  const ACCOUNT_RE = /^[A-Za-z][A-Za-z0-9._-]{1,39}$/;

  /** 去空白与占位符（-、/、无 之类的空单元格） */
  function blankCell(v) {
    const s = String(v == null ? '' : v).replace(/[\u3000\s]/g, '');
    return s === '' || s === '-' || s === '—' || s === '/' || s === '无' ? '' : s;
  }

  /** 单元格 → 账号；中文姓名自动换成账号，认不出来的返回 error */
  function cellToAccount(raw) {
    const v = blankCell(raw);
    if (!v) return { value: '' };
    if (PEOPLE[v]) return { value: v };            // 已经是账号
    if (NAME_TO_ACCOUNT[v]) return { value: NAME_TO_ACCOUNT[v], byName: true };
    if (ACCOUNT_RE.test(v)) return { value: v, unknown: true }; // 账号格式，但不在 PEOPLE 里
    return { value: '', error: v };
  }

  /** 备岗可写多人（、，/;| 分隔），全部保留，第一个作为默认备岗 */
  function cellToAccounts(raw) {
    const parts = String(raw == null ? '' : raw)
      .split(/[、,，;；/|]+/)
      .map((x) => blankCell(x))
      .filter(Boolean);
    const values = [];
    const errors = [];
    for (const p of parts) {
      const r = cellToAccount(p);
      if (r.error) errors.push(r.error);
      else if (r.value) values.push(r.value);
    }
    return { values, errors };
  }

  /** 解析一行分隔文本，支持双引号包裹与 "" 转义 */
  function splitDelimited(line, delim) {
    const cells = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i += 1; } else quoted = false;
        } else cur += ch;
      } else if (ch === '"' && cur.trim() === '') {
        quoted = true;
        cur = '';
      } else if (ch === delim) {
        cells.push(cur);
        cur = '';
      } else cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  }

  /** 从样例里猜分隔符：Excel 复制是制表符，CSV 是逗号 */
  function detectDelimiter(lines) {
    const sample = lines.slice(0, 5).join('\n');
    const count = (ch) => sample.split(ch).length - 1;
    const tab = count('\t');
    const comma = count(',');
    const semi = count(';');
    if (tab > 0 && tab >= comma && tab >= semi) return '\t';
    if (comma > 0 && comma >= semi) return ',';
    if (semi > 0) return ';';
    return '\t';
  }

  const COLUMN_ALIASES = {
    center: ['云中心', '云中心名称', '中心', '云中心名'],
    primary: ['主岗', '二线主岗', '主负责人', '负责人', '主岗账号'],
    backup: ['备岗', '二线备岗', '备岗负责人', '备份', '备'],
  };

  /** 表头判定用：单元格必须「整个等于」某个别名，避免把「甲云中心」这类数据行当成表头 */
  const HEADER_WORDS = [
    ...COLUMN_ALIASES.center,
    ...COLUMN_ALIASES.primary,
    ...COLUMN_ALIASES.backup,
  ];

  /** 表头 → 列号：先全等，再包含 */
  function findColumn(headers, key) {
    const aliases = COLUMN_ALIASES[key];
    const norm = headers.map((h) => String(h || '').replace(/[\u3000\s]/g, ''));
    let idx = norm.findIndex((h) => h && aliases.includes(h));
    if (idx >= 0) return idx;
    idx = norm.findIndex((h) => h && aliases.some((a) => h.includes(a)));
    return idx;
  }

  /**
   * 解析「云中心 / 主岗 / 备岗」表格。
   * 有表头按表头找列，没有表头按顺序取前三列。
   * 返回 { rows, errors, warnings, hasHeader }，errors 非空时不允许应用。
   */
  function parseCenterTable(text) {
    const result = { rows: [], errors: [], warnings: [], hasHeader: false };
    const clean = String(text || '').replace(/^\uFEFF/, '');
    const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (!lines.length) {
      result.errors.push('内容为空，请先粘贴表格或选择 CSV 文件');
      return result;
    }

    const delim = detectDelimiter(lines);
    let cellsAll = lines.map((l) => splitDelimited(l, delim));
    let colCenter = 0;
    let colPrimary = 1;
    let colBackup = 2;

    const headCells = cellsAll[0].map((c) => String(c || '').replace(/[\u3000\s]/g, ''));
    if (headCells.some((c) => HEADER_WORDS.includes(c))) {
      result.hasHeader = true;
      colCenter = findColumn(cellsAll[0], 'center');
      colPrimary = findColumn(cellsAll[0], 'primary');
      colBackup = findColumn(cellsAll[0], 'backup');
      if (colCenter < 0) {
        result.errors.push('表头里找不到「云中心」列');
        return result;
      }
      if (colPrimary < 0) result.warnings.push('表头里没有「主岗」列，所有行都会缺主岗');
      if (colBackup < 0) result.warnings.push('表头里没有「备岗」列，所有行都会缺备岗');
      cellsAll = cellsAll.slice(1);
    } else {
      result.warnings.push('未检测到表头，按「云中心 / 主岗 / 备岗」顺序解析前三列');
    }

    const seen = new Map();
    cellsAll.forEach((cells, i) => {
      const lineNo = i + (result.hasHeader ? 2 : 1);
      const center = blankCell(cells[colCenter]);
      if (!center) {
        if (cells.some((c) => blankCell(c))) result.warnings.push(`第 ${lineNo} 行缺少云中心，已跳过`);
        return;
      }

      const p = colPrimary >= 0 && colPrimary < cells.length ? cellToAccount(cells[colPrimary]) : { value: '' };
      const b = colBackup >= 0 && colBackup < cells.length ? cellToAccounts(cells[colBackup]) : { values: [], errors: [] };

      if (p.error) {
        result.errors.push(`第 ${lineNo} 行主岗「${p.error}」既不是已知姓名也不是账号格式`);
      }
      if (b.errors.length) {
        result.errors.push(`第 ${lineNo} 行备岗「${b.errors.join('、')}」既不是已知姓名也不是账号格式`);
      }
      if (p.error || b.errors.length) return;
      if (!p.value) result.warnings.push(`第 ${lineNo} 行「${center}」没有主岗，该云中心不会命中规则`);

      const row = { center, primary: p.value, backup: b.values[0] || '', backups: b.values.slice() };
      if (seen.has(center)) {
        result.warnings.push(`云中心「${center}」重复出现（第 ${lineNo} 行），以最后一次为准`);
        Object.assign(seen.get(center), row);
        return;
      }
      seen.set(center, row);
      result.rows.push(row);
    });

    if (!result.rows.length && !result.errors.length) result.errors.push('没有解析出任何有效行');
    return result;
  }

  /** 结构校验：丢弃残缺行、去重、统一成 {center, primary, backup, backups} */
  function normalizeCenterRows(list) {
    const out = [];
    const seen = new Set();
    for (const item of Array.isArray(list) ? list : []) {
      if (!item || typeof item !== 'object') continue;
      const center = String(item.center == null ? '' : item.center).trim();
      const primary = String(item.primary == null ? '' : item.primary).trim();
      if (!center || !primary || seen.has(center)) continue;
      seen.add(center);
      const backups = (Array.isArray(item.backups) ? item.backups : [item.backup])
        .map((x) => String(x == null ? '' : x).trim())
        .filter(Boolean);
      out.push({ center, primary, backup: backups[0] || '', backups });
    }
    return out;
  }

  /** 导出成 CSV（姓名优先，认不出的账号原样输出），带 BOM 方便 Excel 直接打开 */
  function centersToCsv(rows) {
    const label = (acc) => (PEOPLE[acc] ? PEOPLE[acc] : acc);
    const esc = (v) => {
      const s = String(v == null ? '' : v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = ['云中心,主岗,备岗'];
    for (const r of rows) {
      const backups = (r.backups && r.backups.length ? r.backups : [r.backup]).filter(Boolean);
      lines.push([esc(r.center), esc(label(r.primary)), esc(backups.map(label).join('、'))].join(','));
    }
    return `\uFEFF${lines.join('\r\n')}`;
  }

  function saveCenters() {
    try {
      localStorage.setItem(CENTERS_KEY, JSON.stringify({
        v: 1,
        savedAt: centerMeta.savedAt,
        source: centerMeta.source,
        rows: CENTERS,
      }));
    } catch (e) {
      toast('保存失败：浏览器存储不可用', true);
    }
  }

  function loadStoredCenters() {
    try {
      const raw = JSON.parse(localStorage.getItem(CENTERS_KEY) || 'null');
      if (!raw || !Array.isArray(raw.rows)) return;
      const rows = normalizeCenterRows(raw.rows);
      if (!rows.length) return;
      CENTERS.splice(0, CENTERS.length, ...rows);
      rebuildConfig();
      centerMeta = { source: 'imported', savedAt: String(raw.savedAt || '') };
    } catch (e) { /* 存储损坏时按内置表处理 */ }
  }

  loadStoredCenters();

  /** 读文件：优先 UTF-8，失败回退 GBK（Excel 中文版「另存为 CSV」默认是 GBK） */
  async function readTableFile(file) {
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      throw new Error('不支持直接读 Excel，请在 Excel 里「另存为 CSV UTF-8」，或直接复制单元格粘贴');
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return new TextDecoder('utf-8').decode(bytes.subarray(3));
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (e) {
      return new TextDecoder('gbk').decode(bytes);
    }
  }

  /* ============================ 工具函数 ============================ */

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  // 注意：不能只用 offsetParent 判断，弹窗是 position:fixed，offsetParent 为 null
  const isVisible = (el) => {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  async function waitFor(fn, timeout = 8000, interval = 200) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const v = fn();
        if (v) return v;
      } catch (e) { /* 忽略轮询期间的异常 */ }
      await sleep(interval);
    }
    return null;
  }

  function findButton(text, root = document) {
    return [...root.querySelectorAll('button')].find((b) => isVisible(b) && b.innerText.trim() === text) || null;
  }

  // ng-zorro 的下拉项只认完整鼠标事件序列，单纯 click() 不会触发选中
  function dispatchClick(el) {
    ['mousedown', 'mouseup', 'click'].forEach((type) => {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    });
  }

  /* ========================== 读取表格数据 ========================== */

  function getDataTable() {
    const tables = [...document.querySelectorAll('.ant-table')].filter(
      (t) => isVisible(t) && t.querySelector('tbody tr.ant-table-row .ant-checkbox-input')
    );
    return tables.length ? tables[tables.length - 1] : null;
  }

  function readRows(onlySelected = false) {
    const table = getDataTable();
    if (!table) return [];

    const ths = [...table.querySelectorAll('thead tr:last-child th')].map((th) => th.innerText.trim());
    const rows = [];

    [...table.querySelectorAll('tbody tr.ant-table-row')].forEach((tr) => {
      const cb = tr.querySelector('.ant-checkbox-input');
      if (onlySelected && (!cb || !cb.checked)) return;

      const tds = [...tr.querySelectorAll('td')];
      const data = {};
      tds.forEach((td, i) => {
        const key = ths[i];
        if (key) data[key] = td.innerText.trim();
      });
      data.__id = data['工单编号'] || data['工单标题'] || '未编号工单';
      data.__title = data['工单标题'] || '';
      data.__tr = tr;
      data.__cb = cb;
      rows.push(data);
    });

    return rows;
  }

  const readSelectedRows = () => readRows(true);

  /**
   * 只勾选指定编号的工单，其余取消勾选。
   * 批量转派只对「当前勾选」生效，所以分组转派前必须重设勾选。
   */
  async function reselect(ids) {
    // 列表可能在上一批转派后重建，先等目标工单出现在表格里
    await waitFor(() => {
      const rows = readRows(false);
      return rows.length && ids.some((id) => rows.some((r) => r.__id === id)) ? rows : null;
    }, 6000);

    const wanted = new Set(ids);
    const rows = readRows(false);

    for (const row of rows) {
      if (!row.__cb) continue;
      const should = wanted.has(row.__id);
      if (row.__cb.checked !== should) {
        row.__cb.click();
        await sleep(120);
      }
    }
    await sleep(300);

    const selected = readSelectedRows().map((r) => r.__id);
    const missing = ids.filter((id) => !selected.includes(id));
    if (missing.length) {
      throw new Error(`勾选失败，以下工单不在当前列表或无法勾选：${missing.join('、')}`);
    }
  }

  function matchUser(row) {
    for (const rule of CONFIG.rules) {
      if (!rule || !rule.user || !rule.match) continue;
      let hit = true;
      for (const [col, expect] of Object.entries(rule.match)) {
        const val = (row[col] == null ? '' : String(row[col])).trim();
        if (expect instanceof RegExp) {
          if (!expect.test(val)) { hit = false; break; }
        } else if (col === '云中心') {
          // 云中心名称存在包含关系（昆明云中心 / 昆明呈贡云中心），必须全等
          if (val !== String(expect)) { hit = false; break; }
        } else if (!val.includes(String(expect))) {
          hit = false; break;
        }
      }
      if (hit) return rule.user;
    }
    return null;
  }

  /* ========================= 主备岗状态 ========================= */

  const DISABLED_KEY = 'css-auto-transfer-disabled-users';

  let disabledUsers = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(DISABLED_KEY) || '[]');
    if (Array.isArray(saved)) disabledUsers = new Set(saved.filter((x) => typeof x === 'string'));
  } catch (e) { /* 存储损坏时按全部启用处理 */ }

  function saveDisabledUsers() {
    try {
      localStorage.setItem(DISABLED_KEY, JSON.stringify([...disabledUsers]));
    } catch (e) { /* 隐私模式等场景忽略 */ }
  }

  const OVERRIDES_KEY = 'css-auto-transfer-overrides';

  /** 手动指派：{ 云中心: 账号 }，优先级高于 CENTERS 表 */
  let overrides = {};
  try {
    const saved = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      overrides = Object.fromEntries(
        Object.entries(saved).filter(([, v]) => typeof v === 'string' && v)
      );
    }
  } catch (e) { /* 存储损坏时按无指派处理 */ }

  function saveOverrides() {
    try {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    } catch (e) { /* 隐私模式等场景忽略 */ }
  }

  /** 规则表里出现过的所有主岗人员及其负责的云中心列表（按首次出现顺序） */
  function primaryUsers() {
    const map = new Map();
    for (const rule of CONFIG.rules) {
      if (!rule || !rule.user) continue;
      const center = rule.match && typeof rule.match['云中心'] === 'string' ? rule.match['云中心'] : '';
      if (!map.has(rule.user)) map.set(rule.user, { user: rule.user, centers: [] });
      const entry = map.get(rule.user);
      if (center && !entry.centers.includes(center)) entry.centers.push(center);
    }
    return [...map.values()];
  }

  function findBackup(center) {
    const name = (center || '').trim();
    if (!name) return null;
    const hit = (CONFIG.backups || []).find((b) => b && b.center === name);
    return hit ? hit.user : null;
  }

  /**
   * 决定一张工单该转给谁。
   * 主岗启用 -> 主岗；主岗停用 -> 该云中心的备岗；都没有 -> null
   */
  function resolveTarget(row) {
    const center = (row['云中心'] || '').trim();
    const manual = center && overrides[center];
    if (manual) return { user: manual, manual: true };

    const primary = matchUser(row);
    if (!primary) return { user: null, reason: 'no-rule' };

    if (!disabledUsers.has(primary)) return { user: primary, primary, fallback: false };

    const backup = findBackup(row['云中心'] || '');
    if (!backup) return { user: null, reason: 'no-backup', primary };
    return { user: backup, primary, fallback: true };
  }

  /* ============================== UI ============================== */

  let host = null;
  let shadow = null;
  let fab = null;
  let confirmBox = null;
  let cfgBox = null;
  let toastEl = null;
  let running = false;

  function ensureUI() {
    if (host && document.documentElement.contains(host)) return;
    host = document.createElement('div');
    host.id = 'css-auto-transfer-host';
    host.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:2147483000;';
    document.documentElement.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
        #dock { display: flex; align-items: center; gap: 8px; }
        #cfg {
          padding: 10px 14px; border: 0; border-radius: 22px; background: #fff; color: #333;
          font-size: 14px; cursor: pointer; box-shadow: 0 4px 14px rgba(0, 0, 0, .18);
        }
        #cfg:hover { background: #f5f5f5; }
        #fab {
          display: none; padding: 10px 18px; border: 0; border-radius: 22px;
          background: #1677ff; color: #fff; font-size: 14px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(22, 119, 255, .35);
        }
        #fab:hover { background: #4096ff; }
        #fab[disabled] { background: #8fbcf7; cursor: not-allowed; }
        #mask, #cfgMask {
          position: fixed; inset: 0; background: rgba(0, 0, 0, .45);
          display: none; align-items: center; justify-content: center; z-index: 10;
        }
        #mask.show, #cfgMask.show { display: flex; }
        #dialog, #cfgDialog {
          width: 520px; max-height: 76vh; background: #fff; border-radius: 8px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 8px 30px rgba(0, 0, 0, .2);
        }
        #dialog h3, #cfgDialog h3 { margin: 0; padding: 16px 20px; font-size: 16px; border-bottom: 1px solid #f0f0f0; }
        #dialog .body, #cfgDialog .body { padding: 14px 20px; overflow: auto; font-size: 13px; color: #333; }
        #dialog .body table, #cfgDialog .body table { width: 100%; border-collapse: collapse; }
        #dialog .body th, #dialog .body td,
        #cfgDialog .body th, #cfgDialog .body td {
          text-align: left; padding: 6px 8px; border-bottom: 1px solid #f5f5f5; vertical-align: top;
        }
        #dialog .body th, #cfgDialog .body th { color: #888; font-weight: 400; white-space: nowrap; }
        #dialog .warn, #cfgDialog .warn { color: #d4380d; }
        #dialog .actions, #cfgDialog .actions { padding: 12px 20px; border-top: 1px solid #f0f0f0; text-align: right; }
        #dialog .actions button, #cfgDialog .actions button {
          padding: 6px 16px; margin-left: 8px; border-radius: 4px; font-size: 14px; cursor: pointer;
          border: 1px solid #d9d9d9; background: #fff; color: #333;
        }
        #dialog .actions button.primary, #cfgDialog .actions button.primary { background: #1677ff; border-color: #1677ff; color: #fff; }
        #dialog .actions button[disabled] { opacity: .5; cursor: not-allowed; }
        .cfg-row {
          display: flex; align-items: center; gap: 10px; padding: 10px 4px;
          border-bottom: 1px solid #f5f5f5; cursor: pointer;
        }
        .cfg-row input { width: 16px; height: 16px; cursor: pointer; }
        .cfg-row .u { font-weight: 600; min-width: 96px; }
        .cfg-row .meta { color: #888; font-size: 12px; }
        .cfg-row.off .u { color: #bbb; text-decoration: line-through; }
        #cfgDialog .tabs { display: flex; gap: 4px; padding: 8px 20px 0; border-bottom: 1px solid #f0f0f0; }
        #cfgDialog .tab {
          padding: 8px 14px; border: 0; background: transparent; cursor: pointer; font-size: 14px;
          color: #888; border-bottom: 2px solid transparent; margin-bottom: -1px;
        }
        #cfgDialog .tab.active { color: #1677ff; border-bottom-color: #1677ff; }
        .center-row { display: flex; align-items: center; gap: 8px; padding: 8px 4px; border-bottom: 1px solid #f5f5f5; }
        .center-row .c { flex: 1; font-size: 13px; }
        .center-row select { max-width: 210px; padding: 4px 6px; font-size: 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; }
        .center-row.manual .c { color: #1677ff; font-weight: 600; }
        #cfgCenterSearch {
          flex: 1; min-width: 160px; padding: 6px 10px; border: 1px solid #d9d9d9;
          border-radius: 4px; font-size: 13px; outline: none;
        }
        #cfgCenterSearch:focus { border-color: #1677ff; }
        .count { color: #888; font-size: 12px; white-space: nowrap; }
        mark { background: #ffe58f; color: inherit; padding: 0; }
        .center-empty { color: #888; font-size: 13px; padding: 12px 4px; }
        .hint { color: #888; margin: 0 0 10px; font-size: 12px; line-height: 1.6; }
        .data-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0; }
        .data-bar button {
          padding: 5px 12px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px;
          font-size: 13px; cursor: pointer; color: #333;
        }
        .data-bar button:hover { border-color: #1677ff; color: #1677ff; }
        .data-bar input[type="file"] { font-size: 12px; max-width: 100%; }
        #cfgText {
          width: 100%; height: 108px; box-sizing: border-box; padding: 8px;
          border: 1px solid #d9d9d9; border-radius: 4px; font-size: 12px; line-height: 1.6;
          font-family: Consolas, Menlo, monospace; resize: vertical;
        }
        .preview { font-size: 12px; color: #333; margin: 6px 0 4px; }
        .preview .ok { color: #389e0d; margin: 0 0 6px; }
        .preview .warn { color: #d4380d; margin: 0 0 6px; }
        .preview ul { margin: 0 0 6px; padding-left: 18px; color: #d46b08; line-height: 1.7; }
        .preview ul.warn { color: #d4380d; }
        .preview table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        #toast {
          position: fixed; left: 50%; bottom: 96px; transform: translateX(-50%);
          max-width: 70vw; padding: 10px 16px; border-radius: 6px; font-size: 13px;
          background: rgba(0, 0, 0, .78); color: #fff; display: none; white-space: pre-wrap;
        }
        #toast.show { display: block; }
        #toast.err { background: #d4380d; }
      </style>
      <div id="dock">
        <button id="cfg" title="主备岗配置">⚙ 配置</button>
        <button id="fab">自动转派</button>
      </div>
      <div id="mask">
        <div id="dialog">
          <h3>确认自动转派</h3>
          <div class="body"></div>
          <div class="actions">
            <button id="cancel">取消</button>
            <button id="ok" class="primary">确认执行</button>
          </div>
        </div>
      </div>
      <div id="cfgMask">
        <div id="cfgDialog">
          <h3>配置</h3>
          <div class="tabs">
            <button class="tab active" data-tab="people">人员开关</button>
            <button class="tab" data-tab="centers">云中心指派</button>
            <button class="tab" data-tab="data">数据源</button>
          </div>
          <div class="body">
            <div id="tabPeople">
              <p class="hint">取消勾选即停用该主岗，其负责的工单会转给对应云中心的备岗。</p>
              <div id="cfgList"></div>
            </div>
            <div id="tabCenters" hidden>
              <p class="hint">手动指定某云中心的处理人，优先级高于表格里的主/备岗。</p>
              <div class="data-bar">
                <input type="search" id="cfgCenterSearch" placeholder="搜索云中心 / 负责人姓名或账号…" spellcheck="false">
                <span id="cfgCenterCount" class="count"></span>
              </div>
              <div id="cfgCenters"></div>
            </div>
            <div id="tabData" hidden>
              <p class="hint">
                维护云中心负责人：在 Excel 里选中「云中心 / 主岗 / 备岗」三列直接复制粘贴到下面，
                或选择 CSV/TSV 文件。填姓名或账号都行（姓名自动换成账号）；备岗可写多个，用「、」分隔，取第一个作默认。
              </p>
              <div class="data-bar">
                <input type="file" id="cfgFile" accept=".csv,.tsv,.txt">
                <button id="cfgParse">解析预览</button>
                <button id="cfgClearText">清空</button>
              </div>
              <textarea id="cfgText" spellcheck="false" placeholder="云中心&#9;主岗&#9;备岗&#10;北京大族云中心&#9;李新勇&#9;黄超"></textarea>
              <div id="cfgPreview" class="preview"></div>
              <div class="data-bar">
                <button id="cfgApplyReplace">替换全部</button>
                <button id="cfgApplyMerge">合并到当前</button>
                <button id="cfgExport">导出当前表</button>
                <button id="cfgReset">恢复内置</button>
              </div>
              <p class="hint" id="cfgSource"></p>
            </div>
          </div>
          <div class="actions">
            <button id="cfgClose" class="primary">关闭</button>
          </div>
        </div>
      </div>
      <div id="toast"></div>
    `;
    fab = shadow.getElementById('fab');
    confirmBox = shadow.getElementById('mask');
    cfgBox = shadow.getElementById('cfgMask');
    toastEl = shadow.getElementById('toast');

    fab.addEventListener('click', onRun);
    shadow.getElementById('cfg').addEventListener('click', openConfig);
    shadow.getElementById('cfgClose').addEventListener('click', () => cfgBox.classList.remove('show'));
    shadow.querySelectorAll('#cfgDialog .tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    bindCentersTab();
    bindDataTab();
    shadow.getElementById('cancel').addEventListener('click', () => closeConfirm(false));
    shadow.getElementById('ok').addEventListener('click', () => closeConfirm(true));
  }

  let confirmResolve = null;

  function openConfirm(html, opts = {}) {
    ensureUI();
    const { okText = '确认执行', showOk = true, cancelText = '取消' } = opts;
    shadow.querySelector('#dialog .body').innerHTML = html;
    const okBtn = shadow.getElementById('ok');
    okBtn.textContent = okText;
    okBtn.style.display = showOk ? '' : 'none';
    shadow.getElementById('cancel').textContent = cancelText;
    confirmBox.classList.add('show');
    return new Promise((resolve) => { confirmResolve = resolve; });
  }

  function closeConfirm(value) {
    confirmBox.classList.remove('show');
    if (confirmResolve) { confirmResolve(value); confirmResolve = null; }
  }

  function openConfig() {
    ensureUI();
    switchTab('people');
    cfgBox.classList.add('show');
  }

  function switchTab(name) {
    shadow.querySelectorAll('#cfgDialog .tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === name);
    });
    shadow.getElementById('tabPeople').hidden = name !== 'people';
    shadow.getElementById('tabCenters').hidden = name !== 'centers';
    shadow.getElementById('tabData').hidden = name !== 'data';
    // 每次切页重新渲染，保证导入表格后人员开关 / 指派列表立刻同步
    if (name === 'people') renderPeople();
    else if (name === 'centers') renderCenters();
    else if (name === 'data') renderData();
  }

  function renderPeople() {
    const list = shadow.getElementById('cfgList');
    const users = primaryUsers();

    if (!users.length) {
      list.innerHTML = '<p class="hint">规则表里还没有配置任何人员。</p>';
      return;
    }

    list.innerHTML = users.map(({ user, centers }) => {
      const enabled = !disabledUsers.has(user);
      const meta = centers.length
        ? `负责 ${centers.length} 个云中心 · 停用后按云中心转给各自备岗`
        : '未限定云中心';
      return `
        <label class="cfg-row ${enabled ? '' : 'off'}" data-user="${escapeHtml(user)}">
          <input type="checkbox" ${enabled ? 'checked' : ''}>
          <span class="u">${escapeHtml(displayName(user))}</span>
          <span class="meta">${escapeHtml(meta)}</span>
        </label>`;
    }).join('');

    list.querySelectorAll('.cfg-row').forEach((row) => {
      const cb = row.querySelector('input');
      cb.addEventListener('change', () => {
        const user = row.dataset.user;
        if (cb.checked) disabledUsers.delete(user);
        else disabledUsers.add(user);
        saveDisabledUsers();
        row.classList.toggle('off', !cb.checked);
        updateFab();

        const entry = users.find((u) => u.user === user) || { centers: [] };
        if (cb.checked) {
          toast(`${displayName(user)} 已启用`);
        } else if (!entry.centers.length) {
          toast(`${displayName(user)} 已停用`);
        } else {
          const noBackup = entry.centers.filter((c) => !findBackup(c));
          if (noBackup.length) {
            toast(`${displayName(user)} 已停用；${noBackup.length} 个云中心没有备岗，相关工单会在执行前被拦下`, true);
          } else {
            toast(`${displayName(user)} 已停用，其 ${entry.centers.length} 个云中心的工单将转给各自备岗`);
          }
        }
      });
    });
  }

  /**
   * 关键词是否命中：云中心名、主岗/备岗的账号或姓名。
   * 这样既能搜「济南」，也能搜「黄超」找他负责的所有云中心。
   */
  function centerMatches(item, kw) {
    if (!kw) return true;
    const people = [item.primary, item.backup, ...(item.backups || [])].filter(Boolean);
    const hay = [item.center, ...people, ...people.map((acc) => displayName(acc))].join(' ').toLowerCase();
    return hay.includes(kw);
  }

  /** 把命中的片段包成 <mark> 高亮；kw 需已转小写 */
  function highlightMatch(text, kw) {
    const s = String(text == null ? '' : text);
    if (!kw) return escapeHtml(s);
    const lower = s.toLowerCase();
    const out = [];
    let i = 0;
    while (i <= s.length) {
      const at = lower.indexOf(kw, i);
      if (at < 0 || !kw) { out.push(escapeHtml(s.slice(i))); break; }
      out.push(escapeHtml(s.slice(i, at)));
      out.push(`<mark>${escapeHtml(s.slice(at, at + kw.length))}</mark>`);
      i = at + kw.length;
    }
    return out.join('');
  }

  function bindCentersTab() {
    const input = shadow.getElementById('cfgCenterSearch');
    if (!input) return;
    input.addEventListener('input', renderCenters);
    // 点输入框右侧的 ✕ 清空时只触发 search 事件
    input.addEventListener('search', renderCenters);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && input.value) {
        input.value = '';
        renderCenters();
      }
    });
  }

  function renderCenters() {
    const list = shadow.getElementById('cfgCenters');
    const countEl = shadow.getElementById('cfgCenterCount');
    const input = shadow.getElementById('cfgCenterSearch');
    const kw = String(input ? input.value : '').trim().toLowerCase();

    const accounts = [...new Set([
      ...Object.keys(PEOPLE),
      ...CENTERS.flatMap((c) => [c.primary, c.backup, ...(c.backups || [])]),
    ])];

    const shown = CENTERS.filter((c) => centerMatches(c, kw));

    if (countEl) {
      countEl.textContent = kw
        ? `匹配 ${shown.length} / ${CENTERS.length}`
        : `共 ${CENTERS.length} 个`;
    }

    if (!shown.length) {
      list.innerHTML = `<p class="center-empty">没有匹配「${escapeHtml(kw)}」的云中心</p>`;
      return;
    }

    list.innerHTML = shown.map((c) => {
      const current = overrides[c.center] || '';
      const options = accounts.map((acc) =>
        `<option value="${escapeHtml(acc)}" ${current === acc ? 'selected' : ''}>${escapeHtml(displayName(acc))}</option>`
      ).join('');
      return `
        <div class="center-row ${current ? 'manual' : ''}" data-center="${escapeHtml(c.center)}">
          <span class="c">${highlightMatch(c.center, kw)}</span>
          <select>
            <option value="">跟随规则（${escapeHtml(displayName(c.primary))}）</option>
            ${options}
          </select>
        </div>`;
    }).join('');

    list.querySelectorAll('.center-row').forEach((row) => {
      const center = row.dataset.center;
      const sel = row.querySelector('select');
      sel.addEventListener('change', () => {
        if (sel.value) overrides[center] = sel.value;
        else delete overrides[center];
        saveOverrides();
        row.classList.toggle('manual', !!sel.value);
        toast(sel.value
          ? `${center} 已手动指派给 ${displayName(sel.value)}`
          : `${center} 已恢复按规则转派`);
      });
    });
  }

  /* ---------------------------- 数据源 tab ---------------------------- */

  function renderData() {
    const src = shadow.getElementById('cfgSource');
    if (src) {
      src.textContent = centerMeta.source === 'imported'
        ? `当前使用导入表：${CENTERS.length} 个云中心，导入时间 ${centerMeta.savedAt ? new Date(centerMeta.savedAt).toLocaleString() : '未知'}`
        : `当前使用脚本内置表：${CENTERS.length} 个云中心`;
    }
    previewEl().innerHTML = parsedTable ? previewHtml(parsedTable) : '';
  }

  function previewEl() {
    return shadow.getElementById('cfgPreview');
  }

  function previewHtml(r) {
    const errs = r.errors.slice(0, 8).map((e) => `<li>${escapeHtml(e)}</li>`).join('');
    const warns = r.warnings.slice(0, 6).map((w) => `<li>${escapeHtml(w)}</li>`).join('');
    const rows = r.rows.slice(0, 8).map((x) => {
      const backups = (x.backups || []).map((a) => displayName(a)).join('、');
      return `<tr><td>${escapeHtml(x.center)}</td><td>${escapeHtml(displayName(x.primary || ''))}</td><td>${escapeHtml(backups || '—')}</td></tr>`;
    }).join('');
    const headline = r.errors.length
      ? `<p class="warn">解析到 ${r.rows.length} 个云中心，但有 ${r.errors.length} 处错误，修正后才能应用</p>`
      : `<p class="ok">解析到 ${r.rows.length} 个云中心，可以应用</p>`;
    return `${headline}
      ${errs ? `<ul class="warn">${errs}</ul>` : ''}
      ${warns ? `<ul>${warns}</ul>` : ''}
      ${rows ? `<table><thead><tr><th>云中心</th><th>主岗</th><th>备岗</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
      ${r.rows.length > 8 ? `<p class="hint">仅显示前 8 行，共 ${r.rows.length} 行</p>` : ''}`;
  }

  function bindDataTab() {
    const ta = shadow.getElementById('cfgText');
    const file = shadow.getElementById('cfgFile');

    const runParse = () => {
      parsedTable = parseCenterTable(ta.value);
      previewEl().innerHTML = previewHtml(parsedTable);
      return parsedTable;
    };

    shadow.getElementById('cfgParse').addEventListener('click', runParse);
    shadow.getElementById('cfgClearText').addEventListener('click', () => {
      ta.value = '';
      parsedTable = null;
      previewEl().innerHTML = '';
    });
    shadow.getElementById('cfgApplyReplace').addEventListener('click', () => applyParsed('replace'));
    shadow.getElementById('cfgApplyMerge').addEventListener('click', () => applyParsed('merge'));
    shadow.getElementById('cfgExport').addEventListener('click', exportCenters);
    shadow.getElementById('cfgReset').addEventListener('click', resetCenters);

    file.addEventListener('change', async () => {
      const f = file.files && file.files[0];
      file.value = '';
      if (!f) return;
      try {
        ta.value = await readTableFile(f);
        runParse();
        toast(`已读取 ${f.name}`);
      } catch (e) {
        toast(`读取失败：${e.message}`, true);
      }
    });
  }

  function applyParsed(mode) {
    if (!parsedTable) { toast('请先点「解析预览」', true); return; }
    if (parsedTable.errors.length) { toast('表格有错误，请按提示修正后再应用', true); return; }
    const incoming = normalizeCenterRows(parsedTable.rows);
    if (!incoming.length) { toast('没有可应用的数据', true); return; }

    let rows = incoming;
    if (mode === 'merge') {
      const map = new Map(CENTERS.map((c) => [c.center, c]));
      incoming.forEach((r) => map.set(r.center, r));
      rows = [...map.values()];
    }
    CENTERS.splice(0, CENTERS.length, ...normalizeCenterRows(rows));
    rebuildConfig();
    centerMeta = { source: 'imported', savedAt: new Date().toISOString() };
    saveCenters();
    renderData();
    updateFab();
    toast(`已应用 ${CENTERS.length} 个云中心（${mode === 'merge' ? '合并' : '替换'}），刷新页面后依然有效`);
  }

  function resetCenters() {
    const builtin = BUILTIN_CENTERS.map((c) => ({
      center: c.center,
      primary: c.primary,
      backup: c.backup,
      backups: [c.backup].filter(Boolean),
    }));
    CENTERS.splice(0, CENTERS.length, ...builtin);
    rebuildConfig();
    centerMeta = { source: 'builtin', savedAt: '' };
    try { localStorage.removeItem(CENTERS_KEY); } catch (e) { /* 隐私模式等场景忽略 */ }
    parsedTable = null;
    const ta = shadow.getElementById('cfgText');
    if (ta) ta.value = '';
    previewEl().innerHTML = '';
    renderData();
    updateFab();
    toast(`已恢复内置的 ${builtin.length} 个云中心`);
  }

  function exportCenters() {
    const blob = new Blob([centersToCsv(CENTERS)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '云中心负责人.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast('已导出当前表，可用 Excel 打开编辑后再导入');
  }

  function toast(msg, isError = false) {
    ensureUI();
    toastEl.textContent = msg;
    toastEl.className = 'show' + (isError ? ' err' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toastEl.className = ''; }, 5000);
  }

  /* ============================ 页面操作 ============================ */

  async function pickUser(drawer, account) {
    const selectRoot = drawer.querySelector('nz-select[name="dealSkillsetUser"]');
    if (!selectRoot) throw new Error('未找到「处理人员」选择框');

    // 若已有选中值，先清空，避免残留
    const clearBtn = selectRoot.querySelector('.ant-select-selection__clear');
    if (clearBtn) dispatchClick(clearBtn);

    const selection = selectRoot.querySelector('.ant-select-selection');
    dispatchClick(selection);

    const input = await waitFor(
      () => selectRoot.querySelector('input.ant-select-search__field'),
      3000
    );
    if (!input) throw new Error('人员搜索框未出现');

    input.focus();
    input.value = account;
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true, data: account, inputType: 'insertText',
    }));

    // 搜索是异步过滤，必须等列表真正收敛到少量结果，避免点到完整列表里的旧节点
    const option = await waitFor(() => {
      const dropdowns = [...document.querySelectorAll('.ant-select-dropdown')]
        .filter((d) => isVisible(d));
      const dd = dropdowns[dropdowns.length - 1];
      if (!dd) return null;
      const items = [...dd.querySelectorAll('li')].filter(isVisible);
      const matched = items.filter((li) => li.innerText.includes(`[${account}]`));
      if (matched.length !== 1) return null;
      // 过滤完成时列表通常只剩 1~3 条
      return items.length <= 3 ? matched[0] : null;
    }, 8000);

    if (!option) throw new Error(`人员下拉中没有找到账号 ${account}`);

    option.scrollIntoView({ block: 'nearest' });
    await sleep(200);
    dispatchClick(option);
    await sleep(800);

    const chosen = selectRoot.querySelector('.ant-select-selection-selected-value');
    if (!chosen || !chosen.innerText.includes(account)) {
      throw new Error(`人员 ${account} 未选中`);
    }
  }

  async function fillDescription(drawer, text) {
    const editor = drawer.querySelector('.ql-container .ql-editor');
    if (!editor) throw new Error('未找到「处理描述」编辑器');

    editor.innerHTML = String(text)
      .split('\n')
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join('');

    // Quill 通过 MutationObserver 异步同步到表单模型
    await sleep(500);
  }

  async function waitTransferResult() {
    const start = Date.now();
    while (Date.now() - start < 15000) {
      await sleep(300);

      const errNode = [...document.querySelectorAll('.ant-message-error, .ant-notification-notice-error')]
        .find(isVisible);
      if (errNode) return { ok: false, msg: errNode.innerText.trim() };

      const drawer = document.querySelector('.ant-drawer-open app-workorder-batch-transfer');
      if (!drawer) return { ok: true, msg: '' };
    }
    return { ok: false, msg: '等待结果超时，请到工单列表确认是否转派成功' };
  }

  async function doTransfer(user, description) {
    const openBtn = findButton('批量转派');
    if (!openBtn) throw new Error('未找到「批量转派」按钮，请确认已勾选工单');

    dispatchClick(openBtn);

    const confirmBtn = await waitFor(() => {
      const modal = [...document.querySelectorAll('.ant-modal-wrap')]
        .find((w) => isVisible(w) && /批量转派/.test(w.innerText));
      return modal ? [...modal.querySelectorAll('button')]
        .find((b) => b.innerText.trim() === '确认') : null;
    }, 5000);
    if (!confirmBtn) throw new Error('未出现「是否确认批量转派」弹窗');
    dispatchClick(confirmBtn);

    const drawer = await waitFor(
      () => document.querySelector('.ant-drawer-open app-workorder-batch-transfer'),
      8000
    );
    if (!drawer) throw new Error('转派表单未打开');

    await pickUser(drawer, user);
    await fillDescription(drawer, description);

    const saveBtn = drawer.querySelector('.submit-btn');
    if (!saveBtn) throw new Error('未找到「保存」按钮');
    if (saveBtn.disabled) throw new Error('表单校验未通过，「保存」按钮不可用');

    dispatchClick(saveBtn);
    const result = await waitTransferResult();
    if (!result.ok) throw new Error(result.msg || '转派失败');
  }

  /* ============================ 主流程 ============================ */

  async function onRun() {
    if (running) return;

    const rows = readSelectedRows();
    if (!rows.length) {
      toast('请先勾选要转派的工单', true);
      return;
    }

    const plan = [];
    const missing = [];
    for (const row of rows) {
      const target = resolveTarget(row);
      if (target.user) {
        plan.push({ row, user: target.user, fallback: !!target.fallback, primary: target.primary, manual: !!target.manual });
      } else {
        missing.push({ row, reason: target.reason, primary: target.primary });
      }
    }

    if (missing.length) {
      const list = missing.map((m) => {
        const head = `${escapeHtml(m.row.__id)} ${escapeHtml(m.row.__title)}`;
        if (m.reason === 'no-backup') {
          return `<li>${head} —— 主岗 ${escapeHtml(m.primary)} 已停用，但云中心「${escapeHtml(m.row['云中心'] || '未知')}」没有配置备岗</li>`;
        }
        return `<li>${head} —— 未命中任何规则</li>`;
      }).join('');
      const html = `
        <p class="warn">以下 ${missing.length} 张工单无法确定处理人员：</p>
        <ul>${list}</ul>
        <p>请在脚本配置区的 rules / backups 中补充后再试。</p>
      `;
      await openConfirm(html, { showOk: false, cancelText: '知道了' });
      return;
    }

    // 按人员分组：系统的批量转派一次只能指定一个人，所以不同人员要分批执行
    const groups = new Map();
    for (const p of plan) {
      if (!groups.has(p.user)) groups.set(p.user, []);
      groups.get(p.user).push(p);
    }
    const desc = CONFIG.description;

    const rowsHtml = plan.map((p) => `
      <tr>
        <td>${escapeHtml(p.row.__id)}</td>
        <td>${escapeHtml(p.row.__title)}</td>
        <td>${escapeHtml(displayName(p.user))}${p.manual ? '（手动指派）' : p.fallback ? '（备岗）' : ''}</td>
      </tr>
    `).join('');

    const groupSummary = [...groups.entries()]
      .map(([user, items]) => `<li>${escapeHtml(displayName(user))}：${items.length} 张</li>`)
      .join('');

    const html = `
      <p>共 <b>${plan.length}</b> 张工单，按人员分 <b>${groups.size}</b> 批转派：</p>
      <ul>${groupSummary}</ul>
      <table>
        <thead><tr><th>工单编号</th><th>工单标题</th><th>处理人员</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p style="margin-top:12px;color:#888">处理描述：${escapeHtml(desc)}</p>
    `;

    const ok = await openConfirm(html);
    if (!ok) return;

    running = true;
    fab.disabled = true;

    const done = [];
    const failed = [];

    try {
      let index = 0;
      for (const [user, items] of groups) {
        index += 1;
        fab.textContent = `转派中 ${index}/${groups.size}：${user}`;

        try {
          // 每次执行前按当前表格重新勾选，避免列表刷新后行元素失效
          await reselect(items.map((p) => p.row.__id));
          await doTransfer(user, desc);
          done.push({ user, items });
          // 等列表刷新稳定后再处理下一组
          await sleep(1200);
        } catch (e) {
          failed.push({ user, items, message: e.message });
          break;
        }
      }
    } finally {
      running = false;
      fab.disabled = false;
      updateFab();
    }

    if (failed.length) {
      const f = failed[0];
      const left = groups.size - done.length;
      toast(
        `已转派 ${done.reduce((n, d) => n + d.items.length, 0)} 张；` +
        `转给 ${f.user} 时失败：${f.message}` +
        (left > 1 ? `（还有 ${left - 1} 批未执行）` : ''),
        true
      );
      return;
    }

    const total = done.reduce((n, d) => n + d.items.length, 0);
    toast(`已成功转派 ${total} 张工单（${groups.size} 批）`);
  }

  /* =========================== 按钮联动 =========================== */

  function updateFab() {
    ensureUI();
    if (running) return;
    const n = readSelectedRows().length;
    fab.style.display = n ? 'inline-block' : 'none';
    fab.textContent = `自动转派 (${n})`;
  }

  let updateTimer = null;
  function scheduleUpdate() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(updateFab, 200);
  }

  function init() {
    ensureUI();
    updateFab();
    document.addEventListener('change', scheduleUpdate, true);
    document.addEventListener('click', scheduleUpdate, true);
    new MutationObserver(scheduleUpdate).observe(document.body, { childList: true, subtree: true });
    setInterval(scheduleUpdate, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
