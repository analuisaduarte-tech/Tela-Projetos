/**
 * app.js – HelpDeskManager
 * Usa DB (db.js) como fonte de dados persistida em localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Dashboard
    if (document.getElementById('atendimentos-body')) {
        renderAtendimentos();
        renderMeusChamados();
        renderResponsabilidades();
    }

    // Painel de Atendimento
    if (document.getElementById('atendimento-list-body')) {
        updateAtendimentoCounts();
    }

    // Modal global
    if (document.getElementById('modal-area')) {
        populateModalAreas();
        populateModalUsers();
    }

    // Filtro por URL
    handleURLParameters();
});

// ─────────────────────────── URL PARAMS ───────────────────────────

function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const opcao = urlParams.get('opcao');
    if (!opcao) return;

    if (document.getElementById('atendimento-list-body')) {
        document.querySelectorAll('.status-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === opcao);
        });
        renderAtendimentoList(opcao);
    }

    if (document.getElementById('tickets-list-body')) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === opcao);
        });
        renderTicketList(opcao);
    }

    if (document.getElementById('report-list-body')) {
        const days = urlParams.get('dias') || '30';
        document.querySelectorAll('.status-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === opcao);
        });
        document.querySelectorAll('.period-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.days === days);
        });
        renderReportList(opcao, parseInt(days));
    }
}

// ─────────────────────────── MODAL ───────────────────────────────

function openTicketModal(type = '') {
    const modal = document.getElementById('ticket-modal');
    if (!modal) return;
    document.getElementById('ticket-form').reset();
    document.getElementById('modal-nivel').disabled = true;
    document.getElementById('modal-problema').disabled = true;
    const onBehalf = document.getElementById('modal-on-behalf-section');
    if (type === 'EmNome') onBehalf.classList.remove('hidden');
    else onBehalf.classList.add('hidden');
    modal.style.display = 'block';
}

function closeTicketModal() {
    const m = document.getElementById('ticket-modal');
    if (m) m.style.display = 'none';
}

window.onclick = function (event) {
    const modal = document.getElementById('ticket-modal');
    if (event.target === modal) closeTicketModal();
};

function handleTicketSubmit(event) {
    event.preventDefault();
    const areaId     = document.getElementById('modal-area').value;
    const nivelId    = document.getElementById('modal-nivel').value;
    const problemaId = document.getElementById('modal-problema').value;
    const descricao  = document.getElementById('modal-descricao').value;

    if (!areaId || !nivelId || !problemaId || !descricao.trim()) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const solicitanteId = 1; // usuário logado simulado (Ana Duarte)

    const novo = DB.addChamado({ areaId, nivelId, problemaId, descricao, solicitanteId });

    closeTicketModal();
    showToast(`Chamado #${novo.id} aberto com sucesso!`, 'success');

    // Atualiza contadores/listas se estiver na página correta
    if (document.getElementById('tickets-list-body')) renderTicketList();
    if (document.getElementById('atendimento-list-body')) { updateAtendimentoCounts(); renderAtendimentoList(); }
    if (document.getElementById('atendimentos-body')) { renderAtendimentos(); renderMeusChamados(); }
}

// ─────────────────────────── MODAL SELECTS ───────────────────────

function populateModalUsers() {
    const select = document.getElementById('modal-usuario-abertura');
    if (!select) return;
    select.innerHTML = '<option value="">-- Selecione o Usuário --</option>';
    DB.usuarios.forEach(u => {
        select.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
    });
}

function populateModalAreas() {
    const select = document.getElementById('modal-area');
    if (!select) return;
    select.innerHTML = '<option value="">-- Selecione a Área --</option>';
    DB.areas.forEach(a => {
        select.innerHTML += `<option value="${a.id}">${a.nome}</option>`;
    });
}

function onModalAreaChange() {
    const areaId = document.getElementById('modal-area').value;
    const nivelSelect = document.getElementById('modal-nivel');
    const problemaSelect = document.getElementById('modal-problema');

    nivelSelect.innerHTML = '<option value="">-- Selecione o Nível --</option>';
    problemaSelect.innerHTML = '<option value="">Selecione um Nível primeiro</option>';
    problemaSelect.disabled = true;

    if (areaId) {
        DB.niveisPorArea(areaId).forEach(n => {
            nivelSelect.innerHTML += `<option value="${n.id}">${n.nome}</option>`;
        });
        nivelSelect.disabled = false;
    } else {
        nivelSelect.disabled = true;
    }
}

function onModalNivelChange() {
    const nivelId = document.getElementById('modal-nivel').value;
    const problemaSelect = document.getElementById('modal-problema');

    problemaSelect.innerHTML = '<option value="">-- Selecione a Ocorrência --</option>';
    if (nivelId) {
        DB.problemasPorNivel(nivelId).forEach(p => {
            problemaSelect.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
        });
        problemaSelect.disabled = false;
    } else {
        problemaSelect.disabled = true;
    }
}

// ─────────────── DASHBOARD (index.html) ──────────────────────────

function renderAtendimentos() {
    const container = document.getElementById('atendimentos-body');
    if (!container) return;
    const stats = DB.stats();
    const items = [
        { label: 'Novos Chamados',     count: stats.NO, sub: 'Abertos recentemente',                      color: '#3b82f6', status: 'NO' },
        { label: 'Em Atendimento',     count: stats.EM, sub: 'Já possuem ações em execução',               color: '#10b981', status: 'EM' },
        { label: 'Atrasados',          count: stats.AT, sub: 'Com SLA vencido',                            color: '#ef4444', status: 'AT' },
        { label: 'Aguardando Retorno', count: stats.AR, sub: 'Aguardando ação de terceiro ou solicitante', color: '#f59e0b', status: 'AR' },
    ];
    container.innerHTML = items.map(item => `
        <tr onclick="window.location.href='listachamadosatendimento.html?opcao=${item.status}'" style="cursor:pointer;">
            <td style="border-left:8px solid ${item.color}">${item.label} <span class="status-label-small">${item.sub}</span></td>
            <td>${item.count}</td>
            <td class="al-center"><a href="listachamadosatendimento.html?opcao=${item.status}" class="view-btn"><i class="fa-solid fa-magnifying-glass"></i></a></td>
        </tr>
    `).join('');
}

function renderMeusChamados() {
    const container = document.getElementById('chamados-body');
    if (!container) return;
    // Filtra chamados do usuário logado (id=1)
    const meus = DB.chamados.filter(c => c.solicitanteId === 1);
    const statuses = ['NO', 'EM', 'AT', 'AR'];
    const labels   = ['Novos Chamados', 'Em Atendimento', 'Atrasados', 'Aguardando Retorno'];
    const subs     = ['Abertos por você recentemente', 'Já possuem ações em execução', 'Com SLA vencido', 'Aguardando ação de terceiro ou solicitante'];
    const colors   = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

    container.innerHTML = statuses.map((s, i) => {
        const count = s === 'AT' ? meus.filter(c => c.atrasado).length : meus.filter(c => c.status === s).length;
        return `
        <tr onclick="window.location.href='listachamados.html?opcao=${s}'" style="cursor:pointer;">
            <td style="border-left:8px solid ${colors[i]}">${labels[i]} <span class="status-label-small">${subs[i]}</span></td>
            <td>${count}</td>
            <td class="al-center"><a href="listachamados.html?opcao=${s}" class="view-btn"><i class="fa-solid fa-magnifying-glass"></i></a></td>
        </tr>`;
    }).join('');
}

function renderResponsabilidades() {
    const container = document.getElementById('responsabilidade-body');
    if (!container) return;
    // Lista as áreas/níveis onde o usuário logado é responsável
    const responsabilidades = [
        { area: 'Tecnologia da Informação', nivel: 'Nível 1 – Suporte', problema: 'Software e Sistemas', cliente: 'BrSupply Matriz' },
        { area: 'Infraestrutura',            nivel: 'Telecomunicações',   problema: 'Acesso Remoto / VPN', cliente: 'TODOS' },
        { area: 'Desenvolvimento',            nivel: 'SGI – Sustentação', problema: 'Erro de Integração',  cliente: 'BrSupply Matriz' },
    ];
    container.innerHTML = responsabilidades.map(r => `
        <tr>
            <td><strong>${r.area}</strong></td>
            <td>${r.nivel}</td>
            <td>${r.problema}</td>
            <td>${r.cliente}</td>
            <td class="al-center"><a href="#" class="view-btn"><i class="fa-solid fa-list-ul"></i></a></td>
        </tr>
    `).join('');
}

// ──────────── PAINEL DE ATENDIMENTO (listachamadosatendimento.html) ────────────

function updateAtendimentoCounts() {
    const stats = DB.stats();
    const map = { 'count-no': stats.NO, 'count-em': stats.EM, 'count-ar': stats.AR, 'count-at': stats.AT };
    Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `(${val})`;
    });
}

function renderAtendimentoList(filter = 'PD', searchTerm = '') {
    const container = document.getElementById('atendimento-list-body');
    if (!container) return;

    let filtered = [...DB.chamados];

    if (filter === 'PD') {
        filtered = filtered.filter(t => ['NO', 'EM', 'AR'].includes(t.status));
    } else if (filter === 'RS') {
        filtered = filtered.filter(t => t.responsavelId === 2); // Carlos Lima
    } else if (filter === 'AT') {
        filtered = filtered.filter(t => t.atrasado);
    } else if (filter === 'NO') {
        filtered = filtered.filter(t => t.status === 'NO');
    } else {
        filtered = filtered.filter(t => t.status === filter);
    }

    if (searchTerm) {
        filtered = filtered.filter(t =>
            (t.responsavelNome || '').toLowerCase().includes(searchTerm) ||
            (t.problemaNome || '').toLowerCase().includes(searchTerm) ||
            t.id.toString().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#64748b;">Nenhum chamado encontrado.</td></tr>';
        return;
    }

    container.innerHTML = filtered.map(t => {
        const acaoPendente = (t.id % 2 === 0 && !['EN','CA'].includes(t.status));
        let rowColor = t.atrasado ? '#ffe6e6' : t.corClara;
        if (!t.atrasado && acaoPendente) rowColor = '#ffffcc';
        const mainColor = t.atrasado ? '#ef4444' : t.cor;
        const barColor  = t.atrasado ? '#ff3333' : rowColor;
        const previsaoFmt = t.previsao ? new Date(t.previsao).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
        return `
        <tr style="background-color:${rowColor};">
            <td class="al-center">
                <span class="id-col-atend" style="background-color:${mainColor};" title="Clique para ver">${t.id}</span>
            </td>
            <td style="background-color:${barColor};width:10px;padding:0;"></td>
            <td><strong>${t.areaNome}</strong><br><span style="font-size:0.8rem;color:#64748b;">${t.nivelNome}</span></td>
            <td>${t.problemaNome}</td>
            <td>${t.solicitanteNome}<br><span style="color:#64748b;font-size:0.8rem;">${t.responsavelNome}</span></td>
            <td class="al-center" style="font-size:0.85rem;">${previsaoFmt}</td>
            <td class="al-center">${t.anexos > 0 ? `<i class="fa-solid fa-paperclip" title="${t.anexos} anexo(s)"></i>` : ''}</td>
            <td class="al-center">
                <span class="status-pill" style="background:white;border:1px solid ${mainColor};color:${mainColor};">${t.statusDesc}</span>
                ${t.atrasado ? '<span class="atraso-label">ATRASADO</span>' : ''}
                ${acaoPendente ? '<span class="pendente-acao-label">AÇÃO PENDENTE</span>' : ''}
            </td>
            <td class="al-center">
                <a href="chamado.html?id=${t.id}&Orig=Atende" class="view-btn"><i class="fa-solid fa-magnifying-glass"></i></a>
            </td>
        </tr>`;
    }).join('');
}

// ──────────── MEUS CHAMADOS (listachamados.html) ──────────────────

function renderTicketList(filter = 'TD', searchTerm = '') {
    const container = document.getElementById('tickets-list-body');
    if (!container) return;

    let filtered = DB.chamados.filter(c => c.solicitanteId === 1); // usuário logado

    if (filter !== 'TD') {
        if (filter === 'AT') {
            filtered = filtered.filter(t => t.atrasado);
        } else {
            filtered = filtered.filter(t => t.status === filter);
        }
    }

    if (searchTerm) {
        filtered = filtered.filter(t =>
            t.id.toString().includes(searchTerm) ||
            (t.problemaNome || '').toLowerCase().includes(searchTerm) ||
            (t.areaNome || '').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#64748b;">Nenhum chamado encontrado.</td></tr>';
        return;
    }

    container.innerHTML = filtered.map(t => {
        const rowColor  = t.atrasado ? '#ffe6e6' : t.corClara;
        const mainColor = t.atrasado ? '#ef4444' : t.cor;
        const previsaoFmt = t.previsao ? new Date(t.previsao).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
        return `
        <tr style="background-color:${rowColor};">
            <td class="al-center"><span class="id-column" style="background-color:${mainColor};">${t.id}</span></td>
            <td><strong>${t.areaNome}</strong><br><span style="font-size:0.8rem;color:#64748b;">${t.nivelNome}</span></td>
            <td>${t.problemaNome}</td>
            <td>${t.responsavelNome}</td>
            <td class="al-center" style="font-size:0.85rem;">${previsaoFmt}</td>
            <td class="al-center">${t.anexos > 0 ? `<i class="fa-solid fa-paperclip" title="${t.anexos} anexo(s)"></i>` : ''}</td>
            <td class="al-center">
                <span class="status-pill" style="background:white;border:1px solid ${mainColor};color:${mainColor};">${t.statusDesc}</span>
                ${t.atrasado ? '<span class="atraso-label">ATRASADO</span>' : ''}
            </td>
            <td class="al-center">
                <a href="chamado.html?id=${t.id}&Orig=MeusChamados" class="view-btn"><i class="fa-solid fa-magnifying-glass"></i></a>
            </td>
        </tr>`;
    }).join('');
}

// ──────────── RELATÓRIOS (listatodoschamados.html) ───────────────

function renderReportList(statusFilter = 'TD', daysFilter = 30, searchTerm = '') {
    const container = document.getElementById('report-list-body');
    if (!container) return;

    const now = new Date();
    let filtered = [...DB.chamados];

    if (daysFilter < 9999) {
        filtered = filtered.filter(t => {
            const d = t.dataAbertura ? new Date(t.dataAbertura) : null;
            if (!d) return true;
            return (now - d) / 86400000 <= daysFilter;
        });
    }

    if (statusFilter !== 'TD') {
        if (statusFilter === 'PE') {
            filtered = filtered.filter(t => ['NO','EM','AR'].includes(t.status));
        } else if (statusFilter === 'AT') {
            filtered = filtered.filter(t => t.atrasado);
        } else {
            filtered = filtered.filter(t => t.status === statusFilter);
        }
    }

    if (searchTerm) {
        filtered = filtered.filter(t =>
            t.id.toString().includes(searchTerm) ||
            (t.problemaNome || '').toLowerCase().includes(searchTerm) ||
            (t.solicitanteNome || '').toLowerCase().includes(searchTerm) ||
            (t.responsavelNome || '').toLowerCase().includes(searchTerm) ||
            (t.areaNome || '').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#64748b;">Nenhum chamado encontrado.</td></tr>';
        return;
    }

    container.innerHTML = filtered.map(t => {
        const mainColor = t.atrasado ? '#ef4444' : t.cor;
        const rowColor  = t.atrasado ? '#ffe6e6' : t.corClara;
        const previsaoFmt = t.previsao ? new Date(t.previsao).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
        return `
        <tr style="background-color:${rowColor};">
            <td class="al-center"><span class="id-column" style="background-color:${mainColor};">${t.id}</span></td>
            <td><strong>${t.areaNome}</strong><br><span style="font-size:0.8rem;color:#64748b;">${t.nivelNome}</span></td>
            <td>${t.problemaNome}</td>
            <td>${t.solicitanteNome || 'Sistema'}</td>
            <td>${t.responsavelNome}</td>
            <td class="al-center" style="font-size:0.85rem;">${previsaoFmt}</td>
            <td class="al-center">${t.anexos > 0 ? `<i class="fa-solid fa-paperclip" title="${t.anexos} anexo(s)"></i>` : ''}</td>
            <td class="al-center">
                <span class="status-pill" style="background:white;border:1px solid ${mainColor};color:${mainColor};">${t.statusDesc}</span>
                ${t.atrasado ? '<span class="atraso-label">ATRASADO</span>' : ''}
            </td>
            <td class="al-center" style="border-right:4px solid ${mainColor};">
                <a href="chamado.html?id=${t.id}&Orig=ListaTodos" class="view-btn"><i class="fa-solid fa-magnifying-glass"></i></a>
            </td>
        </tr>`;
    }).join('');
}

// ──────────── edita_chamado.html (backwards compat) ──────────────

function populateUsers() {
    const select = document.getElementById('input-usuario-abertura');
    if (!select) return;
    select.innerHTML = '<option value="">-- Selecione --</option>';
    DB.usuarios.forEach(u => {
        select.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
    });
}

function populateAreas() {
    const select = document.getElementById('input-area');
    if (!select) return;
    select.innerHTML = '<option value="">-- Selecione a Área --</option>';
    DB.areas.forEach(a => {
        select.innerHTML += `<option value="${a.id}">${a.nome}</option>`;
    });
}

function onAreaChange() {
    const areaId = document.getElementById('input-area').value;
    const nivelSelect    = document.getElementById('input-nivel');
    const problemaSelect = document.getElementById('input-problema');
    nivelSelect.innerHTML    = '<option value="">-- Selecione o Nível --</option>';
    problemaSelect.innerHTML = '<option value="">Selecione um Nível primeiro</option>';
    problemaSelect.disabled  = true;
    if (areaId) {
        DB.niveisPorArea(areaId).forEach(n => {
            nivelSelect.innerHTML += `<option value="${n.id}">${n.nome}</option>`;
        });
        nivelSelect.disabled = false;
    } else {
        nivelSelect.disabled = true;
    }
}

function onNivelChange() {
    const nivelId = document.getElementById('input-nivel').value;
    const problemaSelect = document.getElementById('input-problema');
    problemaSelect.innerHTML = '<option value="">-- Selecione a Ocorrência --</option>';
    if (nivelId) {
        DB.problemasPorNivel(nivelId).forEach(p => {
            problemaSelect.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
        });
        problemaSelect.disabled = false;
    } else {
        problemaSelect.disabled = true;
    }
}

// ──────────── TOAST ──────────────────────────────────────────────

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(container);
    }
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
    const icons  = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const toast  = document.createElement('div');
    toast.style.cssText = `background:${colors[type]||colors.info};color:white;padding:12px 20px;border-radius:8px;font-size:0.875rem;font-weight:600;display:flex;align-items:center;gap:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:toastIn 0.3s ease;`;
    toast.innerHTML = `<i class="fa-solid ${icons[type]||icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
