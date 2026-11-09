// ==UserScript==
// @name         浪潮云 CSS 工单详情转派
// @namespace    https://css.cloud.inspur.com/
// @version      1.2.0
// @description  工单详情页一键转派：自动点「转派」、选处理人员、填「请老师处理」并保存
// @author       jiebukai
// @match        https://css.cloud.inspur.com/platform/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/jiebukai/Tampermonkey/main/%E6%B5%AA%E6%BD%AE%E4%BA%91CSS%E5%B7%A5%E5%8D%95%E8%AF%A6%E6%83%85%E8%BD%AC%E6%B4%BE.user.js
// @downloadURL  https://raw.githubusercontent.com/jiebukai/Tampermonkey/main/%E6%B5%AA%E6%BD%AE%E4%BA%91CSS%E5%B7%A5%E5%8D%95%E8%AF%A6%E6%83%85%E8%BD%AC%E6%B4%BE.user.js
// ==/UserScript==

(function () {
  'use strict';

  /* ============================== 配置 ============================== */

  /** 可选的处理人员：面板上点谁就转给谁 */
  const PEOPLE = [
    { account: 'yinhang01', name: '尹航' },
    { account: 'malei07', name: '马磊' },
    { account: 'xieruijie', name: '解瑞杰' },
    { account: 'yujingming', name: '庾景铭' },
    { account: 'liuqingkai01', name: '刘庆凯' },
    { account: 'zhengpengke', name: '郑鹏科' },
  ];

  const DEFAULT_DESC = '请老师处理';
  const KEY_USER = 'css-detail-transfer-user';
  const KEY_DESC = 'css-detail-transfer-desc';
  const KEY_DRY = 'css-detail-transfer-dry';
  const KEY_CLAIM = 'css-detail-transfer-claim';

  const state = {
    running: false,
    steps: [],
    dry: localStorage.getItem(KEY_DRY) === '1',
    // 转派前必须先回答「是否认领工单」，这里记住用户的默认选择
    claim: localStorage.getItem(KEY_CLAIM) !== '0',
    user: localStorage.getItem(KEY_USER) || PEOPLE[0].account,
    desc: localStorage.getItem(KEY_DESC) || DEFAULT_DESC,
  };

  const nameOf = (account) => {
    const p = PEOPLE.find((x) => x.account === account);
    return p ? p.name : account;
  };

  /* ============================== 工具 ============================== */

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const norm = (s) => String(s == null ? '' : s).replace(/[\s\u00a0]+/g, '');

  const escapeHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const isVisible = (el) => {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const st = getComputedStyle(el);
    return st.visibility !== 'hidden' && st.display !== 'none' && Number(st.opacity) > 0.05;
  };

  async function waitFor(fn, timeout = 8000, interval = 150) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const v = await fn();
        if (v) return v;
      } catch (e) { /* 继续等 */ }
      await sleep(interval);
    }
    return null;
  }

  /** ant-design 组件对原生 click 不敏感，补全 mousedown/mouseup */
  function click(el) {
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    ['mousedown', 'mouseup'].forEach((type) => {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    });
    el.click();
  }

  /** 给 Angular / React 受控 input 赋值，必须走原生 setter 才会触发框架的 change */
  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ============================ 页面操作 ============================ */

  const log = (msg) => {
    state.steps.push(msg);
    console.info(`[详情转派] ${msg}`);
  };

  /** 按钮文字（去掉内部图标/空白的干扰） */
  const btnText = (el) => norm(el && (el.innerText || el.textContent));

  function allButtons(root = document) {
    return [...root.querySelectorAll('button, a, .ant-btn, [role="button"]')].filter(isVisible);
  }

  function buttonsByText(texts, root = document) {
    const wanted = texts.map(norm);
    return allButtons(root).filter((b) => wanted.includes(btnText(b)));
  }

  /** 详情页顶部的「转派」按钮（排除列表页的「批量转派」） */
  function findTransferButton() {
    const candidates = allButtons().filter((b) => {
      const t = btnText(b);
      return t && t.includes('转派') && !t.includes('批量') && !t.includes('记录') && !t.includes('日志');
    });
    return candidates.find((b) => btnText(b) === '转派')
      || candidates.find((b) => /转派$/.test(btnText(b)) && btnText(b).length <= 6)
      || null;
  }

  /** 判断一个容器是不是转派表单（抽屉或弹窗） */
  function looksLikeTransferForm(el) {
    if (!el || !isVisible(el)) return false;
    const t = norm(el.innerText);
    if (!t) return false;
    if (/处理人员|处理人/.test(t) && /处理描述|描述/.test(t)) return true;
    return /转派/.test(t) && /处理人员/.test(t);
  }

  function visibleContainers() {
    return [
      ...document.querySelectorAll('.ant-drawer-open, .ant-modal-wrap, .ant-modal, .ant-drawer'),
    ].filter(isVisible);
  }

  function findTransferForm() {
    const list = visibleContainers().filter(looksLikeTransferForm);
    return list.length ? list[list.length - 1] : null;
  }

  /** 页面上的 .ant-message 提示文字（转派前系统会用这个拦人） */
  function toastText() {
    return visibleContainers()
      .concat([...document.querySelectorAll('.ant-message-notice, .ant-message')].filter(isVisible))
      .map((el) => norm(el.innerText))
      .join(' ');
  }

  /** 点了「转派」之后可能先弹确认框，再出表单；两者都等 */
  async function openTransferForm() {
    const btn = findTransferButton();
    if (!btn) throw new Error('没找到「转派」按钮（请确认当前是工单详情页，且工单状态允许转派）');

    const clickTransfer = () => {
      log(`点击「${btn.innerText.trim()}」`);
      click(btn);
    };

    // 真实页面：不先回答「是否认领工单」就直接点「转派」，只会弹一句提示，表单根本不出现
    const chooseClaim = () => {
      const want = state.claim ? '认领' : '不认领';
      const el = [...document.querySelectorAll('.ant-radio-wrapper')]
        .filter(isVisible)
        .find((r) => norm(r.innerText) === want);
      if (!el || el.querySelector('.ant-radio-checked')) return false;
      log(`先选「${want}」`);
      click(el);
      return true;
    };

    if (chooseClaim()) await sleep(400);
    clickTransfer();

    await sleep(1200);
    if (!findTransferForm() && /认领/.test(toastText()) && chooseClaim()) {
      await sleep(400);
      clickTransfer();
    }

    const form = await waitFor(() => {
      const found = findTransferForm();
      if (found) return found;

      // 出现「是否确认转派」这类小确认框时点确认
      const modal = visibleContainers()
        .filter((el) => !looksLikeTransferForm(el) && /确认|确定要/.test(norm(el.innerText)));
      if (modal.length) {
        const ok = buttonsByText(['确认', '确定', '是'], modal[modal.length - 1])[0];
        if (ok) {
          log('出现确认弹窗，点击「确认」');
          click(ok);
        }
      }
      return null;
    }, 12000, 250);

    if (!form) throw new Error('点了「转派」但转派表单没有出现');
    log('转派表单已打开');
    return form;
  }

  /** 表单字段的标签文字（不同版本 ng-zorro 的 DOM 不一样，做了兜底） */
  function labelOf(el) {
    const item = el.closest('.ant-form-item, nz-form-item, .form-item, tr');
    if (!item) return '';
    const label = item.querySelector('label, .ant-form-item-label, th, .label');
    return norm(label ? label.innerText : item.innerText).slice(0, 40);
  }

  function findUserSelect(form) {
    const selects = [...form.querySelectorAll('nz-select, .ant-select, [nz-select]')].filter(isVisible);
    if (!selects.length) return null;
    return selects.find((s) => (s.getAttribute('name') || '') === 'dealSkillsetUser')
      || selects.find((s) => /处理人/.test(labelOf(s)))
      || selects.find((s) => /处理人/.test(norm(s.innerText)))
      || selects[0];
  }

  function selectionTarget(select) {
    return select.querySelector('.ant-select-selection')
      || select.querySelector('.ant-select-selector')
      || select;
  }

  function selectedText(select) {
    const node = select.querySelector('.ant-select-selection-selected-value')
      || select.querySelector('.ant-select-selection-item')
      || select.querySelector('.ant-select-selection__choice');
    return norm(node ? node.innerText : (select.innerText || ''));
  }

  function dropdownOptions() {
    const dropdowns = [...document.querySelectorAll('.ant-select-dropdown')].filter(isVisible);
    const dd = dropdowns[dropdowns.length - 1];
    if (!dd) return { dd: null, items: [] };
    const items = [...dd.querySelectorAll('li, .ant-select-item-option, nz-option-item')]
      .filter((li) => isVisible(li) && btnText(li));
    return { dd, items };
  }

  /** 在下拉框里按账号搜索；服务端搜索必须等组件进入搜索态后写值才生效 */
  async function searchUser(select, account) {
    const input = await waitFor(() => {
      const el = select.querySelector('input.ant-select-search__field')
        || select.querySelector('input:not([type="hidden"])');
      return el && isVisible(el) ? el : null;
    }, 2000, 100);
    if (!input) return false;

    input.focus();
    // 先清空再写入，值没变化时组件不会重新发请求
    setNativeValue(input, '');
    await sleep(120);
    setNativeValue(input, account);
    return true;
  }

  async function pickUser(form, person) {
    const select = findUserSelect(form);
    if (!select) throw new Error('表单里没有找到「处理人员」下拉框');

    const already = selectedText(select);
    if (already && (already.includes(person.name) || already.includes(person.account))) {
      log(`处理人员已经是 ${person.name}，跳过选择`);
      return;
    }

    // 有值先清空，避免残留
    const clear = select.querySelector('.ant-select-selection__clear, .ant-select-clear');
    if (clear && isVisible(clear)) {
      click(clear);
      await sleep(200);
    }

    // 第一次点击有时只是关掉上一个残留浮层，所以确认真的展开了才算
    let opened = null;
    for (let i = 0; i < 3 && !opened; i += 1) {
      click(selectionTarget(select));
      opened = await waitFor(() => dropdownOptions().dd, 1200, 100);
      if (!opened) await sleep(200);
    }
    if (!opened) throw new Error('「处理人员」下拉框没有展开');

    // 服务端搜索有延迟，结果没收敛就重输一次
    let option = null;
    for (let attempt = 0; attempt < 3 && !option; attempt += 1) {
      if (attempt > 0) log(`重新搜索人员（第 ${attempt + 1} 次）`);
      await searchUser(select, person.account);

      option = await waitFor(() => {
        const { items } = dropdownOptions();
        if (!items.length) return null;

        const byAccount = items.filter((li) => btnText(li).includes(`[${person.account}]`));
        if (byAccount.length === 1) return byAccount[0];

        const byName = items.filter((li) => btnText(li).includes(person.name));
        if (byName.length === 1 && items.length <= 8) return byName[0];

        return null;
      }, 3000, 150);
    }

    if (!option) {
      throw new Error(`人员下拉里没有找到 ${person.name}（${person.account}）`);
    }

    // 系统会把自己（当前登录人）的选项置灰，点了不会生效
    if (/disabled/.test(option.className) || option.getAttribute('aria-disabled') === 'true') {
      throw new Error(`系统不允许把工单转给 ${person.name}（该选项是置灰的，通常是因为他/她就是你本人）`);
    }

    // 点击选项；偶尔第一次点击被浮层重绘吃掉，再补一次
    let chosen = '';
    for (let i = 0; i < 2; i += 1) {
      option.scrollIntoView({ block: 'nearest' });
      await sleep(120);
      click(option);
      await sleep(600);
      chosen = selectedText(select);
      if (chosen.includes(person.name) || chosen.includes(person.account)) break;
    }
    if (!chosen.includes(person.name) && !chosen.includes(person.account)) {
      throw new Error(`人员 ${person.name} 没有被选中（当前显示：${chosen}）`);
    }
    log(`处理人员选择：${person.name}`);
  }

  async function fillDescription(form, text) {
    // 注意：真实页面里 <quill-editor> 宿主元素本身就有 class="ql-editor"，
    // 真正可编辑的是里面的 .ql-container .ql-editor，直接改宿主会把工具栏冲掉。
    const editor = form.querySelector('.ql-container .ql-editor')
      || form.querySelector('.ql-editor[contenteditable="true"]')
      || form.querySelector('[contenteditable="true"]');
    if (editor) {
      editor.innerHTML = String(text)
        .split('\n')
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join('');
      // Quill 通过 MutationObserver 异步同步到表单模型，再补一次 input 兜底
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
      await sleep(500);
      log('处理描述已填写（富文本）');
      return;
    }

    const textarea = [...form.querySelectorAll('textarea')].filter(isVisible)[0];
    if (textarea) {
      setNativeValue(textarea, text);
      await sleep(300);
      log('处理描述已填写（textarea）');
      return;
    }

    throw new Error('没有找到「处理描述」输入框');
  }

  function findSaveButton(form) {
    const direct = form.querySelector('.submit-btn');
    if (direct && isVisible(direct)) return direct;
    return buttonsByText(['保存', '提交', '确定'], form)[0] || null;
  }

  async function waitResult(form) {
    const start = Date.now();
    while (Date.now() - start < 15000) {
      await sleep(300);

      const err = [...document.querySelectorAll('.ant-message-error, .ant-notification-notice-error')]
        .find(isVisible);
      if (err) return { ok: false, msg: err.innerText.trim() };

      const ok = [...document.querySelectorAll('.ant-message-success, .ant-notification-notice-success')]
        .find(isVisible);
      if (ok) return { ok: true, msg: ok.innerText.trim() };

      if (!form.isConnected || !isVisible(form)) return { ok: true, msg: '转派表单已关闭' };
    }
    return { ok: false, msg: '等待转派结果超时，请到工单详情确认是否已转派' };
  }

  /** 诊断：把转派表单的 HTML 抓出来，方便我改进选择器 */
  async function dumpFormHtml() {
    const form = findTransferForm() || await openTransferForm();

    const clone = form.cloneNode(true);
    // 去掉脚本、样式，只留结构
    clone.querySelectorAll('script, style, svg, .ant-select-dropdown').forEach((n) => n.remove());
    const html = clone.outerHTML
      .replace(/class="([^"]*)"/g, (m, c) => `class="${c}"`)
      .replace(/\s+/g, ' ')
      .slice(0, 20000);
    return `${form.tagName.toLowerCase()} | ${html}`;
  }

  async function runTransfer() {
    if (state.running) return;
    state.running = true;
    state.steps = [];
    const person = PEOPLE.find((p) => p.account === state.user) || PEOPLE[0];

    render();
    try {
      log(`开始：转给 ${person.name}（${person.account}）${state.claim ? '｜认领' : '｜不认领'}${state.dry ? '｜试跑模式' : ''}`);
      const form = await openTransferForm();
      await pickUser(form, person);
      await fillDescription(form, state.desc);

      const save = findSaveButton(form);
      if (!save) throw new Error('没有找到「保存」按钮');

      if (state.dry) {
        log('试跑模式：表单已填好，未点保存');
        toast(`试跑完成：已填好 ${person.name}，请手动检查后保存`);
        return;
      }

      if (save.disabled) throw new Error('「保存」按钮不可用，表单校验没通过');
      log('点击「保存」');
      click(save);

      const result = await waitResult(form);
      if (!result.ok) throw new Error(result.msg || '转派失败');
      log(`转派成功：${result.msg || '表单已关闭'}`);
      toast(`已转派给 ${person.name}`);
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      log(`失败：${msg}`);
      toast(msg, true);
      showDiag(msg);
    } finally {
      state.running = false;
      render();
    }
  }

  /* =============================== UI =============================== */

  let host = null;
  let shadow = null;
  let toastEl = null;
  let diagEl = null;
  let toastTimer = null;

  function ensureUI() {
    if (host && document.documentElement.contains(host)) return;
    host = document.createElement('div');
    host.id = 'css-detail-transfer-host';
    host.style.cssText = 'position:fixed;right:24px;bottom:96px;z-index:2147483000;';
    document.documentElement.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          /* 主题：蓝紫 */
          --brand: #5b4bdb;
          --brand-deep: #4a3ac4;
          --brand-soft: #7a6cf0;
          --brand-weak: #efedfd;
          --brand-off: #b6adf0;
        }
        * { box-sizing: border-box; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
        #fab {
          width: 46px; height: 46px; border: 0; border-radius: 23px; cursor: pointer;
          background: #fff; color: var(--brand); font-size: 13px; font-weight: 600;
          box-shadow: 0 4px 14px rgba(84, 64, 200, .28);
        }
        #fab:hover { background: var(--brand-weak); }
        #panel {
          display: none; width: 244px; background: #fff; border-radius: 8px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, .2); overflow: hidden;
        }
        #panel.show { display: block; }
        #panel .head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333;
        }
        #panel .head b { font-weight: 600; }
        #close { border: 0; background: transparent; color: #999; cursor: pointer; font-size: 15px; line-height: 1; }
        #people { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 10px 4px; }
        #claimRow { display: flex; align-items: center; gap: 6px; padding: 4px 10px 0; }
        #claimRow .lab { font-size: 12px; color: #8a8a8a; white-space: nowrap; }
        #claimRow .c {
          flex: 1; padding: 4px 0; border: 1px solid #d9d9d9; border-radius: 4px;
          background: #fff; color: #555; font-size: 12px; cursor: pointer;
        }
        #claimRow .c:hover { border-color: var(--brand); color: var(--brand); }
        #claimRow .c.on { border-color: var(--brand); background: var(--brand-weak); color: var(--brand); font-weight: 600; }
        .p {
          flex: 1 0 72px; padding: 7px 4px; border: 1px solid #d9d9d9; border-radius: 5px;
          background: #fff; color: #333; font-size: 13px; cursor: pointer; text-align: center;
        }
        .p:hover { border-color: var(--brand); color: var(--brand); }
        .p.on { border-color: var(--brand); background: var(--brand-weak); color: var(--brand); font-weight: 600; }
        #desc {
          width: calc(100% - 20px); margin: 8px 10px 0; padding: 6px 8px; font-size: 13px;
          border: 1px solid #d9d9d9; border-radius: 4px; outline: none;
        }
        #desc:focus { border-color: var(--brand); }
        #run {
          width: calc(100% - 20px); margin: 8px 10px 6px; padding: 9px 0; border: 0; border-radius: 5px;
          background: var(--brand); color: #fff; font-size: 14px; cursor: pointer;
        }
        #run:hover { background: var(--brand-soft); }
        #run[disabled] { background: var(--brand-off); cursor: not-allowed; }
        #foot {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 10px 10px; font-size: 12px; color: #888;
        }
        #foot label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
        #diag { border: 0; background: transparent; color: #999; font-size: 12px; cursor: pointer; text-decoration: underline; }
        #diagBox { display: none; padding: 0 10px 10px; }
        #diagBox.show { display: block; }
        #diagText {
          width: 100%; height: 110px; font-size: 11px; font-family: Consolas, monospace;
          border: 1px solid #ffccc7; border-radius: 4px; padding: 6px; resize: vertical;
        }
        #diagActions { display: flex; gap: 6px; margin-top: 6px; }
        #diagActions button {
          flex: 1; padding: 5px 0; font-size: 12px; cursor: pointer;
          border: 1px solid #d9d9d9; border-radius: 4px; background: #fff;
        }
        #toast {
          position: fixed; right: 24px; top: 96px; max-width: 260px;
          background: rgba(0, 0, 0, .82); color: #fff; font-size: 13px; line-height: 1.5;
          padding: 8px 12px; border-radius: 6px; opacity: 0; transform: translateY(-8px);
          transition: all .18s; pointer-events: none; z-index: 2;
        }
        #toast.show { opacity: 1; transform: translateY(0); }
        #toast.err { background: #d4380d; }
      </style>
      <button id="fab" title="工单转派">转派</button>
      <div id="panel">
        <div class="head"><b>转给谁？</b><button id="close" title="收起">×</button></div>
        <div id="people"></div>
        <div id="claimRow">
          <span class="lab">是否认领</span>
          <button class="c" data-claim="1">认领</button>
          <button class="c" data-claim="0">不认领</button>
        </div>
        <input id="desc" placeholder="处理描述">
        <button id="run">一键转派</button>
        <div id="foot">
          <label><input type="checkbox" id="dry"> 试跑（只填不保存）</label>
          <button id="diag">诊断</button>
        </div>
        <div id="diagBox">
          <textarea id="diagText" readonly></textarea>
          <div id="diagActions">
            <button id="diagCopy">复制</button>
            <button id="diagClose">关闭</button>
          </div>
        </div>
      </div>
      <div id="toast"></div>
    `;

    toastEl = shadow.getElementById('toast');
    diagEl = shadow.getElementById('diagBox');

    shadow.getElementById('fab').addEventListener('click', () => {
      const panel = shadow.getElementById('panel');
      panel.classList.toggle('show');
      shadow.getElementById('fab').style.display = panel.classList.contains('show') ? 'none' : 'block';
      render();
    });

    shadow.getElementById('close').addEventListener('click', () => {
      shadow.getElementById('panel').classList.remove('show');
      shadow.getElementById('fab').style.display = 'block';
    });

    shadow.getElementById('desc').addEventListener('input', (e) => {
      state.desc = e.target.value;
      localStorage.setItem(KEY_DESC, state.desc);
    });

    shadow.getElementById('dry').addEventListener('change', (e) => {
      state.dry = e.target.checked;
      localStorage.setItem(KEY_DRY, state.dry ? '1' : '0');
    });

    shadow.getElementById('run').addEventListener('click', runTransfer);
    shadow.getElementById('diag').addEventListener('click', onDiag);
    shadow.getElementById('diagCopy').addEventListener('click', async () => {
      const ta = shadow.getElementById('diagText');
      try {
        await navigator.clipboard.writeText(ta.value);
        toast('已复制，发给我即可');
      } catch (e) {
        ta.select();
        document.execCommand('copy');
        toast('已复制，发给我即可');
      }
    });
    shadow.getElementById('diagClose').addEventListener('click', () => diagEl.classList.remove('show'));
  }

  function render() {
    if (!shadow) return;
    const people = shadow.getElementById('people');
    people.innerHTML = PEOPLE.map((p) => `
      <button class="p ${p.account === state.user ? 'on' : ''}" data-account="${escapeHtml(p.account)}">${escapeHtml(p.name)}</button>
    `).join('');
    people.querySelectorAll('.p').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.user = btn.dataset.account;
        localStorage.setItem(KEY_USER, state.user);
        render();
      });
    });

    const desc = shadow.getElementById('desc');
    if (desc.value !== state.desc) desc.value = state.desc;
    shadow.getElementById('dry').checked = state.dry;

    shadow.querySelectorAll('#claimRow .c').forEach((btn) => {
      const wanted = btn.dataset.claim === '1';
      btn.classList.toggle('on', wanted === state.claim);
      btn.onclick = () => {
        state.claim = wanted;
        localStorage.setItem(KEY_CLAIM, wanted ? '1' : '0');
        render();
      };
    });

    const run = shadow.getElementById('run');
    run.disabled = state.running;
    run.textContent = state.running ? '执行中…' : `一键转派给 ${nameOf(state.user)}`;
  }

  function toast(msg, isError = false) {
    ensureUI();
    toastEl.textContent = msg;
    toastEl.className = 'show' + (isError ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = ''; }, 6000);
  }

  function showDiag(title) {
    ensureUI();
    diagEl.classList.add('show');
    const lines = [`【${title}】`, '', ...state.steps];
    shadow.getElementById('diagText').value = lines.join('\n');
  }

  async function onDiag() {
    ensureUI();
    try {
      toast('正在抓取转派表单结构…');
      const dump = await dumpFormHtml();
      diagEl.classList.add('show');
      shadow.getElementById('diagText').value = dump;
      toast('已抓取，点「复制」发给我');
    } catch (e) {
      showDiag(e && e.message ? e.message : String(e));
    }
  }

  /* ============================== 启动 ============================== */

  function init() {
    ensureUI();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
