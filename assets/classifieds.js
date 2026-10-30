/* Classifieds and family notices, as printed in today's paper. The Irad-Time date seeds the choice, so every reader
   sees the same page and it changes each morning (no Sunday paper: Sunday shows Saturday's). Names come from
   data/people.json. */
(function () {
  "use strict";
  var root = document.getElementById("cls");
  if (!root) return;
  var BASE = root.getAttribute("data-base") || "";
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var DAY = 86400000, MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var day = Math.floor((Date.now() + 6 * 3600000) / DAY);
  if ((day + 4) % 7 === 0) day -= 1;                     // Sunday: Saturday's paper
  function d(n) { var x = new Date(n * DAY); return x.getUTCDate() + " " + MONTHS[x.getUTCMonth()]; }
  function wd(n) { return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(n * DAY).getUTCDay()]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  fetch(BASE + "data/people.json").then(function (r) { return r.json(); }).then(function (P) {
    var r = rng(day * 101 + 3);
    function pick(a) { return a[Math.floor(r() * a.length)]; }
    function n(a, b) { return a + Math.floor(r() * (b - a + 1)); }
    function tel(city) { return "+996-39-" + (city === "Iyık Janyl" ? "6" : "2") + "-" + n(20, 59) + "-" + ("0" + n(0, 99)).slice(-2) + "-" + ("0" + n(0, 99)).slice(-2); }
    function box() { return "Box " + n(1200, 4890) + ", the Herald"; }
    function young() { return pick(P.young)[0]; }
    function first(name) { return name.split(" ")[0]; }
    var year = new Date(day * DAY).getUTCFullYear();

    /* ---- family notices ---- */
    var deaths = [], used = {};
    for (var i = 0, nd = n(2, 5); i < nd; i++) {
      var p = pick(P.old); if (used[p[0]]) continue; used[p[0]] = 1;
      var parts = p[0].split(" "), sur = parts.slice(1).join(" "), age = year - p[2] - (r() < .5 ? 1 : 0), died = day - n(1, 3);
      var kin = p[1] === "f" ? pick(["beloved mother, grandmother and great-grandmother", "dear wife of the late " + first(pick(P.old)[0]) + ", mother of " + n(2, 7) + ", grandmother of many", "much-loved mother and grandmother", "sister, aunt and friend to many, teacher for 41 years"])
        : pick(["beloved father, grandfather and great-grandfather", "dear husband, father of " + n(2, 6) + " and grandfather of " + n(4, 19), "veteran of the Talas Electrical Works, father and grandfather", "aksakal of his street, father and grandfather", "retired driver of the Talas–Nurzhan bus, father and grandfather"]);
      var fun = pick(["The funeral leaves the family home at 11:00 on " + wd(day + 1) + ". Memorial meal to follow.",
                      "Burial at the " + p[3] + " cemetery on " + wd(day + 1) + " at 12:00. The family receive visitors at home.",
                      (p[3] === "Iyık Janyl" ? "Holy Qurbana for the departed at the Church of St. Janyl, " : p[3] === "Talas" ? "Holy Qurbana for the departed at the Church of St. Yuhanna, Talas, " : "Prayers for the departed at the family home, ") + wd(day + 1) + " at 9:00, then burial.",
                      "The family thank the doctors of the city hospital. Funeral " + wd(day + 2) + "; the seventh-day meal on " + d(died + 7) + ".",
                      "Farewell at the house of the family on " + wd(day + 1) + " from 10:00. No flowers, please."]);
      deaths.push("<p><b>" + esc(sur.toUpperCase()) + "</b>, " + esc(parts[0]) + ", of " + esc(p[3]) + ", on " + d(died) + ", aged " + age + ". " + kin.charAt(0).toUpperCase() + kin.slice(1) + ". " + fun + "</p>");
    }
    var mem = [];
    for (i = 0; i < n(1, 2); i++) {
      var q = pick(P.old), yrs = pick([1, 1, 3, 5, 10, 20]);
      mem.push("<p><b>" + esc(q[0].split(" ").slice(1).join(" ").toUpperCase()) + "</b>, " + esc(first(q[0])) + ". " + (yrs === 1 ? "A year" : yrs + " years") + " since you left us. " +
        pick(["Remembered every day by your children and grandchildren.", "The house is quiet without you.", "Your garden still flowers.", "Ash for the anniversary at the family home on " + wd(day + n(1, 5)) + "."]) + "</p>");
    }
    var births = [];
    for (i = 0; i < n(1, 3); i++) {
      var mom = pick(P.young.filter(function (x) { return x[1] === "f"; })), dad = pick(P.young.filter(function (x) { return x[1] === "m"; }));
      births.push("<p><b>" + esc(dad[0].split(" ").slice(1).join(" ").toUpperCase()) + "</b>. To " + esc(first(mom[0])) + " and " + esc(first(dad[0])) + ", at the Talas Maternity Hospital on " + d(day - n(1, 6)) + ", a " + pick(["son", "daughter", "son", "daughter", "son and a daughter (twins)"]) + ". " +
        pick(["A brother for " + first(young()) + ".", "Thanks to the midwives of ward 3.", "Beshik toy on Sunday.", "Grandparents in Nurzhan are delighted.", ""]) + "</p>");
    }
    var namedays = [];
    if (r() < .6) namedays.push("<p><b>" + esc(young().toUpperCase().split(" ").slice(1).join(" ")) + "</b>, " + esc(first(young())) + ". Happy name day! From all at the " + pick(["Talas Post Office, counter 4", "Nurzhan refinery canteen", "TSU history faculty", "Bazar-i Kalan, row 12"]) + ".</p>");

    /* ---- classifieds ---- */
    var C = {
      "Flats and houses to let": function () {
        var rooms = n(1, 4), city = pick(["Talas", "Talas", "Talas", "Nurzhan", "Iyık Janyl"]);
        return pick(["Talas, Old City, " + rooms + "-room flat, " + pick(["2nd", "3rd", "4th", "5th"]) + " floor, gas, phone line, furnished. " + n(18, 45) * 100 + " som a month, three months in advance. " + tel("Talas") + ".",
                     city + ", " + rooms + " rooms in a private house, own entrance, courtyard. Quiet family or students. " + n(12, 30) * 100 + " som. " + tel(city) + " after 18:00.",
                     "Microdistrict 4, Talas: room for a girl student, near TSU. " + n(6, 12) * 100 + " som with meals. " + box() + ".",
                     "Foreigners welcome: modern flat, Freedom Avenue, Western repair, hot water day and night, generator. Rent in dollars. " + tel("Talas") + ".",
                     "Nurzhan, Neftyanik district, 2-room flat near the refinery bus. Heating included. " + n(15, 25) * 100 + " som. " + box() + "."]);
      },
      "For sale": function () {
        return pick(["Piano, Soviet, 'Belarus', needs tuning. " + n(30, 90) * 100 + " som or exchange for a refrigerator. " + tel("Talas") + ".",
                     "Shyrdak, 2 × 3 m, red and black, made in Kochkor-Ata 1987. " + n(8, 20) * 1000 + " som. " + tel("Iyık Janyl") + ".",
                     "Coal, Tash-Kömür, delivered by the tonne. Orders before the snow. " + tel("Talas") + ".",
                     "Felt boots, all sizes, hand-made. Bazar-i Kalan, row 7, ask for " + first(young()) + ".",
                     "Satellite dish with receiver, all channels. Installed. " + tel("Talas") + ".",
                     "Walnuts, this year's, " + n(80, 140) + " som a kilo, from 5 kg. " + box() + ".",
                     "Komuz, apricot wood, maker's label inside. " + n(25, 60) * 100 + " som. " + tel("Iyık Janyl") + ".",
                     "Honey from the Chatkal, 3-litre jars. " + n(9, 15) * 100 + " som. " + tel("Talas") + ".",
                     "School uniforms, boys 8–12, little worn. Cheap. " + box() + "."]);
      },
      "Cars": function () {
        return pick(["Lada 2107, " + n(1990, 2008) + ", white, gas and petrol, documents in order. " + n(18, 40) * 1000 + " som. " + tel("Talas") + ".",
                     "Toyota Camry, " + n(2004, 2014) + ", right-hand drive, customs cleared. " + n(30, 70) * 100 + " dollars. " + tel("Talas") + ".",
                     "UAZ 'Bukhanka', " + n(1985, 1999) + ", runs, for the mountains. Swap for sheep considered. " + box() + ".",
                     "Daewoo Matiz, " + n(2003, 2012) + ", one owner, a lady. " + tel("Iyık Janyl") + ".",
                     "Wanted: Niva, any condition. Cash. " + tel("Talas") + ".",
                     "Spare parts for Volga GAZ-24: doors, bonnet, engine. All for " + n(5, 15) * 1000 + " som. " + box() + "."]);
      },
      "Jobs": function () {
        return pick(["Night watchman wanted, warehouse, Talas industrial zone. Retired men welcome. " + tel("Talas") + ".",
                     "English teacher for children, evenings. Native speakers preferred, pay by the hour. " + box() + ".",
                     "Driver with category C licence for the Toktogul route. Own lodging provided. " + tel("Talas") + ".",
                     "Cook (plov, lagman, samsa) for a café on Freedom Avenue. Experience required. Ask for " + first(young()) + ".",
                     "Accountant with 1C, Russian and Iradi, for a trading firm. CV to " + box() + ".",
                     "Seamstress, piecework, own machine. Bazar-i Kalan, row 3.",
                     "Sales agents for an insurance company. Commission only. Opportunity! " + tel("Talas") + "."]);
      },
      "Services": function () {
        return pick(["Repairs of televisions, refrigerators, washing machines. At your home. " + tel("Talas") + ".",
                     "Translations: English, Russian, Iradi, Turkish. Notarised. Next to the Hall of Justice. " + tel("Talas") + ".",
                     "Tutor in mathematics and physics for the national test. Results guaranteed. " + box() + ".",
                     "Weddings filmed and photographed, with a drone. " + tel("Talas") + ".",
                     "Chimneys and stoves cleaned before winter. " + tel("Iyık Janyl") + ".",
                     "Visa forms filled in, photographs 3 × 4 while you wait. Opposite the post office.",
                     "Removals, Talas–Nurzhan–Iyık Janyl, with loaders. " + tel("Talas") + "."]);
      },
      "Lost and found": function () {
        return pick(["Lost: grey cat, answers to Murka, Microdistrict 2. Reward. " + tel("Talas") + ".",
                     "Found: passport in the name of " + young() + ", at the bus station. Collect at the Herald office.",
                     "Lost: gold earring with turquoise, Central Square, Friday. Family memory. Reward. " + box() + ".",
                     "Lost: brown dog, collar with registration tag TZ-" + n(1000, 9999) + ". " + tel("Talas") + ".",
                     "Found: bunch of keys on the steps of the Hall of Justice. Ask at the Registry window."]);
      },
      "Personal": function () {
        return pick(["Pensioner, 68, widower, own house in Talas, seeks a kind woman for companionship. " + box() + ".",
                     "To the girl in the green coat on the 7 bus on Tuesday: you dropped your glove. I kept it. " + box() + ".",
                     "Looking for classmates of School No. " + n(1, 30) + ", class of " + n(1975, 1999) + ", for a reunion. " + tel("Talas") + ".",
                     "Thank you to the unknown driver who pulled our car out of the snow on the Ala-Bel road. The " + young().split(" ").slice(1).join(" ") + " family."]);
      }
    };
    var cls = Object.keys(C).map(function (k) {
      var seen = {}, items = [];
      for (var j = 0, m = n(2, 5); j < m; j++) { var t = C[k](); if (!seen[t]) { seen[t] = 1; items.push("<li>" + esc(t) + "</li>"); } }
      return "<section class=\"cls-sec\"><h3>" + esc(k) + "</h3><ul>" + items.join("") + "</ul></section>";
    }).join("");

    root.innerHTML =
      '<p class="cls-meta">As printed in the paper of ' + wd(day) + " " + d(day) + ". Box replies to Herald House, 8 Printers’ Lane, Talas.</p>" +
      '<div class="cls-grid"><div class="cls-family"><h2 class="rule-head">Family notices</h2>' +
      "<h3>Deaths</h3>" + deaths.join("") + (mem.length ? "<h3>In memoriam</h3>" + mem.join("") : "") +
      (births.length ? "<h3>Births</h3>" + births.join("") : "") + (namedays.length ? "<h3>Name days</h3>" + namedays.join("") : "") +
      '</div><div class="cls-ads"><h2 class="rule-head">Classified</h2>' + cls + "</div></div>" +
      '<p class="small">To place a notice or a classified, see <a href="' + BASE + 'advertise.html">Advertise</a>. Notices are accepted at Herald House until 16:00 for the next day’s paper, with the death certificate or a letter from the mosque, church or mahalla committee.</p>';
  }).catch(function () { root.innerHTML = "<p>The classifieds could not be loaded.</p>"; });
})();
