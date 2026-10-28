// Gardner Solutions – meny, scroll-historie, kalkulator og skjema
(function () {
  "use strict";

  var rolig = window.matchMedia("(prefers-reduced-motion: reduce)");
  var stor = window.matchMedia("(min-width: 981px) and (prefers-reduced-motion: no-preference)");

  /* ---------- Mobilmeny ---------- */
  var knapp = document.querySelector(".meny-knapp");
  var panel = document.getElementById("meny-panel");
  if (knapp && panel) {
    var sett = function (apen) {
      panel.classList.toggle("apen", apen);
      knapp.setAttribute("aria-expanded", apen ? "true" : "false");
      knapp.setAttribute("aria-label", apen ? "Lukk meny" : "Åpne meny");
      document.body.style.overflow = apen ? "hidden" : "";
    };
    knapp.addEventListener("click", function () { sett(!panel.classList.contains("apen")); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) sett(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("apen")) { sett(false); knapp.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 980) sett(false); });
  }

  /* ---------- Scroll-historien ---------- */
  var spor = document.querySelector(".historie-spor");
  if (spor) {
    var steg = Array.prototype.slice.call(spor.querySelectorAll(".steg"));
    var fremdrift = spor.querySelector(".fremdrift");
    var svar = spor.querySelector("[data-skriv]");
    var svarTekst = svar ? svar.querySelector(".svar-tekst") : null;
    var fulltSvar = svarTekst ? svarTekst.textContent : "";
    var skrevet = false;
    var stoppSkriving = null;

    var skrivSvar = function () {
      if (!svar || skrevet) return;
      skrevet = true;
      if (rolig.matches) { svar.classList.add("ferdigskrevet"); return; }
      svarTekst.textContent = "";
      svarTekst.classList.add("skriver");
      var i = 0;
      var start = setTimeout(function neste() {
        i += 2;
        svarTekst.textContent = fulltSvar.slice(0, i);
        if (i < fulltSvar.length) { start = setTimeout(neste, 28); }
        else { svarTekst.classList.remove("skriver"); svar.classList.add("ferdigskrevet"); }
      }, 700);
      stoppSkriving = function () { clearTimeout(start); };
    };

    var aktiver = function (el) {
      if (el.classList.contains("aktiv")) return;
      el.classList.add("aktiv");
      if (el.querySelector("[data-skriv]")) skrivSvar();
    };

    // Rolig bevegelse: alt vises ferdig
    if (rolig.matches) {
      steg.forEach(function (el) { el.classList.add("ferdig"); });
      if (svar) svar.classList.add("ferdigskrevet");
    }

    // PC: aktivt steg følger scroll-posisjonen
    var stottarTidslinje = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
    var paScroll = function () {
      if (!stor.matches) return;
      var r = spor.getBoundingClientRect();
      var lengde = r.height - window.innerHeight;
      var p = Math.min(1, Math.max(0, -r.top / (lengde > 0 ? lengde : 1)));
      var nr = Math.min(steg.length - 1, Math.floor(p * steg.length));
      steg.forEach(function (el, i) {
        if (i === nr) aktiver(el); else el.classList.remove("aktiv");
      });
      if (fremdrift && !stottarTidslinje) fremdrift.style.setProperty("--p", p.toFixed(3));
    };

    // Mobil: hvert steg spilles av én gang når det kommer til syne
    var observator = null;
    var startMobil = function () {
      if (observator || stor.matches || !("IntersectionObserver" in window)) return;
      observator = new IntersectionObserver(function (oppf) {
        oppf.forEach(function (o) {
          if (o.isIntersecting) { aktiver(o.target); observator.unobserve(o.target); }
        });
      }, { threshold: 0.35 });
      steg.forEach(function (el) { if (!el.classList.contains("aktiv")) observator.observe(el); });
    };

    var oppsett = function () {
      if (stor.matches) {
        if (observator) { observator.disconnect(); observator = null; }
        paScroll();
      } else {
        startMobil();
      }
    };
    window.addEventListener("scroll", paScroll, { passive: true });
    window.addEventListener("resize", oppsett);
    oppsett();
    if (!("IntersectionObserver" in window) && !stor.matches) steg.forEach(aktiver);
  }

  /* ---------- Kalkulator ---------- */
  var kalk = document.getElementById("kalkulator");
  if (kalk) {
    var fmt = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });
    var felt = {
      folk: kalk.querySelector("#k-folk"),
      timer: kalk.querySelector("#k-timer"),
      kost: kalk.querySelector("#k-kost")
    };
    var vis = {
      folk: kalk.querySelector("#v-folk"),
      timer: kalk.querySelector("#v-timer"),
      kost: kalk.querySelector("#v-kost"),
      timerAar: kalk.querySelector("#r-timer"),
      kronerAar: kalk.querySelector("#r-kroner")
    };
    var UKER = 46;
    var regn = function () {
      var f = +felt.folk.value, t = +felt.timer.value, k = +felt.kost.value;
      vis.folk.textContent = fmt.format(f);
      vis.timer.textContent = fmt.format(t);
      vis.kost.textContent = fmt.format(k) + " kr";
      var timerAar = f * t * UKER;
      vis.timerAar.textContent = fmt.format(timerAar);
      vis.kronerAar.textContent = fmt.format(timerAar * k) + " kr";
      Object.keys(felt).forEach(function (n) {
        var el = felt[n];
        var pst = ((el.value - el.min) / (el.max - el.min)) * 100;
        el.style.setProperty("--fyll", pst + "%");
      });
    };
    kalk.addEventListener("input", regn);
    regn();
  }

  /* ---------- Kontaktskjema (Formspree) ---------- */
  var skjema = document.getElementById("kartlegging-skjema");
  if (skjema) {
    var feil = document.getElementById("skjema-feil");
    var takk = document.getElementById("skjema-takk");
    skjema.addEventListener("submit", function (e) {
      e.preventDefault();
      feil.hidden = true;
      if (!skjema.checkValidity()) { skjema.reportValidity(); return; }
      if (skjema.action.indexOf("DIN-SKJEMA-ID") !== -1) {
        feil.textContent = "Skjemaet er ikke koblet til ennå. Ring meg på 463 20 132.";
        feil.hidden = false;
        return;
      }
      var send = skjema.querySelector("button[type=submit]");
      send.disabled = true;
      send.textContent = "Sender …";
      fetch(skjema.action, { method: "POST", body: new FormData(skjema), headers: { Accept: "application/json" } })
        .then(function (svar) {
          if (!svar.ok) throw new Error("Feil " + svar.status);
          skjema.hidden = true;
          takk.hidden = false;
          takk.focus();
        })
        .catch(function () {
          feil.textContent = "Noe gikk galt. Prøv igjen, eller ring meg på 463 20 132.";
          feil.hidden = false;
          send.disabled = false;
          send.textContent = "Book kartlegging";
        });
    });
  }
})();
