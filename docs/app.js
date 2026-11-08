/* ============================================================
   MOFLASH 官网脚本
   - 自动拉取 GitHub 最新 Release（版本 / APK / 大小 / 更新日志）
   - 滚动入场动画、导航滚动状态
   ============================================================ */
(function () {
  "use strict";

  var OWNER = "xskokernel";
  var REPO = "No-Root-Android-Flash-TooL";
  var API_LATEST = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/releases/latest";
  var RELEASES_PAGE = "https://github.com/" + OWNER + "/" + REPO + "/releases";

  var el = {
    heroVersion: document.getElementById("hero-version"),
    heroDl: document.getElementById("hero-download"),
    heroDlText: document.getElementById("hero-download-text"),
    dlDesc: document.getElementById("dl-desc"),
    dlBtn: document.getElementById("dl-btn"),
    dlBtnText: document.getElementById("dl-btn-text"),
    dlNote: document.getElementById("dl-note"),
    year: document.getElementById("year"),
    nav: document.getElementById("nav")
  };

  /* ---------- 工具函数 ---------- */
  function fmtSize(bytes) {
    if (!bytes || isNaN(bytes)) return "";
    var mb = bytes / 1048576;
    return mb >= 1 ? mb.toFixed(1) + " MB" : (bytes / 1024).toFixed(0) + " KB";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var p = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function firstLines(text, n) {
    if (!text) return "";
    var lines = text.split("\n").filter(function (l) { return l.trim() !== ""; });
    // 遇到英文分隔行就截断，只展示中文段落
    var zh = [];
    for (var i = 0; i < lines.length; i++) {
      if (/^-{3,}$/.test(lines[i].trim())) break;
      if (/^english\s*:?$/i.test(lines[i].trim())) break;
      zh.push(lines[i].trim());
    }
    var arr = zh.length ? zh : lines;
    return arr.slice(0, n).join("\n");
  }

  /* ---------- 渲染最新版本 ---------- */
  function render(release) {
    var tag = release.tag_name || "";
    var name = release.name || tag;
    var apk = null;
    (release.assets || []).forEach(function (a) {
      if (!apk && /\.apk$/i.test(a.name)) apk = a;
    });

    if (el.heroVersion) el.heroVersion.textContent = name || tag || "最新版本";

    if (el.dlBtn && apk) {
      el.dlBtn.href = apk.browser_download_url;
    }
    if (el.heroDl && apk) {
      el.heroDl.href = apk.browser_download_url;
    }
    if (el.heroDlText) {
      el.heroDlText.textContent = apk ? "下载最新版" : "前往 Release";
    }
    if (el.dlBtnText) {
      el.dlBtnText.textContent = apk ? "下载 APK" : "前往 Release";
    }

    if (el.dlDesc) {
      var bits = [];
      if (name) bits.push(name);
      if (apk && apk.size) bits.push(fmtSize(apk.size));
      var date = fmtDate(release.published_at);
      if (date) bits.push("发布于 " + date);
      if (apk && typeof apk.download_count === "number") bits.push("下载 " + apk.download_count + " 次");
      el.dlDesc.textContent = bits.join("  ·  ") || "点击下方按钮前往 GitHub Release 下载";
    }

    if (el.dlNote) {
      var log = firstLines(release.body, 4);
      el.dlNote.textContent = log ? "本次更新：" + log.replace(/\n/g, " / ") : "";
    }
  }

  function fallback() {
    if (el.heroVersion) el.heroVersion.textContent = "最新版本";
    if (el.dlDesc) el.dlDesc.textContent = "前往 GitHub Release 获取最新安装包（含版本说明与历史版本）。";
    if (el.dlBtn) el.dlBtn.href = RELEASES_PAGE + "/latest";
  }

  /* 供历史版本列表复用（避免重复请求 latest 接口） */
  window.__moflashRenderRelease = render;

  /* ---------- 拉取 Release（失败静默降级到静态链接） ---------- */
  function loadRelease() {
    if (!window.fetch) { fallback(); return; }
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);

    fetch(API_LATEST, {
      headers: { Accept: "application/vnd.github+json" },
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) { clearTimeout(timer); render(data); })
      .catch(function () { clearTimeout(timer); fallback(); });
  }

  /* ---------- 导航滚动状态 ---------- */
  function onScroll() {
    if (!el.nav) return;
    el.nav.classList.toggle("scrolled", window.scrollY > 12);
  }

  /* ---------- 滚动入场 ---------- */
  function setupReveal() {
    var targets = document.querySelectorAll(
      ".feat, .tool, .shot, .spec, .warn, .dl-card, .login, .sec-head"
    );
    if (!("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (t, i) {
      t.classList.add("reveal");
      // 同组内做轻微错峰，避免整屏一起弹
      t.style.transitionDelay = (Math.min(i % 4, 3) * 70) + "ms";
      io.observe(t);
    });
  }

  /* ============================================================
     彩蛋 & 增强交互
     ============================================================ */
  function initEggs() {
    var toast = document.getElementById("egg-toast");
    var toastIco = document.getElementById("egg-ico");
    var toastText = document.getElementById("egg-text");
    var toastTimer = 0;

    function say(text, ico) {
      if (!toast) return;
      if (toastIco) toastIco.textContent = ico || "✦";
      if (toastText) toastText.textContent = text;
      toast.style.display = "";   // 解除内联隐藏
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove("show");
        // 过渡结束后重新隐藏，避免裸露
        setTimeout(function () {
          if (!toast.classList.contains("show")) toast.style.display = "none";
        }, 480);
      }, 3800);
    }
    window.__moflashSay = say;

    /* ---------- 1. 顶部滚动进度条 ---------- */
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    window.addEventListener("scroll", function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    }, { passive: true });

    /* ---------- 2. 鼠标柔光 ---------- */
    var glow = document.getElementById("cursor-glow");
    if (glow && window.matchMedia("(pointer: fine)").matches) {
      var gx = 0, gy = 0, cx = 0, cy = 0;
      document.addEventListener("mousemove", function (e) {
        gx = e.clientX; gy = e.clientY;
        glow.classList.add("on");
      });
      (function follow() {
        cx += (gx - cx) * 0.12;
        cy += (gy - cy) * 0.12;
        glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
        requestAnimationFrame(follow);
      })();
    }

    /* ---------- 3. 卡片光斑跟随 ---------- */
    document.addEventListener("mousemove", function (e) {
      var card = e.target.closest && e.target.closest(".card");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    }, { passive: true });

    /* ---------- 4. Hero 标题逐字动画 ---------- */
    /* ⚠ em 标签带 background-clip:text 渐变，逐字拆分会破坏渐变效果，
       因此整段跳过 em，只对纯文本节点做拆字。 */
    var h1 = document.querySelector(".hero h1");
    if (h1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var counter = { n: 0 };
      var walk = function (node) {
        var kids = Array.prototype.slice.call(node.childNodes);
        kids.forEach(function (n) {
          if (n.nodeType === 3) {
            var txt = n.textContent;
            if (!txt.trim()) return;
            var frag = document.createDocumentFragment();
            for (var i = 0; i < txt.length; i++) {
              var ch = txt[i];
              if (/\s/.test(ch)) {
                frag.appendChild(document.createTextNode(ch));
              } else {
                var sp = document.createElement("span");
                sp.className = "ch";
                sp.textContent = ch;
                sp.style.animationDelay = (counter.n++ * 55 + 120) + "ms";
                frag.appendChild(sp);
              }
            }
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.tagName !== "EM") {
            walk(n);
          }
        });
      };
      walk(h1);
    }

    /* ---------- 5. Konami 秘籍 → 成就 ---------- */
    var KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    var seq = 0;
    var ach = document.getElementById("egg-achievement");
    var achDone = false;

    document.addEventListener("keydown", function (e) {
      var key = e.key;
      if (key.length === 1) key = key.toLowerCase();
      if (key === KONAMI[seq]) {
        seq++;
        if (seq === KONAMI.length) {
          seq = 0;
          if (!achDone && ach) {
            achDone = true;
            ach.style.display = "";
            ach.classList.add("show");
            createParticles();
            say("秘籍生效：所有分区已就绪 🏆", "🎉");
            setTimeout(function () {
              ach.classList.remove("show");
              setTimeout(function () {
                if (!ach.classList.contains("show")) ach.style.display = "none";
              }, 650);
            }, 6000);
          } else {
            say("秘籍已用过一次啦，别贪心 ~", "😄");
          }
        }
      } else {
        seq = (key === KONAMI[0]) ? 1 : 0;
      }
    });

    /* ---------- 6. 粒子爆发 ---------- */
    function createParticles() {
      var colors = ["#6ea8ff", "#a78bfa", "#34e2c0", "#ffce7a"];
      for (var i = 0; i < 42; i++) {
        var p = document.createElement("div");
        p.style.cssText = [
          "position:fixed", "left:50%", "top:50%",
          "width:7px", "height:7px", "border-radius:2px",
          "background:" + colors[i % colors.length],
          "z-index:350", "pointer-events:none",
          "box-shadow:0 0 12px currentColor"
        ].join(";");
        document.body.appendChild(p);

        var ang = Math.random() * Math.PI * 2;
        var dist = 120 + Math.random() * 260;
        var dx = Math.cos(ang) * dist;
        var dy = Math.sin(ang) * dist;

        p.animate(
          [
            { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1 },
            { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(0) rotate(" + (Math.random() * 540 - 270) + "deg)", opacity: 0 }
          ],
          { duration: 900 + Math.random() * 600, easing: "cubic-bezier(.2,.7,.3,1)" }
        ).onfinish = function () { this.effect.target.remove(); };
        setTimeout(function (el) { return function () { if (el.parentNode) el.remove(); }; }(p), 1800);
      }
    }

    /* ---------- 7. Hero 图标：点 5 次 ---------- */
    var heroIcon = document.querySelector(".hero-icon");
    var iconClicks = 0;
    if (heroIcon) {
      heroIcon.style.cursor = "pointer";
      heroIcon.addEventListener("click", function () {
        iconClicks++;
        heroIcon.classList.remove("cheat");
        void heroIcon.offsetWidth;
        if (iconClicks === 5) {
          heroIcon.classList.add("cheat");
          say("别戳了，它已经免 Root 了 ~", "👆");
          iconClicks = 0;
        } else if (iconClicks > 4) {
          heroIcon.classList.add("cheat");
        }
      });
    }

    /* ---------- 8. Logo 连点 3 次 → 像素模式 ---------- */
    var brand = document.querySelector(".brand");
    var brandClicks = 0;
    var brandTimer = 0;
    var pixelOn = false;
    if (brand) {
      brand.addEventListener("click", function () {
        brandClicks++;
        clearTimeout(brandTimer);
        brandTimer = setTimeout(function () { brandClicks = 0; }, 900);
        if (brandClicks >= 3) {
          brandClicks = 0;
          pixelOn = !pixelOn;
          document.body.classList.toggle("egg-pixel", pixelOn);
          say(pixelOn ? "已切换到像素风（再连点三次切回）" : "已切回液态玻璃风", "🧊");
        }
      });
    }

    /* ---------- 10. 隐藏终端：按 ` 或 ~ ---------- */
    var term = document.getElementById("egg-terminal");
    var termBody = document.getElementById("term-body");
    var termClose = document.getElementById("term-close");
    var termOpen = false;
    var termLines = [
      "<span class='t-dim'>MOFLASH 6.0.0-release-20261108 (No Root)</span>",
      "<span class='t-dim'>Android 14 · OnePlus PKG110</span>",
      "",
      "<span class='t-blue'>$</span> usbhost --list",
      "  <span class='t-ok'>✓</span> fd 桥接已建立 (usbhost fd)",
      "  <span class='t-ok'>✓</span> 主控端 MOFLASH  @" + (navigator.platform || "android"),
      "  <span class='t-ok'>✓</span> 被控端 MediaTek BROM / Preloader",
      "",
      "<span class='t-blue'>$</span> flash --partition super --image super.img",
      "  [████████████████████░░░░]  736.0 MiB / 8.99 GiB",
      "  <span class='t-warn'>ETA 230s · 36.8 MB/s</span>",
      "",
      "  <span class='t-ok'>✓</span> 分区 'super' 刷写完成",
      "  <span class='t-ok'>✓</span> 分区 'efuse' 刷写完成",
      "  <span class='t-ok'>✓</span> 分区 'logo_a' 刷写完成",
      "",
      "<span class='t-blue'>$</span> <span class='t-cursor'></span>"
    ];

    function openTerm() {
      if (!term || !termBody) return;
      if (termOpen) return;
      termOpen = true;
      termBody.innerHTML = "";
      term.style.display = "";   // 解除内联隐藏，交给 .show 控制
      term.classList.add("show");
      var i = 0;
      (function typeLine() {
        if (i >= termLines.length) return;
        var d = document.createElement("div");
        d.innerHTML = termLines[i] || "&nbsp;";
        termBody.appendChild(d);
        termBody.scrollTop = termBody.scrollHeight;
        i++;
        setTimeout(typeLine, 110 + Math.random() * 90);
      })();
      say("你发现了隐藏终端 · 按 Esc 关闭", "🖥️");
    }

    function closeTerm() {
      if (!term) return;
      term.classList.remove("show");
      // 过渡结束后重新内联隐藏，避免任何情况下裸露
      setTimeout(function () {
        if (!termOpen) term.style.display = "none";
      }, 380);
      termOpen = false;
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "`" || e.key === "~") {
        e.preventDefault();
        termOpen ? closeTerm() : openTerm();
      } else if (e.key === "Escape" && termOpen) {
        closeTerm();
      }
    });
    if (termClose) termClose.addEventListener("click", closeTerm);

    /* ---------- 11. 彩蛋：拉断 3 次给个提示 ---------- */
    window.__moflashBrokenCount = 0;
  }

  /* ============================================================
     历史版本列表
     - 拉取全部 Release（分页直到拿完），直接给 APK 下载直链
     - 同时保留「去 GitHub 看」入口
     ============================================================ */
  function initVersions() {
    var listEl = document.getElementById("ver-list");
    var tipEl = document.getElementById("ver-tip");
    var searchEl = document.getElementById("ver-search");
    var filterEl = document.getElementById("ver-filter");
    if (!listEl) return;

    var state = {
      all: [],
      filter: "all",
      keyword: "",
      loaded: false
    };

    /* ---------- 版本号排序用 ---------- */
    function parseVer(name) {
      var m = String(name || "").match(/(\d+)\.(\d+)(?:\.(\d+))?/);
      if (!m) return [0, 0, 0];
      return [+m[1], +(m[2] || 0), +(m[3] || 0)];
    }

    function fmtSize(bytes) {
      if (!bytes || isNaN(bytes)) return "";
      var mb = bytes / 1048576;
      return mb >= 1 ? mb.toFixed(1) + " MB" : (bytes / 1024).toFixed(0) + " KB";
    }

    function fmtDate(iso) {
      if (!iso) return "";
      var d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      var p = function (n) { return n < 10 ? "0" + n : "" + n; };
      return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
    }

    var GH_SVG =
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

    var DL_SVG =
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V4a1 1 0 0 1 1-1Zm-7 15a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v1.5A1.5 1.5 0 0 1 18.5 22h-13A1.5 1.5 0 0 1 4 20.5V19a1 1 0 0 1 1-1Z"/></svg>';

    /* 轻量 HTML 转义：用字符码拼实体，避免源码里出现原始实体字面量 */
    var _AMP = 38, _LT = 60, _GT = 62, _QUOT = 34, _APOS = 39;
    var _ENT = {};
    _ENT[_AMP] = 'amp';
    _ENT[_LT] = 'lt';
    _ENT[_GT] = 'gt';
    _ENT[_QUOT] = 'quot';
    _ENT[_APOS] = '39';
    function esc(s) {
      if (s == null) return '';
      var out = '';
      var str = String(s);
      for (var i = 0; i < str.length; i++) {
        var cc = str.charCodeAt(i);
        if (_ENT[cc]) {
          out += _ENT[cc] === '39' ? '&#39;' : '&' + _ENT[cc] + ';';
        } else {
          out += str.charAt(i);
        }
      }
      return out;
    }

    /* ---------- 渲染 ---------- */
    function render() {
      if (!state.loaded) return;

      var kw = state.keyword.trim().toLowerCase();
      var items = state.all.filter(function (r) {
        if (state.filter === "pre" && !r.prerelease) return false;
        if (state.filter === "stable" && r.prerelease) return false;
        if (!kw) return true;
        var hay = (r.name + " " + r.tag_name).toLowerCase();
        return hay.indexOf(kw) !== -1;
      });

      if (!items.length) {
        listEl.innerHTML =
          '<div class="ver-empty">' +
          (kw ? "没有匹配「" + esc(kw) + "」的版本" : "暂无符合条件的版本") +
          "</div>";
        return;
      }

      var html = "";
      items.forEach(function (r, i) {
        var apk = null;
        (r.assets || []).forEach(function (a) {
          if (!apk && /\.apk$/i.test(a.name)) apk = a;
        });

        var v = parseVer(r.name || r.tag_name);
        var verLabel = v[0] + "." + v[1] + "." + v[2];
        var isLatest = i === 0 && state.filter === "all" && !kw;

        var metaBits = [];
        if (apk) metaBits.push('<span class="nm">' + fmtSize(apk.size) + "</span>");
        var d = fmtDate(r.published_at);
        if (d) metaBits.push("<span>" + d + "</span>");
        if (apk && typeof apk.download_count === "number")
          metaBits.push("<span>下载 " + apk.download_count + " 次</span>");
        if (apk) metaBits.push('<span title="' + esc(apk.name) + '">' + esc(shortName(apk.name)) + "</span>");

        html +=
          '<div class="ver-item' + (isLatest ? " latest" : "") + '">' +
            '<div class="ver-badge">' +
              "<b>" + esc(verLabel) + "</b>" +
              "<small>" + (isLatest ? "LATEST" : "VERSION") + "</small>" +
            "</div>" +
            '<div class="ver-mid">' +
              '<div class="ver-title">' +
                "<h4>" + esc(r.name || r.tag_name) + "</h4>" +
                (isLatest ? '<span class="ver-tagchip new">最新</span>' : "") +
                (r.prerelease ? '<span class="ver-tagchip pre">预览版</span>' : "") +
              "</div>" +
              '<div class="ver-meta">' + metaBits.join("<i></i>") + "</div>" +
            "</div>" +
            '<div class="ver-actions">' +
              (apk
                ? '<a class="ver-dl" href="' + esc(apk.browser_download_url) + '" download rel="noopener">' + DL_SVG + "<span>下载 APK</span></a>"
                : '<span class="ver-dl muted">无安装包</span>') +
              '<a class="ver-gh" href="' + esc(r.html_url) + '" target="_blank" rel="noopener" title="在 GitHub 查看该版本">' + GH_SVG + "</a>" +
            "</div>" +
          "</div>";
      });

      listEl.innerHTML = html;

      if (tipEl) {
        tipEl.textContent =
          "共 " + state.all.length + " 个版本" +
          (items.length !== state.all.length ? "，当前显示 " + items.length + " 个" : "") +
          " · 点击「下载 APK」直接开始下载，不跳转页面";
      }
    }

    function shortName(n) {
      // 只保留版本和日期，太长就截断
      var s = String(n).replace(/^MOFLASH[_-]?/i, "");
      return s.length > 34 ? s.slice(0, 32) + "…" : s;
    }

    /* ---------- 拉取全部 Release ---------- */
    function loadAll() {
      var base = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/releases?per_page=100";
      var all = [];

      function page(url, guard) {
        if (guard > 5) return finish();
        return fetch(url, { headers: { Accept: "application/vnd.github+json" } })
          .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
          })
          .then(function (data) {
            if (!Array.isArray(data) || !data.length) return finish();
            all = all.concat(data);
            if (data.length < 100) return finish();
            var last = data[data.length - 1];
            // 用 id 做游标，避免超过 100 个后漏版本
            return page(base + "&before=" + last.id, guard + 1);
          })
          .catch(function (e) {
            if (all.length) finish();
            else fail(e);
          });
      }

      function finish() {
        all.sort(function (a, b) {
          var va = parseVer(a.name || a.tag_name), vb = parseVer(b.name || b.tag_name);
          for (var i = 0; i < 3; i++) if (va[i] !== vb[i]) return vb[i] - va[i];
          return new Date(b.published_at) - new Date(a.published_at);
        });
        state.all = all;
        state.loaded = true;
        render();
        // 最新版同步给 Hero / 下载区（复用第一页数据，少一次请求）
        if (all.length && window.__moflashRenderRelease) {
          window.__moflashRenderRelease(all[0]);
        }
      }

      function fail(e) {
        state.loaded = true;
        listEl.innerHTML =
          '<div class="ver-empty">版本列表加载失败（' + esc(e && e.message || "网络异常") +
          "）<br>可以直接前往 GitHub 查看全部 Release。</div>";
        if (tipEl) tipEl.textContent = "无法访问 GitHub API，请检查网络或使用代理。";
      }

      page(base, 0);
    }

    /* ---------- 交互 ---------- */
    if (searchEl) {
      var sTimer = 0;
      searchEl.addEventListener("input", function () {
        clearTimeout(sTimer);
        var v = searchEl.value;
        sTimer = setTimeout(function () {
          state.keyword = v;
          render();
        }, 140);
      });
    }

    if (filterEl) {
      filterEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".vf-btn");
        if (!btn) return;
        Array.prototype.forEach.call(filterEl.children, function (b) {
          b.classList.toggle("active", b === btn);
        });
        state.filter = btn.dataset.filter || "all";
        render();
      });
    }

    loadAll();
  }

  /* ---------- 初始化 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (el.year) el.year.textContent = new Date().getFullYear();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    setupReveal();
    initEggs();

    // 版本列表会拉取全部 Release，成功后顺带回填 Hero / 下载区，
    // 所以这里不再单独请求 /releases/latest（少一次 API 调用、降低限流风险）。
    initVersions();

    // 兜底：若版本列表在 9 秒内还没回填（网络慢或接口不可达），
    // 才退回到单次 latest 请求，保证首屏版本信息不空着。
    setTimeout(function () {
      if (el.heroVersion && el.heroVersion.textContent.indexOf("最新版本") !== -1) {
        loadRelease();
      }
    }, 9000);
  });
})();