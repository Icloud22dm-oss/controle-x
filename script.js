// script.js

// State
let state = {
    user: {
        name: '',
        expectedIncome: 0
    },
    transactions: [],
    settings: {
        hasCompletedOnboarding: false
    }
};

let currentTxType = 'expense';

// DOM Elements
const els = {
    onboardingScreen: document.getElementById('onboardingScreen'),
    appContainer: document.getElementById('appContainer'),
    userNameInput: document.getElementById('userNameInput'),
    userIncomeInput: document.getElementById('userIncomeInput'),
    finishOnboardingBtn: document.getElementById('finishOnboardingBtn'),
    
    displayUserName: document.getElementById('displayUserName'),
    userAvatar: document.getElementById('userAvatar'),
    currentBalance: document.getElementById('currentBalance'),
    totalIncome: document.getElementById('totalIncome'),
    totalExpense: document.getElementById('totalExpense'),
    transactionsList: document.getElementById('transactionsList'),
    emptyStateMsg: document.getElementById('emptyStateMsg'),
    
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    addTransactionModal: document.getElementById('addTransactionModal'),
    addTransactionSheet: document.getElementById('addTransactionSheet'),
    closeAddModalBtn: document.getElementById('closeAddModalBtn'),
    
    typeExpenseBtn: document.getElementById('typeExpenseBtn'),
    typeIncomeBtn: document.getElementById('typeIncomeBtn'),
    txAmount: document.getElementById('txAmount'),
    txDescription: document.getElementById('txDescription'),
    saveTransactionBtn: document.getElementById('saveTransactionBtn'),
    
    assistantMessage: document.getElementById('assistantMessage'),
    toggleRealityBtn: document.getElementById('toggleRealityBtn'),
    realityContent: document.getElementById('realityContent'),
    dailyAvg: document.getElementById('dailyAvg'),
    monthProjection: document.getElementById('monthProjection'),

    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
    resetDataBtn: document.getElementById('resetDataBtn')
};

// Initialization
function init() {
    loadState();
    if (state.settings.hasCompletedOnboarding) {
        showApp();
        updateUI();
    } else {
        showOnboarding();
    }
    setupEventListeners();
    registerServiceWorker();
}

function loadState() {
    const saved = localStorage.getItem('controleX_state');
    if (saved) {
        state = JSON.parse(saved);
    }
}

function saveState() {
    localStorage.setItem('controleX_state', JSON.stringify(state));
}

// UI Navigation
function showOnboarding() {
    els.onboardingScreen.classList.remove('hidden');
    els.appContainer.classList.add('hidden');
}

function showApp() {
    els.onboardingScreen.classList.add('hidden');
    els.appContainer.classList.remove('hidden');
}

// Event Listeners
function setupEventListeners() {
    els.finishOnboardingBtn.addEventListener('click', handleOnboarding);
    
    els.openAddModalBtn.addEventListener('click', openAddModal);
    els.closeAddModalBtn.addEventListener('click', closeAddModal);
    
    els.typeExpenseBtn.addEventListener('click', () => setTxType('expense'));
    els.typeIncomeBtn.addEventListener('click', () => setTxType('income'));
    
    els.saveTransactionBtn.addEventListener('click', saveTransaction);
    
    els.toggleRealityBtn.addEventListener('click', () => {
        els.realityContent.classList.toggle('hidden');
    });

    els.settingsBtn.addEventListener('click', () => {
        els.settingsModal.classList.remove('hidden');
        setTimeout(() => els.settingsModal.classList.add('modal-open'), 10);
    });

    els.cancelSettingsBtn.addEventListener('click', () => {
        els.settingsModal.classList.remove('modal-open');
        setTimeout(() => els.settingsModal.classList.add('hidden'), 300);
    });

    els.resetDataBtn.addEventListener('click', () => {
        localStorage.removeItem('controleX_state');
        location.reload();
    });
}

function handleOnboarding() {
    const name = els.userNameInput.value.trim();
    const income = parseFloat(els.userIncomeInput.value);
    
    if (!name || isNaN(income) || income <= 0) {
        alert('Preencha os dados corretamente.');
        return;
    }
    
    state.user.name = name;
    state.user.expectedIncome = income;
    state.settings.hasCompletedOnboarding = true;
    
    saveState();
    showApp();
    updateUI();
}

// Modals & Forms
function openAddModal() {
    els.addTransactionModal.classList.remove('hidden');
    setTimeout(() => {
        els.addTransactionModal.classList.add('modal-open');
        els.addTransactionSheet.classList.add('sheet-open');
    }, 10);
    els.txAmount.value = '';
    els.txDescription.value = '';
    setTxType('expense');
}

function closeAddModal() {
    els.addTransactionModal.classList.remove('modal-open');
    els.addTransactionSheet.classList.remove('sheet-open');
    setTimeout(() => {
        els.addTransactionModal.classList.add('hidden');
    }, 300);
}

function setTxType(type) {
    currentTxType = type;
    if (type === 'expense') {
        els.typeExpenseBtn.className = 'flex-1 py-2 rounded-md bg-danger/20 text-danger font-medium text-sm transition-colors';
        els.typeIncomeBtn.className = 'flex-1 py-2 rounded-md text-gray-400 font-medium text-sm transition-colors';
    } else {
        els.typeIncomeBtn.className = 'flex-1 py-2 rounded-md bg-success/20 text-success font-medium text-sm transition-colors';
        els.typeExpenseBtn.className = 'flex-1 py-2 rounded-md text-gray-400 font-medium text-sm transition-colors';
    }
}

function saveTransaction() {
    const amount = parseFloat(els.txAmount.value);
    const description = els.txDescription.value.trim();
    
    if (isNaN(amount) || amount <= 0 || !description) {
        alert('Preencha o valor e a descrição.');
        return;
    }
    
    const tx = {
        id: Date.now().toString(),
        amount: amount,
        description: description,
        type: currentTxType,
        date: new Date().toISOString()
    };
    
    state.transactions.unshift(tx);
    saveState();
    closeAddModal();
    updateUI();
}

function deleteTransaction(id) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveState();
    updateUI();
}

// Logic & Calculations
function updateUI() {
    els.displayUserName.textContent = state.user.name.split(' ')[0];
    els.userAvatar.textContent = state.user.name.charAt(0).toUpperCase();
    
    let totalInc = 0;
    let totalExp = 0;
    
    els.transactionsList.innerHTML = '';
    
    if (state.transactions.length === 0) {
        els.emptyStateMsg.classList.remove('hidden');
    } else {
        els.emptyStateMsg.classList.add('hidden');
        
        state.transactions.forEach((tx, index) => {
            if (tx.type === 'income') totalInc += tx.amount;
            if (tx.type === 'expense') totalExp += tx.amount;
            
            const isExpense = tx.type === 'expense';
            const colorClass = isExpense ? 'text-danger' : 'text-success';
            const prefix = isExpense ? '-' : '+';
            const date = new Date(tx.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'});
            
            const el = document.createElement('div');
            el.className = `flex justify-between items-center bg-dark p-3 rounded-xl border border-gray-800 tx-enter`;
            el.style.animationDelay = `${index * 0.05}s`;
            
            el.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-gray-800">
                        ${isExpense ? 
                            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>' : 
                            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>'}
                    </div>
                    <div>
                        <p class="text-white font-medium text-sm">${tx.description}</p>
                        <p class="text-gray-500 text-xs">${date}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="${colorClass} font-bold">${prefix} R$ ${tx.amount.toFixed(2)}</span>
                    <button onclick="deleteTransaction('${tx.id}')" class="text-gray-600 hover:text-danger">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            els.transactionsList.appendChild(el);
        });
    }
    
    const balance = totalInc - totalExp;
    
    els.totalIncome.textContent = `R$ ${totalInc.toFixed(2)}`;
    els.totalExpense.textContent = `R$ ${totalExp.toFixed(2)}`;
    els.currentBalance.textContent = `R$ ${balance.toFixed(2)}`;
    
    updateAssistantAndReality(totalInc, totalExp, balance);
}

function updateAssistantAndReality(totalInc, totalExp, balance) {
    const expenses = state.transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) {
        els.assistantMessage.textContent = "Tudo tranquilo. Adicione suas despesas para começarmos a análise.";
        els.dailyAvg.textContent = "R$ 0,00";
        els.monthProjection.textContent = `R$ ${(state.user.expectedIncome).toFixed(2)}`;
        return;
    }

    const firstTxDate = new Date(state.transactions[state.transactions.length - 1].date);
    const now = new Date();
    const diffTime = Math.abs(now - firstTxDate);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) diffDays = 1;

    const dailyExpAvg = totalExp / diffDays;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const projectedEndBalance = balance - (dailyExpAvg * daysLeft);
    const projectedExpTotal = totalExp + (dailyExpAvg * daysLeft);

    els.dailyAvg.textContent = `R$ ${dailyExpAvg.toFixed(2)}`;
    els.monthProjection.textContent = `R$ ${projectedEndBalance.toFixed(2)}`;
    
    const monthProjectionEl = els.monthProjection;
    if (projectedEndBalance < 0) {
        monthProjectionEl.className = "text-sm font-bold text-danger";
    } else {
        monthProjectionEl.className = "text-sm font-bold text-success";
    }

    // Assistant Logic
    let msg = "";
    const ratio = totalExp / (state.user.expectedIncome || 1);
    const smallExpensesCount = expenses.filter(e => e.amount < 50).length;

    if (projectedEndBalance < 0) {
        msg = "Alerta Crítico: Se continuar nesse ritmo, você fechará o mês no vermelho. Corte gastos imediatos.";
    } else if (ratio > 0.8) {
        msg = "Atenção: Você já comprometeu mais de 80% da sua renda. Evite qualquer compra não essencial.";
    } else if (smallExpensesCount > 5) {
        msg = "Aviso: Muitas pequenas despesas detectadas. Elas parecem inofensivas, mas destroem o orçamento.";
    } else if (ratio < 0.5) {
        msg = "Excelente: Sua taxa de poupança está ótima. Considere investir o excedente.";
    } else {
        msg = "Caminho certo: Seus gastos estão controlados. Mantenha a disciplina até o fim do mês.";
    }

    els.assistantMessage.textContent = msg;
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .catch(err => console.log('SW registration failed', err));
    }
}

// Start
init();
window.deleteTransaction = deleteTransaction;