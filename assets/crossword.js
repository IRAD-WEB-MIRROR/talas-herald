/* The Saturday crossword. One puzzle a week, the same for every reader: the week number (in Irad Time, weeks
   starting Saturday) seeds a shuffle of the clue bank in data/crossword.json and a free-form grid is built from it.
   The page shows this week's puzzle and last week's solution. Answers typed in are kept in the browser. */
(function () {
  "use strict";
  var root = document.getElementById("xw");
  if (!root) return;
  var BASE = root.getAttribute("data-base") || "";
  var SIZE = 13, FIRST_WEEK = 1211;   // crossword No. 1 was in the paper of Saturday 20 March 1993

  function irt() { return new Date(Date.now() + 6 * 3600000); }
  // weeks since Saturday 3 January 1970; day 0 (1 Jan 1970) was a Thursday, so Saturdays are days 2, 9, ...
  function weekOf(ms) { return Math.floor((Math.floor(ms / 86400000) - 2) / 7); }
  function saturday(week) { return new Date((week * 7 + 2) * 86400000); }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function longDate(d) { return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); }

  function rng(seed) {   // mulberry32
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---- grid building ---- */
  function build(bank, week) {
    var r = rng(week * 7919 + 17), pool = bank.slice();
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    pool = pool.filter(function (c) { return c[0].length >= 3 && c[0].length <= SIZE; });
    var g = [], placed = [];
    for (var y = 0; y < SIZE; y++) { g.push([]); for (var x = 0; x < SIZE; x++) g[y].push(""); }
    function at(x, y) { return x < 0 || y < 0 || x >= SIZE || y >= SIZE ? null : g[y][x]; }
    function fits(w, x, y, dx, dy) {
      var cross = 0;
      if (x < 0 || y < 0 || x + dx * (w.length - 1) >= SIZE || y + dy * (w.length - 1) >= SIZE) return -1;
      if (at(x - dx, y - dy) || at(x + dx * w.length, y + dy * w.length)) return -1;
      for (var k = 0; k < w.length; k++) {
        var cx = x + dx * k, cy = y + dy * k, c = g[cy][cx];
        if (c) { if (c !== w[k]) return -1; cross++; }
        else if (at(cx + dy, cy + dx) || at(cx - dy, cy - dx)) return -1;   // no side-by-side letters
      }
      return cross;
    }
    function put(c, x, y, dx, dy) {
      for (var k = 0; k < c[0].length; k++) g[y + dy * k][x + dx * k] = c[0][k];
      placed.push({ a: c[0], clue: c[1], x: x, y: y, dx: dx, dy: dy });
    }
    // the first word goes across the middle
    var first = pool.shift();
    while (first[0].length < 7 || first[0].length > 11) { pool.push(first); first = pool.shift(); }
    put(first, Math.floor((SIZE - first[0].length) / 2), Math.floor(SIZE / 2), 1, 0);
    for (var pass = 0; pass < 2 && placed.length < 18; pass++) {
      pool = pool.filter(function (c) {
        if (placed.length >= 18) return true;
        var w = c[0], best = null;
        for (var y = 0; y < SIZE; y++) for (var x = 0; x < SIZE; x++) for (var d = 0; d < 2; d++) {
          var n = fits(w, x, y, d ? 0 : 1, d ? 1 : 0);
          if (n > 0 && (!best || n > best.n || (n === best.n && r() < .3))) best = { n: n, x: x, y: y, d: d };
        }
        if (!best) return true;
        put(c, best.x, best.y, best.d ? 0 : 1, best.d ? 1 : 0);
        return false;
      });
    }
    // number the starts, row by row
    var nums = {}, n = 0;
    placed.sort(function (a, b) { return a.y - b.y || a.x - b.x; }).forEach(function (p) {
      var k = p.x + "," + p.y;
      if (!nums[k]) nums[k] = ++n;
      p.n = nums[k];
    });
    return { grid: g, words: placed, nums: nums };
  }

  /* ---- drawing ---- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function bounds(p) {
    var x0 = SIZE, y0 = SIZE, x1 = 0, y1 = 0;
    for (var y = 0; y < SIZE; y++) for (var x = 0; x < SIZE; x++) if (p.grid[y][x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  function gridHTML(p, solved) {
    var b = bounds(p), h = '<table class="xw-grid' + (solved ? " xw-solved" : "") + '"><tbody>';
    for (var y = b.y0; y <= b.y1; y++) {
      h += "<tr>";
      for (var x = b.x0; x <= b.x1; x++) {
        var c = p.grid[y][x], num = p.nums[x + "," + y];
        if (!c) { h += '<td class="xw-b"></td>'; continue; }
        h += '<td class="xw-c">' + (num ? '<span class="xw-n">' + num + "</span>" : "") +
          (solved ? '<span class="xw-s">' + c + "</span>" : '<input maxlength="1" data-x="' + x + '" data-y="' + y + '" aria-label="Row ' + (y - b.y0 + 1) + ", column " + (x - b.x0 + 1) + '" autocomplete="off" autocapitalize="characters">') + "</td>";
      }
      h += "</tr>";
    }
    return h + "</tbody></table>";
  }
  function cluesHTML(p) {
    function list(dx, title) {
      return '<div class="xw-list"><h3>' + title + "</h3><ol>" + p.words.filter(function (w) { return w.dx === dx; }).sort(function (a, b) { return a.n - b.n; })
        .map(function (w) { return '<li value="' + w.n + '" data-n="' + w.n + '" data-d="' + dx + '">' + esc(w.clue) + " (" + w.a.length + ")</li>"; }).join("") + "</ol></div>";
    }
    return list(1, "Across") + list(0, "Down");
  }

  var now = weekOf(irt().getTime()), store = "herald-xw-" + now;
  fetch(BASE + "data/crossword.json").then(function (r) { return r.json(); }).then(function (d) {
    var p = build(d.clues, now), prev = build(d.clues, now - 1);
    var no = now - FIRST_WEEK + 1;
    root.innerHTML =
      '<p class="xw-meta">No. ' + no.toLocaleString("en") + " · Saturday " + longDate(saturday(now)) + " · compiled by Kestrel</p>" +
      '<div class="xw-wrap">' + gridHTML(p, false) + '<div class="xw-clues">' + cluesHTML(p) + "</div></div>" +
      '<p class="xw-tools"><button type="button" id="xw-check">Check</button> <button type="button" id="xw-reveal">Reveal</button> <button type="button" id="xw-clear">Clear</button> <span id="xw-msg" class="xw-msg" aria-live="polite"></span></p>' +
      '<h2 class="rule-head">Solution to No. ' + (no - 1).toLocaleString("en") + "</h2>" +
      '<div class="xw-wrap xw-prev">' + gridHTML(prev, true) + "</div>";
    var cells = [].slice.call(root.querySelectorAll(".xw-grid:not(.xw-solved) input")), dir = 1, saved = {};
    try { saved = JSON.parse(localStorage.getItem(store) || "{}"); } catch (e) {}
    function cell(x, y) { return root.querySelector('input[data-x="' + x + '"][data-y="' + y + '"]'); }
    function save() {
      var s = {}; cells.forEach(function (c) { if (c.value) s[c.dataset.x + "," + c.dataset.y] = c.value; });
      try { localStorage.setItem(store, JSON.stringify(s)); } catch (e) {}
    }
    cells.forEach(function (c) {
      c.value = saved[c.dataset.x + "," + c.dataset.y] || "";
      c.addEventListener("input", function () {
        c.value = c.value.replace(/[^a-z]/gi, "").toUpperCase().slice(-1);
        c.classList.remove("xw-bad");
        save();
        if (c.value) {
          var x = +c.dataset.x, y = +c.dataset.y, next = dir ? cell(x + 1, y) : cell(x, y + 1);
          if (next) next.focus();
        }
      });
      c.addEventListener("keydown", function (ev) {
        var x = +c.dataset.x, y = +c.dataset.y, m = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[ev.key];
        if (m) { var t = cell(x + m[0], y + m[1]); if (t) { dir = m[0] ? 1 : 0; t.focus(); } ev.preventDefault(); }
        if (ev.key === "Backspace" && !c.value) { var b = dir ? cell(x - 1, y) : cell(x, y - 1); if (b) { b.value = ""; b.focus(); save(); } ev.preventDefault(); }
      });
      c.addEventListener("focus", function () {
        var x = +c.dataset.x, y = +c.dataset.y;
        if (dir && !cell(x - 1, y) && !cell(x + 1, y)) dir = 0;
        if (!dir && !cell(x, y - 1) && !cell(x, y + 1)) dir = 1;
      });
    });
    var msg = root.querySelector("#xw-msg");
    root.querySelector("#xw-check").addEventListener("click", function () {
      var wrong = 0, empty = 0;
      cells.forEach(function (c) {
        var ok = c.value === p.grid[+c.dataset.y][+c.dataset.x];
        if (!c.value) empty++; else if (!ok) wrong++;
        c.classList.toggle("xw-bad", !!c.value && !ok);
      });
      msg.textContent = wrong ? wrong + (wrong === 1 ? " letter is" : " letters are") + " wrong." : empty ? "So far, so good. " + empty + " to go." : "Solved. Well done.";
    });
    root.querySelector("#xw-reveal").addEventListener("click", function () {
      cells.forEach(function (c) { c.value = p.grid[+c.dataset.y][+c.dataset.x]; c.classList.remove("xw-bad"); });
      save(); msg.textContent = "Revealed. The solution will be printed next Saturday.";
    });
    root.querySelector("#xw-clear").addEventListener("click", function () {
      cells.forEach(function (c) { c.value = ""; c.classList.remove("xw-bad"); });
      save(); msg.textContent = "";
    });
  }).catch(function () { root.innerHTML = '<p class="muted">The crossword could not be loaded. It is printed in the Saturday paper.</p>'; });
})();
