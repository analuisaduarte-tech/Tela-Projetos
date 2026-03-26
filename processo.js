/**
 * SGI - processo.js
 * Process detail page logic with mock data
 */

// ===================== MOCK DATA =====================
const MOCK_PROCESS_DB = {
    1: {
        id: 1, nome: 'Gestão de Compras', responsavel: 'Carlos Lima', sgi: 'Marcos Pereira',
        ativo: 1, area: 'Compras',
        participante: true, aprovado: false, // Alterado para false para testar o bloqueio
        docs: [
            { id: 101, sigla: 'PC-001', nome: 'Procedimento de Compras Nacionais', revisao: '03', publicacao: '15/01/2025', aprovadoPor: 'Marcos Pereira', aprovadoEm: '16/01/2025 14:32', status: 'Aprovado', tipo: 1 },
            { id: 102, sigla: 'PC-002', nome: 'Instrução de Avaliação de Fornecedores', revisao: '01', publicacao: '10/03/2025', aprovadoPor: null, aprovadoEm: null, status: 'Não Aprovado', tipo: 1 },
            { id: 103, sigla: 'PC-003', nome: 'Procedimento de Compras Internacionais', revisao: '02', publicacao: '05/11/2024', aprovadoPor: 'Marcos Pereira', aprovadoEm: '06/11/2024 09:10', status: 'Aprovado', tipo: 1 },
        ],
        forms: [
            { id: 201, sigla: 'FC-001', nome: 'Formulário de Requisição de Compra', revisao: '05', publicacao: '12/02/2025', aprovadoPor: 'Marcos Pereira', aprovadoEm: '13/02/2025 11:20', status: 'Aprovado', tipo: 2 },
            { id: 202, sigla: 'FC-002', nome: 'Formulário de Cotação', revisao: '02', publicacao: '08/12/2024', aprovadoPor: null, aprovadoEm: null, status: 'Não Aprovado', tipo: 2 },
        ],
        participants: [
            { id: 2, nome: 'Carlos Lima', email: 'carlos.lima@brsupply.com', perfil: 'Participante' },
            { id: 5, nome: 'Juliana Costa', email: 'juliana.costa@brsupply.com', perfil: 'Visualizador' },
            { id: 6, nome: 'Marcos Pereira', email: 'marcos.pereira@brsupply.com', perfil: 'Participante' },
        ],
    },
    2: {
        id: 2, nome: 'Recrutamento e Seleção', responsavel: 'Fernanda Ramos', sgi: 'Marcos Pereira',
        ativo: 1, area: 'RH', participante: false,
        docs: [
            { id: 104, sigla: 'RH-001', nome: 'Procedimento de Recrutamento Externo', revisao: '02', publicacao: '20/02/2025', aprovadoPor: 'Marcos Pereira', aprovadoEm: '21/02/2025 10:00', status: 'Aprovado', tipo: 1 },
        ],
        forms: [
            { id: 203, sigla: 'FH-001', nome: 'Formulário de Triagem', revisao: '01', publicacao: '01/01/2025', aprovadoPor: 'Marcos Pereira', aprovadoEm: '02/01/2025 08:30', status: 'Aprovado', tipo: 2 },
        ],
        participants: [
            { id: 3, nome: 'Fernanda Ramos', email: 'fernanda.ramos@brsupply.com', perfil: 'Participante' },
        ],
    },
};

// Fallback generic process for any other id
function getMockProcess(id) {
    if (MOCK_PROCESS_DB[id]) return MOCK_PROCESS_DB[id];
    return {
        id, nome: `Processo #${id}`, responsavel: 'Ana Duarte', sgi: 'Marcos Pereira',
        ativo: 1, area: 'TI', participante: false,
        docs: [], forms: [], participants: [],
    };
}

const AVAILABLE_USERS = [
    { id: 1, nome: 'Ana Duarte', setor: 'TI', email: 'ana.duarte@brsupply.com' },
    { id: 4, nome: 'Rafael Souza', setor: 'Financeiro', email: 'rafael.souza@brsupply.com' },
    { id: 7, nome: 'Patricia Mendes', setor: 'Compras', email: 'patricia.mendes@brsupply.com' },
    { id: 8, nome: 'Bruno Alves', setor: 'TI', email: 'bruno.alves@brsupply.com' },
    { id: 9, nome: 'Camila Torres', setor: 'Logística', email: 'camila.torres@brsupply.com' },
];

// SESSION
const SESSION = { userId: 1, name: 'Ana Duarte', isAdmin: true, isSGI: true };

// ===================== STATE =====================
let PROCESS = null;
let currentTab = 'docs';
let pendingApproveId = null;
let selectedUserIds = new Set();
let updateDocType = 1; // 1=docs, 2=forms

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id')) || 1;
    PROCESS = JSON.parse(JSON.stringify(getMockProcess(id))); // deep clone
    
    // Sync with LocalStorage from index.html (app.js)
    const localDB = JSON.parse(localStorage.getItem('MOCK_PROCESSOS_DB')) || [];
    const pLocal = localDB.find(x => x.id === id);
    if(pLocal) {
        PROCESS = { ...PROCESS, ...pLocal };
        
        // Fix data corruption from app.js which saved docs as an integer count
        if (!Array.isArray(PROCESS.docs)) PROCESS.docs = [];
        if (!Array.isArray(PROCESS.forms)) PROCESS.forms = [];
        if (!Array.isArray(PROCESS.participants)) PROCESS.participants = [];
    }

    renderProcessHeader();
    renderDocsTab();
    renderFormsTab();
    renderParticipantsTab();
    updateTabCounts();
    document.getElementById('breadcrumb-name').textContent = PROCESS.nome;
    document.title = `SGI – ${PROCESS.nome} | BrSupply`;
});

// ===================== RENDER HEADER =====================
function renderProcessHeader() {
    const canAct = SESSION.isAdmin || SESSION.isSGI || PROCESS.participante;
    const panel = document.getElementById('process-info-panel');
    panel.innerHTML = `
        <div class="info-panel-code">
            <span class="label">Código da Área</span>
            <span class="value">${PROCESS.id}</span>
            <span class="badge-sgi">SGI</span>
        </div>
        <div class="info-panel-details">
            <div class="info-row">
                <span class="info-label"><i class="fa-solid fa-tag"></i> Área</span>
                <span class="info-value">${PROCESS.nome}</span>
            </div>
            <div class="info-row">
                <span class="info-label"><i class="fa-solid fa-user-tie"></i> Responsável</span>
                <span class="info-value">${PROCESS.responsavel}</span>
            </div>
            <div class="info-row">
                <span class="info-label"><i class="fa-solid fa-building"></i> Área</span>
                <span class="info-value">${PROCESS.area}</span>
            </div>
            <div class="info-row">
                <span class="info-label"><i class="fa-solid fa-circle-check"></i> Status</span>
                <span class="info-value">
                    ${PROCESS.ativo
                        ? '<span class="badge badge-approved"><i class="fa-solid fa-circle" style="font-size:0.45rem;"></i> Ativo</span>'
                        : '<span class="badge badge-not-approved"><i class="fa-solid fa-circle" style="font-size:0.45rem;"></i> Inativo</span>'}
                </span>
            </div>
            <div class="info-row">
                <span class="info-label"><i class="fa-solid fa-users"></i> Participantes</span>
                <span class="info-value">${PROCESS.participants.length} pessoa${PROCESS.participants.length !== 1 ? 's' : ''}</span>
            </div>
        </div>`;

    // Header quick-access buttons
    const headerActions = document.getElementById('header-actions');
    let actionsHtml = '';
    
    if (canAct) {
        if (!PROCESS.aprovado) {
            actionsHtml += `
                <button class="btn btn-success btn-sm" onclick="aprovarProcessoAtual()">
                    <i class="fa-solid fa-stamp"></i> Aprovar Processo
                </button>`;
        }
        actionsHtml += `
            <button class="btn btn-primary btn-sm" onclick="openModal('modal-upload')">
                <i class="fa-solid fa-file-arrow-up"></i> Novo Documento
            </button>`;
    }
    headerActions.innerHTML = actionsHtml;
}

// ===================== RENDER DOCS =====================
function renderDocsTab() {
    const canAct = SESSION.isAdmin || SESSION.isSGI || PROCESS.participante;
    const canView = SESSION.isAdmin || SESSION.isSGI || PROCESS.participante;

    // Actions bar
    const docsActions = document.getElementById('docs-actions');
    if (canAct) {
        docsActions.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="openModal('modal-upload')">
                <i class="fa-solid fa-plus"></i> Novo
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openUpdateModal(1)">
                <i class="fa-solid fa-rotate"></i> Atualizar
            </button>`;
    }

    const body = document.getElementById('docs-body');
    if (!canView) {
        body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-lock"></i><p>Você não tem permissão para visualizar os documentos deste processo.</p></div>`;
        return;
    }

    const docs = SESSION.isAdmin || SESSION.isSGI
        ? PROCESS.docs
        : PROCESS.docs.filter(d => d.aprovadoPor);

    if (docs.length === 0) {
        body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>Nenhum documento disponível até o momento.</p></div>`;
        return;
    }

    body.innerHTML = `<table class="modern-table">
        <thead><tr>
            <th>Documento</th>
            <th class="al-center">Sigla</th>
            <th class="al-center">Versão</th>
            <th class="al-center">Atualização</th>
            <th class="al-center">Leitura</th>
            <th>Aprovação</th>
            ${SESSION.isAdmin || SESSION.isSGI ? '<th class="al-center">Ações</th>' : ''}
        </tr></thead>
        <tbody>
            ${docs.map(d => buildDocRow(d, SESSION.isAdmin || SESSION.isSGI)).join('')}
        </tbody>
    </table>`;
}

function buildDocRow(d, isAdmin) {
    const approvalCell = buildApprovalCell(d);
    const deleteBtn = isAdmin ? `
        <button class="action-btn delete" title="Excluir" onclick="deleteDoc(${d.id}, ${d.tipo})" style="display:inline-flex;">
            <i class="fa-solid fa-trash"></i>
        </button>` : '';
    return `<tr>
        <td>${d.nome}</td>
        <td class="al-center">
            <a href="#" class="doc-link" onclick="viewDocument(${d.id})" title="Visualizar documento">
                <i class="fa-solid fa-file-pdf"></i> ${d.sigla}
            </a>
        </td>
        <td class="al-center">
            <span style="background:#f1f5f9;padding:2px 8px;border-radius:10px;font-size:0.8rem;font-weight:600;">${d.revisao}</span>
        </td>
        <td class="al-center">${d.publicacao}</td>
        <td class="al-center">
            <button class="action-btn" title="Ver leituras" onclick="viewReadings(${d.id})" style="display:inline-flex;">
                <i class="fa-solid fa-eye"></i>
            </button>
        </td>
        <td>${approvalCell}</td>
        ${isAdmin ? `<td class="al-center">${deleteBtn}</td>` : ''}
    </tr>`;
}

function buildApprovalCell(d) {
    if (d.status === 'Não Aprovado') {
        if (SESSION.isSGI || SESSION.isAdmin) {
            return `<button class="btn btn-primary btn-sm" onclick="openApproveModal(${d.id})">
                <i class="fa-solid fa-stamp"></i> Aprovar / Reprovar
            </button>`;
        }
        return `<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> Não Aprovado</span>`;
    } else if (d.status === 'Reprovado') {
        return `<div style="font-size:0.8rem;">
            <span class="badge badge-not-approved" style="margin-bottom:4px;"><i class="fa-solid fa-xmark"></i> Reprovado</span><br>
            <span style="color:var(--text-muted);">${d.aprovadoPor}</span><br>
            <span style="color:var(--text-muted);font-size:0.75rem;">${d.aprovadoEm}</span><br>
            ${d.motivoReprovacao ? `<div style="margin-top:4px;padding:4px;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;color:#991b1b;font-size:0.75rem;"><strong>Motivo:</strong> ${d.motivoReprovacao}</div>` : ''}
        </div>`;
    }
    return `<div style="font-size:0.8rem;">
        <span class="badge badge-approved" style="margin-bottom:4px;"><i class="fa-solid fa-check"></i> Aprovado</span><br>
        <span style="color:var(--text-muted);">${d.aprovadoPor}</span><br>
        <span style="color:var(--text-muted);font-size:0.75rem;">${d.aprovadoEm}</span>
    </div>`;
}

// ===================== RENDER FORMS =====================
function renderFormsTab() {
    const canAct = SESSION.isAdmin || SESSION.isSGI || PROCESS.participante;
    const canView = SESSION.isAdmin || SESSION.isSGI || PROCESS.participante;

    const formsActions = document.getElementById('forms-actions');
    if (canAct) {
        formsActions.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="openModal('modal-upload')">
                <i class="fa-solid fa-plus"></i> Novo
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openUpdateModal(2)">
                <i class="fa-solid fa-rotate"></i> Atualizar
            </button>`;
    }

    const body = document.getElementById('forms-body');
    if (!canView) {
        body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-lock"></i><p>Sem permissão.</p></div>`;
        return;
    }

    const forms = PROCESS.forms;
    if (forms.length === 0) {
        body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>Nenhum formulário disponível até o momento.</p></div>`;
        return;
    }

    body.innerHTML = `<table class="modern-table">
        <thead><tr>
            <th>Formulário</th>
            <th class="al-center">Sigla</th>
            <th class="al-center">Versão</th>
            <th class="al-center">Atualização</th>
            <th class="al-center">Leitura</th>
            <th>Aprovação</th>
            ${SESSION.isAdmin || SESSION.isSGI ? '<th class="al-center">Ações</th>' : ''}
        </tr></thead>
        <tbody>
            ${forms.map(f => buildDocRow(f, SESSION.isAdmin || SESSION.isSGI)).join('')}
        </tbody>
    </table>`;
}

// ===================== RENDER PARTICIPANTS =====================
function renderParticipantsTab() {
    const canManage = SESSION.isAdmin || SESSION.isSGI;
    const pActions = document.getElementById('participants-actions');
    if (canManage) {
        pActions.innerHTML = `<button class="btn btn-primary btn-sm" onclick="openAddParticipantModal()">
            <i class="fa-solid fa-user-plus"></i> Novo Participante
        </button>`;
    }
    paintParticipants(PROCESS.participants);
}

function paintParticipants(list) {
    const body = document.getElementById('participants-body');
    if (list.length === 0) {
        body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i><p>Nenhum participante inserido até o momento.</p></div>`;
        return;
    }
    const canManage = SESSION.isAdmin || SESSION.isSGI;
    body.innerHTML = `<table class="modern-table">
        <thead><tr>
            <th>Usuário</th>
            <th>Email</th>
            <th>Perfil</th>
            ${canManage ? '<th class="al-center">Ações</th>' : ''}
        </tr></thead>
        <tbody>
            ${list.map(p => {
                const initials = p.nome.split(' ').map(w => w[0]).slice(0, 2).join('');
                const perfil = p.perfil === 'Participante'
                    ? `<span class="badge badge-participant"><i class="fa-solid fa-user-gear"></i> Participante</span>`
                    : `<span class="badge badge-viewer"><i class="fa-solid fa-eye"></i> Visualizador</span>`;
                return `<tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f78f1e,#e07b13);display:flex;align-items:center;justify-content:center;color:white;font-size:0.7rem;font-weight:700;">${initials}</div>
                            <strong>${p.nome}</strong>
                        </div>
                    </td>
                    <td style="font-size:0.85rem;color:var(--text-muted);">${p.email}</td>
                    <td>${perfil}</td>
                    ${canManage ? `<td class="al-center"><button class="action-btn delete" title="Remover" onclick="removeParticipant(${p.id})" style="display:inline-flex;"><i class="fa-solid fa-user-minus"></i></button></td>` : ''}
                </tr>`;
            }).join('')}
        </tbody>
    </table>`;
}

function filterParticipants() {
    const q = document.getElementById('participant-search').value.toLowerCase();
    const filtered = PROCESS.participants.filter(p =>
        p.nome.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.perfil.toLowerCase().includes(q)
    );
    paintParticipants(filtered);
}

function removeParticipant(userId) {
    if (!confirm('Remover este participante do processo?')) return;
    PROCESS.participants = PROCESS.participants.filter(p => p.id !== userId);
    renderParticipantsTab();
    updateTabCounts();
    saveCurrentProcess();
    showToast('Participante removido.', 'success');
}

// ===================== TAB SWITCHING =====================
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`tab-btn-${tab}`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

function updateTabCounts() {
    document.getElementById('tab-docs-count').textContent = PROCESS.docs.length;
    document.getElementById('tab-forms-count').textContent = PROCESS.forms.length;
    document.getElementById('tab-participants-count').textContent = PROCESS.participants.length;
}

// ===================== MODALS =====================
function openModal(id) {
    if (id === 'modal-upload') {
        if (!PROCESS.aprovado) {
            showToast('Este processo ainda não foi aprovado pelo responsável. Você não pode anexar documentos até a sua aprovação.', 'error');
            return;
        }

        const selectAprovador = document.getElementById('upload-aprovador');
        selectAprovador.innerHTML = '<option value="">-- Selecione o Aprovador --</option>' + 
            AVAILABLE_USERS.map(u => `<option value="${u.nome}">${u.nome}</option>`).join('');
        
        document.getElementById('upload-requer-aprovacao').checked = false;
        toggleAprovadorDoc();
    }
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function toggleAprovadorDoc() {
    const chk = document.getElementById('upload-requer-aprovacao').checked;
    const div = document.getElementById('div-upload-aprovador');
    if (chk) {
        div.classList.remove('hidden');
    } else {
        div.classList.add('hidden');
    }
}

// Close on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

function openUpdateModal(tipo) {
    updateDocType = tipo;
    const list = tipo === 1 ? PROCESS.docs : PROCESS.forms;
    document.getElementById('modal-update-title').innerHTML = `<i class="fa-solid fa-rotate"></i> Atualizar ${tipo === 1 ? 'Documento' : 'Formulário'} — ${PROCESS.nome}`;
    const sel = document.getElementById('update-doc-select');
    sel.innerHTML = '<option value="">-- Selecione --</option>' +
        list.map(d => `<option value="${d.id}">${d.sigla} — ${d.nome}</option>`).join('');
    openModal('modal-update');
}

// Upload document (mock)
function uploadDocument() {
    const nome = document.getElementById('upload-nome').value.trim();
    const sigla = document.getElementById('upload-sigla').value.trim();
    const tipo = parseInt(document.getElementById('upload-tipo').value);
    
    const requerAprovacao = document.getElementById('upload-requer-aprovacao').checked;
    const aprovador = requerAprovacao ? document.getElementById('upload-aprovador').value : null;

    if (!nome || !sigla || !tipo) {
        showToast('Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    if (requerAprovacao && !aprovador) {
        showToast('Selecione o aprovador.', 'error');
        return;
    }

    const newDoc = {
        id: Date.now(),
        sigla, nome,
        revisao: '01',
        publicacao: new Date().toLocaleDateString('pt-BR'),
        aprovadoPor: requerAprovacao ? null : 'Automático',
        aprovadoEm: requerAprovacao ? null : new Date().toLocaleString('pt-BR'),
        status: requerAprovacao ? 'Não Aprovado' : 'Aprovado',
        tipo,
    };
    if (tipo === 1) {
        PROCESS.docs.push(newDoc);
        renderDocsTab();
    } else {
        PROCESS.forms.push(newDoc);
        renderFormsTab();
    }
    updateTabCounts();
    saveCurrentProcess();
    closeModal('modal-upload');
    document.getElementById('upload-nome').value = '';
    document.getElementById('upload-sigla').value = '';
    document.getElementById('upload-tipo').value = '';
    showToast('Documento anexado com sucesso!', 'success');
}

// Update document (mock – just bumps revision)
function updateDocument() {
    const docId = parseInt(document.getElementById('update-doc-select').value);
    if (!docId) { showToast('Selecione um documento.', 'error'); return; }
    const list = updateDocType === 1 ? PROCESS.docs : PROCESS.forms;
    const doc = list.find(d => d.id === docId);
    if (doc) {
        doc.revisao = String(parseInt(doc.revisao) + 1).padStart(2, '0');
        doc.publicacao = new Date().toLocaleDateString('pt-BR');
        doc.status = 'Não Aprovado';
        doc.aprovadoPor = null;
        doc.aprovadoEm = null;
    }
    if (updateDocType === 1) renderDocsTab(); else renderFormsTab();
    saveCurrentProcess();
    closeModal('modal-update');
    showToast('Documento atualizado! Nova versão aguarda aprovação.', 'success');
}

// Delete doc
function deleteDoc(id, tipo) {
    if (!confirm('Excluir este documento?')) return;
    if (tipo === 1) {
        PROCESS.docs = PROCESS.docs.filter(d => d.id !== id);
        renderDocsTab();
    } else {
        PROCESS.forms = PROCESS.forms.filter(d => d.id !== id);
        renderFormsTab();
    }
    updateTabCounts();
    saveCurrentProcess();
    showToast('Documento removido.', 'success');
}

// Approve modal
function openApproveModal(docId) {
    const all = [...PROCESS.docs, ...PROCESS.forms];
    const doc = all.find(d => d.id === docId);
    if (!doc) return;
    pendingApproveId = docId;
    document.getElementById('approve-doc-name').textContent = `${doc.sigla} — ${doc.nome}`;
    document.getElementById('motivo-reprovacao').value = '';
    openModal('modal-approve');
}

function confirmApprove() {
    const all = [...PROCESS.docs, ...PROCESS.forms];
    const doc = all.find(d => d.id === pendingApproveId);
    if (!doc) return;
    const now = new Date();
    doc.status = 'Aprovado';
    doc.aprovadoPor = SESSION.name;
    doc.aprovadoEm = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    closeModal('modal-approve');
    renderDocsTab();
    renderFormsTab();
    saveCurrentProcess();
    showToast('Documento aprovado com sucesso!', 'success');
    pendingApproveId = null;
}

function confirmReject() {
    const all = [...PROCESS.docs, ...PROCESS.forms];
    const doc = all.find(d => d.id === pendingApproveId);
    if (!doc) return;
    
    const motivo = document.getElementById('motivo-reprovacao').value.trim();
    if (!motivo) {
        showToast('Para reprovar, é OBRIGATÓRIO informar o motivo.', 'error');
        document.getElementById('motivo-reprovacao').focus();
        return;
    }

    const now = new Date();
    doc.status = 'Reprovado';
    doc.aprovadoPor = SESSION.name;
    doc.aprovadoEm = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.motivoReprovacao = motivo;
    
    closeModal('modal-approve');
    renderDocsTab();
    renderFormsTab();
    saveCurrentProcess();
    showToast('Documento reprovado. Uma nova revisão deverá ser criada.', 'error');
    pendingApproveId = null;
}

// View document (mock)
function viewDocument(id) {
    const all = [...PROCESS.docs, ...PROCESS.forms];
    const doc = all.find(d => d.id === id);
    if (!doc) return;

    if (doc.status !== 'Aprovado') {
        showToast('Download bloqueado: O documento não está aprovado.', 'error');
        return;
    }

    showToast('Abrindo documento/download...', 'info');
}

// View readings (mock)
function viewReadings(id) {
    const readings = [
        { nome: 'Carlos Lima', data: '10/03/2025 09:14' },
        { nome: 'Juliana Costa', data: '11/03/2025 14:20' },
        { nome: 'Ana Duarte', data: '12/03/2025 16:05' },
    ];
    const body = document.getElementById('readings-body');
    if (readings.length === 0) {
        body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-book-open"></i><p>Nenhuma leitura registrada.</p></div>`;
    } else {
        body.innerHTML = `<table class="modern-table">
            <thead><tr><th>Usuário</th><th class="al-right">Data/Hora</th></tr></thead>
            <tbody>
                ${readings.map(r => `<tr><td><strong>${r.nome}</strong></td><td class="al-right" style="color:var(--text-muted);">${r.data}</td></tr>`).join('')}
            </tbody>
        </table>`;
    }
    openModal('modal-readings');
}

// ===================== ADD PARTICIPANTS =====================
function openAddParticipantModal() {
    const alreadyIn = PROCESS.participants.map(p => p.id);
    const available = AVAILABLE_USERS.filter(u => !alreadyIn.includes(u.id));
    selectedUserIds.clear();
    document.getElementById('btn-add-participants').disabled = true;
    document.getElementById('add-participant-search').value = '';
    paintAvailableUsers(available);
    openModal('modal-participant');
}

function paintAvailableUsers(list) {
    const alreadyIn = PROCESS.participants.map(p => p.id);
    const available = list.filter(u => !alreadyIn.includes(u.id));
    const container = document.getElementById('available-users-list');
    if (available.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i><p>Todos os usuários já estão no processo.</p></div>`;
        return;
    }
    container.innerHTML = available.map(u => {
        const initials = u.nome.split(' ').map(w => w[0]).slice(0, 2).join('');
        const isChecked = selectedUserIds.has(u.id);
        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px dashed #f1f5f9;cursor:pointer;" onclick="toggleUser(${u.id}, this)">
            <input type="checkbox" id="usr-${u.id}" ${isChecked ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--primary-color);flex-shrink:0;">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#555,#333);display:flex;align-items:center;justify-content:center;color:white;font-size:0.75rem;font-weight:700;flex-shrink:0;">${initials}</div>
            <div style="flex:1;">
                <div style="font-weight:600;font-size:0.875rem;">${u.nome}</div>
                <div style="color:var(--text-muted);font-size:0.75rem;">${u.setor} · ${u.email}</div>
            </div>
        </div>`;
    }).join('');
}

function toggleUser(id, row) {
    if (selectedUserIds.has(id)) {
        selectedUserIds.delete(id);
        row.querySelector('input[type="checkbox"]').checked = false;
        row.style.background = '';
    } else {
        selectedUserIds.add(id);
        row.querySelector('input[type="checkbox"]').checked = true;
        row.style.background = 'var(--primary-light)';
    }
    document.getElementById('btn-add-participants').disabled = selectedUserIds.size === 0;
}

function filterAvailableUsers() {
    const q = document.getElementById('add-participant-search').value.toLowerCase();
    const alreadyIn = PROCESS.participants.map(p => p.id);
    const filtered = AVAILABLE_USERS.filter(u => !alreadyIn.includes(u.id) && (
        u.nome.toLowerCase().includes(q) || u.setor.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    ));
    paintAvailableUsers(filtered);
}

function toggleSelectAll() {
    const alreadyIn = PROCESS.participants.map(p => p.id);
    const available = AVAILABLE_USERS.filter(u => !alreadyIn.includes(u.id));
    const allSelected = available.every(u => selectedUserIds.has(u.id));
    if (allSelected) {
        available.forEach(u => selectedUserIds.delete(u.id));
    } else {
        available.forEach(u => selectedUserIds.add(u.id));
    }
    paintAvailableUsers(available);
    document.getElementById('btn-add-participants').disabled = selectedUserIds.size === 0;
}

function addParticipants() {
    if (selectedUserIds.size === 0) return;
    const tipo = document.getElementById('participant-type').value;
    const perfil = tipo === '1' ? 'Participante' : 'Visualizador';
    selectedUserIds.forEach(id => {
        const u = AVAILABLE_USERS.find(x => x.id === id);
        if (u) {
            PROCESS.participants.push({ id: u.id, nome: u.nome, email: u.email, perfil });
        }
    });
    closeModal('modal-participant');
    renderParticipantsTab();
    updateTabCounts();
    saveCurrentProcess();
    showToast(`${selectedUserIds.size} participante(s) adicionado(s) com sucesso!`, 'success');
    selectedUserIds.clear();
}

// ===================== TOAST =====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3100);
}

function saveCurrentProcess() {
    const localDB = JSON.parse(localStorage.getItem('MOCK_PROCESSOS_DB')) || [];
    const idx = localDB.findIndex(x => x.id === PROCESS.id);
    if(idx > -1) {
        localDB[idx] = PROCESS;
    } else {
        localDB.push(PROCESS);
    }
    localStorage.setItem('MOCK_PROCESSOS_DB', JSON.stringify(localDB));
}

function aprovarProcessoAtual() {
    if(!confirm('Deseja aprovar este processo? Ele ficará liberado para anexar documentos.')) return;
    PROCESS.aprovado = true;
    saveCurrentProcess();
    renderProcessHeader();
    showToast('Processo aprovado com sucesso!', 'success');
}
