/**
 * db.js – HelpDeskManager
 * Camada de persistência via localStorage (padrão SGI/ProjectManager)
 * Expõe o objeto global DB com todas as coleções e helpers.
 */

// ─────────────────────────── SEED DATA ───────────────────────────

const _DEFAULT_USUARIOS = [
    { id: 1,  nome: 'Ana Duarte',      login: 'ana.duarte',   perfil: 'ADMIN',      setor: 'TI' },
    { id: 2,  nome: 'Carlos Lima',     login: 'carlos.lima',  perfil: 'ATENDENTE',  setor: 'TI' },
    { id: 3,  nome: 'Maria Oliveira',  login: 'maria.oli',    perfil: 'ATENDENTE',  setor: 'Infraestrutura' },
    { id: 4,  nome: 'João Santos',     login: 'joao.santos',  perfil: 'SOLICITANTE', setor: 'Financeiro' },
    { id: 5,  nome: 'Ricardo Mendes', login: 'ricardo.m',    perfil: 'ATENDENTE',  setor: 'Desenvolvimento' },
    { id: 6,  nome: 'Patrícia Lima',   login: 'patricia.l',   perfil: 'ATENDENTE',  setor: 'RH / DP' },
    { id: 7,  nome: 'João Xavier',     login: 'joao.xavier',  perfil: 'ATENDENTE',  setor: 'Infraestrutura' },
    { id: 8,  nome: 'Maria Silva',     login: 'maria.silva',  perfil: 'ATENDENTE',  setor: 'Desenvolvimento' },
];

const _DEFAULT_AREAS = [
    { id: 1, nome: 'Tecnologia da Informação' },
    { id: 2, nome: 'Infraestrutura' },
    { id: 3, nome: 'Desenvolvimento' },
    { id: 4, nome: 'RH / DP' },
];

const _DEFAULT_NIVEIS = [
    { id: 101, areaId: 1, nome: 'Suporte N1' },
    { id: 102, areaId: 1, nome: 'Suporte N2' },
    { id: 201, areaId: 2, nome: 'Redes e Servidores' },
    { id: 202, areaId: 2, nome: 'Telefonia' },
    { id: 301, areaId: 3, nome: 'Sistemas Internos' },
    { id: 302, areaId: 3, nome: 'Portais Web' },
    { id: 401, areaId: 4, nome: 'Benefícios' },
    { id: 402, areaId: 4, nome: 'Pagamento' },
];

const _DEFAULT_PROBLEMAS = [
    { id: 1001, nivelId: 101, nome: 'Troca de Senha' },
    { id: 1002, nivelId: 101, nome: 'Acesso negado ao sistema' },
    { id: 1003, nivelId: 102, nome: 'Lentidão no computador' },
    { id: 1004, nivelId: 102, nome: 'Configuração de E-mail' },
    { id: 2001, nivelId: 201, nome: 'VPN não conecta' },
    { id: 2002, nivelId: 201, nome: 'Internet oscilando' },
    { id: 2003, nivelId: 202, nome: 'Ramal mudo' },
    { id: 2004, nivelId: 202, nome: 'PABX com falha' },
    { id: 3001, nivelId: 301, nome: 'Erro no SGI' },
    { id: 3002, nivelId: 301, nome: 'Solicitação de nova funcionalidade' },
    { id: 3003, nivelId: 302, nome: 'Erro no Portal Web' },
    { id: 4001, nivelId: 401, nome: 'Dúvida sobre benefícios' },
    { id: 4002, nivelId: 402, nome: 'Dúvida sobre Holerite' },
];

// Calcula SLA padrão por área (em horas)
function _slaHoras(areaId) {
    return { 1: 8, 2: 24, 3: 48, 4: 72 }[areaId] || 24;
}

function _addHours(date, h) {
    return new Date(new Date(date).getTime() + h * 3600000).toISOString();
}

const _now = new Date();
function _ago(days, hours = 0) {
    return new Date(_now.getTime() - (days * 86400 + hours * 3600) * 1000).toISOString();
}

const _DEFAULT_CHAMADOS = [
    {
        id: 45201,
        areaId: 1, areaNome: 'Tecnologia da Informação',
        nivelId: 101, nivelNome: 'Suporte N1',
        problemaId: 1001, problemaNome: 'Troca de Senha de E-mail',
        descricao: 'Usuário solicita troca de senha do e-mail corporativo após bloqueio por tentativas inválidas.',
        solicitanteId: 4, solicitanteNome: 'João Santos',
        responsavelId: 2, responsavelNome: 'Carlos Lima',
        dataAbertura: _ago(0, 5),
        slaHoras: 8,
        previsao: _addHours(_ago(0, 5), 8),
        status: 'NO', statusDesc: 'Novo', cor: '#3b82f6', corClara: '#eff6ff',
        atrasado: false, anexos: 0,
        historico: [
            { data: _ago(0, 5), usuario: 'Sistema', acao: 'Chamado aberto pelo solicitante' }
        ]
    },
    {
        id: 45198,
        areaId: 3, areaNome: 'Desenvolvimento',
        nivelId: 301, nivelNome: 'Sistemas Internos',
        problemaId: 3001, problemaNome: 'Erro de Login SGI',
        descricao: 'Usuários do setor financeiro não conseguem efetuar login no SGI após atualização do sistema.',
        solicitanteId: 4, solicitanteNome: 'João Santos',
        responsavelId: 8, responsavelNome: 'Maria Silva',
        dataAbertura: _ago(2),
        slaHoras: 48,
        previsao: _addHours(_ago(2), 48),
        status: 'EM', statusDesc: 'Em Atendimento', cor: '#10b981', corClara: '#ecfdf5',
        atrasado: true, anexos: 2,
        historico: [
            { data: _ago(2), usuario: 'Sistema', acao: 'Chamado aberto pelo solicitante' },
            { data: _ago(1, 18), usuario: 'Maria Silva', acao: 'Chamado assumido para atendimento. Analisando logs do servidor.' }
        ]
    },
    {
        id: 45185,
        areaId: 2, areaNome: 'Infraestrutura',
        nivelId: 201, nivelNome: 'Redes e Servidores',
        problemaId: 2002, problemaNome: 'Lentidão na Internet',
        descricao: 'Toda a ala do escritório B está com internet muito lenta, impactando as videochamadas e acesso a sistemas em nuvem.',
        solicitanteId: 4, solicitanteNome: 'João Santos',
        responsavelId: 7, responsavelNome: 'João Xavier',
        dataAbertura: _ago(5),
        slaHoras: 24,
        previsao: _addHours(_ago(5), 24),
        status: 'AR', statusDesc: 'Aguard. Retorno', cor: '#f59e0b', corClara: '#fffbeb',
        atrasado: false, anexos: 1,
        historico: [
            { data: _ago(5), usuario: 'Sistema', acao: 'Chamado aberto pelo solicitante' },
            { data: _ago(4), usuario: 'João Xavier', acao: 'Verificado switch de distribuição. Solicitado retorno ao fornecedor de link.' },
            { data: _ago(3), usuario: 'João Xavier', acao: 'Aguardando resposta do provedor para análise do tráfego.' }
        ]
    },
    {
        id: 45150,
        areaId: 1, areaNome: 'Tecnologia da Informação',
        nivelId: 102, nivelNome: 'Suporte N2',
        problemaId: 1003, problemaNome: 'Instalação de Software',
        descricao: 'Solicitação de instalação do pacote Adobe Creative Cloud na estação de trabalho do usuário.',
        solicitanteId: 4, solicitanteNome: 'João Santos',
        responsavelId: 5, responsavelNome: 'Ricardo Mendes',
        dataAbertura: _ago(10),
        slaHoras: 8,
        previsao: _addHours(_ago(10), 8),
        status: 'EN', statusDesc: 'Encerrado', cor: '#64748b', corClara: '#f1f5f9',
        atrasado: false, anexos: 0,
        historico: [
            { data: _ago(10), usuario: 'Sistema', acao: 'Chamado aberto pelo solicitante' },
            { data: _ago(10, -2), usuario: 'Ricardo Mendes', acao: 'Software instalado e licença ativada com sucesso.' },
            { data: _ago(10, -3), usuario: 'Ricardo Mendes', acao: 'Chamado encerrado.' }
        ]
    },
    {
        id: 45142,
        areaId: 4, areaNome: 'RH / DP',
        nivelId: 401, nivelNome: 'Benefícios',
        problemaId: 4002, problemaNome: 'Dúvida sobre Holerite',
        descricao: 'Usuário com dúvida sobre desconto indevido no holerite do mês de fevereiro.',
        solicitanteId: 4, solicitanteNome: 'João Santos',
        responsavelId: 6, responsavelNome: 'Patrícia Lima',
        dataAbertura: _ago(15),
        slaHoras: 72,
        previsao: _addHours(_ago(15), 72),
        status: 'CA', statusDesc: 'Cancelado', cor: '#ef4444', corClara: '#fef2f2',
        atrasado: false, anexos: 0,
        historico: [
            { data: _ago(15), usuario: 'Sistema', acao: 'Chamado aberto pelo solicitante' },
            { data: _ago(14), usuario: 'João Santos', acao: 'Chamado cancelado pelo solicitante. Problema resolvido diretamente com o RH.' }
        ]
    },
    {
        id: 45130,
        areaId: 2, areaNome: 'Infraestrutura',
        nivelId: 202, nivelNome: 'Telefonia',
        problemaId: 2003, problemaNome: 'Ramal mudo',
        descricao: 'Ramal 2045 está com áudio mudo na discagem. Já foram testados dois aparelhos diferentes.',
        solicitanteId: 4, solicitanteNome: 'João Santos',
        responsavelId: 7, responsavelNome: 'João Xavier',
        dataAbertura: _ago(7),
        slaHoras: 24,
        previsao: _addHours(_ago(7), 24),
        status: 'NO', statusDesc: 'Novo', cor: '#ef4444', corClara: '#fef2f2',
        atrasado: true, anexos: 0,
        historico: [
            { data: _ago(7), usuario: 'Sistema', acao: 'Chamado aberto pelo solicitante' }
        ]
    },
];

const _DEFAULT_ARQUIVOS = [
    { id: 10, nome: 'Instalação e Configuração do Serviço Finnet', descricao: 'Configuração Finnet', categoria: 'Finnet', topico: 'Tutorial de instalação', dataUpload: '2023-05-30T10:00:00Z' },
    { id: 11, nome: 'Restauração de arquivos VEEAM', descricao: 'Tutorial de restauração', categoria: 'Veeam', topico: 'Tutorial de restauração', dataUpload: '2023-05-30T10:15:00Z' },
    { id: 12, nome: 'Configuração FTP Br Supply', descricao: 'FTP Transportadoras', categoria: 'FTP', topico: 'Configuração FTP', dataUpload: '2023-05-30T11:00:00Z' },
    { id: 13, nome: 'Abertura de Chamado', descricao: 'Abrindo Chamados', categoria: 'Chamados', topico: 'Help Desk', dataUpload: '2023-05-30T12:00:00Z' },
    { id: 14, nome: 'Alteração de Gateway VPN', descricao: 'Tutorial de instalação', categoria: 'VPN', topico: 'Tutorial de acesso.', dataUpload: '2023-05-30T14:30:00Z' },
    { id: 15, nome: 'Digitalização', descricao: 'Recursos de digitalização', categoria: 'Impressora', topico: 'Tutorial de acesso.', dataUpload: '2023-05-30T15:45:00Z' },
    { id: 16, nome: 'Cartilha Telefonia Voip', descricao: 'Tutorial de Acesso', categoria: 'Voip', topico: 'Tutorial de acesso.', dataUpload: '2023-05-30T16:20:00Z' },
    { id: 17, nome: 'Assinatura de e-mail no navegador WEB', descricao: 'Configuração de assinatura no navegador', categoria: 'E-mail', topico: 'Configurar assinatura de e-mail', dataUpload: '2023-03-17T09:00:00Z' },
    { id: 18, nome: 'Assinatura de e-mail aplicação desktop', descricao: 'Tutorial de configuração no aplicativo', categoria: 'E-mail', topico: 'Configurar assinatura de e-mail no aplicativo', dataUpload: '2023-03-17T09:30:00Z' },
    { id: 19, nome: 'Alteração de grupos de email', descricao: 'Tutorial de alteração de grupos de atendimento.', categoria: 'E-mail', topico: 'Grupos de e-mail', dataUpload: '2023-03-17T10:15:00Z' },
    { id: 20, nome: 'Ajuste de menu favoritos', descricao: 'Ajuste de Favoritos SAP', categoria: 'SAP', topico: 'Ajustes dos Favoritos', dataUpload: '2023-03-17T11:50:00Z' },
];

// ─────────────────────────── BANCO ───────────────────────────

const DB = (function () {
    const KEYS = {
        usuarios:  'HD_USUARIOS',
        areas:     'HD_AREAS',
        niveis:    'HD_NIVEIS',
        problemas: 'HD_PROBLEMAS',
        chamados:  'HD_CHAMADOS',
        arquivos:  'HD_ARQUIVOS',
    };

    function _load(key, defaultData) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultData;
        } catch (e) {
            return defaultData;
        }
    }

    function _save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function _nextId(arr) {
        return arr.length > 0 ? Math.max(...arr.map(x => x.id)) + 1 : 1;
    }

    // Carrega todas as coleções
    const db = {
        usuarios:  _load(KEYS.usuarios,  _DEFAULT_USUARIOS),
        areas:     _load(KEYS.areas,     _DEFAULT_AREAS),
        niveis:    _load(KEYS.niveis,    _DEFAULT_NIVEIS),
        problemas: _load(KEYS.problemas, _DEFAULT_PROBLEMAS),
        chamados:  _load(KEYS.chamados,  _DEFAULT_CHAMADOS),
        arquivos:  _load(KEYS.arquivos,  _DEFAULT_ARQUIVOS),
    };

    // Persiste se ainda não estava no LS (primeira vez)
    Object.entries(KEYS).forEach(([col, key]) => {
        if (!localStorage.getItem(key)) _save(key, db[col]);
    });

    // ── Helpers públicos ──────────────────────────────────────

    db.save = function (colecao) {
        _save(KEYS[colecao], this[colecao]);
    };

    db.nextId = function (colecao) {
        return _nextId(this[colecao]);
    };

    // ── Chamados ──────────────────────────────────────────────

    db.getChamado = function (id) {
        return this.chamados.find(c => c.id === id) || null;
    };

    db.addChamado = function (dados) {
        const id = this.nextId('chamados');
        const area     = this.areas.find(a => a.id === parseInt(dados.areaId))     || {};
        const nivel    = this.niveis.find(n => n.id === parseInt(dados.nivelId))   || {};
        const problema = this.problemas.find(p => p.id === parseInt(dados.problemaId)) || {};
        const usuario  = this.usuarios.find(u => u.id === parseInt(dados.solicitanteId)) || { nome: 'Usuário Sistema' };
        const sla      = _slaHoras(parseInt(dados.areaId));
        const agora    = new Date().toISOString();

        const novo = {
            id,
            areaId:          parseInt(dados.areaId),
            areaNome:        area.nome || '',
            nivelId:         parseInt(dados.nivelId),
            nivelNome:       nivel.nome || '',
            problemaId:      parseInt(dados.problemaId),
            problemaNome:    problema.nome || dados.problemaNome || '',
            descricao:       dados.descricao || '',
            solicitanteId:   usuario.id,
            solicitanteNome: usuario.nome,
            responsavelId:   null,
            responsavelNome: 'Não atribuído',
            dataAbertura:    agora,
            slaHoras:        sla,
            previsao:        _addHours(agora, sla),
            status:    'NO', statusDesc: 'Novo',
            cor: '#3b82f6', corClara: '#eff6ff',
            atrasado: false, anexos: 0,
            historico: [{ data: agora, usuario: usuario.nome, acao: 'Chamado aberto.' }]
        };

        this.chamados.unshift(novo);
        this.save('chamados');
        return novo;
    };

    db.updateChamadoStatus = function (id, status) {
        const statusMap = {
            'NO': { desc: 'Novo',           cor: '#3b82f6', corClara: '#eff6ff' },
            'EM': { desc: 'Em Atendimento', cor: '#10b981', corClara: '#ecfdf5' },
            'AR': { desc: 'Aguard. Retorno',cor: '#f59e0b', corClara: '#fffbeb' },
            'EN': { desc: 'Encerrado',      cor: '#64748b', corClara: '#f1f5f9' },
            'CA': { desc: 'Cancelado',      cor: '#ef4444', corClara: '#fef2f2' },
        };
        const c = this.getChamado(id);
        if (!c) return;
        const meta = statusMap[status] || {};
        c.status    = status;
        c.statusDesc = meta.desc || status;
        c.cor       = meta.cor || c.cor;
        c.corClara  = meta.corClara || c.corClara;
        this.save('chamados');
        return c;
    };

    db.addHistorico = function (id, usuarioNome, acao) {
        const c = this.getChamado(id);
        if (!c) return;
        if (!Array.isArray(c.historico)) c.historico = [];
        c.historico.push({ data: new Date().toISOString(), usuario: usuarioNome, acao });
        this.save('chamados');
        return c;
    };

    db.reclassificarChamado = function (id, dados) {
        const c = this.getChamado(id);
        if (!c) return;
        
        const area     = this.areas.find(a => a.id === parseInt(dados.areaId))     || {};
        const nivel    = this.niveis.find(n => n.id === parseInt(dados.nivelId))   || {};
        const problema = this.problemas.find(p => p.id === parseInt(dados.problemaId)) || {};
        const sla      = _slaHoras(parseInt(dados.areaId));

        c.areaId       = parseInt(dados.areaId);
        c.areaNome     = area.nome || '';
        c.nivelId      = parseInt(dados.nivelId);
        c.nivelNome    = nivel.nome || '';
        c.problemaId   = parseInt(dados.problemaId);
        c.problemaNome = problema.nome || '';
        c.slaHoras     = sla;
        c.previsao     = _addHours(c.dataAbertura, sla);

        this.addHistorico(id, dados.usuarioNome, `Chamado reclassificado. Motivo: ${dados.motivo}`);
        this.save('chamados');
        return c;
    };

    db.transferirChamado = function (id, novoResponsavelId, motivo, usuarioAcaoNome) {
        const c = this.getChamado(id);
        if (!c) return;
        
        const resp = this.usuarios.find(u => u.id === parseInt(novoResponsavelId)) || { nome: 'Não atribuído' };
        
        c.responsavelId   = resp.id;
        c.responsavelNome = resp.nome;

        this.addHistorico(id, usuarioAcaoNome, `Chamado transferido para ${resp.nome}. Motivo: ${motivo}`);
        this.save('chamados');
        return c;
    };

    // ── Lookups para forms  ───────────────────────────────────

    db.niveisPorArea = function (areaId) {
        return this.niveis.filter(n => n.areaId === parseInt(areaId));
    };

    db.problemasPorNivel = function (nivelId) {
        return this.problemas.filter(p => p.nivelId === parseInt(nivelId));
    };

    // ── Stats para dashboard ──────────────────────────────────

    db.stats = function () {
        const ativos = this.chamados.filter(c => !['EN','CA'].includes(c.status));
        return {
            NO: ativos.filter(c => c.status === 'NO').length,
            EM: ativos.filter(c => c.status === 'EM').length,
            AR: ativos.filter(c => c.status === 'AR').length,
            AT: ativos.filter(c => c.atrasado).length,
            total: ativos.length,
        };
    };

    // ── Arquivos ──────────────────────────────────────────────

    db.getArquivos = function () {
        return this.arquivos;
    };

    db.addArquivo = function (dados) {
        const id = this.nextId('arquivos');
        const novo = {
            id,
            nome:      dados.nome,
            descricao: dados.descricao,
            categoria: dados.categoria,
            topico:    dados.topico,
            dataUpload: new Date().toISOString()
        };
        this.arquivos.unshift(novo);
        this.save('arquivos');
        return novo;
    };

    db.deleteArquivo = function (id) {
        this.arquivos = this.arquivos.filter(a => a.id !== parseInt(id));
        this.save('arquivos');
    };

    return db;
})();
