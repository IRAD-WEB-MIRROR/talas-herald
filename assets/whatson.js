/* What's on: the coming events across Irad (iradone.com/data/whatson.json, the same list the venues and
 * other papers print), set in Herald type. [data-wo="week"] is the sidebar box, [data-wo="all"] the full page. */
(function () {
  "use strict";

  var SRC = "https://iradone.com/data/whatson.json";
  var KINDS = [["all", "All"], ["concert", "Music"], ["exhibition", "Exhibitions"], ["lecture", "Talks"], ["feast", "Church"], ["match", "Football"]];
  var CITIES = ["Talas", "Nurzhan", "Iyık Janyl"];
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function iradToday() {                       // Irad Time is UTC+6
    return new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
  }

  function addDays(iso, n) {
    var d = new Date(iso + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function day(iso, withWeekday) {
    var d = new Date(iso + "T00:00:00Z");
    return (withWeekday ? WD[d.getUTCDay()] + " " : "") + d.getUTCDate() + " " + MON[d.getUTCMonth()];
  }

  function short(iso) {
    var d = new Date(iso + "T00:00:00Z");
    return WD[d.getUTCDay()].slice(0, 3) + " " + d.getUTCDate();
  }

  function item(ev, stamp, withNote) {
    var li = el("li", "wo-" + ev.kind);
    li.appendChild(el("span", "wo-time", stamp));
    var body = el("span", "wo-body");
    var a = el("a", "wo-title", ev.title.en);
    a.href = ev.url;
    a.rel = "noopener";
    body.appendChild(a);
    var where = ev.venue + (!ev.city || ev.venue.indexOf(ev.city) >= 0 ? "" : ", " + ev.city);
    var bits = [where];
    if (ev.end && ev.end !== ev.date) bits.push((ev.kind === "exhibition" ? "until " : "to ") + day(ev.end));
    if (ev.price) bits.push(ev.price === "free" ? "free" : ev.price);
    body.appendChild(el("span", "wo-detail", bits.join(" · ")));
    if (withNote && ev.note && ev.note.en) body.appendChild(el("span", "wo-note", ev.note.en));
    li.appendChild(body);
    return li;
  }

  function week(list, evs, today) {
    var stop = addDays(today, 7);
    var rows = [], games = {};
    evs.forEach(function (e) {                 // a day's football is one line in the box
      if (e.date < today || e.date > stop) return;
      if (e.kind !== "match") return rows.push(e);
      var comp = e.title.en.split(":")[0], key = e.date + comp;
      if (games[key]) return games[key].n++;
      games[key] = { n: 1, date: e.date, kind: "match", url: e.url, title: { en: comp }, venue: "", city: "" };
      games[key].first = e;
      rows.push(games[key]);
    });
    rows = rows.map(function (r) {
      if (r.first && r.n === 1) return r.first;
      if (r.first) { r.title.en = r.title.en + ": " + r.n + " matches"; r.venue = "Kick-off from " + r.first.time; }
      return r;
    }).slice(0, 7);
    var open = evs.filter(function (e) { return e.kind === "exhibition" && e.date < today && (e.end || e.date) >= today; }).slice(0, 1);
    list.innerHTML = "";
    rows.forEach(function (e) { list.appendChild(item(e, e.date === today ? (e.time || "Today") : short(e.date))); });
    open.forEach(function (e) { list.appendChild(item(e, "Now")); });
    if (!list.children.length) list.appendChild(el("li", "wo-loading", "Nothing listed this week."));
  }

  function full(box, evs, today, kind, city) {
    var pick = evs.filter(function (e) {
      if (kind !== "all" && e.kind !== kind && !(kind === "lecture" && e.kind === "other")) return false;
      if (city === "Elsewhere") return CITIES.indexOf(e.city) < 0;
      return city === "all" || e.city === city;
    });
    box.innerHTML = "";
    var running = pick.filter(function (e) { return e.end && e.end !== e.date && e.date <= today; });
    if (running.length) {
      var s = el("section", "wo-day");
      s.appendChild(el("h2", "rule-head", "Running now"));
      var ol = el("ol", "wo-list wo-full");
      running.forEach(function (e) { ol.appendChild(item(e, e.kind === "exhibition" ? "Daily" : "", true)); });
      s.appendChild(ol);
      box.appendChild(s);
    }
    var cur = null, ol2 = null;
    pick.filter(function (e) { return e.date >= today; }).forEach(function (e) {
      if (e.date !== cur) {
        cur = e.date;
        var s2 = el("section", "wo-day");
        s2.appendChild(el("h2", "rule-head", e.date === today ? "Today, " + day(e.date) : e.date === addDays(today, 1) ? "Tomorrow, " + day(e.date) : day(e.date, true)));
        ol2 = el("ol", "wo-list wo-full");
        s2.appendChild(ol2);
        box.appendChild(s2);
      }
      ol2.appendChild(item(e, e.time || (e.kind === "feast" ? "Feast" : "All day"), true));
    });
    if (!box.children.length) box.appendChild(el("p", "muted", "Nothing listed."));
  }

  function filters(bar, onChange) {
    var state = { kind: "all", city: "all" };
    function group(opts, key) {
      var g = el("span", "wo-group");
      opts.forEach(function (o) {
        var b = el("button", o[0] === state[key] ? "on" : "", o[1]);
        b.type = "button";
        b.addEventListener("click", function () {
          state[key] = o[0];
          Array.prototype.forEach.call(g.children, function (x) { x.className = x === b ? "on" : ""; });
          onChange(state.kind, state.city);
        });
        g.appendChild(b);
      });
      bar.appendChild(g);
    }
    group(KINDS, "kind");
    group([["all", "All towns"]].concat(CITIES.map(function (c) { return [c, c]; })).concat([["Elsewhere", "Elsewhere"]]), "city");
  }

  function init() {
    var boxes = document.querySelectorAll("[data-wo]");
    if (!boxes.length) return;
    fetch(SRC, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(SRC); return r.json(); }).then(function (data) {
      var today = iradToday();
      var evs = (data.events || []).filter(function (e) { return (e.end || e.date) >= today; });
      Array.prototype.forEach.call(boxes, function (b) {
        if (b.getAttribute("data-wo") === "week") return week(b, evs, today);
        full(b, evs, today, "all", "all");
        var bar = document.querySelector("[data-wo-filters]");
        if (bar) filters(bar, function (k, c) { full(b, evs, today, k, c); });
      });
    }).catch(function () {
      Array.prototype.forEach.call(boxes, function (b) {
        b.innerHTML = b.tagName === "OL" ? '<li class="wo-loading">Listings are unavailable right now.</li>' : '<p class="muted">Listings are unavailable right now.</p>';
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
