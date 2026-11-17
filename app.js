document.addEventListener('DOMContentLoaded', () => {
  // referencias dom
  const viewLogin = document.getElementById('view-login');
  const viewDashboard = document.getElementById('view-dashboard');
  const loginForm = document.getElementById('login-form');
  const btnDemo = document.getElementById('btn-demo');
  const btnLogout = document.getElementById('btn-logout');
  const serviceCards = document.querySelectorAll('.service-card');
  const workspace = document.getElementById('module-workspace');

  // sesion guardada
  const savedUser = JSON.parse(localStorage.getItem('imss_user'));
  if (savedUser) {
    showDashboard(savedUser);
  }

  // datos prueba
  btnDemo.addEventListener('click', () => {
    document.getElementById('curp').value = 'PEMJ900515HDFRRL01';
    document.getElementById('nss').value = '98765432101';
    document.getElementById('email').value = 'juan.perez@ejemplo.com';
  });

  // login
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const curp = document.getElementById('curp').value.trim().toUpperCase();
    const nss = document.getElementById('nss').value.trim();
    const email = document.getElementById('email').value.trim();

    if (curp.length !== 18 || nss.length !== 11 || isNaN(nss)) {
      alert('Verifica que la CURP tenga 18 caracteres y el NSS 11 dígitos numéricos.');
      return;
    }

    const userData = {
      nombre: 'Juan Pérez Martínez',
      curp,
      nss,
      email,
      clinica: 'UMF No. 68',
      consultorio: '4',
      turno: 'Matutino'
    };

    localStorage.setItem('imss_user', JSON.stringify(userData));
    showDashboard(userData);
  });

  // cerrar s
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('imss_user');
    workspace.classList.add('hidden');
    viewDashboard.classList.add('hidden');
    btnLogout.classList.add('hidden');
    viewLogin.classList.remove('hidden');
    loginForm.reset();
  });

  // panel p
  function showDashboard(user) {
    document.getElementById('user-greeting').textContent = `Hola, ${user.nombre}`;
    document.getElementById('display-curp').textContent = user.curp;
    document.getElementById('display-nss').textContent = user.nss;
    document.querySelector('.clinic-info').innerHTML = `
      <p><strong>Clínica asignada:</strong> ${user.clinica || 'UMF No. 68'}</p>
      <p><strong>Consultorio:</strong> ${user.consultorio || '4'} | <strong>Turno:</strong> ${user.turno || 'Matutino'}</p>
    `;

    viewLogin.classList.add('hidden');
    viewDashboard.classList.remove('hidden');
    btnLogout.classList.remove('hidden');
  }

  // nav modulos
  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      const moduleName = card.getAttribute('data-module');
      const currentUser = JSON.parse(localStorage.getItem('imss_user'));
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

      workspace.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // cita
  function renderCitaModule(user) {
    const savedCita = JSON.parse(localStorage.getItem('imss_cita'));
    const clinicaActual = user.clinica || 'UMF No. 68';
    const consultorioActual = user.consultorio || '4';

    if (savedCita) {
      workspace.innerHTML = `
        <h3>Cita Médica Familiar</h3>
        <p class="text-muted">Tienes una cita programada en tu Unidad de Medicina Familiar.</p>
        
        <div class="receipt-box">
          <div class="receipt-header">
            <strong>Comprobante Digital</strong>
            <span class="folio-tag">FOLIO: ${savedCita.folio}</span>
          </div>
          <div class="receipt-details">
            <p><strong>Paciente:</strong> ${savedCita.paciente}</p>
            <p><strong>Clínica:</strong> ${savedCita.clinica} (Consultorio ${savedCita.consultorio})</p>
            <p><strong>Fecha:</strong> ${savedCita.fecha}</p>
            <p><strong>Horario:</strong> ${savedCita.hora} hrs (${savedCita.turno})</p>
          </div>
          <button id="btn-cancel-cita" class="btn-danger">Cancelar cita</button>
        </div>
      `;

      document.getElementById('btn-cancel-cita').addEventListener('click', () => {
        if (confirm('¿Seguro que deseas cancelar tu cita médica?')) {
          localStorage.removeItem('imss_cita');
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
    const minDate = tomorrow.toISOString().split('T')[0];

    workspace.innerHTML = `
      <h3>Agendar Cita Médica Familiar</h3>
      <p class="text-muted">Selecciona el turno, fecha y horario disponible en <strong>${clinicaActual}</strong>.</p>

      <form id="cita-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="cita-paciente">Paciente</label>
            <select id="cita-paciente">
              <option value="${user.nombre} (Titular)">${user.nombre} (Titular)</option>
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

    let selectedSlot = null;
    const turnoSelect = document.getElementById('cita-turno');
    const slotsContainer = document.getElementById('slots-container');

    function renderSlots(turno) {
      selectedSlot = null;
      slotsContainer.innerHTML = horariosPorTurno[turno]
        .map(hora => `<button type="button" class="slot-btn" data-hora="${hora}">${hora}</button>`)
        .join('');

      slotsContainer.querySelectorAll('.slot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          slotsContainer.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedSlot = btn.getAttribute('data-hora');
        });
      });
    }

    renderSlots('Matutino');
    turnoSelect.addEventListener('change', (e) => renderSlots(e.target.value));

    document.getElementById('cita-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedSlot) {
        alert('Por favor selecciona un horario disponible.');
        return;
      }

      const nuevaCita = {
        folio: 'IMSS-' + Math.floor(100000 + Math.random() * 900000),
        paciente: document.getElementById('cita-paciente').value,
        clinica: clinicaActual,
        consultorio: consultorioActual,
        turno: turnoSelect.value,
        fecha: document.getElementById('cita-fecha').value,
        hora: selectedSlot
      };

      localStorage.setItem('imss_cita', JSON.stringify(nuevaCita));
      renderCitaModule(user);
    });
  }

  // vig derechos
  function renderVigenciaModule(user) {
    const fechaEmision = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const folioDoc = 'VD-' + Date.now().toString().slice(-8);

    workspace.innerHTML = `
      <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3>Constancia de Vigencia de Derechos</h3>
          <p class="text-muted">Documento oficial con validez para atención médica.</p>
        </div>
        <button id="btn-print-vigencia" class="btn-primary">Imprimir / Guardar PDF</button>
      </div>

      <div class="official-doc">
        <div class="doc-header">
          <div class="doc-title">
            <h4>Instituto Mexicano del Seguro Social</h4>
            <p>Dirección de Incorporación y Recaudación — Constancia de Vigencia</p>
          </div>
          <div class="doc-meta">
            <p><strong>Folio:</strong> ${folioDoc}</p>
            <p><strong>Fecha:</strong> ${fechaEmision}</p>
          </div>
        </div>

        <div class="doc-banner-vigente">
          ESTATUS: CON DERECHO A SERVICIO MÉDICO (VIGENTE)
        </div>

        <div class="doc-grid">
          <div class="doc-field">
            <span>Nombre del Asegurado</span>
            <strong>${user.nombre.toUpperCase()}</strong>
          </div>
          <div class="doc-field">
            <span>CURP</span>
            <strong>${user.curp}</strong>
          </div>
          <div class="doc-field">
            <span>Número de Seguridad Social (NSS)</span>
            <strong>${user.nss}</strong>
          </div>
          <div class="doc-field">
            <span>Unidad de Medicina Familiar</span>
            <strong>${user.clinica || 'UMF No. 68'}</strong>
          </div>
          <div class="doc-field">
            <span>Consultorio y Turno</span>
            <strong>Consultorio ${user.consultorio || '4'} — ${user.turno || 'Matutino'}</strong>
          </div>
          <div class="doc-field">
            <span>Correo Electrónico Registrado</span>
            <strong>${user.email}</strong>
          </div>
        </div>

        <div class="doc-footer-seal">
          <strong>Sello Digital IMSS:</strong> ||1.0|${folioDoc}|${user.curp}|${user.nss}|VIGENTE|${new Date().toISOString()}||
        </div>
      </div>
    `;

    document.getElementById('btn-print-vigencia').addEventListener('click', () => {
      window.print();
    });
  }

  // cambio clinica
  function renderClinicaModule(user) {
    const catalogoClinicas = {
      '55000': [
        { nombre: 'UMF No. 68', direccion: 'Vía Morelos Km 20.5, Tulpetlac, Ecatepec', consultorio: '4', turno: 'Matutino' },
        { nombre: 'UMF No. 93', direccion: 'Av. Central S/N, Cerro Gordo, Ecatepec', consultorio: '12', turno: 'Vespertino' }
      ],
      '55100': [
        { nombre: 'UMF No. 76', direccion: 'Av. Carlos Hank González, Valle de Anáhuac', consultorio: '7', turno: 'Matutino' },
        { nombre: 'UMF No. 191', direccion: 'Av. R-1, Jardines de Santa Clara', consultorio: '2', turno: 'Matutino' }
      ]
    };

    workspace.innerHTML = `
      <h3>Alta o Cambio de Clínica (UMF)</h3>
      <p class="text-muted">Tu clínica actual es <strong>${user.clinica || 'UMF No. 68'}</strong>. Ingresa tu nuevo Código Postal (5 dígitos) para consultar unidades disponibles.</p>

      <form id="cp-form" class="search-bar-group">
        <input type="text" id="input-cp" maxlength="5" placeholder="Ej. 55000 o 55100" required>
        <button type="submit" class="btn-primary">Buscar</button>
      </form>

      <div id="clinica-feedback"></div>
      <div id="clinics-results" class="clinics-list"></div>
    `;

    const cpForm = document.getElementById('cp-form');
    const resultsContainer = document.getElementById('clinics-results');
    const feedbackContainer = document.getElementById('clinica-feedback');

    cpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cp = document.getElementById('input-cp').value.trim();

      if (cp.length !== 5 || isNaN(cp)) {
        alert('Ingresa un Código Postal válido de 5 dígitos.');
        return;
      }

      const resultados = catalogoClinicas[cp] || [
        { nombre: `UMF No. ${cp.slice(-2)}`, direccion: `Zona Centro, C.P. ${cp}`, consultorio: '5', turno: 'Matutino' },
        { nombre: `UMF No. 1${cp.slice(-2)}`, direccion: `Sector Norte, C.P. ${cp}`, consultorio: '9', turno: 'Vespertino' }
      ];

      resultsContainer.innerHTML = resultados.map((item, index) => `
        <div class="clinic-option">
          <div>
            <h4>${item.nombre}</h4>
            <p>${item.direccion}</p>
            <p><strong>Asignación disponible:</strong> Consultorio ${item.consultorio} — Turno ${item.turno}</p>
          </div>
          <button type="button" class="btn-primary btn-select-clinic" data-index="${index}">
            Asignar clínica
          </button>
        </div>
      `).join('');

      resultsContainer.querySelectorAll('.btn-select-clinic').forEach(btn => {
        btn.addEventListener('click', () => {
          const elegida = resultados[btn.getAttribute('data-index')];
          
          user.clinica = elegida.nombre;
          user.consultorio = elegida.consultorio;
          user.turno = elegida.turno;
          localStorage.setItem('imss_user', JSON.stringify(user));

          showDashboard(user);

          feedbackContainer.innerHTML = `
            <div class="alert-success">
              Cambio realizado con éxito. Tu nueva unidad asignada es <strong>${elegida.nombre}</strong> (Consultorio ${elegida.consultorio}, Turno ${elegida.turno}).
            </div>
          `;
          resultsContainer.innerHTML = '';
        });
      });
    });
  }

  // ubicacion
  function renderUbicacionModule() {
    const inmuebles = [
      {
        id: 1,
        tipo: 'Clínica UMF',
        nombre: 'UMF No. 68 Tulpetlac',
        direccion: 'Vía Morelos Km 20.5, Santa María Tulpetlac, Ecatepec',
        horario: 'Lunes a Viernes: 08:00 - 20:00 hrs',
        queryMapa: 'IMSS+UMF+68+Ecatepec'
      },
      {
        id: 2,
        tipo: 'Hospital',
        nombre: 'HGR No. 196 Fidel Velázquez',
        direccion: 'Av. Carlos Hank González S/N, Valle de Aragón 3ra Secc.',
        horario: 'Urgencias: 24 horas / Consulta externa: 08:00 - 20:00 hrs',
        queryMapa: 'Hospital+General+Regional+196+IMSS'
      },
      {
        id: 3,
        tipo: 'Clínica UMF',
        nombre: 'UMF No. 93 Cerro Gordo',
        direccion: 'Av. Central S/N, Santa Clara Coatitla, Ecatepec',
        horario: 'Lunes a Viernes: 08:00 - 20:00 hrs',
        queryMapa: 'IMSS+UMF+93+Ecatepec'
      },
      {
        id: 4,
        tipo: 'Hospital',
        nombre: 'HGZ No. 76 Xalostoc',
        direccion: 'Antigua Carretera a Pachuca Km 12.5, San Pedro Xalostoc',
        horario: 'Urgencias: 24 horas',
        queryMapa: 'Hospital+General+de+Zona+76+IMSS'
      },
      {
        id: 5,
        tipo: 'Subdelegación',
        nombre: 'Subdelegación Ecatepec',
        direccion: 'Av. Insurgentes No. 12, San Cristóbal Centro, Ecatepec',
        horario: 'Lunes a Viernes: 08:00 - 15:30 hrs (Trámites administrativos)',
        queryMapa: 'Subdelegacion+IMSS+Ecatepec'
      }
    ];

    let filtroTipo = 'Todos';
    let textoBusqueda = '';
    let seleccionado = inmuebles[0];

    workspace.innerHTML = `
      <h3>Ubicación de Inmuebles IMSS</h3>
      <p class="text-muted">Consulta clínicas, hospitales y subdelegaciones cercanas y visualiza su ubicación.</p>

      <div class="search-bar-group" style="max-width: 100%; margin-top: 1rem;">
        <input type="text" id="search-inmueble" placeholder="Buscar por número de clínica, hospital o colonia...">
      </div>

      <div class="filter-pills">
        <button type="button" class="pill-btn active" data-filter="Todos">Todos</button>
        <button type="button" class="pill-btn" data-filter="Clínica UMF">Clínicas UMF</button>
        <button type="button" class="pill-btn" data-filter="Hospital">Hospitales</button>
        <button type="button" class="pill-btn" data-filter="Subdelegación">Subdelegaciones</button>
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

    const listContainer = document.getElementById('locations-list');
    const mapFrame = document.getElementById('imss-map-frame');
    const searchInput = document.getElementById('search-inmueble');

    function renderLista() {
      const filtrados = inmuebles.filter(item => {
        const coincideTipo = filtroTipo === 'Todos' || item.tipo === filtroTipo;
        const coincideTexto = item.nombre.toLowerCase().includes(textoBusqueda) ||
                              item.direccion.toLowerCase().includes(textoBusqueda);
        return coincideTipo && coincideTexto;
      });

      if (filtrados.length === 0) {
        listContainer.innerHTML = `<p class="text-muted">No se encontraron inmuebles con ese criterio.</p>`;
        return;
      }

      listContainer.innerHTML = filtrados.map(item => `
        <div class="location-item ${item.id === seleccionado.id ? 'selected' : ''}" data-id="${item.id}">
          <span class="location-type">${item.tipo}</span>
          <h4>${item.nombre}</h4>
          <p>${item.direccion}</p>
          <p style="margin-top: 0.25rem;"><strong>Horario:</strong> ${item.horario}</p>
        </div>
      `).join('');

      listContainer.querySelectorAll('.location-item').forEach(el => {
        el.addEventListener('click', () => {
          const id = Number(el.getAttribute('data-id'));
          seleccionado = inmuebles.find(i => i.id === id);
          mapFrame.src = `https://maps.google.com/maps?q=${seleccionado.queryMapa}&output=embed`;
          renderLista();
        });
      });
    }

    // filtros y buscador
    workspace.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        workspace.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroTipo = btn.getAttribute('data-filter');
        renderLista();
      });
    });

    searchInput.addEventListener('input', (e) => {
      textoBusqueda = e.target.value.toLowerCase().trim();
      renderLista();
    });

    renderLista();
  }
});