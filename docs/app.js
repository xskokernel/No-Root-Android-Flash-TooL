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
     OTG Playground — 拖拽双手机 + 实时线缆
     ============================================================ */
  function initPlayground() {
    var wrap = document.getElementById("playground");
    if (!wrap) return;

    var canvas = document.getElementById("otg-canvas");
    var phoneA = document.getElementById("phone-a");
    var phoneB = document.getElementById("phone-b");
    var hint = document.getElementById("pg-hint");
    var status = document.getElementById("pg-status");
    var statusText = document.getElementById("pg-status-text");
    var lenEl = document.getElementById("pg-len");
    if (!canvas || !phoneA || !phoneB) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    /* 保底位置（百分比），无 JS 布局计算时也能看 */
    phoneA.style.left = "10%";
    phoneA.style.top = "16%";
    phoneB.style.left = "66%";
    phoneB.style.top = "16%";

    var state = {
      dragging: null,
      offX: 0,
      offY: 0,
      broken: false,
      interacted: false,
      raf: 0
    };

    var MAX_LEN = 0; // 由布局决定
    var geom = { a: { x: 0, y: 0 }, b: { x: 0, y: 0 } };

    function box() {
      return wrap.getBoundingClientRect();
    }

    /* 手机尺寸：用 offsetWidth/offsetHeight，避免 getBoundingClientRect
       与自身的 left/top 互相反馈（clamp 改位置 → 影响测量 → 抖动） */
    function bodySize(el) {
      var body = el.querySelector(".phone-body");
      if (!body) return { w: el.offsetWidth, h: el.offsetHeight };
      return { w: body.offsetWidth, h: body.offsetHeight };
    }

    /* 计算某台手机「底部 USB 口」在容器坐标系中的位置 */
    function portPoint(el) {
      var size = bodySize(el);
      var left = parseFloat(el.style.left) || 0;
      var top = parseFloat(el.style.top) || 0;
      // 端口在机身底部中心，略微伸出
      return { x: left + size.w / 2, y: top + size.h + 2 };
    }

    function clamp(el) {
      var b = box();
      var size = bodySize(el);
      var tagH = 32;
      var left = parseFloat(el.style.left) || 0;
      var top = parseFloat(el.style.top) || 0;
      var maxLeft = Math.max(0, b.width - size.w);
      var maxTop = Math.max(0, b.height - size.h - tagH);
      left = Math.min(Math.max(left, 0), maxLeft);
      top = Math.min(Math.max(top, 40), Math.max(40, maxTop));
      el.style.left = left + "px";
      el.style.top = top + "px";
    }

    function layout() {
      var b = box();
      if (!b.width || !b.height) return;

      canvas.width = Math.round(b.width * dpr);
      canvas.height = Math.round(b.height * dpr);
      canvas.style.width = b.width + "px";
      canvas.style.height = b.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 首次布局：换成像素定位
      if (!wrap.dataset.laid) {
        var w0 = b.width;
        var sA = bodySize(phoneA);
        var sB = bodySize(phoneB);
        var pad0 = Math.max(16, w0 * 0.06);
        var topY0 = Math.max(60, (b.height - sA.h - 48) / 2 + 6);

        phoneA.style.left = pad0 + "px";
        phoneA.style.top = topY0 + "px";
        phoneB.style.left = Math.max(pad0, w0 - sB.w - pad0) + "px";
        phoneB.style.top = topY0 + "px";

        wrap.dataset.laid = "1";
      }

      // 最大线长按「当前容器可容纳的最远水平距离」重算，
      // 这样窗口缩放（手机尺寸变化）后线长阈值不会失真。
      var sizeA = bodySize(phoneA);
      var sizeB = bodySize(phoneB);
      var reach = Math.max(0, b.width - sizeA.w / 2 - sizeB.w / 2);
      MAX_LEN = Math.max(280, reach * 0.82);

      clamp(phoneA);
      clamp(phoneB);
      draw();
    }

    /* 画 OTG 线：两段贝塞尔 + 波纹光泽 */
    function draw() {
      var b = box();
      var A = portPoint(phoneA);
      var B = portPoint(phoneB);
      geom.a = A;
      geom.b = B;

      ctx.clearRect(0, 0, b.width, b.height);

      var dist = Math.hypot(B.x - A.x, B.y - A.y);
      var ratio = MAX_LEN ? dist / MAX_LEN : 0;
      state.broken = ratio > 1;

      if (lenEl) lenEl.textContent = Math.round(dist) + " px / " + Math.round(MAX_LEN) + " px";

      if (status) status.classList.toggle("broken", state.broken);
      phoneB.classList.toggle("unplugged", state.broken);
      if (statusText) {
        statusText.textContent = state.broken
          ? "线缆拉断 · 请靠近一些"
          : (state.dragging ? "OTG 传输中…" : "OTG 已连接");
      }

      if (state.broken) {
        // 断线：只画两端残段
        drawBrokenStub(A, B);
        return;
      }

      // 张力控制：越拉越紧、越耷拉
      var slack = Math.max(0, 1 - ratio);           // 1=很松, 0=绷直
      var sag = 46 * slack * slack + 12 * (1 - ratio);

      var midX = (A.x + B.x) / 2;
      var midY = (A.y + B.y) / 2 + sag;

      // 颜色随张力变化：松=青蓝，紧=橙红警告
      var glow = ratio > 0.82 ? "255,140,80" : (ratio > 0.6 ? "120,180,255" : "90,150,255");

      // ---- 外层柔光 ----
      ctx.save();
      ctx.filter = "blur(9px)";
      ctx.strokeStyle = "rgba(" + glow + ",0.30)";
      ctx.lineWidth = 13;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.quadraticCurveTo(midX, midY, B.x, B.y);
      ctx.stroke();
      ctx.restore();

      // ---- 线缆本体（渐变）----
      var grad = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
      if (ratio > 0.82) {
        grad.addColorStop(0, "#8fa8c8");
        grad.addColorStop(0.5, "#ff9a5c");
        grad.addColorStop(1, "#c8b0a0");
      } else {
        grad.addColorStop(0, "#aebbd0");
        grad.addColorStop(0.45, "#e8eef8");
        grad.addColorStop(1, "#9fb0c8");
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.quadraticCurveTo(midX, midY, B.x, B.y);
      ctx.stroke();

      // ---- 内芯高光 ----
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.quadraticCurveTo(midX, midY - 1.2, B.x, B.y);
      ctx.stroke();

      // ---- 传输光点 ----
      var t = (performance.now() / 1400) % 1;
      for (var k = 0; k < 3; k++) {
        var tt = (t + k / 3) % 1;
        var p = quadPoint(A, { x: midX, y: midY }, B, tt);
        ctx.beginPath();
        ctx.fillStyle = "rgba(180,220,255," + (0.85 - k * 0.2) + ")";
        ctx.arc(p.x, p.y, 2.6 - k * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- 两端接头 ----
      drawPlug(A, 0);
      drawPlug(B, Math.PI);
    }

    function quadPoint(p0, p1, p2, t) {
      var mt = 1 - t;
      return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
      };
    }

    function drawPlug(p, rot) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(rot);
      // 接头外壳
      ctx.fillStyle = "#3a4256";
      roundRect(-7, -3, 14, 16, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // 金属触点
      ctx.fillStyle = "#9fb4d4";
      roundRect(-4, 9, 8, 5, 2);
      ctx.fill();
      ctx.restore();
    }

    function drawBrokenStub(A, B) {
      var MX = 58;
      ctx.lineCap = "round";

      // 左残段
      ctx.strokeStyle = "rgba(255,120,110,0.55)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(A.x, A.y + MX);
      ctx.stroke();

      // 右残段
      ctx.beginPath();
      ctx.moveTo(B.x, B.y);
      ctx.lineTo(B.x, B.y + MX);
      ctx.stroke();

      // 断口火花
      var f = (Math.sin(performance.now() / 160) + 1) / 2;
      [A, B].forEach(function (p) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(255," + Math.round(120 + f * 90) + ",80," + (0.5 + f * 0.5) + ")";
        ctx.arc(p.x, p.y + MX, 3 + f * 2, 0, Math.PI * 2);
        ctx.fill();
      });
      drawPlug(A, 0);
      drawPlug(B, Math.PI);
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    /* ---------- 拖拽 ---------- */
    function startDrag(e, el) {
      var b = box();
      var r = el.getBoundingClientRect();
      var pt = e.touches ? e.touches[0] : e;
      state.dragging = el;
      state.offX = pt.clientX - r.left;
      state.offY = pt.clientY - r.top;
      el.classList.add("dragging");
      el.classList.remove("returning");
      el.style.zIndex = 8;
      if (hint && !state.interacted) {
        state.interacted = true;
        hint.classList.add("hide");
      }
      e.preventDefault();
    }

    function moveDrag(e) {
      if (!state.dragging) return;
      var b = box();
      var pt = e.touches ? e.touches[0] : e;
      var left = pt.clientX - b.left - state.offX;
      var top = pt.clientY - b.top - state.offY;

      state.dragging.style.left = left + "px";
      state.dragging.style.top = top + "px";
      clamp(state.dragging);
      scheduleDraw();
      e.preventDefault();
    }

    function endDrag() {
      if (!state.dragging) return;
      state.dragging.classList.remove("dragging");
      state.dragging.style.zIndex = "";
      state.dragging = null;
      draw();
    }

    function scheduleDraw() {
      if (state.raf) return;
      state.raf = requestAnimationFrame(function () {
        state.raf = 0;
        draw();
      });
    }

    [phoneA, phoneB].forEach(function (el) {
      el.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        startDrag(e, el);
      });
      el.addEventListener("touchstart", function (e) {
        if (e.touches.length > 1) return;
        startDrag(e, el);
      }, { passive: false });

      // 双击回位：只有「手机本体」响应；屏幕区域会 stopPropagation，
      // 所以被控端黑屏双击不会被这里吃掉（详见 initEggs 第 9 条）。
      el.addEventListener("dblclick", function (e) {
        e.preventDefault();
        resetPositions();
      });
    });

    // 统一在 window 上收尾，避免指针移出元素后拖拽卡死
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("touchmove", moveDrag, { passive: false });
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);
    window.addEventListener("touchcancel", endDrag);
    window.addEventListener("blur", endDrag);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) endDrag();
    });

    function resetPositions() {
      var b = box();
      if (!b.width || !b.height) return;
      var sizeA = bodySize(phoneA);
      var sizeB = bodySize(phoneB);
      var pad = Math.max(16, b.width * 0.06);
      var topY = Math.max(60, (b.height - sizeA.h - 48) / 2 + 6);

      phoneA.classList.add("returning");
      phoneB.classList.add("returning");
      phoneA.style.left = pad + "px";
      phoneA.style.top = topY + "px";
      phoneB.style.left = Math.max(pad, b.width - sizeB.w - pad) + "px";
      phoneB.style.top = topY + "px";

      // 过渡结束后重绘，保证线缆贴合最终位置
      clearTimeout(wrap._retTimer);
      wrap._retTimer = setTimeout(function () {
        phoneA.classList.remove("returning");
        phoneB.classList.remove("returning");
        draw();
      }, 580);
      draw();
    }

    /* 持续轻描（光点动画）—— 仅在可视时运行 */
    var running = false;
    function loop() {
      if (!running) return;
      draw();
      state.raf = requestAnimationFrame(loop);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !running) {
            running = true;
            loop();
          } else if (!en.isIntersecting) {
            running = false;
          }
        });
      }, { threshold: 0.15 });
      io.observe(wrap);
    } else {
      running = true;
      loop();
    }

    // 布局
    window.addEventListener("resize", layout);
    if (window.ResizeObserver) {
      new ResizeObserver(function () { layout(); }).observe(wrap);
    }
    // 等图片/字体就位后再测量一次
    window.addEventListener("load", layout);
    setTimeout(layout, 60);
    setTimeout(layout, 350);
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
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 3800);
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
            ach.classList.add("show");
            createParticles();
            say("秘籍生效：所有分区已就绪 🏆", "🎉");
            setTimeout(function () { ach.classList.remove("show"); }, 6000);
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

    /* ---------- 9. 被控端双击 → 点亮 ---------- */
    /* ⚠ 不能挂在 phone-b 的 dblclick 上：那样会和「双击回位」抢同一个事件，
       导致同一台手机上永远只能回位、点不亮。改用屏幕区域单独响应。 */
    var slave = document.getElementById("phone-b");
    if (slave) {
      var litState = false;
      var slaveScreen = slave.querySelector(".phone-screen");
      var slaveFace = slave.querySelector(".dark-face");
      var dblTimer = 0;
      var tapCount = 0;

      function toggleLight() {
        litState = !litState;
        if (!slaveScreen) return;
        slaveScreen.style.transition = "background .45s";
        if (litState) {
          slaveScreen.style.background = "radial-gradient(circle at 50% 40%, #1b3a2e 0%, #0a1712 55%, #05080a 100%)";
          if (slaveFace) {
            slaveFace.innerHTML =
              "<span class='dark-pulse' style='background:#34e2c0;box-shadow:0 0 14px #34e2c0'></span>" +
              "<em style='color:#6ee7a8'>BOOT OK</em>" +
              "<small style='color:#3a6b56'>SYSTEM ONLINE</small>";
          }
          say("被控端刷写完成，成功开机 ✅", "⚡");
        } else {
          slaveScreen.style.background = "";
          if (slaveFace) {
            slaveFace.innerHTML = "<span class='dark-pulse'></span><em>BLACK SCREEN</em><small>BL LOCKED</small>";
          }
          say("已复位：黑屏待刷写", "📴");
        }
      }

      /* 用点击计数模拟双击，且阻止冒泡，避免触发手机本体的 dblclick 回位 */
      if (slaveScreen) {
        slaveScreen.style.cursor = "pointer";
        slaveScreen.addEventListener("click", function (e) {
          e.stopPropagation();
          tapCount++;
          clearTimeout(dblTimer);
          dblTimer = setTimeout(function () { tapCount = 0; }, 320);
          if (tapCount >= 2) {
            tapCount = 0;
            toggleLight();
          }
        });
        // 阻止屏幕区域的 dblclick 冒泡到手机（否则会被回位逻辑吃掉）
        slaveScreen.addEventListener("dblclick", function (e) {
          e.stopPropagation();
          e.preventDefault();
        });
      }
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
    initPlayground();
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