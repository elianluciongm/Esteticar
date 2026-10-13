'use strict';

const WHATSAPP_NUMBER = '5564999501702';

const menuToggle = document.getElementById('menuToggle');
const primaryNav = document.getElementById('primaryNav');
function closeMobileMenu() {
  primaryNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  document.body.classList.remove('menu-open');
}
menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  if (isOpen) {
    closeMobileMenu();
  } else {
    primaryNav.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Fechar menu');
    document.body.classList.add('menu-open');
  }
});
primaryNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));
window.addEventListener('resize', () => {
  if (window.innerWidth > 700) closeMobileMenu();
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMobileMenu();
});

function checkOpeningHours() {
  // Always evaluate in the local timezone of the shop, not the visitor's timezone.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const getPart = name => parts.find(part => part.type === name)?.value || '';
  const weekdays = {Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6};
  const day = weekdays[getPart('weekday')];
  const now = Number(getPart('hour')) * 60 + Number(getPart('minute'));
  const weekdayClosing = 17 * 60 + 50;
  const saturdayClosing = 16 * 60 + 45;
  const closing = day === 6 ? saturdayClosing : weekdayClosing;
  const isOpen = day !== 0 && now >= 8 * 60 && now < closing;
  let message;
  if (isOpen) message = day === 6 ? 'Aberto agora · até 16h45' : 'Aberto agora · até 17h50';
  else if (day === 0) message = 'Fechado hoje · abre segunda às 08h';
  else if (now < 8 * 60) message = 'Fechado agora · abre às 08h';
  else if (day === 6) message = 'Fechado agora · abre segunda às 08h';
  else message = 'Fechado agora · abre amanhã às 08h';
  document.getElementById('topStatus').textContent = message;
  const info = document.getElementById('locationStatus');
  info.lastElementChild.textContent = message;
  info.classList.toggle('closed', !isOpen);
  document.querySelectorAll('.status-dot').forEach(dot => {
    dot.classList.toggle('is-open', isOpen);
    dot.classList.toggle('is-closed', !isOpen);
  });
  document.querySelectorAll('#hoursList [data-day]').forEach(row => {
    row.classList.toggle('is-today', Number(row.dataset.day) === day);
    if (Number(row.dataset.day) === day) row.setAttribute('aria-current', 'date');
    else row.removeAttribute('aria-current');
  });
}
checkOpeningHours();
// Refreshing this message does not mean the site itself makes appointments.
setInterval(checkOpeningHours, 60_000);

document.getElementById('currentYear').textContent = String(new Date().getFullYear());

const dateField = document.getElementById('preferredDate');
const todayInBrazil = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
// Support browsers that format en-CA inconsistently.
const localParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(new Date());
const localValue = type => localParts.find(part => part.type === type).value;
dateField.min = `${localValue('year')}-${localValue('month')}-${localValue('day')}`;

const serviceField = document.getElementById('service');
document.querySelectorAll('.service-link[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    serviceField.value = link.dataset.service;
  });
});

function formatDate(dateValue) {
  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}
const bookingForm = document.getElementById('bookingForm');
const formFeedback = document.getElementById('formFeedback');
bookingForm.addEventListener('submit', event => {
  event.preventDefault();
  formFeedback.textContent = '';
  const name = document.getElementById('clientName').value.trim();
  const vehicle = document.getElementById('vehicle').value;
  const service = serviceField.value;
  const date = dateField.value;
  const period = document.getElementById('preferredPeriod').value;
  const notes = document.getElementById('notes').value.trim();
  if (!name || !vehicle || !service) {
    formFeedback.textContent = 'Informe seu nome, tipo de veículo e serviço desejado.';
    if (!name) document.getElementById('clientName').focus();
    else if (!vehicle) document.getElementById('vehicle').focus();
    else serviceField.focus();
    return;
  }
  if (date && date < dateField.min) {
    formFeedback.textContent = 'Escolha uma data de hoje em diante.';
    dateField.focus();
    return;
  }
  if (date && new Date(`${date}T12:00:00`).getDay() === 0) {
    formFeedback.textContent = 'A EstetiCar está fechada aos domingos. Escolha outro dia.';
    dateField.focus();
    return;
  }
  const message = [
    'Olá, EstetiCar! Gostaria de consultar um atendimento. 🚗',
    '',
    `*Nome:* ${name}`,
    `*Veículo:* ${vehicle}`,
    `*Serviço:* ${service}`,
    ...(date ? [`*Data de preferência:* ${formatDate(date)}`] : []),
    ...(period ? [`*Período:* ${period}`] : []),
    ...(notes ? [`*Observação:* ${notes}`] : []),
    '',
    'Podem me informar a disponibilidade e o valor?'
  ].join('\n');
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  // Navigation occurs only after the user explicitly submits the form.
  const newTab = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newTab) window.location.href = url;
});

const backToTop = document.getElementById('backToTop');
function updateBackToTop() {
  backToTop.classList.toggle('visible', window.scrollY > 460);
}
window.addEventListener('scroll', updateBackToTop, {passive: true});
updateBackToTop();
backToTop.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));

const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: .09, rootMargin: '0px 0px 45px 0px'});
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('revealed'));
}
