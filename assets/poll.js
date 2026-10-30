/* Reader poll in the sidebar: a new question every Monday (Irad Time), the same for every reader. The figures are
   the Herald's running count; a reader's own vote is remembered in this browser. */
(function () {
  "use strict";
  var box = document.getElementById("poll");
  if (!box) return;
  var Q = [
    ["Should Central Square stay lit all night in winter?", [["Yes, it is the heart of the city", 31], ["No, save the money for heating", 52], ["Only on holidays", 17]]],
    ["How will you heat your home this winter?", [["District heating", 46], ["Coal stove", 29], ["Electric heater", 18], ["Gas cylinder", 7]]],
    ["Do you trust the official Toktogul reservoir figures?", [["Yes", 22], ["Partly", 41], ["No", 37]]],
    ["Should minibus fares in Talas rise to 15 som?", [["Yes, if drivers keep the timetable", 24], ["No", 63], ["Don't use minibuses", 13]]],
    ["Will the Lieutenant Governor's school pledge be met by 2028?", [["Yes", 14], ["Only in some districts", 39], ["No", 47]]],
    ["Where do you buy most of your food?", [["The bazaar", 58], ["A supermarket", 27], ["The shop on my street", 15]]],
    ["Should shops close on Sundays?", [["Yes", 19], ["No", 66], ["Only big stores", 15]]],
    ["Have you had a power cut at home this month?", [["No", 38], ["Once or twice", 41], ["More often", 21]]],
    ["Should the Herald print more stories in Iradi?", [["Yes", 49], ["No", 21], ["Keep Jarchy for that", 30]]],
    ["What should the city fix first?", [["Roads", 34], ["Courtyard lighting", 18], ["Water pipes", 31], ["Bus stops", 17]]],
    ["Would you buy one of the new mortgage flats in western Talas?", [["Yes, if I could afford it", 36], ["No, too far out", 29], ["No, I don't trust the builders", 35]]],
    ["How do you get the news first?", [["Tulpar", 41], ["IradOne", 26], ["The Herald", 22], ["Neighbours", 11]]],
    ["Should foreign visitors pay more at museums?", [["Yes", 57], ["No", 30], ["Only at the big ones", 13]]],
    ["Do you plan to travel abroad next year?", [["Yes", 21], ["Maybe", 26], ["No", 53]]],
    ["Should Talas ban coal burning in the city centre?", [["Yes, now", 33], ["Yes, once there is an alternative", 45], ["No", 22]]],
    ["Which is the best kümöch in Talas?", [["My mother's", 61], ["The bazaar bakers'", 23], ["The church's on feast days", 16]]],
    ["Should the Ala-Bel pass have a tunnel?", [["Yes", 71], ["No, it would never be finished", 22], ["No opinion", 7]]],
    ["How long did your last visit to a state office take?", [["Under an hour", 17], ["Half a day", 46], ["I had to come back", 37]]],
    ["Should schools teach a third language from first grade?", [["Yes, English", 48], ["Yes, Chinese", 14], ["No, two is enough", 38]]],
    ["Do you play IradLoto?", [["Every week", 19], ["Sometimes", 32], ["Never", 49]]],
    ["Should the courts publish every judgment online?", [["Yes", 68], ["Only in big cases", 21], ["No", 11]]],
    ["Is Talas safer than five years ago?", [["Safer", 23], ["The same", 45], ["Less safe", 32]]],
    ["Do you read the Herald on paper or online?", [["Paper", 27], ["Online", 51], ["Both", 22]]]
  ];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var now = Date.now() + 6 * 3600000, day = Math.floor(now / 86400000);
  var week = Math.floor((day + 3) / 7);                      // weeks start on Monday
  var r = rng(week * 7919), q = Q[week % Q.length];
  var shares = q[1].map(function (o) { return Math.max(1, o[1] + (r() - 0.5) * 12); });
  // the count grows through the week, most votes in the first days
  var into = (now / 86400000 - (week * 7 - 3)) / 7, total = Math.round((900 + r() * 1500) * Math.min(1, 0.25 + Math.sqrt(Math.max(0, into)) * 0.75));
  var sum = shares.reduce(function (a, b) { return a + b; }, 0);
  var votes = shares.map(function (s) { return Math.round(total * s / sum); });
  var key = "herald-poll-" + week, mine = null;
  try { mine = localStorage.getItem(key); } catch (e) {}

  function results() {
    var v = votes.slice();
    if (mine !== null) v[+mine]++;
    var t = v.reduce(function (a, b) { return a + b; }, 0);
    return '<ul class="poll-res">' + q[1].map(function (o, i) {
      var pc = Math.round(100 * v[i] / t);
      return '<li' + (String(i) === mine ? ' class="mine"' : "") + '><span class="poll-l">' + esc(o[0]) + '</span><span class="poll-bar"><i style="width:' + pc + '%"></i></span><b>' + pc + "%</b></li>";
    }).join("") + '</ul><p class="poll-n">' + t.toLocaleString("en-GB") + " votes. Not a scientific survey. A new question every Monday.</p>";
  }
  function render() {
    var h = '<h3 class="widget-title">Readers\' poll</h3><p class="poll-q">' + esc(q[0]) + "</p>";
    if (mine !== null) { box.innerHTML = h + results(); return; }
    box.innerHTML = h + '<form class="poll-f">' + q[1].map(function (o, i) {
      return '<label><input type="radio" name="pv" value="' + i + '"> ' + esc(o[0]) + "</label>";
    }).join("") + '<button class="btn" type="submit">Vote</button> <a href="#" class="poll-see">See results</a></form>';
    box.querySelector("form").onsubmit = function (e) {
      e.preventDefault();
      var c = box.querySelector("input:checked");
      if (!c) return;
      mine = c.value;
      try { localStorage.setItem(key, mine); } catch (x) {}
      render();
    };
    box.querySelector(".poll-see").onclick = function (e) { e.preventDefault(); box.innerHTML = h + results(); };
  }
  render();
})();
