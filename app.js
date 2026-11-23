document.addEventListener('DOMContentLoaded', () => {
  // ---------- configuración ----------
  const STORAGE_USER = 'demo_user';
  const STORAGE_CITA = 'demo_cita';
  const DEFAULT_CLINICA = 'Clínica Demo No. 68';
  const DEFAULT_CONSULTORIO = '4';
  const DEFAULT_TURNO = 'Matutino';

  // ---------- GSAP (opcional: si no carga, la página funciona igual) ----------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && !reduceMotion;
  if (hasGsap) document.documentElement.classList.add('has-gsap');

  // aparece desde abajo con escalonado
  function animateIn(targets, opts = {}) {
    if (!hasGsap) return;
    gsap.from(targets, {
      opacity: 0,
      y: 18,
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.08,
      clearProps: 'all',
      ...opts
    });
  }

  // sacudida para errores de formulario
  function shake(target) {
    if (!hasGsap) return;
    gsap.fromTo(target, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.25)', clearProps: 'x' });
  }

  // ---------- utilidades ----------
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function readJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ---------- referencias DOM ----------
  const viewLogin = document.getElementById('view-login');
  const viewDashboard = document.getElementById('view-dashboard');
  const loginForm = document.getElementById('login-form');
  const btnDemo = document.getElementById('btn-demo');
  const btnLogout = document.getElementById('btn-logout');
  const serviceCards = document.querySelectorAll('.service-card');
  const workspace = document.getElementById('module-workspace');

  // ---------- vistas y menú ----------
  const views = {
    login: viewLogin,
    dashboard: viewDashboard,
    calendario: document.getElementById('view-calendario'),
    nosotros: document.getElementById('view-nosotros'),
    servicios: document.getElementById('view-servicios'),
    modulos: document.getElementById('view-modulos'),
    video: document.getElementById('view-video')
  };
  const navLinks = document.querySelectorAll('.nav-link');

  function showOnly(name) {
    Object.entries(views).forEach(([key, el]) => {
      if (el) el.classList.toggle('hidden', key !== name);
    });
    const player = document.getElementById('demo-video-player');
    if (name !== 'video' && player && !player.paused) {
      player.pause();
    }
  }

  function setActiveNav(key) {
    navLinks.forEach(btn => btn.classList.toggle('active', btn.dataset.nav === key));
  }

  function closeWorkspace() {
    workspace.classList.add('hidden');
    serviceCards.forEach(c => c.classList.remove('active-card'));
  }

  function bindCloseButton() {
    const closeBtn = document.getElementById('btn-close-workspace');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeWorkspace);
    }
  }

  // aviso flotante
  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function goTo(key) {
    const user = readJSON(STORAGE_USER);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (key === 'nosotros') {
      showOnly('nosotros');
      setActiveNav(key);
      animateIn('#view-nosotros .card', { duration: 0.55 });
      return;
    }

    if (key === 'modulos') {
      showOnly('modulos');
      setActiveNav(key);
      animateIn('#view-modulos .card', { duration: 0.5 });
      return;
    }

    if (key === 'servicios') {
      showOnly('servicios');
      setActiveNav(key);
      animateIn('#view-servicios .card, #view-servicios .principio', { duration: 0.5, stagger: 0.06 });
      return;
    }

    if (key === 'video') {
      showOnly('video');
      setActiveNav(key);
      animateIn('#view-video .card', { duration: 0.5, stagger: 0.1 });
      return;
    }

    if (key === 'inicio') {
      if (user) {
        closeWorkspace();
        showDashboard(user, false);
      } else {
        showOnly('login');
        animateIn('.hero-banner, .login-card', { y: 24, duration: 0.65, stagger: 0.12 });
      }
      setActiveNav(null);
      return;
    }

    if (!user) {
      showOnly('login');
      setActiveNav(null);
      animateIn('.hero-banner, .login-card', { y: 24, duration: 0.65, stagger: 0.12 });
      toast('Inicia sesión para entrar a esta sección.');
      return;
    }

    if (key === 'calendario') {
      showOnly('calendario');
      setActiveNav(key);
      renderCalendar(user);
      return;
    }

    showDashboard(user, false);
    setActiveNav(key);

    if (key === 'citas') {
      serviceCards.forEach(c => c.classList.toggle('active-card', c.dataset.module === 'cita'));
      workspace.classList.remove('hidden');
      renderCitaModule(user);
      animateIn(workspace, { y: 24, stagger: 0 });
      workspace.scrollIntoView({ behavior: 'smooth' });
    }
  }

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => goTo(el.dataset.nav));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goTo(el.dataset.nav);
      }
    });
  });

  // ---------- página "Servicios que ofrecemos" ----------
  const areas = [
    {
      id: 'primer', icon: '🩺', nombre: 'Primer nivel',
      texto: 'Atiende la consulta general, la prevención y el seguimiento de las personas cerca de su hogar. Es la primera puerta de entrada a los servicios de salud.',
      funciones: [
        'Definir los servicios y el personal de cada clínica.',
        'Mantener actualizado el sistema de referencia hacia otros niveles.',
        'Promover el uso responsable de medicamentos y estudios.'
      ]
    },
    {
      id: 'segundo', icon: '🏥', nombre: 'Segundo nivel',
      texto: 'Coordina los hospitales y las clínicas de especialidad para que cuenten con medicamentos, personal, equipo e instalaciones en buen estado.',
      funciones: [
        'Gestionar recursos, personal y abasto de insumos.',
        'Evaluar la calidad de la atención hospitalaria.',
        'Organizar la colaboración con otros niveles de atención.'
      ]
    },
    {
      id: 'enfermeria', icon: '💉', nombre: 'Enfermería',
      texto: 'Impulsa cuidados integrales con trato cálido y profesional, tanto en las unidades como en el acompañamiento a pacientes.',
      funciones: [
        'Vigilar que se apliquen las normas de cuidado.',
        'Acompañar a las personas para que la atención sea oportuna.',
        'Capacitar de forma continua al personal.'
      ]
    },
    {
      id: 'epidemiologia', icon: '📊', nombre: 'Epidemiología',
      texto: 'Observa cómo cambia la salud de la población para detectar riesgos a tiempo y orientar las acciones de prevención.',
      funciones: [
        'Registrar y analizar información de salud.',
        'Emitir alertas ante brotes o riesgos.',
        'Apoyar la toma de decisiones con datos.'
      ]
    },
    {
      id: 'educacion', icon: '🎓', nombre: 'Educación e investigación',
      texto: 'Fortalece la formación del personal y promueve estudios que ayuden a mejorar los servicios.',
      funciones: [
        'Organizar cursos y talleres.',
        'Impulsar proyectos de investigación.',
        'Compartir buenas prácticas entre equipos.'
      ]
    },
    {
      id: 'preventivos', icon: '🌿', nombre: 'Programas preventivos',
      texto: 'Diseña campañas y actividades para cuidar la salud antes de que aparezcan los problemas.',
      funciones: [
        'Campañas de vacunación y chequeos.',
        'Orientación sobre alimentación y actividad física.',
        'Acciones comunitarias en escuelas y colonias.'
      ]
    }
  ];

  const areaTabs = document.getElementById('area-tabs');
  const areaPanel = document.getElementById('area-panel');

  function showArea(id) {
    const area = areas.find(a => a.id === id) || areas[0];

    areaTabs.querySelectorAll('.area-tab').forEach(btn => {
      const active = btn.dataset.area === area.id;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    areaPanel.innerHTML = `
      <div class="area-icon">${area.icon}</div>
      <div>
        <h3>${escapeHTML(area.nombre)}</h3>
        <p class="text-muted" style="margin-bottom: 0.9rem;">${escapeHTML(area.texto)}</p>
        <ul class="area-list">
          ${area.funciones.map(f => `<li>${escapeHTML(f)}</li>`).join('')}
        </ul>
      </div>
    `;
    animateIn('#area-panel > *', { y: 12, duration: 0.35, stagger: 0.08 });
  }

  if (areaTabs && areaPanel) {
    areaTabs.innerHTML = areas.map(a =>
      `<button type="button" class="area-tab" role="tab" data-area="${a.id}">${escapeHTML(a.nombre)}</button>`
    ).join('');
    areaTabs.querySelectorAll('.area-tab').forEach(btn =>
      btn.addEventListener('click', () => showArea(btn.dataset.area))
    );
    showArea(areas[0].id);
  }

  const btnGoDigital = document.getElementById('btn-go-digital');
  if (btnGoDigital) btnGoDigital.addEventListener('click', () => goTo('inicio'));

  // ---------- ubica tu módulo de registro ----------
  const modulos = [
    { id: 1, nombre: 'Módulo Demo Centro', horario: 'Lun a Vie · 9:00 - 17:00', domicilio: 'Av. Juárez 120, Centro, Ecatepec de Morelos', cp: '55000', colonia: 'Centro', municipio: 'Ecatepec de Morelos' },
    { id: 2, nombre: 'Módulo Demo Tulpetlac', horario: 'Lun a Vie · 9:00 - 16:00', domicilio: 'Vía Morelos 850, Santa María Tulpetlac, Ecatepec de Morelos', cp: '55400', colonia: 'Santa María Tulpetlac', municipio: 'Ecatepec de Morelos' },
    { id: 3, nombre: 'Módulo Demo Cerro Gordo', horario: 'Lun a Sáb · 9:00 - 15:00', domicilio: 'Av. Central 45, Cerro Gordo, Ecatepec de Morelos', cp: '55210', colonia: 'Cerro Gordo', municipio: 'Ecatepec de Morelos' },
    { id: 4, nombre: 'Módulo Demo Valle de Aragón', horario: 'Lun a Vie · 8:30 - 16:30', domicilio: 'Av. Carlos Hank González 300, Valle de Aragón, Nezahualcóyotl', cp: '57100', colonia: 'Valle de Aragón', municipio: 'Nezahualcóyotl' },
    { id: 5, nombre: 'Módulo Demo Zócalo', horario: 'Lun a Vie · 9:00 - 18:00', domicilio: 'Plaza de la Constitución, Centro Histórico, Ciudad de México', cp: '06000', colonia: 'Centro Histórico', municipio: 'Cuauhtémoc' },
    { id: 6, nombre: 'Módulo Demo Coyoacán', horario: 'Lun a Vie · 9:00 - 17:00', domicilio: 'Av. Hidalgo 50, Coyoacán Centro, Ciudad de México', cp: '04000', colonia: 'Coyoacán Centro', municipio: 'Coyoacán' },
    { id: 7, nombre: 'Módulo Demo Lindavista', horario: 'Lun a Sáb · 9:00 - 15:00', domicilio: 'Av. Montevideo 200, Lindavista, Ciudad de México', cp: '07300', colonia: 'Lindavista', municipio: 'Gustavo A. Madero' },
    { id: 8, nombre: 'Módulo Demo Naucalpan', horario: 'Lun a Vie · 9:00 - 16:00', domicilio: 'Calzada de los Remedios 10, Naucalpan Centro, Naucalpan de Juárez', cp: '53000', colonia: 'Naucalpan Centro', municipio: 'Naucalpan de Juárez' }
  ];

  const modForm = document.getElementById('mod-form');
  const modSearch = document.getElementById('mod-search');
  const modBody = document.getElementById('mod-body');
  const modCount = document.getElementById('mod-count');
  const modMap = document.getElementById('mod-map');
  let modSelected = modulos[0];

  function setModMap(m) {
    modSelected = m;
    modMap.src = `https://maps.google.com/maps?q=${encodeURIComponent(m.domicilio)}&output=embed`;
  }

  function normalizar(text) {
    return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function renderModulos(query = '') {
    const q = normalizar(query.trim());
    const lista = modulos.filter(m =>
      !q || normalizar([m.nombre, m.colonia, m.cp, m.municipio, m.domicilio].join(' ')).includes(q)
    );

    modCount.textContent = lista.length
      ? `${lista.length} módulo${lista.length === 1 ? '' : 's'} encontrado${lista.length === 1 ? '' : 's'}`
      : 'Sin resultados';

    if (!lista.length) {
      modBody.innerHTML = `<tr><td colspan="4" class="text-muted">No encontramos módulos con esa búsqueda. Prueba con otra colonia, código postal o municipio.</td></tr>`;
      return;
    }

    modBody.innerHTML = lista.map(m => `
      <tr class="${m.id === modSelected.id ? 'selected' : ''}">
        <td><strong>${escapeHTML(m.nombre)}</strong></td>
        <td>${escapeHTML(m.horario)}</td>
        <td>${escapeHTML(m.domicilio)}</td>
        <td><button type="button" class="btn-secondary mod-go" data-id="${m.id}">Ver mapa</button></td>
      </tr>
    `).join('');

    modBody.querySelectorAll('.mod-go').forEach(btn => {
      btn.addEventListener('click', () => {
        setModMap(modulos.find(m => m.id === Number(btn.dataset.id)));
        renderModulos(modSearch.value);
      });
    });

    animateIn('#mod-body tr', { y: 8, duration: 0.3, stagger: 0.04 });
  }

  if (modForm) {
    modForm.addEventListener('submit', (e) => {
      e.preventDefault();
      renderModulos(modSearch.value);
    });
    document.getElementById('mod-clear').addEventListener('click', () => {
      modSearch.value = '';
      renderModulos('');
    });
    setModMap(modulos[0]);
    renderModulos('');
  }

  // animación de entrada de la página
  if (hasGsap) {
    gsap.from('.navbar', { y: -50, opacity: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' });
  }

  // ---------- sesión guardada ----------
  const savedUser = readJSON(STORAGE_USER);
  if (savedUser) {
    showDashboard(savedUser, false);
  } else {
    animateIn('.hero-banner, .login-card', { y: 24, duration: 0.65, stagger: 0.12 });
  }

  // ---------- datos de prueba ----------
  btnDemo.addEventListener('click', () => {
    document.getElementById('curp').value = 'PEMJ900515HDFRRL01';
    document.getElementById('nss').value = '98765432101';
    document.getElementById('email').value = 'juan.perez@ejemplo.com';
    animateIn('#login-form .form-group', { y: 8, duration: 0.3, stagger: 0.05 });
  });

  // ---------- login ----------
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const curp = document.getElementById('curp').value.trim().toUpperCase();
    const nss = document.getElementById('nss').value.trim();
    const email = document.getElementById('email').value.trim();

    if (curp.length !== 18 || nss.length !== 11 || !/^\d{11}$/.test(nss)) {
      shake('.login-card');
      alert('Verifica que la CURP tenga 18 caracteres y el NSS 11 dígitos numéricos.');
      return;
    }

    const userData = {
      nombre: 'Juan Pérez Martínez',
      curp,
      nss,
      email,
      clinica: DEFAULT_CLINICA,
      consultorio: DEFAULT_CONSULTORIO,
      turno: DEFAULT_TURNO
    };

    writeJSON(STORAGE_USER, userData);
    showDashboard(userData, true);
  });

  // ---------- cerrar sesión ----------
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_USER);
    closeWorkspace();
    showOnly('login');
    setActiveNav(null);
    btnLogout.classList.add('hidden');
    loginForm.reset();
    animateIn('.hero-banner, .login-card', { y: 24, duration: 0.6, stagger: 0.12 });
  });

  // ---------- panel principal ----------
  function showDashboard(user, animate = true) {
    document.getElementById('user-greeting').textContent = `Hola, ${user.nombre}`;
    document.getElementById('display-curp').textContent = user.curp;
    document.getElementById('display-nss').textContent = user.nss;
    document.querySelector('.clinic-info').innerHTML = `
      <p><strong>Clínica asignada:</strong> ${escapeHTML(user.clinica || DEFAULT_CLINICA)}</p>
      <p><strong>Consultorio:</strong> ${escapeHTML(user.consultorio || DEFAULT_CONSULTORIO)} &nbsp;|&nbsp; <strong>Turno:</strong> ${escapeHTML(user.turno || DEFAULT_TURNO)}</p>
    `;

    showOnly('dashboard');
    btnLogout.classList.remove('hidden');

    if (animate && hasGsap) {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from('.profile-summary', { opacity: 0, y: 24, duration: 0.5, clearProps: 'all' })
        .from('.service-card', { opacity: 0, y: 30, scale: 0.96, duration: 0.5, stagger: 0.1, clearProps: 'all' }, '-=0.2');
    }
  }

  // ---------- navegación de módulos ----------
  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      const moduleName = card.getAttribute('data-module');
      const currentUser = readJSON(STORAGE_USER);
      if (!currentUser) return;

      serviceCards.forEach(c => c.classList.remove('active-card'));
      card.classList.add('active-card');
      workspace.classList.remove('hidden');

      if (moduleName === 'cita') {
        renderCitaModule(currentUser);
      } else if (moduleName === 'vigencia') {
        renderVigenciaModule(currentUser);
      } else if (moduleName === 'clinica') {
        renderClinicaModule(currentUser);
      } else if (moduleName === 'ubicacion') {
        renderUbicacionModule();
      }

      animateIn(workspace, { y: 24, stagger: 0 });
      workspace.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ---------- cita ----------
  function renderCitaModule(user) {
    const savedCita = readJSON(STORAGE_CITA);
    const clinicaActual = user.clinica || DEFAULT_CLINICA;
    const consultorioActual = user.consultorio || DEFAULT_CONSULTORIO;

    if (savedCita) {
      workspace.innerHTML = `
        <div class="workspace-header">
          <div>
            <h3>Cita Médica Familiar</h3>
            <p class="text-muted">Tienes una cita programada (simulación).</p>
          </div>
          <button type="button" id="btn-close-workspace" class="btn-close-module">Cerrar &times;</button>
        </div>

        <div class="receipt-box">
          <div class="receipt-header">
            <strong>Comprobante de ejemplo</strong>
            <span class="folio-tag">FOLIO: ${escapeHTML(savedCita.folio)}</span>
          </div>
          <div class="receipt-details">
            <p><strong>Paciente:</strong> ${escapeHTML(savedCita.paciente)}</p>
            <p><strong>Clínica:</strong> ${escapeHTML(savedCita.clinica)} (Consultorio ${escapeHTML(savedCita.consultorio)})</p>
            <p><strong>Fecha:</strong> ${escapeHTML(savedCita.fecha)}</p>
            <p><strong>Horario:</strong> ${escapeHTML(savedCita.hora)} hrs (${escapeHTML(savedCita.turno)})</p>
          </div>
          <button id="btn-cancel-cita" class="btn-danger">Cancelar cita</button>
        </div>
      `;

      bindCloseButton();
      animateIn('.receipt-box .receipt-details p', { y: 10, duration: 0.35, stagger: 0.07, delay: 0.2 });

      document.getElementById('btn-cancel-cita').addEventListener('click', () => {
        if (confirm('¿Seguro que deseas cancelar tu cita médica?')) {
          localStorage.removeItem(STORAGE_CITA);
          toast('Cita cancelada.');
          renderCitaModule(user);
        }
      });
      return;
    }

    const horariosPorTurno = {
      Matutino: ['08:00', '08:30', '09:15', '10:00', '11:30', '12:45'],
      Vespertino: ['14:00', '14:45', '15:30', '16:15', '17:00', '18:30']
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0')
    ].join('-');

    workspace.innerHTML = `
      <div class="workspace-header">
        <div>
          <h3>Agendar Cita Médica Familiar</h3>
          <p class="text-muted">Selecciona el turno, fecha y horario disponible en <strong>${escapeHTML(clinicaActual)}</strong>.</p>
        </div>
        <button type="button" id="btn-close-workspace" class="btn-close-module">Cerrar &times;</button>
      </div>

      <form id="cita-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="cita-paciente">Paciente</label>
            <select id="cita-paciente">
              <option value="${escapeHTML(user.nombre)} (Titular)">${escapeHTML(user.nombre)} (Titular)</option>
              <option value="Beneficiario Registrado">Beneficiario Registrado</option>
            </select>
          </div>

          <div class="form-group">
            <label for="cita-turno">Turno</label>
            <select id="cita-turno">
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
            </select>
          </div>

          <div class="form-group">
            <label for="cita-fecha">Fecha de atención</label>
            <input type="date" id="cita-fecha" min="${minDate}" value="${minDate}" required>
          </div>
        </div>

        <div class="form-group">
          <label>Horarios disponibles</label>
          <div id="slots-container" class="slots-grid"></div>
        </div>

        <button type="submit" class="btn-primary">Confirmar cita</button>
      </form>
    `;

    bindCloseButton();

    let selectedSlot = null;
    const turnoSelect = document.getElementById('cita-turno');
    const slotsContainer = document.getElementById('slots-container');

    function renderSlots(turno) {
      selectedSlot = null;
      slotsContainer.innerHTML = horariosPorTurno[turno]
        .map(hora => `<button type="button" class="slot-btn" data-hora="${hora}">${hora}</button>`)
        .join('');

      animateIn('.slot-btn', { y: 10, scale: 0.9, duration: 0.3, stagger: 0.04 });

      slotsContainer.querySelectorAll('.slot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          slotsContainer.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedSlot = btn.getAttribute('data-hora');
          if (hasGsap) {
            gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', clearProps: 'scale' });
          }
        });
      });
    }

    renderSlots('Matutino');
    turnoSelect.addEventListener('change', (e) => renderSlots(e.target.value));

    document.getElementById('cita-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedSlot) {
        shake('#slots-container');
        alert('Por favor selecciona un horario disponible.');
        return;
      }

      const nuevaCita = {
        folio: 'DEMO-' + Math.floor(100000 + Math.random() * 900000),
        paciente: document.getElementById('cita-paciente').value,
        clinica: clinicaActual,
        consultorio: consultorioActual,
        turno: turnoSelect.value,
        fecha: document.getElementById('cita-fecha').value,
        hora: selectedSlot
      };

      writeJSON(STORAGE_CITA, nuevaCita);
      toast('Cita agendada. Puedes verla en el calendario.');
      renderCitaModule(user);
    });
  }

  // ---------- calendario de citas ----------
  const calState = { year: new Date().getFullYear(), month: new Date().getMonth() };

  function renderCalendar(user) {
    const root = document.getElementById('calendar-root');
    const cita = readJSON(STORAGE_CITA);
    const { year, month } = calState;

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7;
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const keyOf = d => `${year}-${pad(month + 1)}-${pad(d)}`;

    const rawTitle = firstDay.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    let cells = '';
    for (let i = 0; i < offset; i++) cells += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const key = keyOf(d);
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const hasCita = cita && cita.fecha === key;
      cells += `<button type="button" class="cal-day${isToday ? ' today' : ''}${hasCita ? ' has-cita' : ''}" data-date="${key}">
        <span>${d}</span>${hasCita ? '<i class="cal-dot"></i>' : ''}
      </button>`;
    }

    root.innerHTML = `
      <div class="cal-head">
        <button type="button" id="cal-prev" class="btn-secondary" aria-label="Mes anterior">‹</button>
        <h3 class="cal-title">${escapeHTML(title)}</h3>
        <button type="button" id="cal-next" class="btn-secondary" aria-label="Mes siguiente">›</button>
      </div>
      <div class="cal-grid">
        ${weekdays.map(w => `<div class="cal-weekday">${w}</div>`).join('')}
        ${cells}
      </div>
      <div id="cal-detail" class="cal-detail"></div>
    `;

    const detail = document.getElementById('cal-detail');

    function showDetail(dateKey) {
      if (cita && cita.fecha === dateKey) {
        detail.innerHTML = `
          <div class="receipt-box">
            <div class="receipt-header">
              <strong>Cita programada</strong>
              <span class="folio-tag">${escapeHTML(cita.folio)}</span>
            </div>
            <div class="receipt-details">
              <p><strong>Paciente:</strong> ${escapeHTML(cita.paciente)}</p>
              <p><strong>Clínica:</strong> ${escapeHTML(cita.clinica)} (Consultorio ${escapeHTML(cita.consultorio)})</p>
              <p><strong>Horario:</strong> ${escapeHTML(cita.hora)} hrs (${escapeHTML(cita.turno)})</p>
            </div>
          </div>`;
      } else {
        detail.innerHTML = `
          <p class="text-muted">No tienes citas este día.</p>
          <button type="button" id="cal-new" class="btn-primary" style="margin-top:0.75rem">Agendar una cita</button>`;
        document.getElementById('cal-new').addEventListener('click', () => goTo('citas'));
      }
      animateIn(detail, { y: 10, duration: 0.35, stagger: 0 });
    }

    root.querySelectorAll('.cal-day[data-date]').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.cal-day.selected').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        showDetail(btn.dataset.date);
      });
    });

    document.getElementById('cal-prev').addEventListener('click', () => {
      calState.month--;
      if (calState.month < 0) { calState.month = 11; calState.year--; }
      renderCalendar(user);
    });
    document.getElementById('cal-next').addEventListener('click', () => {
      calState.month++;
      if (calState.month > 11) { calState.month = 0; calState.year++; }
      renderCalendar(user);
    });

    if (cita) {
      detail.innerHTML = `<p class="text-muted">Próxima cita: <strong>${escapeHTML(cita.fecha)}</strong> a las <strong>${escapeHTML(cita.hora)}</strong> en ${escapeHTML(cita.clinica)}. Toca el día marcado para ver el detalle.</p>`;
    } else {
      detail.innerHTML = `<p class="text-muted">Aún no tienes citas.</p>
        <button type="button" id="cal-new" class="btn-primary" style="margin-top:0.75rem">Agendar una cita</button>`;
      document.getElementById('cal-new').addEventListener('click', () => goTo('citas'));
    }

    animateIn('.cal-day:not(.empty)', { y: 8, duration: 0.3, stagger: 0.01 });
  }

  // ---------- vigencia (documento de ejemplo) ----------
  function renderVigenciaModule(user) {
    const fechaEmision = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const folioDoc = 'DEMO-' + Date.now().toString().slice(-8);

    workspace.innerHTML = `
      <div class="workspace-header no-print">
        <div>
          <h3>Constancia de Vigencia (ejemplo)</h3>
          <p class="text-muted">Documento de simulación académica, sin validez oficial.</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="btn-print-vigencia" class="btn-primary">Imprimir / Guardar PDF</button>
          <button type="button" id="btn-close-workspace" class="btn-close-module">Cerrar &times;</button>
        </div>
      </div>

      <div class="official-doc">
        <div class="doc-header">
          <div class="doc-title">
            <h4>IMSS Digital · Simulación</h4>
            <p>Proyecto escolar — Constancia de ejemplo</p>
          </div>
          <div class="doc-meta">
            <p><strong>Folio:</strong> ${escapeHTML(folioDoc)}</p>
            <p><strong>Fecha:</strong> ${escapeHTML(fechaEmision)}</p>
          </div>
        </div>

        <div class="doc-banner-vigente">
          ESTATUS DE EJEMPLO: VIGENTE (SIMULACIÓN)
        </div>

        <div class="doc-grid">
          <div class="doc-field">
            <span>Nombre</span>
            <strong>${escapeHTML(user.nombre.toUpperCase())}</strong>
          </div>
          <div class="doc-field">
            <span>CURP (ejemplo)</span>
            <strong>${escapeHTML(user.curp)}</strong>
          </div>
          <div class="doc-field">
            <span>NSS (ejemplo)</span>
            <strong>${escapeHTML(user.nss)}</strong>
          </div>
          <div class="doc-field">
            <span>Clínica</span>
            <strong>${escapeHTML(user.clinica || DEFAULT_CLINICA)}</strong>
          </div>
          <div class="doc-field">
            <span>Consultorio y Turno</span>
            <strong>Consultorio ${escapeHTML(user.consultorio || DEFAULT_CONSULTORIO)} — ${escapeHTML(user.turno || DEFAULT_TURNO)}</strong>
          </div>
          <div class="doc-field">
            <span>Correo Electrónico</span>
            <strong>${escapeHTML(user.email)}</strong>
          </div>
        </div>

        <div class="doc-footer-seal">
          <strong>Documento de prueba:</strong> sin sello ni validez oficial · ${escapeHTML(folioDoc)} · ${escapeHTML(new Date().toISOString())}
        </div>
      </div>
    `;

    bindCloseButton();
    animateIn('.doc-field', { y: 14, duration: 0.4, stagger: 0.06, delay: 0.15 });
    animateIn('.doc-banner-vigente', { scale: 0.96, y: 0, duration: 0.5, delay: 0.1 });

    document.getElementById('btn-print-vigencia').addEventListener('click', () => {
      window.print();
    });
  }

  // ---------- cambio de clínica ----------
  function renderClinicaModule(user) {
    const catalogoClinicas = {
      '55000': [
        { nombre: 'Clínica Demo No. 68', direccion: 'Vía Morelos Km 20.5, Tulpetlac, Ecatepec', consultorio: '4', turno: 'Matutino' },
        { nombre: 'Clínica Demo No. 93', direccion: 'Av. Central S/N, Cerro Gordo, Ecatepec', consultorio: '12', turno: 'Vespertino' }
      ],
      '55100': [
        { nombre: 'Clínica Demo No. 76', direccion: 'Av. Carlos Hank González, Valle de Anáhuac', consultorio: '7', turno: 'Matutino' },
        { nombre: 'Clínica Demo No. 191', direccion: 'Av. R-1, Jardines de Santa Clara', consultorio: '2', turno: 'Matutino' }
      ]
    };

    workspace.innerHTML = `
      <div class="workspace-header">
        <div>
          <h3>Alta o Cambio de Clínica</h3>
          <p class="text-muted">Tu clínica actual es <strong>${escapeHTML(user.clinica || DEFAULT_CLINICA)}</strong>. Ingresa tu nuevo Código Postal (5 dígitos) para consultar unidades disponibles.</p>
        </div>
        <button type="button" id="btn-close-workspace" class="btn-close-module">Cerrar &times;</button>
      </div>

      <form id="cp-form" class="search-bar-group">
        <input type="text" id="input-cp" maxlength="5" inputmode="numeric" placeholder="Ej. 55000 o 55100" required>
        <button type="submit" class="btn-primary">Buscar</button>
      </form>

      <div id="clinica-feedback"></div>
      <div id="clinics-results" class="clinics-list"></div>
    `;

    bindCloseButton();

    const cpForm = document.getElementById('cp-form');
    const resultsContainer = document.getElementById('clinics-results');
    const feedbackContainer = document.getElementById('clinica-feedback');

    cpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cp = document.getElementById('input-cp').value.trim();

      if (!/^\d{5}$/.test(cp)) {
        shake(cpForm);
        alert('Ingresa un Código Postal válido de 5 dígitos.');
        return;
      }

      const resultados = catalogoClinicas[cp] || [
        { nombre: `Clínica Demo No. ${cp.slice(-2)}`, direccion: `Zona Centro, C.P. ${cp}`, consultorio: '5', turno: 'Matutino' },
        { nombre: `Clínica Demo No. 1${cp.slice(-2)}`, direccion: `Sector Norte, C.P. ${cp}`, consultorio: '9', turno: 'Vespertino' }
      ];

      resultsContainer.innerHTML = resultados.map((item, index) => `
        <div class="clinic-option">
          <div>
            <h4>${escapeHTML(item.nombre)}</h4>
            <p>${escapeHTML(item.direccion)}</p>
            <p><strong>Asignación disponible:</strong> Consultorio ${escapeHTML(item.consultorio)} — Turno ${escapeHTML(item.turno)}</p>
          </div>
          <button type="button" class="btn-primary btn-select-clinic" data-index="${index}">
            Asignar clínica
          </button>
        </div>
      `).join('');

      animateIn('.clinic-option', { y: 20, duration: 0.45, stagger: 0.12 });

      resultsContainer.querySelectorAll('.btn-select-clinic').forEach(btn => {
        btn.addEventListener('click', () => {
          const elegida = resultados[btn.getAttribute('data-index')];

          user.clinica = elegida.nombre;
          user.consultorio = elegida.consultorio;
          user.turno = elegida.turno;
          writeJSON(STORAGE_USER, user);

          showDashboard(user, false);

          feedbackContainer.innerHTML = `
            <div class="alert-success">
              Cambio realizado con éxito. Tu nueva unidad asignada es <strong>${escapeHTML(elegida.nombre)}</strong> (Consultorio ${escapeHTML(elegida.consultorio)}, Turno ${escapeHTML(elegida.turno)}).
            </div>
          `;
          animateIn('.alert-success', { y: -10, duration: 0.4, stagger: 0 });
          resultsContainer.innerHTML = '';
        });
      });
    });
  }

  // ---------- ubicación ----------
  function renderUbicacionModule() {
    const inmuebles = [
      {
        id: 1,
        tipo: 'Clínica UMF',
        nombre: 'Clínica Demo No. 68 Tulpetlac',
        direccion: 'Vía Morelos Km 20.5, Santa María Tulpetlac, Ecatepec',
        horario: 'Lunes a Viernes: 08:00 - 20:00 hrs',
        queryMapa: 'clinica+Tulpetlac+Ecatepec'
      },
      {
        id: 2,
        tipo: 'Hospital',
        nombre: 'Hospital Demo Regional Valle de Aragón',
        direccion: 'Av. Carlos Hank González S/N, Valle de Aragón 3ra Secc.',
        horario: 'Urgencias: 24 horas / Consulta externa: 08:00 - 20:00 hrs',
        queryMapa: 'hospital+Valle+de+Aragon+Ecatepec'
      },
      {
        id: 3,
        tipo: 'Clínica UMF',
        nombre: 'Clínica Demo No. 93 Cerro Gordo',
        direccion: 'Av. Central S/N, Santa Clara Coatitla, Ecatepec',
        horario: 'Lunes a Viernes: 08:00 - 20:00 hrs',
        queryMapa: 'clinica+Santa+Clara+Coatitla+Ecatepec'
      },
      {
        id: 4,
        tipo: 'Hospital',
        nombre: 'Hospital Demo de Zona Xalostoc',
        direccion: 'Antigua Carretera a Pachuca Km 12.5, San Pedro Xalostoc',
        horario: 'Urgencias: 24 horas',
        queryMapa: 'hospital+Xalostoc+Ecatepec'
      },
      {
        id: 5,
        tipo: 'Subdelegación',
        nombre: 'Oficina Administrativa Demo Ecatepec',
        direccion: 'Av. Insurgentes No. 12, San Cristóbal Centro, Ecatepec',
        horario: 'Lunes a Viernes: 08:00 - 15:30 hrs (Trámites administrativos)',
        queryMapa: 'San+Cristobal+Centro+Ecatepec'
      }
    ];

    let filtroTipo = 'Todos';
    let textoBusqueda = '';
    let seleccionado = inmuebles[0];

    workspace.innerHTML = `
      <div class="workspace-header">
        <div>
          <h3>Ubicación de Clínicas y Hospitales</h3>
          <p class="text-muted">Consulta clínicas, hospitales y oficinas cercanas y visualiza su ubicación (datos de ejemplo).</p>
        </div>
        <button type="button" id="btn-close-workspace" class="btn-close-module">Cerrar &times;</button>
      </div>

      <div class="search-bar-group" style="max-width: 100%; margin-top: 1rem;">
        <input type="text" id="search-inmueble" placeholder="Buscar por número de clínica, hospital o colonia...">
      </div>

      <div class="filter-pills">
        <button type="button" class="pill-btn active" data-filter="Todos">Todos</button>
        <button type="button" class="pill-btn" data-filter="Clínica UMF">Clínicas</button>
        <button type="button" class="pill-btn" data-filter="Hospital">Hospitales</button>
        <button type="button" class="pill-btn" data-filter="Subdelegación">Oficinas</button>
      </div>

      <div class="locations-layout">
        <div id="locations-list" class="locations-list"></div>
        <div class="map-container">
          <iframe id="imss-map-frame" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=${seleccionado.queryMapa}&output=embed">
          </iframe>
        </div>
      </div>
    `;

    bindCloseButton();

    const listContainer = document.getElementById('locations-list');
    const mapFrame = document.getElementById('imss-map-frame');
    const searchInput = document.getElementById('search-inmueble');

    function renderLista(animate = false) {
      const filtrados = inmuebles.filter(item => {
        const coincideTipo = filtroTipo === 'Todos' || item.tipo === filtroTipo;
        const coincideTexto = item.nombre.toLowerCase().includes(textoBusqueda) ||
                              item.direccion.toLowerCase().includes(textoBusqueda);
        return coincideTipo && coincideTexto;
      });

      if (filtrados.length === 0) {
        listContainer.innerHTML = `<p class="text-muted">No se encontraron resultados con ese criterio.</p>`;
        return;
      }

      listContainer.innerHTML = filtrados.map(item => `
        <div class="location-item ${item.id === seleccionado.id ? 'selected' : ''}" data-id="${item.id}">
          <span class="location-type">${escapeHTML(item.tipo)}</span>
          <h4>${escapeHTML(item.nombre)}</h4>
          <p>${escapeHTML(item.direccion)}</p>
          <p style="margin-top: 0.25rem;"><strong>Horario:</strong> ${escapeHTML(item.horario)}</p>
        </div>
      `).join('');

      if (animate) animateIn('.location-item', { x: -16, y: 0, duration: 0.35, stagger: 0.06 });

      listContainer.querySelectorAll('.location-item').forEach(el => {
        el.addEventListener('click', () => {
          const id = Number(el.getAttribute('data-id'));
          seleccionado = inmuebles.find(i => i.id === id);
          mapFrame.src = `https://maps.google.com/maps?q=${seleccionado.queryMapa}&output=embed`;
          renderLista();
        });
      });
    }

    workspace.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        workspace.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroTipo = btn.getAttribute('data-filter');
        renderLista(true);
      });
    });

    searchInput.addEventListener('input', (e) => {
      textoBusqueda = e.target.value.toLowerCase().trim();
      renderLista();
    });

    renderLista(true);
  }
});