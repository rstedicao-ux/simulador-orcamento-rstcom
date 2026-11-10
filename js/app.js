// ============================================================================
// APP CONTROLLER - SIMULADOR DE ORÇAMENTO DE EVENTOS RSTCOM
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Ajuste responsivo tela cheia no celular (preenche 100% da largura e altura sem bordas ou cortes laterais)
  let baseMobileHeight = window.innerHeight;

  function fitMobileViewport() {
    const shell = document.querySelector('.phone-shell');
    if (!shell) return;
    if (window.innerWidth <= 768) {
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      const isInputFocused = activeTag === 'INPUT' || activeTag === 'TEXTAREA';
      if (!isInputFocused && window.innerHeight > 480) {
        baseMobileHeight = window.innerHeight;
      }
      const vh = isInputFocused ? Math.max(baseMobileHeight, window.innerHeight) : window.innerHeight;
      const sx = vw / 375;
      const sy = vh / 812;
      shell.style.transform = `scale(${sx}, ${sy})`;
    } else {
      shell.style.transform = '';
    }
  }

  fitMobileViewport();
  window.addEventListener('resize', fitMobileViewport);
  window.addEventListener('orientationchange', () => setTimeout(fitMobileViewport, 120));

  const AppState = {
    currentScreen: 'screen-iniciar',
    history: [],
    userName: 'Arthur',
    userEmail: '',
    formato: 'Lancamento de produto',
    locMode: 'Presencial',
    locationText: '',
    locationCoords: { lat: -23.6088, lng: -46.6969, label: 'São Paulo • WTC Events Center' },
    pax: 500,
    selectedMonth: null,
    selectedYear: 2027,
    shortNotice: false,
    startDay: null,
    endDay: null,
    days: 3,
    calendarStep: 1, // 1: Meses, 2: Seleção de dias, 3: Botão confirmar, 4: Selo confirmado
    padrao: 'Premium',
    selectedItems: [
      'Cenografia e estrutura',
      'LED, som e luz',
      'Alimentação e bebidas',
      'Hospedagem',
      'Aéreo e logística',
      'Conteúdo e criação',
      'Atrações e palestrantes',
      'Credenciamento e tecnologia',
      'Transmissão ao vivo'
    ],
    points: 100,
    payMethod: 'cartao',
    lastCalculation: null
  };

  const paxSteps = [100, 200, 300, 500, 800, 1000, 1500, 2500, 5000];
  let paxIndex = 3; // 500 pax default

  const monthsList = [
    { id: 0, short: 'Nov', full: 'Novembro 2026', shortNotice: true, tag: 'Curto' },
    { id: 1, short: 'Dez', full: 'Dezembro 2026', shortNotice: true, tag: 'Curto' },
    { id: 2, short: 'Jan', full: 'Janeiro 2027', shortNotice: true, tag: 'Curto' },
    { id: 3, short: 'Fev', full: 'Fevereiro 2027', shortNotice: false, tag: 'Ideal' },
    { id: 4, short: 'Mar', full: 'Março 2027', shortNotice: false, tag: 'Ideal' },
    { id: 5, short: 'Abr', full: 'Abril 2027', shortNotice: false, tag: 'Ideal' },
    { id: 6, short: 'Mai', full: 'Maio 2027', shortNotice: false, tag: 'Ideal' },
    { id: 7, short: 'Jun', full: 'Junho 2027', shortNotice: false, tag: 'Ideal' },
    { id: 8, short: 'Jul', full: 'Julho 2027', shortNotice: false, tag: 'Ideal' },
    { id: 9, short: 'Ago', full: 'Agosto 2027', shortNotice: false, tag: 'Ideal' },
    { id: 10, short: 'Set', full: 'Setembro 2027', shortNotice: false, tag: 'Ideal' },
    { id: 11, short: 'Out', full: 'Outubro 2027', shortNotice: false, tag: 'Ideal' }
  ];

  const allAccountItems = [
    'Espaço e licenças',
    'Cenografia e estrutura',
    'LED, som e luz',
    'Alimentação e bebidas',
    'Hospedagem',
    'Aéreo e logística',
    'Conteúdo e criação',
    'Atrações e palestrantes',
    'Credenciamento e tecnologia',
    'Transmissão ao vivo',
    'Brindes e kits',
    'Equipe de produção'
  ];

  // Toast helper
  function showToast(msg) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }

  // Navigation Engine
  function goToScreen(targetId, pushHistory = true) {
    if (targetId === AppState.currentScreen) return;
    const currentEl = document.getElementById(AppState.currentScreen);
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    if (pushHistory && AppState.currentScreen !== 'screen-menu') {
      AppState.history.push(AppState.currentScreen);
    }

    if (currentEl) {
      currentEl.classList.remove('active');
      currentEl.classList.add('exit-left');
      setTimeout(() => currentEl.classList.remove('exit-left'), 450);
    }

    targetEl.classList.add('active');
    AppState.currentScreen = targetId;

    // Update top preview toolbar active state
    document.querySelectorAll('.preview-toolbar button[data-screen]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-screen') === targetId);
    });

    if (targetId === 'screen-o-que-entra') {
      renderAccountItems();
    } else if (targetId === 'screen-resultado') {
      renderResultadoScreen();
    }
  }

  function goBack() {
    if (AppState.history.length > 0) {
      const prev = AppState.history.pop();
      goToScreen(prev, false);
    } else {
      goToScreen('screen-iniciar', false);
    }
  }

  window.navigateTo = goToScreen;
  window.navigateBack = goBack;

  // Bind toolbar buttons
  document.querySelectorAll('.preview-toolbar button[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => {
      goToScreen(btn.getAttribute('data-screen'), true);
    });
  });

  // Bind all menu triggers, home triggers, back triggers
  document.querySelectorAll('[data-action="open-menu"]').forEach(el => {
    el.addEventListener('click', () => goToScreen('screen-menu', true));
  });

  document.querySelectorAll('[data-action="go-home"]').forEach(el => {
    el.addEventListener('click', () => goToScreen('screen-iniciar', true));
  });

  document.querySelectorAll('[data-action="go-back"]').forEach(el => {
    el.addEventListener('click', () => goBack());
  });

  // ==========================================================================
  // SEÇÃO 1: INICIAR
  // ==========================================================================
  const btnAgoraMesmo = document.getElementById('btn-agora-mesmo');
  if (btnAgoraMesmo) {
    btnAgoraMesmo.addEventListener('click', () => {
      goToScreen('screen-pergunta-1', true);
    });
  }

  // ==========================================================================
  // SEÇÃO 2: MENU
  // ==========================================================================
  document.querySelectorAll('#screen-menu [data-menu-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-menu-target');
      goToScreen(target, true);
    });
  });

  // ==========================================================================
  // SEÇÃO 3: PERGUNTA 1 (FORMATO DO EVENTO)
  // ==========================================================================
  const formatCards = document.querySelectorAll('#screen-pergunta-1 .option-glass-card');
  formatCards.forEach(card => {
    card.addEventListener('click', () => {
      formatCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const fmtKey = card.getAttribute('data-format');
      AppState.formato = fmtKey;

      // Atualiza os itens pré-marcados na seção "O que entra na conta?" para o formato
      const fmtConfig = window.EventBudgetEngine.formats[fmtKey];
      if (fmtConfig && fmtConfig.defaultItems) {
        AppState.selectedItems = [...fmtConfig.defaultItems];
      }

      animatePoints('#pts-p1', 100, 150);
    });
  });

  const btnNextP1 = document.getElementById('btn-next-p1');
  if (btnNextP1) {
    btnNextP1.addEventListener('click', () => {
      goToScreen('screen-localizacao', true);
    });
  }

  function animatePoints(selector, from, to) {
    const el = document.querySelector(selector);
    if (!el) return;
    let current = from;
    const step = Math.ceil((to - from) / 12);
    const timer = setInterval(() => {
      current += step;
      if (current >= to) {
        current = to;
        clearInterval(timer);
      }
      el.innerHTML = `${current} <small>pts</small>`;
    }, 25);
  }

  // ==========================================================================
  // SEÇÃO 4: LOCALIZAÇÃO (BUSCA REAL NO MAPS + CONFIRMAÇÃO DE ENDEREÇO)
  // ==========================================================================
  const locInput = document.getElementById('loc-input');
  const locNextBtn = document.getElementById('loc-next-btn');
  const locCheck = document.getElementById('loc-confirmed-check');
  const locAutoList = document.getElementById('loc-autocomplete-list');
  let locSearchTimeout = null;

  const fallbackPlaces = [
    { title: 'Av. das Nações Unidas, 12551 — WTC Events Center', sub: 'Brooklin Novo, São Paulo - SP, 04578-903', mode: 'Presencial' },
    { title: 'Av. Paulista, 1000 — Bela Vista', sub: 'São Paulo - SP, 01310-100, Brasil', mode: 'Presencial' },
    { title: 'Rua José Bernardo Pinto, 333 — Expo Center Norte', sub: 'Vila Guilherme, São Paulo - SP, 02055-000', mode: 'Presencial' },
    { title: 'Av. Lúcio Costa, 2630 — Barra da Tijuca', sub: 'Rio de Janeiro - RJ, 22620-172, Brasil', mode: 'Presencial' },
    { title: 'Av. Monsenhor Luís Fernandes de Abreu, 311 — Royal Palm Hall', sub: 'Jardim do Lago Continuação, Campinas - SP', mode: 'Presencial' },
    { title: 'Evento 100% Remoto / Online', sub: 'Transmissão ao vivo • Sem locação física', mode: 'Remoto' }
  ];

  function selectConfirmedAddress(mainText, subText, mode = 'Presencial') {
    AppState.locationText = `${mainText}${subText ? ' • ' + subText : ''}`;
    AppState.locMode = mode;
    if (locInput) locInput.value = mainText;
    locAutoList?.classList.remove('open');
    locCheck?.classList.add('visible');
    locNextBtn?.classList.add('visible');
  }

  function renderAddressOptions(items) {
    if (!locAutoList) return;
    if (!items || items.length === 0) {
      locAutoList.classList.remove('open');
      return;
    }
    locAutoList.innerHTML = items.map((it, idx) => `
      <button type="button" class="loc-auto-option" data-idx="${idx}">
        <strong>📍 ${it.title}</strong>
        <small>${it.sub}</small>
      </button>
    `).join('');
    locAutoList.classList.add('open');

    locAutoList.querySelectorAll('.loc-auto-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const picked = items[Number(btn.getAttribute('data-idx'))];
        if (picked) {
          selectConfirmedAddress(picked.title, picked.sub, picked.mode || 'Presencial');
        }
      });
    });
  }

  if (locInput) {
    locInput.addEventListener('input', () => {
      const query = locInput.value.trim();
      // Enquanto digita sem confirmar na lista do Maps, esconde o check e o botão de avançar
      locCheck?.classList.remove('visible');
      locNextBtn?.classList.remove('visible');

      if (query.length < 2) {
        locAutoList?.classList.remove('open');
        return;
      }

      const qLower = query.toLowerCase();

      // Se digitar "remoto" ou "online", mostra confirmação imediata de evento remoto
      if (qLower.includes('remot') || qLower.includes('online') || qLower.includes('virtual')) {
        renderAddressOptions([
          { title: 'Evento 100% Remoto / Online', sub: 'Confirmado • Transmissão digital sem espaço físico', mode: 'Remoto' },
          { title: `${query} (Formato Híbrido)`, sub: 'Estúdio de transmissão + público remoto', mode: 'Híbrido' }
        ]);
        return;
      }

      // Filtro local imediato + consulta em tempo real na API do OpenStreetMap (Maps)
      const localMatches = fallbackPlaces.filter(p =>
        p.title.toLowerCase().includes(qLower) || p.sub.toLowerCase().includes(qLower)
      );

      const immediateOptions = [
        ...localMatches,
        {
          title: query,
          sub: 'Confirmar este endereço no Maps — Brasil',
          mode: 'Presencial'
        }
      ].slice(0, 4);

      renderAddressOptions(immediateOptions);

      clearTimeout(locSearchTimeout);
      locSearchTimeout = setTimeout(async () => {
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=4&countrycodes=br&q=${encodeURIComponent(query)}`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          if (!resp.ok) return;
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0 && locInput.value.trim() === query) {
            const apiItems = data.map(place => {
              const parts = (place.display_name || '').split(',').map(s => s.trim());
              const title = parts.slice(0, 2).join(', ') || query;
              const sub = parts.slice(2, 6).join(', ') || 'Endereço verificado no Maps';
              return { title, sub, mode: 'Presencial' };
            });
            renderAddressOptions(apiItems);
          }
        } catch (_) {
          // Mantém as opções imediatas caso esteja sem internet
        }
      }, 260);
    });
  }

  if (locNextBtn) {
    locNextBtn.addEventListener('click', () => {
      goToScreen('screen-qtd-pessoas', true);
    });
  }

  // ==========================================================================
  // SEÇÃO 5: QUANTIDADE DE PESSOAS (ROLETA INFINITA) + CALENDÁRIO EM 4 ETAPAS
  // ==========================================================================
  const paxValueText = document.getElementById('pax-value-text');
  const orbitalArc = document.getElementById('orbital-arc');
  const rouletteBeadsGroup = document.getElementById('roulette-beads');
  const rouletteTouchZone = document.getElementById('roulette-touch-zone');

  // Constrói as bolinhas por todos os 360° do círculo (a cada 10°: 1 grande a cada 30° e 2 pequenas entre elas)
  if (rouletteBeadsGroup) {
    const cx = 265;
    const cy = 265;
    const r = 264.5;
    let beadsMarkup = '';
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const x = (cx + r * Math.cos(rad)).toFixed(2);
      const y = (cy + r * Math.sin(rad)).toFixed(2);
      const isMajor = deg % 30 === 0;
      const dotRadius = isMajor ? 7.18157 : 2.87263;
      beadsMarkup += `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="white" />`;
    }
    rouletteBeadsGroup.innerHTML = beadsMarkup;
  }

  // Estado e física da Roleta Infinita
  let wheelAngle = 0; // 0 graus = 500 pax
  let wheelVelocity = 0;
  let isDraggingWheel = false;
  let lastPointerY = 0;
  let wheelAnimFrame = null;

  function syncPaxFromAngle(angleDeg) {
    // Cada 10° equivale a um passo de 50 pessoas (giro infinito com ciclo suave entre 50 e 10.000 pax)
    const stepsFromStart = Math.round(-angleDeg / 10);
    const minPax = 50;
    const maxPax = 10000;
    const rangeSteps = (maxPax - minPax) / 50; // 199 passos
    let rawStep = (9 + stepsFromStart) % (rangeSteps + 1); // 9 * 50 + 50 = 500 pax inicial
    if (rawStep < 0) rawStep += (rangeSteps + 1);
    const computedPax = minPax + rawStep * 50;

    AppState.pax = computedPax;
    if (paxValueText) {
      paxValueText.textContent = `${computedPax.toLocaleString('pt-BR')} pax`;
    }
  }

  function renderWheelRotation() {
    if (orbitalArc) {
      orbitalArc.style.transform = `rotate(${wheelAngle}deg)`;
    }
    syncPaxFromAngle(wheelAngle);
  }

  function startWheelInertia() {
    cancelAnimationFrame(wheelAnimFrame);
    function step() {
      if (!isDraggingWheel) {
        wheelAngle += wheelVelocity;
        wheelVelocity *= 0.92; // Atrito suave da roleta

        // Snap magnético suave para o ponto (múltiplo de 10°) quando desacelera
        if (Math.abs(wheelVelocity) < 0.35) {
          const targetSnap = Math.round(wheelAngle / 10) * 10;
          wheelAngle += (targetSnap - wheelAngle) * 0.22;
          if (Math.abs(targetSnap - wheelAngle) < 0.08 && Math.abs(wheelVelocity) < 0.05) {
            wheelAngle = targetSnap;
            renderWheelRotation();
            return;
          }
        }
        renderWheelRotation();
        wheelAnimFrame = requestAnimationFrame(step);
      }
    }
    wheelAnimFrame = requestAnimationFrame(step);
  }

  if (rouletteTouchZone) {
    rouletteTouchZone.addEventListener('pointerdown', (e) => {
      isDraggingWheel = true;
      lastPointerY = e.clientY;
      wheelVelocity = 0;
      cancelAnimationFrame(wheelAnimFrame);
      rouletteTouchZone.setPointerCapture?.(e.pointerId);
    });

    rouletteTouchZone.addEventListener('pointermove', (e) => {
      if (!isDraggingWheel) return;
      const deltaY = e.clientY - lastPointerY;
      lastPointerY = e.clientY;
      const deltaAngle = deltaY * 0.32;
      wheelAngle += deltaAngle;
      wheelVelocity = deltaAngle;
      renderWheelRotation();
    });

    const endDrag = () => {
      if (!isDraggingWheel) return;
      isDraggingWheel = false;
      startWheelInertia();
    };

    rouletteTouchZone.addEventListener('pointerup', endDrag);
    rouletteTouchZone.addEventListener('pointercancel', endDrag);

    // Suporte também ao scroll do mouse / touchpad para girar a roleta infinitamente
    rouletteTouchZone.addEventListener('wheel', (e) => {
      e.preventDefault();
      wheelVelocity += (e.deltaY > 0 ? -2.2 : 2.2);
      startWheelInertia();
    }, { passive: false });
  }

  // 4-Step Dynamic Calendar inside "Quantos dias?" card (#9215:238)
  const qdCard = document.getElementById('quantos-dias-card');
  const qdBody = document.getElementById('qd-dynamic-body');
  const qdDots = document.querySelectorAll('.qd-step-dot');

  function renderCalendarStep() {
    if (!qdBody || !qdCard) return;

    qdDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx + 1 === Math.min(3, AppState.calendarStep));
    });

    // STEP 1: MESES
    if (AppState.calendarStep === 1) {
      qdCard.classList.remove('expanded');
      qdBody.innerHTML = `
        <div class="qd-months-grid">
          ${monthsList.map(m => `
            <button type="button" class="qd-month-btn ${AppState.selectedMonth === m.id ? 'selected' : ''}" data-month-id="${m.id}">
              ${m.short}
              <small>${m.tag}</small>
            </button>
          `).join('')}
        </div>
      `;

      qdBody.querySelectorAll('.qd-month-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mId = Number(btn.getAttribute('data-month-id'));
          const mObj = monthsList.find(x => x.id === mId);
          AppState.selectedMonth = mId;
          AppState.shortNotice = Boolean(mObj?.shortNotice);
          AppState.startDay = 14;
          AppState.endDay = 16;
          AppState.days = 3;
          AppState.calendarStep = 2;
          renderCalendarStep();
        });
      });
    }

    // STEP 2 & 3: SELEÇÃO DE DIAS (COMO EM SITES DE VIAGENS) + SURGIR BOTÃO CONFIRMAR
    else if (AppState.calendarStep === 2 || AppState.calendarStep === 3) {
      qdCard.classList.add('expanded');
      const mObj = monthsList.find(x => x.id === AppState.selectedMonth) || monthsList[6];
      const daysInMonth = 30;
      const cells = [];
      for (let d = 1; d <= daysInMonth; d++) {
        let cls = 'qd-day-cell';
        if (AppState.startDay && AppState.endDay) {
          if (d === AppState.startDay) cls += ' range-start';
          else if (d === AppState.endDay) cls += ' range-end';
          else if (d > AppState.startDay && d < AppState.endDay) cls += ' in-range';
        } else if (AppState.startDay && d === AppState.startDay) {
          cls += ' range-start';
        }
        cells.push(`<button type="button" class="${cls}" data-day="${d}">${d}</button>`);
      }

      const hasRange = AppState.startDay !== null && AppState.endDay !== null;
      const totalDays = hasRange ? (AppState.endDay - AppState.startDay + 1) : 1;
      AppState.days = totalDays;

      qdBody.innerHTML = `
        <div class="qd-calendar-top">
          <button type="button" class="qd-back-month-btn" id="qd-back-months">← Meses</button>
          <span class="qd-current-month-label">${mObj.full}</span>
        </div>
        <div class="qd-weekdays">
          <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
        </div>
        <div class="qd-days-grid">
          ${cells.join('')}
        </div>
        <div class="qd-range-summary">
          ${hasRange
            ? `${AppState.startDay} a ${AppState.endDay} de ${mObj.short} • <strong>${totalDays} ${totalDays === 1 ? 'dia' : 'dias'}</strong>`
            : `Selecione o dia final do evento`}
        </div>
        ${hasRange ? `
          <button type="button" class="qd-confirm-btn" id="qd-confirm-dates-btn">
            Confirmar ${totalDays} ${totalDays === 1 ? 'dia' : 'dias'} ✓
          </button>
        ` : ''}
      `;

      document.getElementById('qd-back-months')?.addEventListener('click', () => {
        AppState.calendarStep = 1;
        renderCalendarStep();
      });

      qdBody.querySelectorAll('.qd-day-cell').forEach(dayBtn => {
        dayBtn.addEventListener('click', () => {
          const clickedDay = Number(dayBtn.getAttribute('data-day'));
          if (AppState.startDay === null || (AppState.startDay !== null && AppState.endDay !== null)) {
            AppState.startDay = clickedDay;
            AppState.endDay = null;
          } else {
            if (clickedDay < AppState.startDay) {
              AppState.endDay = AppState.startDay;
              AppState.startDay = clickedDay;
            } else {
              AppState.endDay = clickedDay;
            }
            AppState.calendarStep = 3;
          }
          renderCalendarStep();
        });
      });

      document.getElementById('qd-confirm-dates-btn')?.addEventListener('click', () => {
        AppState.calendarStep = 4;
        renderCalendarStep();
        showToast(`✓ ${AppState.days} dias confirmados em ${mObj.full}!`);
      });
    }

    // STEP 4: TELA DO CALENDÁRIO SOME SURGINDO SELO CONFIRMANDO
    else if (AppState.calendarStep === 4) {
      qdCard.classList.remove('expanded');
      const mObj = monthsList.find(x => x.id === AppState.selectedMonth) || monthsList[6];
      qdBody.innerHTML = `
        <div class="qd-confirmed-seal">
          <div class="qd-seal-badge">✓</div>
          <div class="qd-seal-title">Datas Confirmadas</div>
          <div class="qd-seal-days">${AppState.days} ${AppState.days === 1 ? 'Dia' : 'Dias'}</div>
          <div class="qd-seal-dates">${AppState.startDay} a ${AppState.endDay} de ${mObj.short}</div>
          <button type="button" class="qd-seal-edit" id="qd-edit-dates-btn">Alterar datas</button>
        </div>
      `;

      document.getElementById('qd-edit-dates-btn')?.addEventListener('click', () => {
        AppState.calendarStep = 1;
        renderCalendarStep();
      });
    }
  }

  renderCalendarStep();

  document.getElementById('btn-next-qtd')?.addEventListener('click', () => {
    goToScreen('screen-padrao-entrega', true);
  });

  // ==========================================================================
  // SEÇÃO 6: PADRÃO DE ENTREGA (#9215:297)
  // ==========================================================================
  const padraoCards = document.querySelectorAll('#screen-padrao-entrega .option-glass-card');
  padraoCards.forEach(card => {
    card.addEventListener('click', () => {
      padraoCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.padrao = card.getAttribute('data-padrao');
      animatePoints('#pts-padrao', 450, 600);
    });
  });

  document.getElementById('btn-next-padrao')?.addEventListener('click', () => {
    goToScreen('screen-o-que-entra', true);
  });

  // ==========================================================================
  // SEÇÃO 7: O QUE ENTRA NA CONTA? (#9216:347)
  // Rolagem vertical com fade superior/inferior + clique alterna Bold/Black
  // ==========================================================================
  const entraListContainer = document.getElementById('entra-list-scroll');
  let isDraggingEntra = false;
  let entraStartY = 0;
  let entraStartScrollTop = 0;
  let entraMoved = false;

  function renderAccountItems() {
    if (!entraListContainer) return;
    entraListContainer.innerHTML = allAccountItems.map(itemName => {
      const isSelected = AppState.selectedItems.includes(itemName);
      return `
        <div class="entra-item ${isSelected ? 'selected' : ''}" data-item="${itemName}">
          <span class="timeline-dot"></span>
          <span class="entra-text">${itemName}</span>
        </div>
      `;
    }).join('');

    entraListContainer.querySelectorAll('.entra-item').forEach(row => {
      row.addEventListener('click', () => {
        if (entraMoved) return; // Evita clique acidental durante o arraste de rolagem
        const name = row.getAttribute('data-item');
        const idx = AppState.selectedItems.indexOf(name);
        if (idx >= 0) {
          AppState.selectedItems.splice(idx, 1);
          row.classList.remove('selected');
        } else {
          AppState.selectedItems.push(name);
          row.classList.add('selected');
        }
      });
    });
  }

  if (entraListContainer) {
    entraListContainer.addEventListener('pointerdown', (e) => {
      isDraggingEntra = true;
      entraMoved = false;
      entraStartY = e.clientY;
      entraStartScrollTop = entraListContainer.scrollTop;
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDraggingEntra) return;
      const dy = e.clientY - entraStartY;
      if (Math.abs(dy) > 5) entraMoved = true;
      entraListContainer.scrollTop = entraStartScrollTop - dy;
    });

    window.addEventListener('pointerup', () => {
      isDraggingEntra = false;
      setTimeout(() => { entraMoved = false; }, 40);
    });
  }

  renderAccountItems();

  document.getElementById('btn-ver-estimativa')?.addEventListener('click', () => {
    goToScreen('screen-resultado', true);
  });

  // ==========================================================================
  // SEÇÃO 8: LOGIN & SIGN UP (#9205:10 & #9202:203)
  // ==========================================================================
  const authScreen = document.getElementById('screen-auth');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabSignupBtn = document.getElementById('tab-signup-btn');
  const authFormContainer = document.getElementById('auth-form-container');
  const rememberRow = document.getElementById('remember-me-row');
  const toggleRememberBtn = document.getElementById('toggle-remember-btn');

  function setAuthMode(mode) {
    if (!authScreen) return;
    const isSignup = mode === 'signup';
    authScreen.classList.toggle('signup-mode', isSignup);
    const waveImg = authScreen.querySelector('.auth-wave-bg');
    if (waveImg) {
      const prefix = waveImg.getAttribute('src').includes('../../') ? '../../' : '';
      waveImg.setAttribute('src', `${prefix}assets/icons/${isSignup ? 'shape_signup_bg.svg' : 'shape_login_bg.svg'}`);
    }
    tabLoginBtn?.classList.toggle('active', !isSignup);
    tabSignupBtn?.classList.toggle('active', isSignup);
    if (rememberRow) {
      rememberRow.style.display = isSignup ? 'none' : 'flex';
    }

    if (authFormContainer) {
      if (isSignup) {
        authFormContainer.innerHTML = `
          <div class="auth-field">
            <label>Username</label>
            <input type="text" id="auth-username" value="${AppState.userName}" placeholder="Seu nome" />
          </div>
          <div class="auth-field">
            <label>Email</label>
            <input type="email" id="auth-email" value="${AppState.userEmail}" placeholder="voce@empresa.com.br" />
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input type="password" value="••••••••" />
          </div>
          <div class="auth-field">
            <label>Confirm password</label>
            <input type="password" value="••••••••" />
          </div>
          <button type="button" class="auth-submit-btn" id="auth-action-submit">Sign up</button>
        `;
      } else {
        authFormContainer.innerHTML = `
          <div class="auth-field">
            <label>Email</label>
            <input type="email" id="auth-email" value="${AppState.userEmail || 'arthur@rstcom.com.br'}" placeholder="voce@empresa.com.br" />
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input type="password" value="••••••••" />
          </div>
          <button type="button" class="auth-submit-btn" id="auth-action-submit" style="margin-top: 42px;">Login</button>
        `;
      }

      document.getElementById('auth-action-submit')?.addEventListener('click', () => {
        const uInput = document.getElementById('auth-username');
        const eInput = document.getElementById('auth-email');
        if (uInput && uInput.value.trim()) AppState.userName = uInput.value.trim();
        if (eInput && eInput.value.trim()) AppState.userEmail = eInput.value.trim();
        showToast(`Bem-vindo, ${AppState.userName}!`);
        goToScreen('screen-pergunta-1', true);
      });
    }
  }

  tabLoginBtn?.addEventListener('click', () => setAuthMode('login'));
  tabSignupBtn?.addEventListener('click', () => setAuthMode('signup'));

  toggleRememberBtn?.addEventListener('click', () => {
    toggleRememberBtn.classList.toggle('active');
  });

  setAuthMode('login');

  // ==========================================================================
  // SEÇÃO 9: TELA FINAL 1 - RESULTADO DA ESTIMATIVA (#9216:509)
  // ==========================================================================
  function renderResultadoScreen() {
    const calc = window.EventBudgetEngine.calculate(AppState);
    AppState.lastCalculation = calc;

    const userTag = document.getElementById('res-user-tag');
    const formatTag = document.getElementById('res-format-tag');
    const minEl = document.getElementById('res-price-min');
    const maxEl = document.getElementById('res-price-max');
    const perPaxEl = document.getElementById('res-per-pax');
    const pillsEl = document.getElementById('res-summary-pills');
    const barsContainer = document.getElementById('res-bars-container');

    if (userTag) userTag.textContent = `${(AppState.userName || 'ARTHUR').toUpperCase()}, SUA ESTIMATIVA`;
    if (formatTag) formatTag.textContent = calc.formatLabel.toUpperCase();
    if (minEl) minEl.textContent = window.EventBudgetEngine.formatCurrencyCompact(calc.totalMin);
    if (maxEl) maxEl.textContent = window.EventBudgetEngine.formatCurrencyCompact(calc.totalMax);
    if (perPaxEl) {
      perPaxEl.textContent = `Por participante: R$ ${calc.perPaxMin.toLocaleString('pt-BR')} a R$ ${calc.perPaxMax.toLocaleString('pt-BR')}`;
    }

    if (pillsEl) {
      const locShort = AppState.locationText
        ? AppState.locationText.split('•')[0].trim()
        : 'São Paulo';
      pillsEl.innerHTML = `
        <span class="res-mini-pill">👥 ${calc.pax.toLocaleString('pt-BR')} pax</span>
        <span class="res-mini-pill">📅 ${calc.days} ${calc.days === 1 ? 'dia' : 'dias'}</span>
        <span class="res-mini-pill">📍 ${locShort}</span>
        <span class="res-mini-pill">✨ ${AppState.padrao}</span>
      `;
    }

    if (barsContainer) {
      barsContainer.innerHTML = calc.bars.map(b => `
        <div class="money-bar-row">
          <div class="money-bar-header">
            <span>${b.name}</span>
            <span class="pct">${b.pct}%</span>
          </div>
          <div class="money-bar-track">
            <div class="money-bar-fill" data-width="${b.pct}%"></div>
          </div>
        </div>
      `).join('');

      requestAnimationFrame(() => {
        setTimeout(() => {
          barsContainer.querySelectorAll('.money-bar-fill').forEach(fill => {
            fill.style.width = fill.getAttribute('data-width');
          });
        }, 80);
      });
    }
  }

  document.getElementById('btn-ir-pagamento')?.addEventListener('click', () => {
    goToScreen('screen-pagamento', true);
  });

  // ==========================================================================
  // SEÇÃO 10: TELA FINAL 2 - PAGAMENTO E POP-UP COM PLANILHA EXCEL COMPLETA
  // ==========================================================================
  const payMethodTabs = document.querySelectorAll('.pay-method-tab');
  const cardFieldsBlock = document.getElementById('pay-card-fields');
  const pixFieldsBlock = document.getElementById('pay-pix-fields');

  payMethodTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      payMethodTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const method = tab.getAttribute('data-pay-method');
      AppState.payMethod = method;
      if (cardFieldsBlock && pixFieldsBlock) {
        cardFieldsBlock.style.display = method === 'cartao' ? 'block' : 'none';
        pixFieldsBlock.style.display = method === 'pix' ? 'block' : 'none';
      }
    });
  });

  document.getElementById('btn-autofill-demo')?.addEventListener('click', () => {
    document.getElementById('pay-name').value = 'Arthur — RSTCOM Eventos';
    document.getElementById('pay-email').value = 'arthur@rstcom.com.br';
    document.getElementById('pay-card-number').value = '4532 •••• •••• 8890';
    document.getElementById('pay-card-exp').value = '08/29';
    document.getElementById('pay-card-cvv').value = '742';
    showToast('Dados de simulação preenchidos!');
  });

  const excelModal = document.getElementById('excel-modal-backdrop');
  const excelTableBody = document.getElementById('excel-table-tbody');
  const excelTotalMinEl = document.getElementById('excel-total-min');
  const excelTotalMaxEl = document.getElementById('excel-total-max');

  function openExcelPopup() {
    if (!AppState.lastCalculation) {
      AppState.lastCalculation = window.EventBudgetEngine.calculate(AppState);
    }
    renderExcelTable();
    excelModal?.classList.add('open');
  }

  function renderExcelTable() {
    const calc = AppState.lastCalculation;
    if (!calc || !excelTableBody) return;

    let currentCategory = '';
    let html = '';

    calc.spreadsheetItems.forEach((row, idx) => {
      if (row.category !== currentCategory) {
        currentCategory = row.category;
        html += `
          <tr class="cat-group-row">
            <td colspan="5">📂 ${currentCategory.toUpperCase()}</td>
          </tr>
        `;
      }
      html += `
        <tr data-row-idx="${idx}">
          <td>${row.item}</td>
          <td>${row.unit}</td>
          <td>
            <input type="number" min="0" class="excel-qty-input" data-idx="${idx}" value="${row.qty}" />
          </td>
          <td class="cell-min">${window.EventBudgetEngine.formatBRL(row.subMin)}</td>
          <td class="cell-max">${window.EventBudgetEngine.formatBRL(row.subMax)}</td>
        </tr>
      `;
    });

    excelTableBody.innerHTML = html;
    updateExcelTotals();

    excelTableBody.querySelectorAll('.excel-qty-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const i = Number(inp.getAttribute('data-idx'));
        const newQty = Math.max(0, Number(inp.value) || 0);
        const itemObj = calc.spreadsheetItems[i];
        if (itemObj) {
          itemObj.qty = newQty;
          itemObj.subMin = itemObj.unitMin * newQty;
          itemObj.subMax = itemObj.unitMax * newQty;
          const tr = inp.closest('tr');
          if (tr) {
            tr.querySelector('.cell-min').textContent = window.EventBudgetEngine.formatBRL(itemObj.subMin);
            tr.querySelector('.cell-max').textContent = window.EventBudgetEngine.formatBRL(itemObj.subMax);
          }
          updateExcelTotals();
        }
      });
    });
  }

  function updateExcelTotals() {
    const calc = AppState.lastCalculation;
    if (!calc) return;
    const sumMin = calc.spreadsheetItems.reduce((acc, r) => acc + r.subMin, 0);
    const sumMax = calc.spreadsheetItems.reduce((acc, r) => acc + r.subMax, 0);
    if (excelTotalMinEl) excelTotalMinEl.textContent = window.EventBudgetEngine.formatCurrencyCompact(sumMin);
    if (excelTotalMaxEl) excelTotalMaxEl.textContent = window.EventBudgetEngine.formatCurrencyCompact(sumMax);
  }

  document.getElementById('btn-confirmar-pagamento')?.addEventListener('click', () => {
    const nameVal = document.getElementById('pay-name')?.value.trim();
    const emailVal = document.getElementById('pay-email')?.value.trim();
    if (nameVal) AppState.userName = nameVal;
    if (emailVal) AppState.userEmail = emailVal;

    showToast('✓ Pagamento confirmado! Planilha Excel liberada.');
    openExcelPopup();
  });

  document.getElementById('excel-close-btn')?.addEventListener('click', () => {
    excelModal?.classList.remove('open');
  });

  // Download Real CSV/Excel Spreadsheet
  document.getElementById('btn-download-csv')?.addEventListener('click', () => {
    const calc = AppState.lastCalculation || window.EventBudgetEngine.calculate(AppState);
    const lines = [
      ['Categoria', 'Item de Custo', 'Unidade', 'Quantidade', 'Unitario Min (R$)', 'Unitario Max (R$)', 'Subtotal Min (R$)', 'Subtotal Max (R$)']
    ];
    calc.spreadsheetItems.forEach(r => {
      lines.push([
        `"${r.category}"`,
        `"${r.item}"`,
        `"${r.unit}"`,
        r.qty,
        r.unitMin,
        r.unitMax,
        r.subMin,
        r.subMax
      ]);
    });

    const csvContent = '\uFEFF' + lines.map(e => e.join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Orcamento_Evento_RSTCOM_${calc.pax}pax.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Planilha Excel (.csv) baixada com sucesso!');
  });

  // Send summary to Email
  document.getElementById('btn-send-email')?.addEventListener('click', () => {
    const calc = AppState.lastCalculation || window.EventBudgetEngine.calculate(AppState);
    const emailTarget = AppState.userEmail || 'contato@rstcom.com.br';
    const subject = encodeURIComponent(`Simulação de Evento RSTCOM - ${calc.formatLabel} (${calc.pax} pax)`);
    const bodyLines = [
      `Olá equipe RSTCOM,`,
      ``,
      `Segue o resumo da simulação de evento realizada no site:`,
      `• Cliente: ${AppState.userName}`,
      `• Formato: ${calc.formatLabel}`,
      `• Padrão de Entrega: ${AppState.padrao}`,
      `• Local: ${AppState.locationText || 'São Paulo'} (${AppState.locMode})`,
      `• Participantes: ${calc.pax} pax`,
      `• Duração: ${calc.days} dias`,
      `• Faixa Estimada: ${window.EventBudgetEngine.formatCurrencyCompact(calc.totalMin)} a ${window.EventBudgetEngine.formatCurrencyCompact(calc.totalMax)}`,
      `• Custo por Participante: R$ ${calc.perPaxMin.toLocaleString('pt-BR')} a R$ ${calc.perPaxMax.toLocaleString('pt-BR')}`,
      ``,
      `Itens incluídos na conta:`,
      ...AppState.selectedItems.map(i => ` - ${i}`)
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:${emailTarget}?subject=${subject}&body=${body}`;
    showToast(`✉️ Abrindo envio para ${emailTarget}`);
  });
});

