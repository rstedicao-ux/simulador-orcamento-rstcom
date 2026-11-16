// ============================================================================
// MOTOR DE CÁLCULO & GERADOR NATIVO DE EXCEL (.XLSX) — PADRÃO EXECUTIVO RSTCOM
// ============================================================================

window.EventBudgetEngine = {
  formats: {
    'Convencao de vendas': {
      label: 'Convenção de vendas',
      mult: 1.0,
      defaultItems: [
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
      ]
    },
    'Lancamento de produto': {
      label: 'Lançamento de produto',
      mult: 1.18,
      defaultItems: [
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
        'Equipe de produção'
      ]
    },
    'Evento Institucional': {
      label: 'Evento Institucional',
      mult: 0.88,
      defaultItems: [
        'Espaço e licenças',
        'Cenografia e estrutura',
        'LED, som e luz',
        'Alimentação e bebidas',
        'Conteúdo e criação',
        'Atrações e palestrantes',
        'Brindes e kits',
        'Equipe de produção'
      ]
    },
    'Ativacao de marca': {
      label: 'Ativação de marca',
      mult: 0.82,
      defaultItems: [
        'Espaço e licenças',
        'Cenografia e estrutura',
        'LED, som e luz',
        'Conteúdo e criação',
        'Brindes e kits',
        'Equipe de produção'
      ]
    },
    'Congresso': {
      label: 'Congresso',
      mult: 0.96,
      defaultItems: [
        'Espaço e licenças',
        'Cenografia e estrutura',
        'LED, som e luz',
        'Alimentação e bebidas',
        'Atrações e palestrantes',
        'Credenciamento e tecnologia',
        'Transmissão ao vivo',
        'Equipe de produção'
      ]
    },
    'Festa Corporativa': {
      label: 'Festa Corporativa',
      mult: 0.92,
      defaultItems: [
        'Espaço e licenças',
        'Cenografia e estrutura',
        'LED, som e luz',
        'Alimentação e bebidas',
        'Atrações e palestrantes',
        'Conteúdo e criação',
        'Credenciamento e tecnologia',
        'Equipe de produção'
      ]
    },
    'Feira e estande': {
      label: 'Feira e estande',
      mult: 0.85,
      defaultItems: [
        'Espaço e licenças',
        'Cenografia e estrutura',
        'LED, som e luz',
        'Alimentação e bebidas',
        'Conteúdo e criação',
        'Brindes e kits',
        'Equipe de produção'
      ]
    },
    'Apenas Tecnologia': {
      label: 'Locação de Tecnologia & AV',
      mult: 1.0,
      defaultItems: [
        'LED, som e luz',
        'Transmissão ao vivo',
        'Credenciamento e tecnologia',
        'Equipe de produção'
      ]
    }
  },

  tiers: {
    'Essencial': { multMin: 0.74, multMax: 0.80 },
    'Corporativo': { multMin: 1.0, multMax: 1.0 },
    'Premium': { multMin: 1.28, multMax: 1.38 },
    'Iconico': { multMin: 1.65, multMax: 1.85 }
  },

  allCategories: [
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
  ],

  calculate(state) {
    const isTechOnly = state.contractScope === 'tecnologia';
    const fmtKey = isTechOnly ? 'Apenas Tecnologia' : (state.formato || 'Convencao de vendas');
    const fmt = this.formats[fmtKey] || this.formats['Convencao de vendas'];
    const tier = this.tiers[state.padrao] || this.tiers['Corporativo'];
    const pax = Math.max(10, Number(state.pax) || 300);
    const days = Math.max(1, Number(state.days) || 3);

    const leadMult = state.leadTime === 'Menos de 30 dias' ? 1.15 : (state.leadTime === 'De 1 a 3 meses' ? 1.05 : 1.0);
    const scaleMult = fmt.mult * leadMult;

    const rows = this.build47Items(state, pax, days, tier.multMin * scaleMult, tier.multMax * scaleMult);

    // Soma por categoria apenas dos itens com include === 'S'
    const categoryTotals = this.allCategories.map(catName => {
      const catRows = rows.filter(r => r.category === catName && r.include === 'S');
      const min = catRows.reduce((s, r) => s + r.subMin, 0);
      const max = catRows.reduce((s, r) => s + r.subMax, 0);
      const bud = catRows.reduce((s, r) => s + r.subOrcado, 0);
      return { name: catName, min, max, orcado: bud };
    });

    const directMin = categoryTotals.reduce((s, c) => s + c.min, 0);
    const directMax = categoryTotals.reduce((s, c) => s + c.max, 0);
    const directOrcado = categoryTotals.reduce((s, c) => s + c.orcado, 0);

    // Percentuais editáveis idênticos à planilha de referência
    const rates = state.customRates || {
      feeMin: 0.10, feeMax: 0.13, feeOrc: 0.115,
      contMin: 0.05, contMax: 0.08, contOrc: 0.065,
      taxMin: 0.06, taxMax: 0.10, taxOrc: 0.08
    };

    const multTotalMin = 1 + rates.feeMin + rates.contMin + rates.taxMin;
    const multTotalMax = 1 + rates.feeMax + rates.contMax + rates.taxMax;
    const multTotalOrc = 1 + rates.feeOrc + rates.contOrc + rates.taxOrc;

    const totalMin = Math.round(directMin * multTotalMin);
    const totalMax = Math.round(directMax * multTotalMax);
    const totalOrcado = Math.round(directOrcado * multTotalOrc);

    const perPaxMin = Math.round(totalMin / pax);
    const perPaxMax = Math.round(totalMax / pax);
    const perPaxOrcado = Math.round(totalOrcado / pax);

    // Barras de participação percentual nos custos diretos
    const activeCatTotals = categoryTotals.filter(c => c.orcado > 0);
    const sumDirect = Math.max(1, directOrcado);
    const bars = activeCatTotals
      .map(c => ({
        name: c.name,
        pct: Math.max(1, Math.round((c.orcado / sumDirect) * 100)),
        min: c.min,
        max: c.max,
        orcado: c.orcado
      }))
      .sort((a, b) => b.pct - a.pct);

    const sumPct = bars.reduce((s, b) => s + b.pct, 0);
    if (bars.length > 0 && sumPct !== 100) {
      bars[0].pct = Math.max(1, bars[0].pct + (100 - sumPct));
    }

    return {
      formatLabel: fmt.label,
      pax,
      days,
      directMin,
      directMax,
      directOrcado,
      rates,
      totalMin,
      totalMax,
      totalOrcado,
      perPaxMin,
      perPaxMax,
      perPaxOrcado,
      categoryTotals,
      bars,
      spreadsheetItems: rows
    };
  },

  // Constrói exatamente os 47 itens da planilha oficial de referência
  build47Items(state, pax, days, mMin, mMax) {
    const selectedCats = new Set(state.selectedItems || []);
    const isTechOnly = state.contractScope === 'tecnologia';
    const isOnline = state.locMode === 'Remoto' || state.contractScope === 'online';
    const extraRooms = Math.max(0, Number(state.breakoutRooms) || 2);
    const hotelPax = Math.max(0, Number(state.hotelPax) || Math.round(pax * 0.7));
    const ledM2 = Math.max(12, Number(state.ledM2) || Math.round(Math.max(18, pax * 0.06)));

    const techSet = new Set(state.techChoices || []);
    const streamSet = new Set(state.streamChoices || []);
    const cenoSet = new Set(state.cenoChoices || []);
    const abSet = new Set(state.abChoices || []);
    const logSet = new Set(state.logChoices || []);
    const contSet = new Set(state.contChoices || []);

    const hasCat = (cat) => selectedCats.has(cat);

    // Helper para criar cada uma das 47 linhas com valores de referência calibrados
    const makeRow = (inc, category, item, unit, qty, baseMin, baseMax, note = '') => {
      const q = Math.max(1, Math.round(qty));
      const uMin = Math.max(1, Math.round(baseMin * mMin));
      const uMax = Math.max(uMin, Math.round(baseMax * mMax));
      const uOrc = Math.round((uMin + uMax) / 2);
      const isIncluded = inc ? 'S' : 'N';
      return {
        include: isIncluded,
        category,
        item,
        unit,
        qty: q,
        unitMin: uMin,
        unitMax: uMax,
        unitOrcado: uOrc,
        subMin: isIncluded === 'S' ? q * uMin : 0,
        subMax: isIncluded === 'S' ? q * uMax : 0,
        subOrcado: isIncluded === 'S' ? q * uOrc : 0,
        supplier: '',
        status: 'A cotar',
        notes: note
      };
    };

    const incEspaco = !isTechOnly && !isOnline && hasCat('Espaço e licenças');
    const incCeno = !isTechOnly && hasCat('Cenografia e estrutura') && !cenoSet.has('Sem cenografia');
    const incLed = hasCat('LED, som e luz');
    const incAb = !isTechOnly && !isOnline && hasCat('Alimentação e bebidas') && !abSet.has('Sem A&B');
    const incHosp = !isTechOnly && !isOnline && hasCat('Hospedagem') && !logSet.has('Sem logística');
    const incAereo = !isTechOnly && !isOnline && hasCat('Aéreo e logística') && !logSet.has('Sem logística');
    const incConteudo = !isTechOnly && hasCat('Conteúdo e criação');
    const incAtracoes = !isTechOnly && hasCat('Atrações e palestrantes');
    const incCred = hasCat('Credenciamento e tecnologia');
    const incTransm = hasCat('Transmissão ao vivo') || isOnline || streamSet.has('Streaming Online');
    const incBrindes = !isTechOnly && !isOnline && hasCat('Brindes e kits');
    const incEquipe = hasCat('Equipe de produção');

    const spaceNote = state.spaceDetails || state.spaceStatus || '';
    const techNote = state.techDetails || '';
    const cenoNote = state.cenoDetails || '';

    return [
      // 1. Espaço e licenças (6 itens: Rows 4..9)
      makeRow(incEspaco, 'Espaço e licenças', 'Locação do espaço principal', 'diária', days, 26146, 46529, spaceNote),
      makeRow(incEspaco, 'Espaço e licenças', 'Diária de montagem e desmontagem', 'diária', Math.max(1, Math.round(days * 0.4)), 12416, 22347, ''),
      makeRow(incEspaco && extraRooms > 0, 'Espaço e licenças', 'Salas de apoio e breakouts', 'sala/dia', Math.max(1, extraRooms) * days, 2447, 5313, state.roomLayout || ''),
      makeRow(incEspaco, 'Espaço e licenças', 'ECAD e direitos de execução', 'verba', 1, 4044, 8211, ''),
      makeRow(incEspaco, 'Espaço e licenças', 'Alvarás, ART e bombeiros', 'verba', 1, 5152, 11592, ''),
      makeRow(incEspaco, 'Espaço e licenças', 'Seguro do evento', 'verba', 1, 3117, 6279, ''),

      // 2. Cenografia e estrutura (5 itens: Rows 10..14)
      makeRow(incCeno, 'Cenografia e estrutura', 'Projeto cenográfico e 3D', 'verba', 1, 15198, 36386, cenoNote),
      makeRow(incCeno, 'Cenografia e estrutura', 'Palco e estrutura', 'm²', Math.max(24, Math.round(pax * 0.12)), 631, 1208, ''),
      makeRow(incCeno && cenoSet.has('Entrada e Instagramáveis'), 'Cenografia e estrutura', 'Cenografia de entrada e convivência', 'm²', Math.max(16, Math.round(pax * 0.075)), 786, 1530, ''),
      makeRow(incCeno && cenoSet.has('Mobiliário e Lounges'), 'Cenografia e estrutura', 'Mobiliário e lounges', 'pessoa', pax, 45, 92, ''),
      makeRow(incCeno && cenoSet.has('Comunicação Visual'), 'Cenografia e estrutura', 'Sinalização e comunicação visual', 'm²', Math.max(15, Math.round(pax * 0.08)), 219, 383, ''),

      // 3. LED, som e luz (6 itens: Rows 15..20)
      makeRow(incLed && techSet.has('Painel de LED'), 'LED, som e luz', 'Painel de LED', 'm²/dia', ledM2 * days, 422, 760, techNote),
      makeRow(incLed && techSet.has('Sonorização'), 'LED, som e luz', 'Sonorização', 'diária', days, 11360, 20189, ''),
      makeRow(incLed && techSet.has('Iluminação cênica'), 'LED, som e luz', 'Iluminação cênica', 'diária', days, 12288, 22637, ''),
      makeRow(incLed && techSet.has('Projeção e Switcher'), 'LED, som e luz', 'Projeção, switcher e retorno de palco', 'diária', days, 7470, 15134, ''),
      makeRow(incLed && techSet.has('Gerador'), 'LED, som e luz', 'Gerador e energia extra', 'diária', days, 4637, 9660, ''),
      makeRow(incLed, 'LED, som e luz', 'Técnicos de operação', 'diária/pessoa', days * 7, 799, 1320, ''),

      // 4. Alimentação e bebidas (4 itens: Rows 21..24)
      makeRow(incAb && abSet.has('Coffee breaks'), 'Alimentação e bebidas', 'Coffee breaks (2 por dia)', 'serviço', pax * days * 2, 47, 84, ''),
      makeRow(incAb && abSet.has('Almoço'), 'Alimentação e bebidas', 'Almoço', 'refeição', pax * days, 118, 213, ''),
      makeRow(incAb && abSet.has('Jantar ou Coquetel'), 'Alimentação e bebidas', 'Coquetel ou jantar de encerramento', 'pessoa', pax, 191, 354, ''),
      makeRow(incAb && abSet.has('Open bar'), 'Alimentação e bebidas', 'Bebidas e open bar', 'pessoa', pax, 72, 142, ''),

      // 5. Hospedagem (2 itens: Rows 25..26)
      makeRow(incHosp && logSet.has('Hospedagem participantes'), 'Hospedagem', 'Hospedagem dos participantes', 'quarto/noite', Math.max(10, hotelPax * days), 544, 956, ''),
      makeRow(incHosp && logSet.has('Hospedagem equipe'), 'Hospedagem', 'Hospedagem da equipe', 'quarto/noite', Math.max(8, Math.round(days * 10)), 425, 692, ''),

      // 6. Aéreo e logística (3 itens: Rows 27..29)
      makeRow(incAereo && logSet.has('Passagens aéreas'), 'Aéreo e logística', 'Passagens aéreas', 'ida e volta', Math.max(10, Math.round(hotelPax * 0.7)), 1121, 2013, ''),
      makeRow(incAereo && logSet.has('Traslados'), 'Aéreo e logística', 'Traslados', 'trecho', Math.max(20, hotelPax * 2), 76, 143, ''),
      makeRow(incAereo, 'Aéreo e logística', 'Frete e logística de carga', 'verba', 1, 10304, 25760, ''),

      // 7. Conteúdo e criação (7 itens: Rows 30..36)
      makeRow(incConteudo && contSet.has('Identidade e Roteiro'), 'Conteúdo e criação', 'Conceito criativo e identidade do evento', 'verba', 1, 18032, 41860, state.eventTheme || ''),
      makeRow(incConteudo && contSet.has('Identidade e Roteiro'), 'Conteúdo e criação', 'Roteiro e direção criativa', 'verba', 1, 20866, 47334, ''),
      makeRow(incConteudo && contSet.has('Vídeos e Motion LED'), 'Conteúdo e criação', 'Vídeos de abertura e transição', 'vídeo', 2, 14168, 29946, ''),
      makeRow(incConteudo && contSet.has('Vídeos e Motion LED'), 'Conteúdo e criação', 'Conteúdo para LED e motion', 'verba', 1, 13910, 31556, ''),
      makeRow(incConteudo && contSet.has('Identidade e Roteiro'), 'Conteúdo e criação', 'Design de apresentações', 'slide', 20, 183, 377, ''),
      makeRow(incConteudo && contSet.has('Foto, Vídeo e Aftermovie'), 'Conteúdo e criação', 'Cobertura de foto e vídeo', 'diária', days, 6569, 13041, ''),
      makeRow(incConteudo && contSet.has('Foto, Vídeo e Aftermovie'), 'Conteúdo e criação', 'Aftermovie', 'vídeo', 1, 9274, 19320, ''),

      // 8. Atrações e palestrantes (3 itens: Rows 37..39)
      makeRow(incAtracoes && contSet.has('Mestre de Cerimônias / Palestrante'), 'Atrações e palestrantes', 'Mestre de cerimônias', 'cachê', 1, 10304, 25760, ''),
      makeRow(incAtracoes && contSet.has('Mestre de Cerimônias / Palestrante'), 'Atrações e palestrantes', 'Palestrante principal', 'cachê', 1, 38640, 93380, ''),
      makeRow(incAtracoes && contSet.has('Show ou Atração Musical'), 'Atrações e palestrantes', 'Show ou atração de encerramento', 'cachê', 1, 77280, 186760, ''),

      // 9. Credenciamento e tecnologia (3 itens: Rows 40..42)
      makeRow(incCred && streamSet.has('Credenciamento e Totens'), 'Credenciamento e tecnologia', 'Credenciamento e totens', 'pessoa', pax, 26, 49, ''),
      makeRow(incCred && streamSet.has('Aplicativo do Evento'), 'Credenciamento e tecnologia', 'Aplicativo do evento', 'verba', 1, 27048, 62790, ''),
      makeRow(incCred && streamSet.has('Interação ao Vivo'), 'Credenciamento e tecnologia', 'Interação e votação ao vivo', 'verba', 1, 9016, 20930, ''),

      // 10. Transmissão ao vivo (1 item: Row 43)
      makeRow(incTransm, 'Transmissão ao vivo', 'Transmissão ao vivo', 'diária', days, 29366, 63756, isOnline ? 'Evento Online / Híbrido' : ''),

      // 11. Brindes e kits (1 item: Row 44)
      makeRow(incBrindes && contSet.has('Brindes e Kits'), 'Brindes e kits', 'Kit do participante', 'kit', pax, 111, 235, ''),

      // 12. Equipe de produção (6 itens: Rows 45..50)
      makeRow(incEquipe, 'Equipe de produção', 'Gerente de projeto', 'diária', days * 2, 1340, 2190, ''),
      makeRow(incEquipe, 'Equipe de produção', 'Produtores', 'diária/pessoa', days * 4, 786, 1272, ''),
      makeRow(incEquipe && !isTechOnly && contSet.has('Staff, Recepção e Segurança'), 'Equipe de produção', 'Recepcionistas', 'diária/pessoa', Math.max(6, Math.round(pax / 50) * days), 325, 496, ''),
      makeRow(incEquipe && !isTechOnly && contSet.has('Staff, Recepção e Segurança'), 'Equipe de produção', 'Seguranças', 'diária/pessoa', Math.max(4, Math.round(pax / 100) * days), 332, 525, ''),
      makeRow(incEquipe && !isTechOnly && contSet.has('Staff, Recepção e Segurança'), 'Equipe de produção', 'Brigadistas e ambulância', 'diária', days * 2, 461, 750, ''),
      makeRow(incEquipe && !isTechOnly, 'Equipe de produção', 'Limpeza', 'diária', days, 2447, 5313, '')
    ];
  },

  formatCurrencyCompact(value) {
    if (value >= 1000000) {
      const mi = (value / 1000000).toFixed(2).replace('.', ',').replace(/,00$/, '').replace(/(\d),(\d)0$/, '$1,$2');
      return `R$ ${mi} mi`;
    }
    if (value >= 1000) {
      return `R$ ${Math.round(value / 1000).toLocaleString('pt-BR')} mil`;
    }
    return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
  },

  formatBRL(value) {
    return 'R$ ' + Math.round(value).toLocaleString('pt-BR');
  },

  // ==========================================================================
  // GERADOR NATIVO DE ARQUIVO EXCEL (.XLSX) FIEL AO MODELO ENVIADO
  // ==========================================================================
  generateXlsxBlob(state, calc) {
    const sharedStrings = [];
    const strMap = new Map();

    function addStr(val) {
      const s = String(val ?? '');
      if (strMap.has(s)) return strMap.get(s);
      const idx = sharedStrings.length;
      sharedStrings.push(s);
      strMap.set(s, idx);
      return idx;
    }

    function escXml(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const clientLabel = `${state.userName || 'Cliente'}${state.userCompany ? ' · ' + state.userCompany : ' · rstcom'}`;
    const locLabel = state.locationText || (state.locMode === 'Remoto' ? 'Evento 100% Online' : 'Ainda não definido');
    const prazoLabel = state.leadTime || 'De 1 a 3 meses';
    const scopeLabel = state.contractScope === 'tecnologia'
      ? 'Contratação de Tecnologia / AV (Via Rápida)'
      : (state.contractScope === 'online' ? 'Evento Online / Transmissão' : 'Evento Completo (Ponta a Ponta)');

    // ------------------------------------------------------------------------
    // ABA 1: RESUMO (Com vínculos SUMIF dinâmicos para a aba Orçamento + Briefing)
    // ------------------------------------------------------------------------
    const resumoMeta = [
      ['Preparado para', clientLabel],
      ['E-mail / Contato', state.userEmail || 'contato@rstcom.com.br'],
      ['Escopo contratado', scopeLabel],
      ['Formato', calc.formatLabel],
      ['Objetivo principal', state.mainObjective || 'Engajamento e posicionamento'],
      ['Público', `${calc.pax} pessoas`],
      ['Duração', `${calc.days} ${calc.days === 1 ? 'dia' : 'dias'}`],
      ['Local', locLabel],
      ['Situação do espaço', `${state.spaceStatus || 'A definir'}${state.spaceDetails ? ' (' + state.spaceDetails + ')' : ''}`],
      ['Dinâmica de salas', `${state.roomLayout || 'Plenária principal'}${state.breakoutRooms ? ' (' + state.breakoutRooms + ' salas extras)' : ''}`],
      ['Padrão', state.padrao || 'Corporativo'],
      ['Prazo', prazoLabel],
      ['Verba meta / Obs.', state.budgetTarget || 'Aberta conforme estimativa'],
      ['Data do cálculo', todayStr]
    ];

    let s1RowsXml = '';
    s1RowsXml += `<row r="1"><c r="B1" s="1" t="s"><v>${addStr('Estimativa de investimento do evento')}</v></c></row>`;
    s1RowsXml += `<row r="2"><c r="B2" s="2" t="s"><v>${addStr('Valores de referência para planejamento. Não constitui proposta comercial.')}</v></c></row>`;

    let rIdx = 4;
    resumoMeta.forEach(([k, v]) => {
      s1RowsXml += `<row r="${rIdx}"><c r="B${rIdx}" s="3" t="s"><v>${addStr(k)}</v></c><c r="C${rIdx}" t="s"><v>${addStr(v)}</v></c></row>`;
      rIdx++;
    });

    rIdx++; // linha em branco
    const catHeaderRow = rIdx;
    s1RowsXml += `<row r="${catHeaderRow}">` +
      `<c r="A${catHeaderRow}" t="s"><v>${addStr('')}</v></c>` +
      `<c r="B${catHeaderRow}" s="4" t="s"><v>${addStr('Categoria')}</v></c>` +
      `<c r="C${catHeaderRow}" s="4" t="s"><v>${addStr('Mínimo')}</v></c>` +
      `<c r="D${catHeaderRow}" s="4" t="s"><v>${addStr('Máximo')}</v></c>` +
      `<c r="E${catHeaderRow}" s="4" t="s"><v>${addStr('Orçado')}</v></c>` +
      `</row>`;

    const catStartRow = catHeaderRow + 1;
    const itemLastRow = 3 + calc.spreadsheetItems.length; // 50
    calc.categoryTotals.forEach((cat, idx) => {
      const cr = catStartRow + idx;
      s1RowsXml += `<row r="${cr}">` +
        `<c r="B${cr}" t="s"><v>${addStr(cat.name)}</v></c>` +
        `<c r="C${cr}" s="5"><f>SUMIF(&apos;Orçamento&apos;!$B$4:$B$${itemLastRow},$B${cr},&apos;Orçamento&apos;!$I$4:$I$${itemLastRow})</f><v>${cat.min}</v></c>` +
        `<c r="D${cr}" s="5"><f>SUMIF(&apos;Orçamento&apos;!$B$4:$B$${itemLastRow},$B${cr},&apos;Orçamento&apos;!$J$4:$J$${itemLastRow})</f><v>${cat.max}</v></c>` +
        `<c r="E${cr}" s="5"><f>SUMIF(&apos;Orçamento&apos;!$B$4:$B$${itemLastRow},$B${cr},&apos;Orçamento&apos;!$K$4:$K$${itemLastRow})</f><v>${cat.orcado}</v></c>` +
        `</row>`;
    });

    const catEndRow = catStartRow + calc.categoryTotals.length - 1;
    const subRow = catEndRow + 1;
    s1RowsXml += `<row r="${subRow}" s="3" customFormat="1">` +
      `<c r="B${subRow}" s="6" t="s"><v>${addStr('Subtotal de custos diretos')}</v></c>` +
      `<c r="C${subRow}" s="7"><f>SUM(C${catStartRow}:C${catEndRow})</f><v>${calc.directMin}</v></c>` +
      `<c r="D${subRow}" s="7"><f>SUM(D${catStartRow}:D${catEndRow})</f><v>${calc.directMax}</v></c>` +
      `<c r="E${subRow}" s="7"><f>SUM(E${catStartRow}:E${catEndRow})</f><v>${calc.directOrcado}</v></c>` +
      `</row>`;

    const pctHeaderRow = subRow + 2;
    s1RowsXml += `<row r="${pctHeaderRow}">` +
      `<c r="A${pctHeaderRow}" t="s"><v>${addStr('')}</v></c>` +
      `<c r="B${pctHeaderRow}" s="4" t="s"><v>${addStr('Percentuais (editáveis)')}</v></c>` +
      `<c r="C${pctHeaderRow}" s="4" t="s"><v>${addStr('Mínimo')}</v></c>` +
      `<c r="D${pctHeaderRow}" s="4" t="s"><v>${addStr('Máximo')}</v></c>` +
      `<c r="E${pctHeaderRow}" s="4" t="s"><v>${addStr('Orçado')}</v></c>` +
      `</row>`;

    const rFee = pctHeaderRow + 1;
    const rCont = pctHeaderRow + 2;
    const rTax = pctHeaderRow + 3;
    const { rates } = calc;

    s1RowsXml += `<row r="${rFee}"><c r="B${rFee}" t="s"><v>${addStr('Honorários de agência')}</v></c><c r="C${rFee}" s="8"><v>${rates.feeMin}</v></c><c r="D${rFee}" s="8"><v>${rates.feeMax}</v></c><c r="E${rFee}" s="8"><v>${rates.feeOrc}</v></c></row>`;
    s1RowsXml += `<row r="${rCont}"><c r="B${rCont}" t="s"><v>${addStr('Contingência')}</v></c><c r="C${rCont}" s="8"><v>${rates.contMin}</v></c><c r="D${rCont}" s="8"><v>${rates.contMax}</v></c><c r="E${rCont}" s="8"><v>${rates.contOrc}</v></c></row>`;
    s1RowsXml += `<row r="${rTax}"><c r="B${rTax}" t="s"><v>${addStr('Impostos sobre nota')}</v></c><c r="C${rTax}" s="8"><v>${rates.taxMin}</v></c><c r="D${rTax}" s="8"><v>${rates.taxMax}</v></c><c r="E${rTax}" s="8"><v>${rates.taxOrc}</v></c></row>`;

    const rTotal = rTax + 2;
    s1RowsXml += `<row r="${rTotal}" s="9" customFormat="1">` +
      `<c r="B${rTotal}" s="10" t="s"><v>${addStr('Investimento total estimado')}</v></c>` +
      `<c r="C${rTotal}" s="11"><f>C${subRow}*(1+SUM(C${rFee}:C${rTax}))</f><v>${calc.totalMin}</v></c>` +
      `<c r="D${rTotal}" s="11"><f>D${subRow}*(1+SUM(D${rFee}:D${rTax}))</f><v>${calc.totalMax}</v></c>` +
      `<c r="E${rTotal}" s="11"><f>E${subRow}*(1+SUM(E${rFee}:E${rTax}))</f><v>${calc.totalOrcado}</v></c>` +
      `</row>`;

    const rPax = rTotal + 1;
    s1RowsXml += `<row r="${rPax}">` +
      `<c r="B${rPax}" t="s"><v>${addStr('Custo por participante')}</v></c>` +
      `<c r="C${rPax}" s="5"><f>C${rTotal}/${calc.pax}</f><v>${calc.perPaxMin}</v></c>` +
      `<c r="D${rPax}" s="5"><f>D${rTotal}/${calc.pax}</f><v>${calc.perPaxMax}</v></c>` +
      `<c r="E${rPax}" s="5"><f>E${rTotal}/${calc.pax}</f><v>${calc.perPaxOrcado}</v></c>` +
      `</row>`;

    const rFooter = rPax + 2;
    s1RowsXml += `<row r="${rFooter}"><c r="B${rFooter}" s="12" t="s"><v>${addStr('Quer uma proposta com fornecedores reais? Fale com a RSTCOM: contato@rstcom.com.br')}</v></c></row>`;

    const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<dimension ref="A1:E${rFooter}"/>` +
      `<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>` +
      `<sheetFormatPr defaultRowHeight="15"/>` +
      `<cols><col min="1" max="1" width="3" customWidth="1"/><col min="2" max="2" width="34" customWidth="1"/><col min="3" max="5" width="18" customWidth="1"/></cols>` +
      `<sheetData>${s1RowsXml}</sheetData>` +
      `<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>` +
      `</worksheet>`;

    // ------------------------------------------------------------------------
    // ABA 2: ORÇAMENTO (47 itens com Incluir S/N, Qtd, Unit. mín/máx/orçado, Total, Fornecedor, Status, Observações)
    // ------------------------------------------------------------------------
    let s2RowsXml = '';
    s2RowsXml += `<row r="1"><c r="A1" s="13" t="s"><v>${addStr('Orçamento detalhado')}</v></c></row>`;
    s2RowsXml += `<row r="2"><c r="A2" s="2" t="s"><v>${addStr('Edite as células em laranja-claro e as quantidades. Na coluna Incluir, use S ou N para somar ou retirar um item.')}</v></c></row>`;

    const headers2 = [
      ['A', 'Incluir'], ['B', 'Categoria'], ['C', 'Item'], ['D', 'Unidade'],
      ['E', 'Qtd'], ['F', 'Unit. mín.'], ['G', 'Unit. máx.'], ['H', 'Unit. orçado'],
      ['I', 'Total mín.'], ['J', 'Total máx.'], ['K', 'Total orçado'],
      ['L', 'Fornecedor'], ['M', 'Status'], ['N', 'Observações']
    ];
    s2RowsXml += `<row r="3" ht="30" customHeight="1">` +
      headers2.map(([col, label]) => `<c r="${col}3" s="4" t="s"><v>${addStr(label)}</v></c>`).join('') +
      `</row>`;

    calc.spreadsheetItems.forEach((it, idx) => {
      const r = 4 + idx;
      const isS = it.include === 'S';
      const sColA = isS ? '14' : '18';
      const sText = isS ? '' : ' s="17"';
      const sQty = isS ? '15' : '19';
      const sCurr = isS ? '5' : '20';
      const sOrc = isS ? '16' : '21';

      s2RowsXml += `<row r="${r}">` +
        `<c r="A${r}" s="${sColA}" t="s"><v>${addStr(it.include)}</v></c>` +
        `<c r="B${r}"${sText} t="s"><v>${addStr(it.category)}</v></c>` +
        `<c r="C${r}"${sText} t="s"><v>${addStr(it.item)}</v></c>` +
        `<c r="D${r}"${sText} t="s"><v>${addStr(it.unit)}</v></c>` +
        `<c r="E${r}" s="${sQty}"><v>${it.qty}</v></c>` +
        `<c r="F${r}" s="${sCurr}"><v>${it.unitMin}</v></c>` +
        `<c r="G${r}" s="${sCurr}"><v>${it.unitMax}</v></c>` +
        `<c r="H${r}" s="${sOrc}"><v>${it.unitOrcado}</v></c>` +
        `<c r="I${r}" s="${sCurr}"><f>IF($A${r}=&quot;S&quot;,E${r}*F${r},0)</f><v>${it.subMin}</v></c>` +
        `<c r="J${r}" s="${sCurr}"><f>IF($A${r}=&quot;S&quot;,E${r}*G${r},0)</f><v>${it.subMax}</v></c>` +
        `<c r="K${r}" s="${sCurr}"><f>IF($A${r}=&quot;S&quot;,E${r}*H${r},0)</f><v>${it.subOrcado}</v></c>` +
        `<c r="L${r}"${sText} t="s"><v>${addStr(it.supplier || '')}</v></c>` +
        `<c r="M${r}"${sText} t="s"><v>${addStr(it.status || 'A cotar')}</v></c>` +
        `<c r="N${r}"${sText} t="s"><v>${addStr(it.notes || '')}</v></c>` +
        `</row>`;
    });

    const totRow2 = 4 + calc.spreadsheetItems.length; // 51
    s2RowsXml += `<row r="${totRow2}" s="3" customFormat="1">` +
      `<c r="C${totRow2}" s="6" t="s"><v>${addStr('Total de custos diretos')}</v></c>` +
      `<c r="I${totRow2}" s="7"><f>SUM(I4:I${totRow2 - 1})</f><v>${calc.directMin}</v></c>` +
      `<c r="J${totRow2}" s="7"><f>SUM(J4:J${totRow2 - 1})</f><v>${calc.directMax}</v></c>` +
      `<c r="K${totRow2}" s="7"><f>SUM(K4:K${totRow2 - 1})</f><v>${calc.directOrcado}</v></c>` +
      `</row>`;

    const sheet2Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<dimension ref="A1:N${totRow2}"/>` +
      `<sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/></sheetView></sheetViews>` +
      `<sheetFormatPr defaultRowHeight="15"/>` +
      `<cols>` +
      `<col min="1" max="1" width="8" customWidth="1"/>` +
      `<col min="2" max="2" width="26" customWidth="1"/>` +
      `<col min="3" max="3" width="42" customWidth="1"/>` +
      `<col min="4" max="4" width="14" customWidth="1"/>` +
      `<col min="5" max="5" width="10" customWidth="1"/>` +
      `<col min="6" max="7" width="13" customWidth="1"/>` +
      `<col min="8" max="8" width="14" customWidth="1"/>` +
      `<col min="9" max="11" width="15" customWidth="1"/>` +
      `<col min="12" max="12" width="22" customWidth="1"/>` +
      `<col min="13" max="13" width="14" customWidth="1"/>` +
      `<col min="14" max="14" width="32" customWidth="1"/>` +
      `</cols>` +
      `<sheetData>${s2RowsXml}</sheetData>` +
      `<autoFilter ref="A3:N${totRow2 - 1}"/>` +
      `<dataValidations count="2">` +
      `<dataValidation type="list" sqref="A4:A${totRow2 - 1}"><formula1>&quot;S,N&quot;</formula1></dataValidation>` +
      `<dataValidation type="list" allowBlank="1" sqref="M4:M${totRow2 - 1}"><formula1>&quot;A cotar,Cotado,Aprovado,Contratado,Pago&quot;</formula1></dataValidation>` +
      `</dataValidations>` +
      `<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>` +
      `</worksheet>`;

    const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">` +
      sharedStrings.map(s => `<si><t xml:space="preserve">${escXml(s)}</t></si>`).join('') +
      `</sst>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0;[Red]-&quot;R$&quot; #,##0"/><numFmt numFmtId="165" formatCode="0.0%"/></numFmts>` +
      `<fonts count="9">` +
      `<font><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>` +
      `<font><b/><sz val="18"/><color rgb="FF24214D"/><name val="Calibri"/></font>` +
      `<font><i/><sz val="11"/><color rgb="FF555555"/><name val="Calibri"/></font>` +
      `<font><b/><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>` +
      `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
      `<font><b/><sz val="13"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
      `<font><b/><sz val="11"/><color rgb="FF24214D"/><name val="Calibri"/></font>` +
      `<font><b/><sz val="16"/><color rgb="FF24214D"/><name val="Calibri"/></font>` +
      `<font><sz val="11"/><color rgb="FF999999"/><name val="Calibri"/></font>` +
      `</fonts>` +
      `<fills count="5">` +
      `<fill><patternFill patternType="none"/></fill>` +
      `<fill><patternFill patternType="gray125"/></fill>` +
      `<fill><patternFill patternType="solid"><fgColor rgb="FF24214D"/></patternFill></fill>` +
      `<fill><patternFill patternType="solid"><fgColor rgb="FFECEBF5"/></patternFill></fill>` +
      `<fill><patternFill patternType="solid"><fgColor rgb="FFFFF1DF"/></patternFill></fill>` +
      `</fills>` +
      `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
      `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
      `<cellXfs count="22">` +
      `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
      `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
      `<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
      `<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
      `<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>` +
      `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
      `<xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
      `<xf numFmtId="164" fontId="3" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>` +
      `<xf numFmtId="165" fontId="0" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/>` +
      `<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
      `<xf numFmtId="0" fontId="5" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
      `<xf numFmtId="164" fontId="5" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>` +
      `<xf numFmtId="0" fontId="6" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
      `<xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
      `<xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment horizontal="center"/></xf>` +
      `<xf numFmtId="3" fontId="0" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/>` +
      `<xf numFmtId="164" fontId="0" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/>` +
      `<xf numFmtId="0" fontId="8" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
      `<xf numFmtId="0" fontId="8" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center"/></xf>` +
      `<xf numFmtId="3" fontId="8" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>` +
      `<xf numFmtId="164" fontId="8" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>` +
      `<xf numFmtId="164" fontId="8" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>` +
      `</cellXfs>` +
      `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
      `</styleSheet>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets>` +
      `<sheet name="Resumo" sheetId="1" r:id="rId1"/>` +
      `<sheet name="Orçamento" sheetId="2" r:id="rId2"/>` +
      `</sheets>` +
      `</workbook>`;

    const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>` +
      `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>` +
      `</Relationships>`;

    const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>` +
      `</Types>`;

    return this.packZipBlob([
      { name: '[Content_Types].xml', content: contentTypesXml },
      { name: '_rels/.rels', content: rootRelsXml },
      { name: 'xl/workbook.xml', content: workbookXml },
      { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
      { name: 'xl/styles.xml', content: stylesXml },
      { name: 'xl/sharedStrings.xml', content: sharedStringsXml },
      { name: 'xl/worksheets/sheet1.xml', content: sheet1Xml },
      { name: 'xl/worksheets/sheet2.xml', content: sheet2Xml }
    ]);
  },

  // Empacotador ZIP (Store) nativo em JS para gerar o arquivo .xlsx binário válido
  packZipBlob(files) {
    const encoder = new TextEncoder();
    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c >>> 0;
    }

    function crc32(bytes) {
      let crc = 0xFFFFFFFF;
      for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
      }
      return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach(f => {
      const nameBytes = encoder.encode(f.name);
      const dataBytes = encoder.encode(f.content);
      const crc = crc32(dataBytes);
      const size = dataBytes.length;

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true); // UTF-8 flag
      lv.setUint16(8, 0, true);      // Store (no compression)
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0x5421, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(centralHeader.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x5421, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);

      localParts.push(localHeader, dataBytes);
      centralParts.push(centralHeader);
      offset += localHeader.length + size;
    });

    const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob([...localParts, ...centralParts, eocd], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }
};
