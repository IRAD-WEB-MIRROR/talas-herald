/* In court this week: hearings in the next seven days from the Supreme Court's register of pending cases
 * (court.iradgov.org/data/cases.json), set in Herald type. Fills [data-court="week"]. */
(function () {
  "use strict";

  var COURT = "https://court.iradgov.org/";
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

  function day(iso, withYear) {
    var d = new Date(iso + "T00:00:00Z");
    return d.getUTCDate() + " " + MON[d.getUTCMonth()] + (withYear ? " " + d.getUTCFullYear() : "");
  }

  function short(iso) {
    var d = new Date(iso + "T00:00:00Z");
    return WD[d.getUTCDay()].slice(0, 3) + " " + d.getUTCDate();
  }

  function item(c, stamp, courts, extra) {
    var li = el("li");
    li.appendChild(el("span", "ct-time", stamp));
    var body = el("span");
    var a = el("a", "ct-title", c.title.en);
    a.href = COURT + "register.html";
    a.rel = "noopener";
    body.appendChild(a);
    var bits = [courts[c.court] || "", c.no];
    if (c.judge && c.judge.en) bits.push(c.judge.en);
    body.appendChild(el("span", "ct-detail", bits.join(" · ")));
    if (extra) body.appendChild(el("span", "ct-detail", extra));
    li.appendChild(body);
    return li;
  }

  function fill(list, d) {
    var today = iradToday(), stop = addDays(today, 7);
    var courts = {};
    (d.courts || []).forEach(function (c) { courts[c.id] = c.name.en; });
    var cases = d.cases || [];
    var listed = cases.filter(function (c) { return c.next && c.next >= today; })
      .sort(function (a, b) { return a.next < b.next ? -1 : 1; });
    var week = listed.filter(function (c) { return c.next < stop; });
    list.innerHTML = "";
    week.forEach(function (c) {
      var li = item(c, c.next === today ? "Today" : short(c.next), courts, c.status && c.status.en);
      if (c.next === today) li.className = "ct-today";
      list.appendChild(li);
    });
    if (!week.length) {
      list.appendChild(el("li", "ct-none", "No hearings are listed for the coming week."));
      listed.slice(0, 2).forEach(function (c) { list.appendChild(item(c, short(c.next), courts, c.status && c.status.en)); });
    }
    // Cases still waiting for a date: the register says so, and so do we.
    cases.filter(function (c) { return !c.next; }).sort(function (a, b) { return a.filed < b.filed ? -1 : 1; })
      .slice(0, 2).forEach(function (c) {
        var li = item(c, "—", courts, "Filed " + day(c.filed, true) + "; no hearing date yet");
        li.className = "ct-wait";
        list.appendChild(li);
      });
    var upd = document.querySelectorAll("[data-court-updated]");
    Array.prototype.forEach.call(upd, function (u) { u.textContent = "From the court register, as at " + day(d.updated, true); });
  }

  function init() {
    var lists = document.querySelectorAll('[data-court="week"]');
    if (!lists.length) return;
    fetch(COURT + "data/cases.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("cases"); return r.json(); })
      .then(function (d) { Array.prototype.forEach.call(lists, function (l) { fill(l, d); }); })
      .catch(function () {
        Array.prototype.forEach.call(lists, function (l) { l.innerHTML = '<li class="ct-none">The court list is unavailable right now.</li>'; });
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
