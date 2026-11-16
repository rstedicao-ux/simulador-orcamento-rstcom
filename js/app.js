// ============================================================================
// APP CONTROLLER - SIMULADOR DE ORÇAMENTO DE EVENTOS & TECNOLOGIA RSTCOM
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const SCREEN_THEME_COLORS = {
    'screen-iniciar': '#DFDFDF',
    'screen-menu': '#EBEBEB',
    'screen-auth': '#FFFFFF',
    'screen-escopo-inicial': '#F0F0F0',
    'screen-pergunta-1': '#F0F0F0',
    'screen-objetivo': '#F0F0F0',
    'screen-localizacao': '#EFEFEF',
    'screen-espaco': '#F0F0F0',
    'screen-qtd-pessoas': '#050508',
    'screen-ambientes': '#F0F0F0',
    'screen-tecnologia': '#050508',
    'screen-transmissao-cred': '#050508',
    'screen-cenografia': '#F0F0F0',
    'screen-gastronomia': '#050508',
    'screen-logistica': '#050508',
    'screen-conteudo-atracoes': '#050508',
    'screen-padrao-entrega': '#F0F0F0',
    'screen-o-que-entra': '#050508',
    'screen-resultado': '#080711',
    'screen-pagamento': '#080711'
  };

  function syncBrowserThemeColor(screenId) {
    const color = SCREEN_THEME_COLORS[screenId] || '#F0F0F0';
    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) {
      metaTheme.setAttribute('content', color);
    }
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    const shell = document.querySelector('.phone-shell');
    if (shell) {
      shell.style.backgroundColor = color;
    }
  }

  const AppState = {
    currentScreen: 'screen-iniciar',
    history: [],
    userName: 'Arthur Souza',
    userCompany: 'rstcom',
    userEmail: 'arthur@rstcom.com.br',
    contractScope: 'completo', // 'completo' | 'tecnologia' | 'online' | 'cenografia'
    formato: 'Convencao de vendas',
    mainObjective: 'Engajar e alinhar metas do time',
    eventTheme: '',
    locMode: 'Presencial',
    locationText: 'Ainda não definido',
    spaceStatus: 'Espaço já contratado / definido',
    spaceDetails: '',
    pax: 300,
    days: 5,
    leadTime: 'De 1 a 3 meses',
    roomLayout: 'Plenária + Salas simultâneas (Breakouts)',
    breakoutRooms: 2,
    ledM2: 18,
    techDetails: '',
    techChoices: [
      'Painel de LED',
      'Sonorização',
      'Iluminação cênica',
      'Projeção e Switcher',
      'Gerador',
      'Técnicos de operação'
    ],
    streamChoices: [
      'Credenciamento e Totens',
      'Aplicativo do Evento',
      'Interação ao Vivo'
    ],
    cenoChoices: [
      'Palco e Projeto 3D',
      'Entrada e Instagramáveis',
      'Mobiliário e Lounges',
      'Comunicação Visual'
    ],
    cenoDetails: '',
    abChoices: [
      'Coffee breaks',
      'Almoço',
      'Jantar ou Coquetel',
      'Open bar'
    ],
    logChoices: [
      'Hospedagem participantes',
      'Hospedagem equipe',
      'Passagens aéreas',
      'Traslados'
    ],
    hotelPax: 210,
    contChoices: [
      'Identidade e Roteiro',
      'Vídeos e Motion LED',
      'Foto, Vídeo e Aftermovie',
      'Mestre de Cerimônias / Palestrante',
      'Show ou Atração Musical',
      'Brindes e Kits',
      'Staff, Recepção e Segurança'
    ],
    padrao: 'Corporativo',
    selectedItems: [
      'Espaço e licenças',
      'Cenografia e estrutura',
      'LED, som e luz',
      'Alimentação e bebidas',
      'Hospedagem',
      'Aéreo e logística',
      'Conteúdo e criação',
      'Atrações e palestrantes',
      'Credenciamento e tecnologia',
      'Brindes e kits',
      'Equipe de produção'
    ],
    budgetTarget: '',
    customRates: {
      feeMin: 0.10, feeMax: 0.13, feeOrc: 0.115,
      contMin: 0.05, contMax: 0.08, contOrc: 0.065,
      taxMin: 0.06, taxMax: 0.10, taxOrc: 0.08
    },
    payMethod: 'cartao',
    lastCalculation: null
  };

  // Trilhas inteligentes para que quem quer apenas tecnologia não precise responder 14 perguntas
  const FLOW_PATHS = {
    completo: [
      'screen-escopo-inicial',
      'screen-pergunta-1',
      'screen-objetivo',
      'screen-localizacao',
      'screen-espaco',
      'screen-qtd-pessoas',
      'screen-ambientes',
      'screen-tecnologia',
      'screen-transmissao-cred',
      'screen-cenografia',
      'screen-gastronomia',
      'screen-logistica',
      'screen-conteudo-atracoes',
      'screen-padrao-entrega',
      'screen-o-que-entra'
    ],
    tecnologia: [
      'screen-escopo-inicial',
      'screen-localizacao',
      'screen-espaco',
      'screen-qtd-pessoas',
      'screen-tecnologia',
      'screen-transmissao-cred',
      'screen-padrao-entrega'
    ],
    online: [
      'screen-escopo-inicial',
      'screen-objetivo',
      'screen-qtd-pessoas',
      'screen-tecnologia',
      'screen-transmissao-cred',
      'screen-conteudo-atracoes',
      'screen-padrao-entrega'
    ],
    cenografia: [
      'screen-escopo-inicial',
      'screen-localizacao',
      'screen-espaco',
      'screen-qtd-pessoas',
      'screen-cenografia',
      'screen-tecnologia',
      'screen-padrao-entrega'
    ]
  };

  function getActiveFlow() {
    return FLOW_PATHS[AppState.contractScope] || FLOW_PATHS.completo;
  }

  function updateProgressCounters(screenId) {
    const flow = getActiveFlow();
    const idx = flow.indexOf(screenId);
    if (idx === -1) return;
    const remaining = Math.max(1, flow.length - 1 - idx);
    const pts = (idx + 1) * 50 + 50;

    const screenEl = document.getElementById(screenId);
    if (!screenEl) return;

    const remEl = screenEl.querySelector('[data-rem-counter]');
    if (remEl) {
      remEl.textContent = String(remaining).padStart(2, '0');
    }
    const ptsEl = screenEl.querySelector('[data-pts-counter]');
    if (ptsEl) {
      ptsEl.innerHTML = `${pts} <small>pts</small>`;
    }
  }

  function advanceToNextQuestion() {
    syncInputsToState();
    const flow = getActiveFlow();
    const idx = flow.indexOf(AppState.currentScreen);
    if (idx !== -1 && idx < flow.length - 1) {
      goToScreen(flow[idx + 1], true);
    } else {
      goToScreen('screen-resultado', true);
    }
  }

  function showToast(msg) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

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
      setTimeout(() => currentEl.classList.remove('exit-left'), 420);
    }

    targetEl.classList.add('active');
    AppState.currentScreen = targetId;
    syncBrowserThemeColor(targetId);
    updateProgressCounters(targetId);

    if (targetId === 'screen-o-que-entra') {
      renderAccountItems();
    } else if (targetId === 'screen-resultado') {
      syncInputsToState();
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

  // Bind botões globais de menu, home, voltar e avançar etapa
  document.querySelectorAll('[data-action="open-menu"]').forEach(el => {
    el.addEventListener('click', () => goToScreen('screen-menu', true));
  });

  document.querySelectorAll('[data-action="go-home"]').forEach(el => {
    el.addEventListener('click', () => goToScreen('screen-iniciar', true));
  });

  document.querySelectorAll('[data-action="go-back"]').forEach(el => {
    el.addEventListener('click', () => goBack());
  });

  document.querySelectorAll('[data-next-step="true"]').forEach(btn => {
    btn.addEventListener('click', () => advanceToNextQuestion());
  });

  // ==========================================================================
  // SEÇÃO 1: INICIAR & MENU
  // ==========================================================================
  document.getElementById('btn-agora-mesmo')?.addEventListener('click', () => {
    goToScreen('screen-auth', true);
  });

  document.querySelectorAll('#screen-menu [data-menu-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      goToScreen(btn.getAttribute('data-menu-target'), true);
    });
  });

  document.getElementById('menu-fast-tech-btn')?.addEventListener('click', () => {
    activateScope('tecnologia');
    showToast('Via Rápida de Tecnologia ativada (6 perguntas)');
    goToScreen('screen-localizacao', true);
  });

  // ==========================================================================
  // SEÇÃO 3: LOGIN & SIGN UP
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
    tabLoginBtn?.classList.toggle('active', !isSignup);
    tabSignupBtn?.classList.toggle('active', isSignup);
    if (rememberRow) {
      rememberRow.style.display = isSignup ? 'none' : 'flex';
    }

    if (authFormContainer) {
      if (isSignup) {
        authFormContainer.innerHTML = `
          <div class="auth-field">
            <label>Nome / Empresa</label>
            <input type="text" id="auth-username" value="${AppState.userName}" placeholder="Seu nome e empresa" />
          </div>
          <div class="auth-field">
            <label>Email corporativo</label>
            <input type="email" id="auth-email" value="${AppState.userEmail}" placeholder="voce@empresa.com.br" />
          </div>
          <div class="auth-field">
            <label>Senha</label>
            <input type="password" value="••••••••" />
          </div>
          <div class="auth-field">
            <label>Confirmar senha</label>
            <input type="password" value="••••••••" />
          </div>
          <button type="button" class="auth-submit-btn" id="auth-action-submit">Criar conta e iniciar</button>
        `;
      } else {
        authFormContainer.innerHTML = `
          <div class="auth-field">
            <label>Email</label>
            <input type="email" id="auth-email" value="${AppState.userEmail}" placeholder="voce@empresa.com.br" />
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input type="password" value="••••••••" />
          </div>
          <button type="button" class="auth-submit-btn" id="auth-action-submit" style="margin-top: 26px;">Login</button>
        `;
      }

      document.getElementById('auth-action-submit')?.addEventListener('click', () => {
        const uInput = document.getElementById('auth-username');
        const eInput = document.getElementById('auth-email');
        if (uInput && uInput.value.trim()) AppState.userName = uInput.value.trim();
        if (eInput && eInput.value.trim()) AppState.userEmail = eInput.value.trim();
        showToast(`Bem-vindo, ${AppState.userName}!`);
        goToScreen('screen-escopo-inicial', true);
      });
    }
  }

  tabLoginBtn?.addEventListener('click', () => setAuthMode('login'));
  tabSignupBtn?.addEventListener('click', () => setAuthMode('signup'));
  toggleRememberBtn?.addEventListener('click', () => toggleRememberBtn.classList.toggle('active'));
  setAuthMode('login');

  // ==========================================================================
  // PERGUNTA 1 (NOVA): ESCOPO DE CONTRATAÇÃO / VIA RÁPIDA DE TECNOLOGIA
  // ==========================================================================
  function activateScope(scope) {
    AppState.contractScope = scope;
    document.querySelectorAll('#screen-escopo-inicial .option-glass-card').forEach(c => {
      c.classList.toggle('selected', c.getAttribute('data-scope') === scope);
    });

    if (scope === 'tecnologia') {
      AppState.formato = 'Apenas Tecnologia';
      AppState.selectedItems = [
        'LED, som e luz',
        'Transmissão ao vivo',
        'Credenciamento e tecnologia',
        'Equipe de produção'
      ];
    } else if (scope === 'online') {
      AppState.locMode = 'Remoto';
      AppState.locationText = 'Evento 100% Online / Estúdio';
      AppState.selectedItems = [
        'LED, som e luz',
        'Conteúdo e criação',
        'Atrações e palestrantes',
        'Credenciamento e tecnologia',
        'Transmissão ao vivo',
        'Equipe de produção'
      ];
    } else if (scope === 'cenografia') {
      AppState.formato = 'Feira e estande';
      AppState.selectedItems = [
        'Espaço e licenças',
        'Cenografia e estrutura',
        'LED, som e luz',
        'Equipe de produção'
      ];
    } else {
      const fmtConfig = window.EventBudgetEngine.formats[AppState.formato] || window.EventBudgetEngine.formats['Convencao de vendas'];
      AppState.selectedItems = [...fmtConfig.defaultItems];
    }
    updateProgressCounters('screen-escopo-inicial');
  }

  document.querySelectorAll('#screen-escopo-inicial .option-glass-card').forEach(card => {
    card.addEventListener('click', () => {
      const scope = card.getAttribute('data-scope');
      activateScope(scope);
      if (scope === 'tecnologia') {
        showToast('Via Rápida ativada: apenas 6 perguntas técnicas!');
      }
    });
  });

  // Botão de atalho na tela de formato para quem decidir pular para apenas tecnologia
  document.getElementById('btn-shortcut-tech')?.addEventListener('click', () => {
    activateScope('tecnologia');
    showToast('Via Rápida de Tecnologia ativada!');
    goToScreen('screen-localizacao', true);
  });

  // ==========================================================================
  // PERGUNTA 2: FORMATO DO EVENTO
  // ==========================================================================
  const formatCards = document.querySelectorAll('#screen-pergunta-1 .option-glass-card');
  formatCards.forEach(card => {
    card.addEventListener('click', () => {
      formatCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const fmtKey = card.getAttribute('data-format');
      AppState.formato = fmtKey;
      const fmtConfig = window.EventBudgetEngine.formats[fmtKey];
      if (fmtConfig && fmtConfig.defaultItems) {
        AppState.selectedItems = [...fmtConfig.defaultItems];
      }
    });
  });

  // ==========================================================================
  // PERGUNTA 3 (NOVA): OBJETIVO DO PROJETO
  // ==========================================================================
  const objCards = document.querySelectorAll('#grid-objetivo .option-glass-card');
  objCards.forEach(card => {
    card.addEventListener('click', () => {
      objCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.mainObjective = card.getAttribute('data-objective');
    });
  });

  // ==========================================================================
  // PERGUNTA 4: LOCALIZAÇÃO (SIMPLIFICADA: BOTÕES DE MODALIDADE + ESCRITA + MAPS)
  // ==========================================================================
  const locInput = document.getElementById('loc-input');
  const locCheck = document.getElementById('loc-confirmed-check');
  const locAutoList = document.getElementById('loc-autocomplete-list');
  const locModeBtns = document.querySelectorAll('.loc-mode-btn');
  let locSearchTimeout = null;

  locModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      locModeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-loc-mode');
      AppState.locMode = mode;
      if (mode === 'Remoto') {
        AppState.locationText = 'Evento 100% Online / Transmissão Digital';
        if (locInput) locInput.value = 'Evento 100% Online / Transmissão Digital';
        locCheck?.classList.add('visible');
      }
    });
  });

  document.querySelectorAll('.loc-quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const city = chip.getAttribute('data-city');
      AppState.locationText = city;
      if (locInput) locInput.value = city;
      locCheck?.classList.add('visible');
      locAutoList?.classList.remove('open');
    });
  });

  const fallbackPlaces = [
    { title: 'São Paulo - SP (WTC Events Center / Brooklin)', sub: 'Av. das Nações Unidas, 12551 — São Paulo', mode: 'Presencial' },
    { title: 'São Paulo - SP (Expo Center Norte / Anhembi)', sub: 'Pavilhão e Centro de Convenções — São Paulo', mode: 'Presencial' },
    { title: 'São Paulo - SP (Região Av. Paulista / Jardins)', sub: 'Hotéis e Espaços Corporativos — São Paulo', mode: 'Presencial' },
    { title: 'Rio de Janeiro - RJ (Barra da Tijuca / Zona Sul)', sub: 'Centro de Convenções & Hotéis — RJ', mode: 'Presencial' },
    { title: 'Campinas / Interior de SP (Royal Palm Hall / Resorts)', sub: 'Interior de São Paulo — SP', mode: 'Presencial' },
    { title: 'Ainda não definido (Orçar referência padrão)', sub: 'Definiremos o espaço junto com a agência', mode: 'Presencial' }
  ];

  function renderAddressOptions(items) {
    if (!locAutoList) return;
    if (!items || items.length === 0) {
      locAutoList.classList.remove('open');
      return;
    }
    locAutoList.innerHTML = items.map((it, idx) => `
      <button type="button" class="loc-auto-option" data-idx="${idx}">
        <strong>Clique para confirmar: ${it.title}</strong>
        <small>${it.sub}</small>
      </button>
    `).join('');
    locAutoList.classList.add('open');

    locAutoList.querySelectorAll('.loc-auto-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const picked = items[Number(btn.getAttribute('data-idx'))];
        if (picked) {
          AppState.locationText = picked.title;
          if (locInput) locInput.value = picked.title;
          locAutoList.classList.remove('open');
          locCheck?.classList.add('visible');
        }
      });
    });
  }

  if (locInput) {
    locInput.addEventListener('input', () => {
      const query = locInput.value.trim();
      AppState.locationText = query || 'Ainda não definido';
      if (query.length < 2) {
        locAutoList?.classList.remove('open');
        return;
      }
      const qLower = query.toLowerCase();
      const localMatches = fallbackPlaces.filter(p =>
        p.title.toLowerCase().includes(qLower) || p.sub.toLowerCase().includes(qLower)
      );
      const immediateOptions = [
        { title: query, sub: 'Usar este local digitado no orçamento', mode: AppState.locMode },
        ...localMatches
      ].slice(0, 4);

      renderAddressOptions(immediateOptions);

      clearTimeout(locSearchTimeout);
      locSearchTimeout = setTimeout(async () => {
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=3&countrycodes=br&q=${encodeURIComponent(query)}`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          if (!resp.ok) return;
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0 && locInput.value.trim() === query) {
            const apiItems = data.map(place => {
              const parts = (place.display_name || '').split(',').map(s => s.trim());
              return {
                title: parts.slice(0, 2).join(', ') || query,
                sub: parts.slice(2, 5).join(', ') || 'Brasil',
                mode: AppState.locMode
              };
            });
            renderAddressOptions([
              { title: query, sub: 'Confirmar texto digitado', mode: AppState.locMode },
              ...apiItems
            ]);
          }
        } catch (_) {}
      }, 280);
    });
  }

  // ==========================================================================
  // PERGUNTA 5 (NOVA): SITUAÇÃO DO ESPAÇO
  // ==========================================================================
  const spaceCards = document.querySelectorAll('#grid-espaco .option-glass-card');
  spaceCards.forEach(card => {
    card.addEventListener('click', () => {
      spaceCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.spaceStatus = card.getAttribute('data-space');
    });
  });

  // ==========================================================================
  // PERGUNTA 6 (SIMPLIFICADA SEM ROLDANA): PÚBLICO, DIAS E PRAZO
  // ==========================================================================
  const paxDirectInput = document.getElementById('pax-direct-input');
  const daysDirectInput = document.getElementById('days-direct-input');
  const paxQuickBtns = document.querySelectorAll('#pax-quick-btns .click-chip');
  const daysQuickBtns = document.querySelectorAll('#days-quick-btns .click-chip');
  const leadQuickBtns = document.querySelectorAll('#leadtime-quick-btns .click-chip');

  paxQuickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      paxQuickBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = Number(btn.getAttribute('data-pax'));
      AppState.pax = val;
      if (paxDirectInput) paxDirectInput.value = val;
      const hotelInput = document.getElementById('input-hotel-pax');
      if (hotelInput) hotelInput.value = Math.round(val * 0.7);
    });
  });

  paxDirectInput?.addEventListener('input', () => {
    const val = Math.max(1, Number(paxDirectInput.value) || 300);
    AppState.pax = val;
    paxQuickBtns.forEach(b => {
      b.classList.toggle('active', Number(b.getAttribute('data-pax')) === val);
    });
  });

  daysQuickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      daysQuickBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = Number(btn.getAttribute('data-days'));
      AppState.days = val;
      if (daysDirectInput) daysDirectInput.value = val;
    });
  });

  daysDirectInput?.addEventListener('input', () => {
    const val = Math.max(1, Number(daysDirectInput.value) || 3);
    AppState.days = val;
    daysQuickBtns.forEach(b => {
      b.classList.toggle('active', Number(b.getAttribute('data-days')) === val);
    });
  });

  leadQuickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      leadQuickBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.leadTime = btn.getAttribute('data-lead');
    });
  });

  // ==========================================================================
  // PERGUNTA 7 (NOVA): AMBIENTES E SALAS SIMULTÂNEAS
  // ==========================================================================
  const roomCards = document.querySelectorAll('#grid-ambientes .option-glass-card');
  const breakoutInput = document.getElementById('input-breakout-rooms');
  roomCards.forEach(card => {
    card.addEventListener('click', () => {
      roomCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.roomLayout = card.getAttribute('data-room-layout');
      const defRooms = Number(card.getAttribute('data-default-rooms') || 0);
      AppState.breakoutRooms = defRooms;
      if (breakoutInput) breakoutInput.value = defRooms;
    });
  });

  // ==========================================================================
  // PERGUNTAS 8, 9, 10, 11, 12, 13 (MÚLTIPLA ESCOLHA CLICÁVEL COM HOVER)
  // ==========================================================================
  function bindMultiSelectGroup(containerSelector, attrName, stateArrayKey, exclusiveValue = null) {
    const buttons = document.querySelectorAll(`${containerSelector} [data-${attrName}]`);
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute(`data-${attrName}`);
        if (exclusiveValue && val === exclusiveValue) {
          buttons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          AppState[stateArrayKey] = [exclusiveValue];
          return;
        }
        if (exclusiveValue) {
          const exclBtn = document.querySelector(`${containerSelector} [data-${attrName}="${exclusiveValue}"]`);
          exclBtn?.classList.remove('selected');
        }
        btn.classList.toggle('selected');
        const activeVals = [];
        buttons.forEach(b => {
          if (b.classList.contains('selected')) {
            activeVals.push(b.getAttribute(`data-${attrName}`));
          }
        });
        AppState[stateArrayKey] = activeVals;
      });
    });
  }

  bindMultiSelectGroup('#grid-tech-choices', 'tech-item', 'techChoices');
  bindMultiSelectGroup('#grid-stream-choices', 'stream-item', 'streamChoices');
  bindMultiSelectGroup('#grid-cenografia', 'ceno', 'cenoChoices');
  bindMultiSelectGroup('#grid-ab-choices', 'ab-item', 'abChoices', 'Sem A&B');
  bindMultiSelectGroup('#grid-log-choices', 'log-item', 'logChoices', 'Sem logística');
  bindMultiSelectGroup('#grid-cont-choices', 'cont-item', 'contChoices');

  // ==========================================================================
  // PERGUNTA 14: PADRÃO DE ENTREGA
  // ==========================================================================
  const padraoCards = document.querySelectorAll('#screen-padrao-entrega .option-glass-card');
  padraoCards.forEach(card => {
    card.addEventListener('click', () => {
      padraoCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.padrao = card.getAttribute('data-padrao');
    });
  });

  // ==========================================================================
  // PERGUNTA 15: O QUE ENTRA NA CONTA? (BOTÕES CLICÁVEIS COM HOVER E CHECK)
  // ==========================================================================
  const entraListContainer = document.getElementById('entra-list-scroll');

  function renderAccountItems() {
    if (!entraListContainer) return;
    const allCats = window.EventBudgetEngine.allCategories;
    entraListContainer.innerHTML = allCats.map(item => {
      const isSelected = AppState.selectedItems.includes(item);
      return `
        <button type="button" class="entra-btn-card ${isSelected ? 'selected' : ''}" data-account-item="${item}">
          <span class="entra-check">✓</span>
          <span>${item}</span>
        </button>
      `;
    }).join('');

    entraListContainer.querySelectorAll('.entra-btn-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.getAttribute('data-account-item');
        const idx = AppState.selectedItems.indexOf(item);
        if (idx >= 0) {
          if (AppState.selectedItems.length > 1) {
            AppState.selectedItems.splice(idx, 1);
            btn.classList.remove('selected');
          }
        } else {
          AppState.selectedItems.push(item);
          btn.classList.add('selected');
        }
      });
    });
  }

  renderAccountItems();

  document.getElementById('btn-ver-estimativa')?.addEventListener('click', () => {
    syncInputsToState();
    goToScreen('screen-resultado', true);
  });

  // Sincroniza todos os campos de texto/número digitados pelo usuário com o AppState
  function syncInputsToState() {
    const themeEl = document.getElementById('input-event-theme');
    if (themeEl) AppState.eventTheme = themeEl.value.trim();

    const locEl = document.getElementById('loc-input');
    if (locEl && locEl.value.trim()) AppState.locationText = locEl.value.trim();

    const spaceEl = document.getElementById('input-space-details');
    if (spaceEl) AppState.spaceDetails = spaceEl.value.trim();

    const paxEl = document.getElementById('pax-direct-input');
    if (paxEl && Number(paxEl.value) > 0) AppState.pax = Number(paxEl.value);

    const daysEl = document.getElementById('days-direct-input');
    if (daysEl && Number(daysEl.value) > 0) AppState.days = Number(daysEl.value);

    const roomsEl = document.getElementById('input-breakout-rooms');
    if (roomsEl && roomsEl.value !== '') AppState.breakoutRooms = Number(roomsEl.value);

    const ledEl = document.getElementById('input-led-m2');
    if (ledEl && Number(ledEl.value) >= 0) AppState.ledM2 = Number(ledEl.value);

    const techDetEl = document.getElementById('input-tech-details');
    if (techDetEl) AppState.techDetails = techDetEl.value.trim();

    const cenoDetEl = document.getElementById('input-ceno-details');
    if (cenoDetEl) AppState.cenoDetails = cenoDetEl.value.trim();

    const hotelPaxEl = document.getElementById('input-hotel-pax');
    if (hotelPaxEl && hotelPaxEl.value !== '') AppState.hotelPax = Number(hotelPaxEl.value);

    const budgetEl = document.getElementById('input-budget-target');
    if (budgetEl) AppState.budgetTarget = budgetEl.value.trim();

    // Sincroniza categorias ativas com base nas escolhas das telas anteriores
    if (AppState.abChoices.includes('Sem A&B')) {
      AppState.selectedItems = AppState.selectedItems.filter(i => i !== 'Alimentação e bebidas');
    }
    if (AppState.logChoices.includes('Sem logística')) {
      AppState.selectedItems = AppState.selectedItems.filter(i => i !== 'Hospedagem' && i !== 'Aéreo e logística');
    }
    if (AppState.streamChoices.includes('Streaming Online') && !AppState.selectedItems.includes('Transmissão ao vivo')) {
      AppState.selectedItems.push('Transmissão ao vivo');
    }
  }

  // ==========================================================================
  // TELA FINAL 1: RESULTADO DA ESTIMATIVA (COM ÍCONES SÓLIDOS MONOCROMÁTICOS)
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

    if (userTag) userTag.textContent = `${(AppState.userName || 'CLIENTE').toUpperCase()}, SUA ESTIMATIVA`;
    if (formatTag) formatTag.textContent = calc.formatLabel.toUpperCase();
    if (minEl) minEl.textContent = window.EventBudgetEngine.formatCurrencyCompact(calc.totalMin);
    if (maxEl) maxEl.textContent = window.EventBudgetEngine.formatCurrencyCompact(calc.totalMax);
    if (perPaxEl) {
      perPaxEl.textContent = `Orçado médio: ${window.EventBudgetEngine.formatCurrencyCompact(calc.totalOrcado)} • Por participante: R$ ${calc.perPaxMin.toLocaleString('pt-BR')} a R$ ${calc.perPaxMax.toLocaleString('pt-BR')}`;
    }

    if (pillsEl) {
      const locShort = AppState.locationText ? AppState.locationText.split('(')[0].trim() : 'A definir';
      pillsEl.innerHTML = `
        <span class="res-mini-pill">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-1px;margin-right:3px;"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          ${calc.pax.toLocaleString('pt-BR')} pessoas
        </span>
        <span class="res-mini-pill">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-1px;margin-right:3px;"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/></svg>
          ${calc.days} ${calc.days === 1 ? 'dia' : 'dias'}
        </span>
        <span class="res-mini-pill">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-1px;margin-right:3px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          ${locShort}
        </span>
        <span class="res-mini-pill">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-1px;margin-right:3px;"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          Padrão ${AppState.padrao}
        </span>
      `;
    }

    if (barsContainer) {
      barsContainer.innerHTML = calc.bars.map(b => `
        <div class="money-bar-row">
          <div class="money-bar-header">
            <span>${b.name}</span>
            <span class="pct">${b.pct}% (${window.EventBudgetEngine.formatCurrencyCompact(b.orcado)})</span>
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
        }, 60);
      });
    }
  }

  document.getElementById('btn-ir-pagamento')?.addEventListener('click', () => {
    goToScreen('screen-pagamento', true);
  });

  // ==========================================================================
  // TELA FINAL 2: PAGAMENTO E MODAL EXCEL DE 2 ABAS (RESUMO + ORÇAMENTO 47 ITENS)
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
    const nameInput = document.getElementById('pay-name');
    const compInput = document.getElementById('pay-company');
    const emailInput = document.getElementById('pay-email');
    if (nameInput) nameInput.value = 'Arthur Souza';
    if (compInput) compInput.value = 'rstcom';
    if (emailInput) emailInput.value = 'arthur@rstcom.com.br';
    showToast('Dados preenchidos com sucesso!');
  });

  const excelModal = document.getElementById('excel-modal-backdrop');
  const excelSheetTabs = document.querySelectorAll('.excel-sheet-tab');
  const tabPaneResumo = document.getElementById('excel-tab-resumo');
  const tabPaneOrcamento = document.getElementById('excel-tab-orcamento');
  const excelFormulaDisplay = document.getElementById('excel-formula-display');

  excelSheetTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      excelSheetTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-excel-tab');
      const isResumo = targetTab === 'resumo';
      tabPaneResumo?.classList.toggle('active', isResumo);
      tabPaneOrcamento?.classList.toggle('active', !isResumo);
      if (excelFormulaDisplay) {
        excelFormulaDisplay.textContent = isResumo
          ? "=SUMIF('Orçamento'!$B$4:$B$50; Categoria; 'Orçamento'!$K$4:$K$50)"
          : '=IF($A4="S"; E4*H4; 0) • Edite Incluir (S/N), Qtd ou Unit. Orçado';
      }
    });
  });

  function recomputeFromSpreadsheetItems() {
    const calc = AppState.lastCalculation;
    if (!calc) return;

    const categoryTotals = window.EventBudgetEngine.allCategories.map(catName => {
      const catRows = calc.spreadsheetItems.filter(r => r.category === catName && r.include === 'S');
      return {
        name: catName,
        min: catRows.reduce((s, r) => s + r.subMin, 0),
        max: catRows.reduce((s, r) => s + r.subMax, 0),
        orcado: catRows.reduce((s, r) => s + r.subOrcado, 0)
      };
    });

    calc.categoryTotals = categoryTotals;
    calc.directMin = categoryTotals.reduce((s, c) => s + c.min, 0);
    calc.directMax = categoryTotals.reduce((s, c) => s + c.max, 0);
    calc.directOrcado = categoryTotals.reduce((s, c) => s + c.orcado, 0);

    const { rates } = calc;
    calc.totalMin = Math.round(calc.directMin * (1 + rates.feeMin + rates.contMin + rates.taxMin));
    calc.totalMax = Math.round(calc.directMax * (1 + rates.feeMax + rates.contMax + rates.taxMax));
    calc.totalOrcado = Math.round(calc.directOrcado * (1 + rates.feeOrc + rates.contOrc + rates.taxOrc));

    calc.perPaxMin = Math.round(calc.totalMin / calc.pax);
    calc.perPaxMax = Math.round(calc.totalMax / calc.pax);
    calc.perPaxOrcado = Math.round(calc.totalOrcado / calc.pax);

    renderExcelResumoTab();
    updateExcelFooterTotals();
  }

  function updateExcelFooterTotals() {
    const calc = AppState.lastCalculation;
    if (!calc) return;
    const minEl = document.getElementById('excel-total-min');
    const maxEl = document.getElementById('excel-total-max');
    const orcEl = document.getElementById('excel-total-orcado');
    if (minEl) minEl.textContent = window.EventBudgetEngine.formatCurrencyCompact(calc.totalMin);
    if (maxEl) maxEl.textContent = window.EventBudgetEngine.formatCurrencyCompact(calc.totalMax);
    if (orcEl) orcEl.textContent = window.EventBudgetEngine.formatCurrencyCompact(calc.totalOrcado);
  }

  function renderExcelResumoTab() {
    const calc = AppState.lastCalculation;
    if (!calc) return;

    const metaGrid = document.getElementById('excel-resumo-meta-grid');
    const catTbody = document.getElementById('excel-resumo-cat-tbody');
    const ratesTbody = document.getElementById('excel-resumo-rates-tbody');
    const grandBox = document.getElementById('excel-resumo-grand-total');
    const filenameEl = document.getElementById('excel-modal-filename');

    const safeFmtSlug = calc.formatLabel.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    if (filenameEl) {
      filenameEl.textContent = `Orcamento-${safeFmtSlug}.xlsx`;
    }

    if (metaGrid) {
      const todayStr = new Date().toLocaleDateString('pt-BR');
      const metaItems = [
        ['Preparado para', `${AppState.userName} · ${AppState.userCompany || 'rstcom'}`],
        ['Formato', calc.formatLabel],
        ['Público', `${calc.pax} pessoas`],
        ['Duração', `${calc.days} ${calc.days === 1 ? 'dia' : 'dias'}`],
        ['Local', AppState.locationText || 'Ainda não definido'],
        ['Padrão', AppState.padrao],
        ['Prazo', AppState.leadTime],
        ['Data do cálculo', todayStr],
        ['Objetivo', AppState.mainObjective],
        ['Situação do espaço', AppState.spaceStatus],
        ['Ambientes / Salas', `${AppState.roomLayout} (${AppState.breakoutRooms} extras)`],
        ['Verba / Observações', AppState.budgetTarget || 'Conforme planilha']
      ];
      metaGrid.innerHTML = metaItems.map(([k, v]) => `
        <div class="excel-meta-row">
          <strong>${k}:</strong>
          <span>${v}</span>
        </div>
      `).join('');
    }

    if (catTbody) {
      catTbody.innerHTML = calc.categoryTotals.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td class="num-col">${window.EventBudgetEngine.formatBRL(c.min)}</td>
          <td class="num-col">${window.EventBudgetEngine.formatBRL(c.max)}</td>
          <td class="num-col"><strong>${window.EventBudgetEngine.formatBRL(c.orcado)}</strong></td>
        </tr>
      `).join('') + `
        <tr class="subtotal-direct-row">
          <td>Subtotal de custos diretos</td>
          <td class="num-col">${window.EventBudgetEngine.formatBRL(calc.directMin)}</td>
          <td class="num-col">${window.EventBudgetEngine.formatBRL(calc.directMax)}</td>
          <td class="num-col">${window.EventBudgetEngine.formatBRL(calc.directOrcado)}</td>
        </tr>
      `;
    }

    if (ratesTbody) {
      const { rates } = calc;
      ratesTbody.innerHTML = `
        <tr>
          <td>Honorários de agência</td>
          <td class="num-col cell-orange-edit"><input type="number" step="0.5" class="excel-edit-input" data-rate-key="feeMin" value="${(rates.feeMin * 100).toFixed(1)}" /></td>
          <td class="num-col cell-orange-edit"><input type="number" step="0.5" class="excel-edit-input" data-rate-key="feeMax" value="${(rates.feeMax * 100).toFixed(1)}" /></td>
          <td class="num-col cell-orange-edit"><input type="number" step="0.5" class="excel-edit-input" data-rate-key="feeOrc" value="${(rates.feeOrc * 100).toFixed(1)}" /></td>
        </tr>
        <tr>
          <td>Contingência</td>
          <td class="num-col cell-orange-edit"><input type="number" step="0.5" class="excel-edit-input" data-rate-key="contMin" value="${(rates.contMin * 100).toFixed(1)}" /></td>
          <td class="num-col cell-orange-edit"><input type="number" step="0.5" class="excel-edit-input" data-rate-key="contMax" value="${(rates.contMax * 100).toFixed(1)}" /></td>
          <td class="num-col cell-orange-edit"><input type="number" step="0.5" class="excel-edit-input" data-rate-key="contOrc" value="${(rates.contOrc * 100).toFixed(1)}" /></td>
        </tr>
        <tr>
          <td>Impostos sobre nota</td>
          <td class="num-col cell-orange-edit"><input type="number" step="0.5" class="excel-edit-input" data-rate-key="taxMin" value="${(rates.taxMin * 100).toFixed(1)}" /></td>
          <td class="num-col cell-orange-edit"><input type="number" step="0.5" class="excel-edit-input" data-rate-key="taxMax" value="${(rates.taxMax * 100).toFixed(1)}" /></td>
          <td class="num-col cell-orange-edit"><input type="number" step="0.5" class="excel-edit-input" data-rate-key="taxOrc" value="${(rates.taxOrc * 100).toFixed(1)}" /></td>
        </tr>
      `;

      ratesTbody.querySelectorAll('.excel-edit-input').forEach(inp => {
        inp.addEventListener('input', () => {
          const k = inp.getAttribute('data-rate-key');
          const valPct = Math.max(0, Number(inp.value) || 0) / 100;
          calc.rates[k] = valPct;
          AppState.customRates[k] = valPct;
          recomputeFromSpreadsheetItems();
        });
      });
    }

    if (grandBox) {
      grandBox.innerHTML = `
        <div class="grand-total-line">
          <span>Investimento total estimado:</span>
          <span>Mín: ${window.EventBudgetEngine.formatBRL(calc.totalMin)} | Máx: ${window.EventBudgetEngine.formatBRL(calc.totalMax)} | Orçado: ${window.EventBudgetEngine.formatBRL(calc.totalOrcado)}</span>
        </div>
        <div class="grand-pax-line">
          <span>Custo por participante (${calc.pax} pessoas):</span>
          <span>Mín: ${window.EventBudgetEngine.formatBRL(calc.perPaxMin)} | Máx: ${window.EventBudgetEngine.formatBRL(calc.perPaxMax)} | Orçado: ${window.EventBudgetEngine.formatBRL(calc.perPaxOrcado)}</span>
        </div>
      `;
    }
  }

  function renderExcelOrcamentoTab() {
    const calc = AppState.lastCalculation;
    const tbody = document.getElementById('excel-table-tbody');
    if (!calc || !tbody) return;

    tbody.innerHTML = calc.spreadsheetItems.map((row, idx) => {
      const isExcluded = row.include !== 'S';
      return `
        <tr class="${isExcluded ? 'row-excluded' : ''}" data-item-row="${idx}">
          <td class="cell-orange-edit" style="text-align:center;">
            <select class="excel-include-select" data-inc-idx="${idx}">
              <option value="S" ${row.include === 'S' ? 'selected' : ''}>S</option>
              <option value="N" ${row.include === 'N' ? 'selected' : ''}>N</option>
            </select>
          </td>
          <td>${row.category}</td>
          <td><strong>${row.item}</strong></td>
          <td>${row.unit}</td>
          <td class="cell-orange-edit">
            <input type="number" class="excel-edit-input" data-qty-idx="${idx}" value="${row.qty}" min="0" />
          </td>
          <td class="num-col">${window.EventBudgetEngine.formatBRL(row.unitMin)}</td>
          <td class="num-col">${window.EventBudgetEngine.formatBRL(row.unitMax)}</td>
          <td class="cell-orange-edit">
            <input type="number" class="excel-edit-input" data-orc-idx="${idx}" value="${row.unitOrcado}" min="0" />
          </td>
          <td class="num-col" id="sub-min-${idx}">${window.EventBudgetEngine.formatBRL(row.subMin)}</td>
          <td class="num-col" id="sub-max-${idx}">${window.EventBudgetEngine.formatBRL(row.subMax)}</td>
          <td class="num-col" id="sub-orc-${idx}"><strong>${window.EventBudgetEngine.formatBRL(row.subOrcado)}</strong></td>
          <td>${row.status}</td>
          <td>${row.notes || ''}</td>
        </tr>
      `;
    }).join('') + `
      <tr class="subtotal-direct-row">
        <td colspan="8">Total de custos diretos</td>
        <td class="num-col" id="orc-tot-min">${window.EventBudgetEngine.formatBRL(calc.directMin)}</td>
        <td class="num-col" id="orc-tot-max">${window.EventBudgetEngine.formatBRL(calc.directMax)}</td>
        <td class="num-col" id="orc-tot-orc">${window.EventBudgetEngine.formatBRL(calc.directOrcado)}</td>
        <td colspan="2"></td>
      </tr>
    `;

    function updateRowCells(idx) {
      const item = calc.spreadsheetItems[idx];
      const isS = item.include === 'S';
      item.subMin = isS ? item.qty * item.unitMin : 0;
      item.subMax = isS ? item.qty * item.unitMax : 0;
      item.subOrcado = isS ? item.qty * item.unitOrcado : 0;

      const tr = tbody.querySelector(`tr[data-item-row="${idx}"]`);
      tr?.classList.toggle('row-excluded', !isS);

      const sMinEl = document.getElementById(`sub-min-${idx}`);
      const sMaxEl = document.getElementById(`sub-max-${idx}`);
      const sOrcEl = document.getElementById(`sub-orc-${idx}`);
      if (sMinEl) sMinEl.textContent = window.EventBudgetEngine.formatBRL(item.subMin);
      if (sMaxEl) sMaxEl.textContent = window.EventBudgetEngine.formatBRL(item.subMax);
      if (sOrcEl) sOrcEl.innerHTML = `<strong>${window.EventBudgetEngine.formatBRL(item.subOrcado)}</strong>`;

      recomputeFromSpreadsheetItems();

      const totMinEl = document.getElementById('orc-tot-min');
      const totMaxEl = document.getElementById('orc-tot-max');
      const totOrcEl = document.getElementById('orc-tot-orc');
      if (totMinEl) totMinEl.textContent = window.EventBudgetEngine.formatBRL(calc.directMin);
      if (totMaxEl) totMaxEl.textContent = window.EventBudgetEngine.formatBRL(calc.directMax);
      if (totOrcEl) totOrcEl.textContent = window.EventBudgetEngine.formatBRL(calc.directOrcado);
    }

    tbody.querySelectorAll('[data-inc-idx]').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = Number(sel.getAttribute('data-inc-idx'));
        calc.spreadsheetItems[idx].include = sel.value;
        updateRowCells(idx);
      });
    });

    tbody.querySelectorAll('[data-qty-idx]').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = Number(inp.getAttribute('data-qty-idx'));
        calc.spreadsheetItems[idx].qty = Math.max(0, Number(inp.value) || 0);
        updateRowCells(idx);
      });
    });

    tbody.querySelectorAll('[data-orc-idx]').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = Number(inp.getAttribute('data-orc-idx'));
        calc.spreadsheetItems[idx].unitOrcado = Math.max(0, Number(inp.value) || 0);
        updateRowCells(idx);
      });
    });
  }

  function openExcelPopup() {
    syncInputsToState();
    const nameVal = document.getElementById('pay-name')?.value.trim();
    const compVal = document.getElementById('pay-company')?.value.trim();
    const emailVal = document.getElementById('pay-email')?.value.trim();
    if (nameVal) AppState.userName = nameVal;
    if (compVal) AppState.userCompany = compVal;
    if (emailVal) AppState.userEmail = emailVal;

    AppState.lastCalculation = window.EventBudgetEngine.calculate(AppState);
    renderExcelResumoTab();
    renderExcelOrcamentoTab();
    updateExcelFooterTotals();

    excelModal?.classList.add('open');
    showToast('Planilha oficial (.xlsx) gerada com sucesso!');
  }

  document.getElementById('btn-confirmar-pagamento')?.addEventListener('click', openExcelPopup);
  document.getElementById('excel-close-btn')?.addEventListener('click', () => {
    excelModal?.classList.remove('open');
  });

  // Download nativo do arquivo .xlsx real (com as abas Resumo e Orçamento e fórmulas SUMIF/IF)
  document.getElementById('btn-download-csv')?.addEventListener('click', () => {
    if (!AppState.lastCalculation) {
      AppState.lastCalculation = window.EventBudgetEngine.calculate(AppState);
    }
    const calc = AppState.lastCalculation;
    const blob = window.EventBudgetEngine.generateXlsxBlob(AppState, calc);
    const url = URL.createObjectURL(blob);
    const safeFmt = calc.formatLabel.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Orcamento-${safeFmt}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Arquivo Orcamento-${safeFmt}.xlsx baixado!`);
  });

  document.getElementById('btn-send-email')?.addEventListener('click', () => {
    const email = AppState.userEmail || 'contato@rstcom.com.br';
    const calc = AppState.lastCalculation || window.EventBudgetEngine.calculate(AppState);
    const subject = encodeURIComponent(`Orçamento Estimado RSTCOM — ${calc.formatLabel} (${calc.pax} pessoas)`);
    const body = encodeURIComponent(
      `Olá ${AppState.userName},\n\n` +
      `Segue o resumo executivo da simulação realizada na plataforma RSTCOM:\n\n` +
      `• Escopo: ${AppState.contractScope === 'tecnologia' ? 'Apenas Tecnologia (Via Rápida)' : 'Evento Completo 360°'}\n` +
      `• Formato: ${calc.formatLabel}\n` +
      `• Objetivo: ${AppState.mainObjective}\n` +
      `• Público: ${calc.pax} pessoas | Duração: ${calc.days} dias\n` +
      `• Local: ${AppState.locationText}\n` +
      `• Espaço: ${AppState.spaceStatus} ${AppState.spaceDetails ? '(' + AppState.spaceDetails + ')' : ''}\n` +
      `• Padrão de Entrega: ${AppState.padrao} | Prazo: ${AppState.leadTime}\n\n` +
      `• Subtotal Custos Diretos (Orçado): ${window.EventBudgetEngine.formatBRL(calc.directOrcado)}\n` +
      `• Investimento Total Estimado: de ${window.EventBudgetEngine.formatBRL(calc.totalMin)} a ${window.EventBudgetEngine.formatBRL(calc.totalMax)}\n` +
      `• Valor Orçado Recomendado: ${window.EventBudgetEngine.formatBRL(calc.totalOrcado)} (${window.EventBudgetEngine.formatBRL(calc.perPaxOrcado)}/participante)\n\n` +
      `Atenciosamente,\nEquipe RSTCOM`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    showToast(`Abrindo e-mail para ${email}...`);
  });

  syncBrowserThemeColor(AppState.currentScreen);
});
