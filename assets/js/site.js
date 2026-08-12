/* ============================================================
   JOY MEMORIES — site behaviour
   Hash-routed single page, availability calendar, enquiry forms.
   ============================================================ */

/* ---------- configuration ----------
   The only block you should need to edit day to day. */
const CONFIG = {
  /* Where enquiries go. Leave empty and the forms fall back to opening the
     visitor's mail app with everything pre-filled — no data is ever silently
     dropped. Paste a form endpoint (Formspree, Basin, Getform, a Worker…)
     here to have them posted instead. */
  formEndpoint: '',
  enquiryEmail: 'hello@joymemories.com.au',

  /* Dates already taken, as YYYY-MM-DD. Everything else on a shoot day is
     offered as open. */
  bookedDates: [
    '2026-09-05', '2026-09-12', '2026-09-26',
    '2026-10-10', '2026-10-17', '2026-11-07',
  ],

  shootDays: [0, 4, 5, 6],  // Sun, Thu, Fri, Sat
  leadTimeDays: 3,          // earliest bookable date, from today
  monthsAhead: 11,          // how far forward the calendar will page
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------- routing ---------- */
const PAGES = ['home', 'portfolio', 'services', 'pricing', 'about', 'book', 'contact'];
const nav = $('#nav');
const burger = $('#burger');

function go(name, push = true) {
  if (!PAGES.includes(name)) name = 'home';
  $$('.page').forEach(p => p.classList.remove('live'));
  $('#page-' + name).classList.add('live');
  $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.go === name));
  if (push && location.hash !== '#' + name) history.pushState({}, '', '#' + name);
  window.scrollTo({ top: 0, behavior: 'instant' });
  closeNav();
  requestAnimationFrame(observeAll);
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go]');
  if (!t) return;
  e.preventDefault();
  go(t.dataset.go);
});
window.addEventListener('popstate', () => go(location.hash.slice(1) || 'home', false));

/* ---------- mobile nav ---------- */
function closeNav() {
  nav.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  burger.textContent = 'Menu';
}
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
  burger.textContent = open ? 'Close' : 'Menu';
});

/* ---------- scroll reveal ---------- */
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) {
    e.target.classList.add('seen');
    io.unobserve(e.target);
  }
}), { threshold: .12, rootMargin: '0px 0px -40px' });

function observeAll() {
  $$('.page.live .reveal:not(.seen)').forEach(el => io.observe(el));
}

/* ---------- portfolio filter ---------- */
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  $$('#filters button').forEach(x => {
    const on = x === b;
    x.classList.toggle('on', on);
    x.setAttribute('aria-pressed', String(on));
  });
  const f = b.dataset.f;
  $$('#gallery .mount').forEach(m => {
    m.hidden = !(f === 'all' || m.dataset.c === f);
  });
});

/* ---------- availability calendar ---------- */
const booked = new Set(CONFIG.bookedDates);
const grid = $('#calGrid');
const calTitle = $('#calTitle');
const prevM = $('#prevM');
const nextM = $('#nextM');

const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const today = startOfDay(new Date());
const earliest = new Date(today.getFullYear(), today.getMonth(), today.getDate() + CONFIG.leadTimeDays);
const firstMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const lastMonth = new Date(today.getFullYear(), today.getMonth() + CONFIG.monthsAhead, 1);
let view = new Date(firstMonth);

function isOpenDay(d) {
  if (!CONFIG.shootDays.includes(d.getDay())) return false;
  if (d < earliest) return false;
  return !booked.has(iso(d));
}

function drawCalendar() {
  calTitle.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
  grid.innerHTML = '';

  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, i) => {
    const h = document.createElement('div');
    h.className = 'dow';
    h.textContent = d;
    h.setAttribute('aria-hidden', 'true');
    h.title = DAY_NAMES[(i + 1) % 7];
    grid.appendChild(h);
  });

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;                                  // Monday-first grid
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  for (let i = 0; i < lead; i++) {
    const blank = document.createElement('div');
    blank.className = 'day blank';
    grid.appendChild(blank);
  }

  for (let n = 1; n <= days; n++) {
    const d = new Date(view.getFullYear(), view.getMonth(), n);
    const open = isOpenDay(d);
    const cell = document.createElement(open ? 'button' : 'div');
    cell.className = 'day ' + (open ? 'free' : (d >= earliest ? 'taken' : ''));
    cell.textContent = n;

    if (open) {
      const label = `${DAY_NAMES[d.getDay()]} ${n} ${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
      cell.type = 'button';
      cell.dataset.date = iso(d);
      cell.setAttribute('aria-label', 'Request ' + label);
      cell.addEventListener('click', () => {
        $$('.day.sel').forEach(x => x.classList.remove('sel'));
        cell.classList.add('sel');
        const field = $('#b-date');
        field.value = label;
        field.dataset.iso = cell.dataset.date;
      });
    }
    grid.appendChild(cell);
  }

  prevM.disabled = view <= firstMonth;
  nextM.disabled = view >= lastMonth;
}

prevM.addEventListener('click', () => { view.setMonth(view.getMonth() - 1); drawCalendar(); });
nextM.addEventListener('click', () => { view.setMonth(view.getMonth() + 1); drawCalendar(); });
drawCalendar();

/* ---------- enquiry forms ---------- */
function report(panel, title, body, isError = false) {
  panel.innerHTML = `<b></b><p></p>`;
  panel.querySelector('b').textContent = title;
  panel.querySelector('p').textContent = body;
  panel.classList.toggle('err', isError);
  panel.classList.add('show');
  panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function collect(form) {
  const data = {};
  $$('input, select, textarea', form).forEach(el => {
    const label = $(`label[for="${el.id}"]`, form);
    data[label ? label.textContent.trim() : el.id] = el.value.trim();
  });
  return data;
}

function mailtoFor(subject, data) {
  const body = Object.entries(data)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  return `mailto:${CONFIG.enquiryEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function wire(formId, panelId, subject) {
  const form = $('#' + formId);
  const panel = $('#' + panelId);
  const button = $('button[type="submit"]', form);

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const missing = $$('[required]', form).filter(el => !el.value.trim());
    if (missing.length) {
      missing[0].focus();
      report(panel, 'Almost there.', 'Please fill in your name and email so I can reply.', true);
      return;
    }
    const email = $('input[type="email"]', form);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      email.focus();
      report(panel, 'Check that email.', 'That address doesn\'t look quite right — I won\'t be able to reply to it.', true);
      return;
    }

    const data = collect(form);

    if (!CONFIG.formEndpoint) {
      window.location.href = mailtoFor(subject, data);
      report(panel, 'Nearly sent.',
        `Your mail app should have opened with everything filled in — just hit send. If it didn't, email me at ${CONFIG.enquiryEmail}.`);
      return;
    }

    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: subject, ...data }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      report(panel, subject.includes('Booking') ? 'Enquiry sent.' : 'Message sent.',
        'Thanks — I\'ve got it. You\'ll hear back from me within one business day, usually sooner.');
    } catch (err) {
      report(panel, 'That didn\'t go through.',
        `Sorry — something went wrong sending that. Please email me directly at ${CONFIG.enquiryEmail}.`, true);
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  });
}

wire('bookForm', 'bookSent', 'Booking enquiry — Joy Memories');
wire('contactForm', 'contactSent', 'Website enquiry — Joy Memories');

/* ---------- boot ---------- */
go(location.hash.slice(1) || 'home', false);
observeAll();
