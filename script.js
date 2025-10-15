// Contabilizador de Hábitos
// Este script gerencia a interface, armazenamento local e relatórios para o
// aplicativo de hábitos. Ele foi escrito com foco em clareza e em práticas de
// código limpo, incluindo funções pequenas e bem nomeadas. As metas diárias
// são definidas no objeto GOALS.

// Metas diárias em minutos ou quantidades
const GOALS = {
  running: 20,
  flexoes: 36,
  abdominais: 135,
  agachamento: 3,
  studyTi: 30,
  studyConcurso: 60,
  meditation: 5
};

// Horários em que as notificações de metas não alcançadas serão verificadas
// (horas no formato 24h)
const NOTIFICATION_HOURS = [12, 17, 21];

// Atualiza o texto que mostra a data e hora atual
function updateCurrentDateTime() {
  const now = new Date();
  const options = {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  };
  document.getElementById('currentDateTime').textContent = now.toLocaleString('pt-BR', options);
}

// Formata uma data Date para o formato dd/mm/aaaa
function formatDate(date) {
  return date.toLocaleDateString('pt-BR');
}

// Converte uma chave de data (yyyy-mm-dd) para objeto Date no fuso horário local.
// A string 'YYYY-MM-DD' passada para o construtor Date é interpretada como UTC,
// o que causa deslocamentos de dia em ambientes com fuso horário diferente. Para
// evitar isso, construímos uma nova Date a partir dos componentes ano/mês/dia.
function parseDateLocal(dateKey) {
  const [year, month, day] = dateKey.split('-').map(n => parseInt(n, 10));
  return new Date(year, month - 1, day);
}

// Formata uma chave de data (yyyy-mm-dd) para dd/mm/aaaa sem criar um objeto Date.
function formatDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

// Converte uma data ISO (string) em chave de data (YYYY-MM-DD)
function getDateKey(isoString) {
  return isoString.slice(0, 10);
}

// Lê os registros do armazenamento local
function loadRecords() {
  return JSON.parse(localStorage.getItem('habitRecords') || '[]');
}

// Salva um novo registro no armazenamento local
function saveRecord(record) {
  const records = loadRecords();
  records.push(record);
  localStorage.setItem('habitRecords', JSON.stringify(records));
}

// Reseta o formulário para o estado inicial
function resetForm() {
  const form = document.getElementById('habitForm');
  form.reset();
  // Desabilita inputs e oculta campos conforme necessário
  document.getElementById('runningTime').disabled = true;
  document.getElementById('weightsTime').disabled = true;
  document.getElementById('studyTiTime').disabled = true;
  document.getElementById('studyConcursoTime').disabled = true;
  document.getElementById('meditationTime').disabled = true;
  // Oculta campos de exercícios em casa
  document.getElementById('homeFields').classList.add('hidden');
  // Zera valores das subopções
  ['flexoesCount','abdominaisCount','elevacaoCount','agachamentoTime'].forEach(id => {
    const input = document.getElementById(id);
    input.value = 0;
  });
}

// Habilita ou desabilita um campo numérico de acordo com o estado do checkbox
function setupToggleCheckbox(checkboxId, inputId) {
  const checkbox = document.getElementById(checkboxId);
  const input = document.getElementById(inputId);
  checkbox.addEventListener('change', () => {
    input.disabled = !checkbox.checked;
    if (!checkbox.checked) {
      input.value = 0;
    }
  });
}

// Configura a lógica para mostrar ou esconder os campos de exercícios em casa
function setupHomeCheckbox() {
  const homeCheckbox = document.getElementById('homeCheckbox');
  const homeFields = document.getElementById('homeFields');
  homeCheckbox.addEventListener('change', () => {
    if (homeCheckbox.checked) {
      homeFields.classList.remove('hidden');
    } else {
      homeFields.classList.add('hidden');
      // Zera todos os valores
      ['flexoesCount','abdominaisCount','elevacaoCount','agachamentoTime'].forEach(id => {
        const input = document.getElementById(id);
        input.value = 0;
      });
    }
  });
}

// Cria um objeto de registro com base nos valores do formulário
function createRecord() {
  const now = new Date();
  return {
    id: now.getTime(),
    dateTime: now.toISOString(),
    // Armazena a data local (yyyy-mm-dd) para evitar discrepâncias de fuso horário
    dateKey: now.toLocaleDateString('en-CA'),
    exercise: {
      running: {
        done: document.getElementById('runningCheckbox').checked,
        time: Number(document.getElementById('runningTime').value) || 0
      },
      home: {
        done: document.getElementById('homeCheckbox').checked,
        flexoes: parseInt(document.getElementById('flexoesCount').value, 10) || 0,
        abdominais: parseInt(document.getElementById('abdominaisCount').value, 10) || 0,
        elevacao: parseInt(document.getElementById('elevacaoCount').value, 10) || 0,
        agachamento: parseFloat(document.getElementById('agachamentoTime').value) || 0
      },
      weights: {
        done: document.getElementById('weightsCheckbox').checked,
        time: Number(document.getElementById('weightsTime').value) || 0
      }
    },
    study: {
      ti: {
        done: document.getElementById('studyTiCheckbox').checked,
        time: Number(document.getElementById('studyTiTime').value) || 0
      },
      concurso: {
        done: document.getElementById('studyConcursoCheckbox').checked,
        time: Number(document.getElementById('studyConcursoTime').value) || 0
      }
    },
    meditation: {
      done: document.getElementById('meditationCheckbox').checked,
      time: Number(document.getElementById('meditationTime').value) || 0
    }
  };
}

// Agrega registros por data, retornando um objeto com somatórios de valores por dia
function aggregateByDate(records) {
  const aggregated = {};
  records.forEach(rec => {
    const key = rec.dateKey || getDateKey(rec.dateTime);
    if (!aggregated[key]) {
      aggregated[key] = {
        running: 0,
        flexoes: 0,
        abdominais: 0,
        agachamento: 0,
        studyTi: 0,
        studyConcurso: 0,
        meditation: 0
      };
    }
    // Soma valores (somente se a atividade tiver sido marcada como feita)
    aggregated[key].running += rec.exercise.running.done ? rec.exercise.running.time : 0;
    aggregated[key].flexoes += rec.exercise.home.done ? rec.exercise.home.flexoes : 0;
    aggregated[key].abdominais += rec.exercise.home.done ? rec.exercise.home.abdominais : 0;
    aggregated[key].agachamento += rec.exercise.home.done ? rec.exercise.home.agachamento : 0;
    aggregated[key].studyTi += rec.study.ti.done ? rec.study.ti.time : 0;
    aggregated[key].studyConcurso += rec.study.concurso.done ? rec.study.concurso.time : 0;
    aggregated[key].meditation += rec.meditation.done ? rec.meditation.time : 0;
  });
  return aggregated;
}

// Adiciona uma linha à tabela de relatórios diários
function addDailyRow(label, value, goal, tbody) {
  const tr = document.createElement('tr');
  const status = value >= goal ? 'Atingido' : 'Não Atingido';
  tr.innerHTML = `<td>${label}</td><td>${value}</td><td>${goal}</td><td>${status}</td>`;
  tbody.appendChild(tr);
}

// Gera relatório baseado no tipo selecionado (diário, semanal, mensal)
function generateReport(type) {
  const container = document.getElementById('reportContainer');
  container.innerHTML = '';
  const records = loadRecords();
  if (!records.length) {
    container.textContent = 'Nenhum registro encontrado.';
    return;
  }
  const now = new Date();
  let startDate, endDate;
  // Para cada tipo de relatório definimos o intervalo que será considerado.
  // Para o relatório diário utilizamos apenas o dia atual.
  if (type === 'diario') {
    // No diário, ignoramos a filtragem por intervalo e exibimos apenas os dados do dia atual.
    startDate = null;
    endDate = null;
  } else if (type === 'semanal') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else {
    // mensal (últimos 30 dias)
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }
  let relevantRecords;
  if (type === 'diario') {
    // Filtra apenas os registros do dia atual com base na chave de data
    const todayKey = now.toLocaleDateString('en-CA');
    relevantRecords = records.filter(rec => {
      const key = rec.dateKey || getDateKey(rec.dateTime);
      return key === todayKey;
    });
    if (!relevantRecords.length) {
      container.textContent = 'Nenhum registro de hoje.';
      return;
    }
    const aggregated = aggregateByDate(relevantRecords);
    const summary = aggregated[todayKey];
    const title = document.createElement('h3');
    // Usa formatDateKey para evitar problemas de fuso horário na apresentação da data
    title.textContent = `Relatório diário de ${formatDateKey(todayKey)}`;
    container.appendChild(title);
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Atividade</th><th>Realizado</th><th>Meta</th><th>Status</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    addDailyRow('Corrida (min)', summary.running, GOALS.running, tbody);
    addDailyRow('Flexões', summary.flexoes, GOALS.flexoes, tbody);
    addDailyRow('Abdominais', summary.abdominais, GOALS.abdominais, tbody);
    addDailyRow('Agachamento (min)', summary.agachamento, GOALS.agachamento, tbody);
    addDailyRow('Estudo TI (min)', summary.studyTi, GOALS.studyTi, tbody);
    addDailyRow('Estudo Concurso (min)', summary.studyConcurso, GOALS.studyConcurso, tbody);
    addDailyRow('Meditação (min)', summary.meditation, GOALS.meditation, tbody);
    table.appendChild(tbody);
    container.appendChild(table);
    return;
  } else {
    // Filtra registros com base nas datas locais (rec.dateKey) para evitar problemas de fuso horário
    relevantRecords = records.filter(rec => {
      // Converte a chave de data para Date no fuso horário local para comparação
      const recDate = parseDateLocal(rec.dateKey || getDateKey(rec.dateTime));
      return recDate >= startDate && recDate <= endDate;
    });
    if (!relevantRecords.length) {
      container.textContent = 'Nenhum registro no período selecionado.';
      return;
    }
    // Agrupa dados do período e gera relatório semanal/mensal
    const aggregated = aggregateByDate(relevantRecords);
    const title = document.createElement('h3');
    title.textContent = type === 'semanal' ? 'Relatório semanal' : 'Relatório mensal';
    container.appendChild(title);
    const table = document.createElement('table');
    // Cabeçalho da tabela
    const headerRow = '<tr>' +
      '<th>Data</th>' +
      '<th>Corrida (min)</th><th>Status Corrida</th>' +
      '<th>Flexões</th><th>Status Flexões</th>' +
      '<th>Abdominais</th><th>Status Abdominais</th>' +
      '<th>Agachamento (min)</th><th>Status Agachamento</th>' +
      '<th>Estudo TI (min)</th><th>Status TI</th>' +
      '<th>Estudo Concurso (min)</th><th>Status Concurso</th>' +
      '<th>Meditação (min)</th><th>Status Meditação</th>' +
      '</tr>';
    const thead = document.createElement('thead');
    thead.innerHTML = headerRow;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    const dateKeys = Object.keys(aggregated).sort();
    dateKeys.forEach(key => {
      const summary = aggregated[key];
      const row = document.createElement('tr');
      // Exibe a data formatada sem criar um objeto Date
      row.innerHTML =
        `<td>${formatDateKey(key)}</td>` +
        `<td>${summary.running}</td><td>${summary.running >= GOALS.running ? 'Atingiu' : 'Não'}</td>` +
        `<td>${summary.flexoes}</td><td>${summary.flexoes >= GOALS.flexoes ? 'Atingiu' : 'Não'}</td>` +
        `<td>${summary.abdominais}</td><td>${summary.abdominais >= GOALS.abdominais ? 'Atingiu' : 'Não'}</td>` +
        `<td>${summary.agachamento}</td><td>${summary.agachamento >= GOALS.agachamento ? 'Atingiu' : 'Não'}</td>` +
        `<td>${summary.studyTi}</td><td>${summary.studyTi >= GOALS.studyTi ? 'Atingiu' : 'Não'}</td>` +
        `<td>${summary.studyConcurso}</td><td>${summary.studyConcurso >= GOALS.studyConcurso ? 'Atingiu' : 'Não'}</td>` +
        `<td>${summary.meditation}</td><td>${summary.meditation >= GOALS.meditation ? 'Atingiu' : 'Não'}</td>`;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
    return;
  }
}

// Exporta o relatório atual como PDF usando html2pdf
function exportReportAsPdf() {
  const container = document.getElementById('reportContainer');
  if (!container || !container.innerHTML.trim()) {
    alert('Nada para exportar. Gere um relatório primeiro.');
    return;
  }
  // Utiliza html2pdf para converter o conteúdo do relatório em PDF
  const opt = {
    margin:       10,
    filename:     `relatorio_${new Date().toISOString().slice(0,10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(container).save();
}

// Solicita permissão ao usuário e ativa verificação de notificações
function enableNotifications() {
  Notification.requestPermission().then(permission => {
    const statusEl = document.getElementById('notificationStatus');
    if (permission === 'granted') {
      statusEl.textContent = 'Notificações ativadas.';
      statusEl.style.color = 'green';
    } else if (permission === 'denied') {
      statusEl.textContent = 'Permissão de notificações negada.';
      statusEl.style.color = 'red';
    } else {
      statusEl.textContent = 'Permissão de notificações ainda não concedida.';
      statusEl.style.color = '#333';
    }
  });
}

// Atualiza o texto que mostra o estado das notificações
function updateNotificationStatus() {
  const statusEl = document.getElementById('notificationStatus');
  if (!statusEl) return;
  const permission = Notification.permission;
  if (permission === 'granted') {
    statusEl.textContent = 'Notificações ativadas.';
    statusEl.style.color = 'green';
  } else if (permission === 'denied') {
    statusEl.textContent = 'Permissão de notificações negada.';
    statusEl.style.color = 'red';
  } else {
    statusEl.textContent = 'Permissão de notificações ainda não concedida.';
    statusEl.style.color = '#333';
  }
}

// Checa metas diárias e dispara notificações quando necessário
function checkNotifications() {
  if (Notification.permission !== 'granted') return;
  const now = new Date();
  const currentHour = now.getHours();
  // Obtém a data local em yyyy-mm-dd para evitar discrepâncias
  const currentDateKey = now.toLocaleDateString('en-CA');
  // Obtém registros do dia atual
  const records = loadRecords().filter(rec => (rec.dateKey || getDateKey(rec.dateTime)) === currentDateKey);
  const aggregated = aggregateByDate(records);
  const summary = aggregated[currentDateKey] || {
    running: 0,
    flexoes: 0,
    abdominais: 0,
    agachamento: 0,
    studyTi: 0,
    studyConcurso: 0,
    meditation: 0
  };
  // Descobre quais metas ainda não foram alcançadas
  const missed = [];
  if (summary.running < GOALS.running) missed.push('corrida');
  if (summary.flexoes < GOALS.flexoes) missed.push('flexões');
  if (summary.abdominais < GOALS.abdominais) missed.push('abdominais');
  if (summary.agachamento < GOALS.agachamento) missed.push('agachamento');
  if (summary.studyTi < GOALS.studyTi) missed.push('estudo TI');
  if (summary.studyConcurso < GOALS.studyConcurso) missed.push('estudo Concurso');
  if (summary.meditation < GOALS.meditation) missed.push('meditação');
  if (!missed.length) {
    // Todas as metas atingidas, limpa notificações enviadas
    localStorage.removeItem(`notificationsSent-${currentDateKey}`);
    return;
  }
  // Verifica se alguma notificação deve ser enviada neste horário
  const sent = JSON.parse(localStorage.getItem(`notificationsSent-${currentDateKey}`) || '[]');
  NOTIFICATION_HOURS.forEach((hour, index) => {
    if (currentHour >= hour && !sent.includes(index)) {
      // Envia notificação e marca como enviada
      const title = 'Metas diárias pendentes';
      const body = `Você ainda não alcançou: ${missed.join(', ')}.`;
      try {
        new Notification(title, { body });
        sent.push(index);
        localStorage.setItem(`notificationsSent-${currentDateKey}`, JSON.stringify(sent));
      } catch (err) {
        // Em alguns navegadores, notificações podem lançar erro se chamados sem interação
        console.error('Erro ao enviar notificação:', err);
      }
    }
  });
}

// Configura a troca de abas (Registro, Relatórios, Notificações)
function setupTabs() {
  const registerBtn = document.getElementById('tabRegister');
  const reportBtn = document.getElementById('tabReport');
  const notificationsBtn = document.getElementById('tabNotifications');
  const registerSection = document.getElementById('registerSection');
  const reportSection = document.getElementById('reportSection');
  const notificationSection = document.getElementById('notificationSection');
  function activate(btn) {
    // Remove classe ativa de todos
    [registerBtn, reportBtn, notificationsBtn].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  registerBtn.addEventListener('click', () => {
    activate(registerBtn);
    registerSection.classList.remove('hidden');
    reportSection.classList.add('hidden');
    notificationSection.classList.add('hidden');
  });
  reportBtn.addEventListener('click', () => {
    activate(reportBtn);
    registerSection.classList.add('hidden');
    reportSection.classList.remove('hidden');
    notificationSection.classList.add('hidden');
    // Atualiza o relatório quando a aba é aberta
    const type = document.getElementById('reportType').value;
    generateReport(type);
  });
  notificationsBtn.addEventListener('click', () => {
    activate(notificationsBtn);
    registerSection.classList.add('hidden');
    reportSection.classList.add('hidden');
    notificationSection.classList.remove('hidden');
    updateNotificationStatus();
  });
}

// Configura eventos e inicialização do aplicativo
document.addEventListener('DOMContentLoaded', () => {
  updateCurrentDateTime();
  setInterval(updateCurrentDateTime, 1000);
  // Configura abas
  setupTabs();
  // Configura toggles dos checkboxes para habilitar/ desabilitar campos
  setupToggleCheckbox('runningCheckbox', 'runningTime');
  setupToggleCheckbox('weightsCheckbox', 'weightsTime');
  setupToggleCheckbox('studyTiCheckbox', 'studyTiTime');
  setupToggleCheckbox('studyConcursoCheckbox', 'studyConcursoTime');
  setupToggleCheckbox('meditationCheckbox', 'meditationTime');
  setupHomeCheckbox();
  // Evento de envio do formulário
  document.getElementById('habitForm').addEventListener('submit', event => {
    event.preventDefault();
    const record = createRecord();
    saveRecord(record);
    document.getElementById('saveMessage').textContent = 'Registro salvo com sucesso!';
    document.getElementById('saveMessage').style.color = 'green';
    resetForm();
    // Atualiza relatório se a aba de relatórios estiver ativa
    if (!document.getElementById('reportSection').classList.contains('hidden')) {
      const type = document.getElementById('reportType').value;
      generateReport(type);
    }
  });
  // Mudança no tipo de relatório
  document.getElementById('reportType').addEventListener('change', event => {
    generateReport(event.target.value);
  });
  // Exportar PDF
  document.getElementById('exportPdf').addEventListener('click', exportReportAsPdf);
  // Ativar notificações
  document.getElementById('enableNotifications').addEventListener('click', enableNotifications);
  // Inicia verificação de notificações a cada minuto
  setInterval(checkNotifications, 60 * 1000);
});
