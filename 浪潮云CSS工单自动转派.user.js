// ==UserScript==
// @name         浪潮云 CSS 工单自动转派
// @namespace    https://css.cloud.inspur.com/
// @version      1.2.0
// @description  勾选工单后，按规则表自动匹配处理人员，一键完成批量转派
// @author       jiebukai
// @match        https://css.cloud.inspur.com/platform/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // 防止重复注入（刷新页面或脚本被多次加载时只保留一个实例）
  if (window.__cssAutoTransferLoaded) return;
  window.__cssAutoTransferLoaded = true;

  /* ======================= 配置区（按需修改） ======================= */

  /**
   * 云中心 → 主岗 / 备岗（账号）。
   * 主岗启用时转给主岗；在配置面板取消勾选后，该云中心的工单转给备岗。
   * 新增云中心只需在这里加一行。
   */
  const CENTERS = [
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
        .hint { color: #888; margin: 0 0 10px; font-size: 12px; line-height: 1.6; }
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
          <h3>主备岗配置</h3>
          <div class="body">
            <p class="hint">取消勾选即停用该主岗，其负责的工单会转给对应云中心的备岗。开关状态保存在本浏览器。</p>
            <div id="cfgList"></div>
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
    renderConfig();
    cfgBox.classList.add('show');
  }

  function renderConfig() {
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
          <span class="u">${escapeHtml(user)}</span>
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
          toast(`${user} 已启用`);
        } else if (!entry.centers.length) {
          toast(`${user} 已停用`, false);
        } else {
          const noBackup = entry.centers.filter((c) => !findBackup(c));
          if (noBackup.length) {
            toast(`${user} 已停用；${noBackup.length} 个云中心没有备岗，相关工单会在执行前被拦下`, true);
          } else {
            toast(`${user} 已停用，其 ${entry.centers.length} 个云中心的工单将转给各自备岗`);
          }
        }
      });
    });
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
        plan.push({ row, user: target.user, fallback: !!target.fallback, primary: target.primary });
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
        <td>${escapeHtml(p.user)}${p.fallback ? '（备岗）' : ''}</td>
      </tr>
    `).join('');

    const groupSummary = [...groups.entries()]
      .map(([user, items]) => `<li>${escapeHtml(user)}：${items.length} 张</li>`)
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
