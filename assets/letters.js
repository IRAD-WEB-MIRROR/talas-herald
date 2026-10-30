/* Letters to the editor: the write form on letters/index.html (form.lt-form).
   data-mode="mail" opens the writer's e-mail program addressed to data-to; "ref" registers the letter with a
   reference number and remembers it in this browser. Either way nothing is stored on this site. */
(function () {
  "use strict";
  var form = document.querySelector("form.lt-form");
  if (!form) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function load() { try { return JSON.parse(localStorage.getItem("letters:sent") || "[]"); } catch (e) { return []; } }
  function save(v) { try { localStorage.setItem("letters:sent", JSON.stringify(v)); } catch (e) {} }
  function words(t) { return (t.trim().match(/\S+/g) || []).length; }

  var text = form.elements.text, count = form.querySelector(".lt-count"), msg = form.querySelector(".lt-msg");
  var sel = form.elements.about, about = (location.search.match(/[?&]about=([^&]+)/) || [])[1];
  if (about && sel) {
    sel.value = decodeURIComponent(about);
    if (sel.value) setTimeout(function () { form.elements.name.focus(); }, 50);
  }
  function upd() {
    var n = words(text.value);
    count.textContent = n + " / 300 words";
    count.className = "lt-count" + (n > 300 ? " over" : "");
  }
  text.addEventListener("input", upd);
  upd();

  var sent = load();
  if (sent.length) {
    var last = sent[sent.length - 1];
    var p = document.createElement("p");
    p.className = "lt-prev";
    p.innerHTML = "You last wrote to us on " + esc(last.date) + " (reference <b>" + esc(last.ref) + "</b>).";
    form.insertBefore(p, form.firstChild);
  }

  function say(html) { msg.hidden = false; msg.innerHTML = html; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim(), place = form.elements.place.value.trim(), body = text.value.trim();
    if (!name || !place) { say("Please give your name and the district or town where you live. We do not print anonymous letters."); return; }
    if (words(body) < 15) { say("Your letter is very short. Please tell us a little more."); text.focus(); return; }
    if (words(body) > 300) { say("Please keep your letter to 300 words. Longer letters will be cut."); text.focus(); return; }
    var opt = sel && sel.value ? sel.options[sel.selectedIndex].text : "";
    var d = new Date(), date = d.getDate() + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear();
    var ref = "L-" + String(d.getFullYear()).slice(2) + "-" + ("0000" + (hash(name + place + body) % 90000 + 1000)).slice(-5);
    if (form.getAttribute("data-mode") === "mail") {
      var subject = "Letter to the editor" + (opt ? ": " + opt : "");
      var mail = body + "\n\n" + name + "\n" + place;
      location.href = "mailto:" + form.getAttribute("data-to") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(mail);
      say("Your e-mail program should now open with your letter. If it does not, copy your letter and send it to <b>" +
          esc(form.getAttribute("data-to")) + "</b>. We print a selection every Wednesday.");
      return;
    }
    sent.push({ ref: ref, date: date, about: opt });
    save(sent.slice(-10));
    form.reset();
    upd();
    say("Thank you, " + esc(name) + ". Your letter has reached the letters desk, reference <b>" + ref + "</b>. " +
        "We print a selection every Wednesday and cannot reply to every letter. If yours is chosen, it may be edited for length.");
  });
})();
