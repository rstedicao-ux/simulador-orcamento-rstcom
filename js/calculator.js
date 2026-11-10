// ============================================================================
// CALCULADORA DE ORÇAMENTO DE EVENTOS & GERADOR DE PLANILHA DETALHADA (RSTCOM)
// ============================================================================

window.EventBudgetEngine = {
  formats: {
    'Convencao de vendas': {
      label: 'Convenção de vendas',
      basePerPaxMin: 3200,
      basePerPaxMax: 5600,
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
      basePerPaxMin: 4589,
      basePerPaxMax: 8143,
      defaultItems: [
        'Cenografia e estrutura',
        'LED, som e luz',
        'Alimentação e bebidas',
        'Hospedagem',
        'Aéreo e logística',
        'Conteúdo e criação',
        'Atrações e palestrantes',
        'Credenciamento e tecnologia',
        'Transmissão ao vivo'
      ]
    },
    'Evento Institucional': {
      label: 'Evento Institucional',
      basePerPaxMin: 2600,
      basePerPaxMax: 4800,
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
      basePerPaxMin: 1800,
      basePerPaxMax: 3500,
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
      basePerPaxMin: 2900,
      basePerPaxMax: 5200,
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
    'Feira e estande': {
      label: 'Feira e estande',
      basePerPaxMin: 2400,
      basePerPaxMax: 4400,
      defaultItems: [
        'Espaço e licenças',
        'Cenografia e estrutura',
        'LED, som e luz',
        'Alimentação e bebidas',
        'Conteúdo e criação',
        'Brindes e kits',
        'Equipe de produção'
      ]
    }
  },

  tiers: {
    'Essencial': { multMin: 0.68, multMax: 0.75 },
    'Corporativo': { multMin: 0.9, multMax: 0.95 },
    'Premium': { multMin: 1.0, multMax: 1.08 },
    'Iconico': { multMin: 1.35, multMax: 1.55 }
  },

  categoriesWeight: [
    { name: 'Hospedagem', weight: 29 },
    { name: 'Alimentação e bebidas', weight: 24 },
    { name: 'Aéreo e logística', weight: 19 },
    { name: 'Espaço e licenças', weight: 6 },
    { name: 'LED, som e luz', weight: 6 },
    { name: 'Cenografia e estrutura', weight: 5 },
    { name: 'Brindes e kits', weight: 3 },
    { name: 'Atrações e palestrantes', weight: 3 },
    { name: 'Conteúdo e criação', weight: 2 },
    { name: 'Transmissão ao vivo', weight: 2 },
    { name: 'Credenciamento e tecnologia', weight: 1 },
    { name: 'Equipe de produção', weight: 4 }
  ],

  calculate(state) {
    const fmt = this.formats[state.formato] || this.formats['Lancamento de produto'];
    const tier = this.tiers[state.padrao] || this.tiers['Premium'];
    const pax = Math.max(20, Number(state.pax) || 500);
    const days = Math.max(1, Number(state.days) || 3);

    // Prazo curto aumenta custo (conforme aviso no card "Quantos dias?")
    const shortLeadMultiplier = state.shortNotice ? 1.14 : 1.0;
    const remoteFactor = state.locMode === 'Remoto' ? 0.38 : (state.locMode === 'Híbrido' ? 0.85 : 1.0);

    // Pesos dos itens selecionados
    const selectedSet = new Set(state.selectedItems || []);
    let activeBars = this.categoriesWeight.filter(c => selectedSet.has(c.name));
    if (activeBars.length === 0) {
      activeBars = this.categoriesWeight.slice(0, 6);
    }

    const totalRawWeight = activeBars.reduce((acc, item) => acc + item.weight, 0);
    const normalizedBars = activeBars
      .map(item => ({
        name: item.name,
        pct: Math.max(1, Math.round((item.weight / totalRawWeight) * 100))
      }))
      .sort((a, b) => b.pct - a.pct);

    // Ajuste fino para somar 100%
    const sumPct = normalizedBars.reduce((s, i) => s + i.pct, 0);
    if (normalizedBars.length > 0 && sumPct !== 100) {
      normalizedBars[0].pct += (100 - sumPct);
    }

    const selectionRatio = Math.max(0.35, Math.min(1.25, totalRawWeight / 92));
    const daysFactor = 1 + (days - 1) * 0.34;

    const perPaxMin = Math.round(fmt.basePerPaxMin * tier.multMin * daysFactor * shortLeadMultiplier * remoteFactor * selectionRatio);
    const perPaxMax = Math.round(fmt.basePerPaxMax * tier.multMax * daysFactor * shortLeadMultiplier * remoteFactor * selectionRatio);

    const totalMin = perPaxMin * pax;
    const totalMax = perPaxMax * pax;

    return {
      formatLabel: fmt.label,
      pax,
      days,
      perPaxMin,
      perPaxMax,
      totalMin,
      totalMax,
      bars: normalizedBars,
      spreadsheetItems: this.buildDetailedItems(totalMin, totalMax, pax, days, normalizedBars)
    };
  },

  formatCurrencyCompact(value) {
    if (value >= 1000000) {
      const mi = (value / 1000000).toFixed(2).replace('.', ',').replace(/,00$/, '').replace(/(\d),(\d)0$/, '$1,$2');
      return `R$ ${mi} mi`;
    }
    if (value >= 1000) {
      return `R$ ${Math.round(value / 1000).toLocaleString('pt-BR')} mil`;
    }
    return `R$ ${value.toLocaleString('pt-BR')}`;
  },

  formatBRL(value) {
    return 'R$ ' + Math.round(value).toLocaleString('pt-BR');
  },

  buildDetailedItems(totalMin, totalMax, pax, days, bars) {
    const catalog = {
      'Hospedagem': [
        { item: 'Apartamentos Single/Double (Hotel Categoria Superior)', unit: 'diárias', qty: Math.round(pax * 0.85 * days), share: 0.68 },
        { item: 'Suítes Diretoria / VIPs e Palestrantes', unit: 'diárias', qty: Math.max(5, Math.round(pax * 0.05 * days)), share: 0.18 },
        { item: 'Hospedagem Equipe Técnica e Staff', unit: 'diárias', qty: Math.max(15, Math.round(pax * 0.08 * days)), share: 0.14 }
      ],
      'Alimentação e bebidas': [
        { item: 'Welcome Coffee & Coffee Breaks Premium', unit: 'pax/dia', qty: pax * days, share: 0.22 },
        { item: 'Almoço Executivo no Centro de Convenções', unit: 'pax/dia', qty: pax * days, share: 0.33 },
        { item: 'Jantar de Confraternização / Coquetel de Lançamento', unit: 'pax', qty: pax, share: 0.32 },
        { item: 'A&B Camarins, Sala VIP e Staff', unit: 'diárias', qty: Math.round(pax * 0.15 * days), share: 0.13 }
      ],
      'Aéreo e logística': [
        { item: 'Passagens Aéreas Nacionais (Tarifa Grupo)', unit: 'trechos', qty: Math.round(pax * 1.4), share: 0.64 },
        { item: 'Transfers Aeroporto ↔ Hotel ↔ Evento (Ônibus/Vans)', unit: 'diárias', qty: Math.max(6, Math.round(pax / 35) * days), share: 0.22 },
        { item: 'Coordenação de Malha Aérea e RSVP Logístico', unit: 'verba', qty: 1, share: 0.14 }
      ],
      'Espaço e licenças': [
        { item: 'Locação do Espaço Principal / Plenária', unit: 'diárias', qty: days, share: 0.52 },
        { item: 'Diárias de Montagem e Desmontagem', unit: 'diárias', qty: Math.max(2, Math.round(days * 0.8)), share: 0.22 },
        { item: 'Salas de Apoio, Breakout Rooms e Camarins', unit: 'diárias', qty: days, share: 0.16 },
        { item: 'ECAD, Alvarás, Bombeiros e Seguros', unit: 'lote', qty: 1, share: 0.10 }
      ],
      'LED, som e luz': [
        { item: 'Painel de LED P2.6 Curvo de Alta Definição (Plenária)', unit: 'm²/período', qty: Math.max(40, Math.round(pax * 0.12)), share: 0.42 },
        { item: 'Sistema de Sonorização Line Array + Microfonia Digital', unit: 'diárias', qty: days, share: 0.26 },
        { item: 'Projeto de Iluminação Cênica e Moving Lights', unit: 'diárias', qty: days, share: 0.22 },
        { item: 'Geradores Silenciados Standby + Cabos', unit: 'diárias', qty: days, share: 0.10 }
      ],
      'Cenografia e estrutura': [
        { item: 'Palco Principal, Revestimentos e Testeira Cenográfica', unit: 'projeto', qty: 1, share: 0.45 },
        { item: 'Túnel de Entrada Imersivo & Instagramáveis', unit: 'projeto', qty: 1, share: 0.28 },
        { item: 'Mobiliário Lounge, Plenária e Sinalização Visual', unit: 'lote', qty: 1, share: 0.17 },
        { item: 'ART, Laudos Estruturais e Rigging', unit: 'lote', qty: 1, share: 0.10 }
      ],
      'Brindes e kits': [
        { item: 'Welcome Kit Personalizado (Mochila/Squeeze/Caderno)', unit: 'unid', qty: pax, share: 0.65 },
        { item: 'Troféus / Premiação e Embalagens Especiais', unit: 'lote', qty: Math.max(10, Math.round(pax * 0.04)), share: 0.35 }
      ],
      'Atrações e palestrantes': [
        { item: 'Keynote Speaker / Mestre de Cerimônias', unit: 'cachê', qty: Math.max(1, Math.min(4, days)), share: 0.48 },
        { item: 'Show de Encerramento / Banda / DJ', unit: 'cachê', qty: 1, share: 0.52 }
      ],
      'Conteúdo e criação': [
        { item: 'Identidade Visual, Key Visual e Motion Graphics (Telão)', unit: 'projeto', qty: 1, share: 0.48 },
        { item: 'Roteirização, Direção Artística e Apresentações', unit: 'projeto', qty: 1, share: 0.32 },
        { item: 'Cobertura Foto & Vídeo + Aftermovie Same-Day Edit', unit: 'diárias', qty: days, share: 0.20 }
      ],
      'Transmissão ao vivo': [
        { item: 'Unidade Móvel de Corte Multicâmera Full HD/4K', unit: 'diárias', qty: days, share: 0.55 },
        { item: 'Link Dedicado Redundante + Plataforma de Streaming', unit: 'diárias', qty: days, share: 0.45 }
      ],
      'Credenciamento e tecnologia': [
        { item: 'Totens de Auto-Credenciamento + Crachás Inteligentes', unit: 'pax', qty: pax, share: 0.54 },
        { item: 'App do Evento, Gamificação e Wi-Fi Alta Densidade', unit: 'lote', qty: 1, share: 0.46 }
      ],
      'Equipe de produção': [
        { item: 'Diretor Geral, Produtores Executivos e Coordenadores', unit: 'diárias', qty: days * 6, share: 0.48 },
        { item: 'Recepcionistas Bilíngues, Segurança e Brigada Médica', unit: 'diárias', qty: Math.max(12, Math.round(pax / 25) * days), share: 0.52 }
      ]
    };

    const rows = [];
    bars.forEach(bar => {
      const catMin = totalMin * (bar.pct / 100);
      const catMax = totalMax * (bar.pct / 100);
      const templates = catalog[bar.name] || [
        { item: `${bar.name} - Escopo Principal`, unit: 'lote', qty: 1, share: 1.0 }
      ];
      templates.forEach(t => {
        const subMin = Math.round(catMin * t.share);
        const subMax = Math.round(catMax * t.share);
        const unitMin = Math.max(1, Math.round(subMin / Math.max(1, t.qty)));
        const unitMax = Math.max(1, Math.round(subMax / Math.max(1, t.qty)));
        rows.push({
          category: bar.name,
          item: t.item,
          unit: t.unit,
          qty: t.qty,
          unitMin,
          unitMax,
          subMin,
          subMax
        });
      });
    });

    return rows;
  }
};

