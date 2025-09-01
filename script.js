/*
  BunnyBank JS (latest full version)
  Author: Bunny
  Handles login, user dashboard, admin dashboard, crypto, currencies, and payments.
*/

// --- In-memory demo data ---
let accounts = {
  admin: { password: "admin123", balance: { CAD: 1000, USD: 726.66 }, cryptos: {} },
  user1: { password: "user123", balance: { CAD: 500, USD: 363.33 }, cryptos: {} }
};

let cryptoPrices = {}; // e.g. { "RabbitCoin": 100 }
let currencies = { CAD: { rate: 1, wiki: "https://en.wikipedia.org/wiki/Canadian_dollar" }, USD: { rate: 0.7266, wiki: "https://en.wikipedia.org/wiki/United_States_dollar" } };
let currentUser = null;

/* ---------- Utility / Init ---------- */
function hideAllDashboards() {
  document.getElementById('userView').style.display = 'none';
  document.getElementById('adminView').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'none';
}

function showLogin() {
  document.getElementById('loginCard').style.display = 'block';
  hideAllDashboards();
  document.getElementById('welcomeUser').innerText = '';
}

function initPage() {
  showLogin();
  populateGlobalSelects();
}

window.addEventListener('load', initPage);

/* ---------- Login / Logout ---------- */
function login() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  if (!u || !p) { alert('Enter username and password'); return; }
  if (!accounts[u]) { alert('User not found'); return; }
  if (accounts[u].password !== p) { alert('Incorrect password'); return; }

  currentUser = {
    username: u,
    balance: { ...accounts[u].balance },
    cryptos: { ...accounts[u].cryptos },
    isAdmin: (u === 'admin')
  };

  document.getElementById('loginCard').style.display = 'none';
  document.getElementById('userView').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'block';
  if (currentUser.isAdmin) document.getElementById('adminView').style.display = 'block';

  document.getElementById('welcomeUser').innerText = currentUser.username;

  renderBalances();
  renderCrypto();
  renderCurrencies();
  populateGlobalSelects();
  if (currentUser.isAdmin) renderUserTable();
}

function logout() {
  if (currentUser) accounts[currentUser.username] = {
    password: accounts[currentUser.username].password,
    balance: currentUser.balance,
    cryptos: currentUser.cryptos
  };
  currentUser = null;
  showLogin();
}

/* ---------- Rendering ---------- */
function renderBalances() {
  if (!currentUser) return;
  const container = document.getElementById('balances');
  let html = '';
  for (const cur in currentUser.balance) {
    html += `<strong>${cur}</strong>: ${Number(currentUser.balance[cur]).toFixed(2)} 
      <a href="${currencies[cur]?.wiki ?? '#'}" target="_blank" style="font-size:14px;color:#2b7cff;text-decoration:underline;">Wiki</a><br>`;
  }
  container.innerHTML = html;
}

function renderCrypto() {
  if (!currentUser) return;
  const container = document.getElementById('cryptoBalances');
  const cryptos = currentUser.cryptos || {};
  if (Object.keys(cryptos).length === 0) {
    container.innerHTML = '<span class="muted small">You do not own any crypto yet.</span>';
    return;
  }
  let html = '';
  for (const name in cryptos) {
    const qty = cryptos[name];
    const price = cryptoPrices[name] ?? 100;
    html += `<div><strong>${name}</strong>: ${qty} — price ${price} CAD each</div>`;
  }
  container.innerHTML = html;
}

function renderCurrencies() {
  const container = document.getElementById('userCurrencies');
  if (!container) return;
  container.innerHTML = '';
  for (const cur in currencies) {
    container.innerHTML += `
      <div>
        <strong>${cur}</strong> (${currencies[cur].short ?? cur})
        <a href="${currencies[cur].wiki}" target="_blank" style="font-size:12px;color:#2b7cff;">Wiki</a>
      </div>`;
  }
}

/* ---------- Dropdown population ---------- */
function populateGlobalSelects() {
  const users = Object.keys(accounts);
  const globalCryptos = new Set();
  Object.values(accounts).forEach(u => {
    if (u.cryptos) Object.keys(u.cryptos).forEach(c => globalCryptos.add(c));
  });

  const paySelect = document.getElementById('payToUser');
  paySelect.innerHTML = '';
  users.forEach(u => { if (!currentUser || u !== currentUser.username) paySelect.innerHTML += `<option value="${u}">${u}</option>`; });

  const tradeSelect = document.getElementById('tradeCryptoName');
  tradeSelect.innerHTML = '';
  if (globalCryptos.size === 0) tradeSelect.innerHTML = '<option value="">-- no cryptos available --</option>';
  else globalCryptos.forEach(c => tradeSelect.innerHTML += `<option value="${c}">${c}</option>`);

  const priceSelect = document.getElementById('cryptoPriceName');
  if (priceSelect) {
    priceSelect.innerHTML = '';
    if (globalCryptos.size === 0) priceSelect.innerHTML = '<option value="">-- no cryptos --</option>';
    else globalCryptos.forEach(c => priceSelect.innerHTML += `<option value="${c}">${c}</option>`);
  }

  // Update trade price note
  updateTradePriceNote();

  // Populate currency dropdowns
  const payCurSelect = document.getElementById('payCurrency');
  if (payCurSelect) {
    payCurSelect.innerHTML = '';
    Object.keys(currencies).forEach(c => payCurSelect.innerHTML += `<option value="${c}">${c}</option>`);
  }

  const adjCurSelect = document.getElementById('adjCurrencyBalance');
  if (adjCurSelect) {
    adjCurSelect.innerHTML = '';
    Object.keys(currencies).forEach(c => adjCurSelect.innerHTML += `<option value="${c}">${c}</option>`);
  }
}

/* ---------- Crypto actions ---------- */
function createCrypto() {
  if (!currentUser) { alert('Login first'); return; }
  const name = document.getElementById('newCryptoName').value.trim();
  if (!name) { alert('Enter a name for the crypto'); return; }

  let cost = 100;
  if (!currentUser.isAdmin) {
    if (currentUser.balance.CAD < cost) { alert('Not enough CAD to create crypto (cost 100 CAD)'); return; }
    currentUser.balance.CAD -= cost;
  }

  if (!currentUser.cryptos) currentUser.cryptos = {};
  if (currentUser.cryptos[name] === undefined) currentUser.cryptos[name] = 0;

  Object.keys(accounts).forEach(u => {
    if (!accounts[u].cryptos) accounts[u].cryptos = {};
    if (accounts[u].cryptos[name] === undefined) accounts[u].cryptos[name] = 0;
  });

  if (!cryptoPrices[name]) cryptoPrices[name] = 100;

  accounts[currentUser.username] = { password: accounts[currentUser.username].password, balance: currentUser.balance, cryptos: currentUser.cryptos };

  renderBalances(); renderCrypto(); populateGlobalSelects();
  alert(`Created crypto "${name}". Price default ${cryptoPrices[name]} CAD`);
}

async function buyCrypto() {
  if (!currentUser) { alert('Login first'); return; }
  const name = document.getElementById('tradeCryptoName').value;
  const amt = parseFloat(document.getElementById('tradeAmount').value);
  if (!name || !amt || amt <= 0) { alert('Enter valid crypto and amount'); return; }
  const price = cryptoPrices[name] ?? 100;
  const cost = price * amt;
  if (currentUser.balance.CAD < cost) { alert('Not enough CAD'); return; }

  currentUser.balance.CAD -= cost;
  currentUser.cryptos[name] = (currentUser.cryptos[name] || 0) + amt;
  accounts[currentUser.username] = { password: accounts[currentUser.username].password, balance: currentUser.balance, cryptos: currentUser.cryptos };

  renderBalances(); renderCrypto(); populateGlobalSelects();
  alert(`Bought ${amt} ${name} for ${cost.toFixed(2)} CAD`);
}

async function sellCrypto() {
  if (!currentUser) { alert('Login first'); return; }
  const name = document.getElementById('tradeCryptoName').value;
  const amt = parseFloat(document.getElementById('tradeAmount').value);
  if (!name || !amt || amt <= 0 || (currentUser.cryptos[name] || 0) < amt) { alert('Invalid amount'); return; }
  const price = cryptoPrices[name] ?? 100;
  const gain = price * amt;

  currentUser.cryptos[name] -= amt;
  currentUser.balance.CAD += gain;
  accounts[currentUser.username] = { password: accounts[currentUser.username].password, balance: currentUser.balance, cryptos: currentUser.cryptos };

  renderBalances(); renderCrypto(); populateGlobalSelects();
  alert(`Sold ${amt} ${name} for ${gain.toFixed(2)} CAD`);
}

/* ---------- Payments ---------- */
async function sendPayment() {
  if (!currentUser) { alert('Login first'); return; }
  const recipient = document.getElementById('payToUser').value;
  const amount = parseFloat(document.getElementById('payAmount').value);
  const currency = document.getElementById('payCurrency').value;
  if (!recipient || !accounts[recipient] || !amount || amount <= 0 || (currentUser.balance[currency] || 0) < amount) { alert('Invalid payment'); return; }

  currentUser.balance[currency] -= amount;
  accounts[recipient].balance[currency] = (accounts[recipient].balance[currency] || 0) + amount;
  accounts[currentUser.username] = { password: accounts[currentUser.username].password, balance: currentUser.balance, cryptos: currentUser.cryptos };

  renderBalances();
  if (currentUser.isAdmin) renderUserTable();
  populateGlobalSelects();
  alert(`Sent ${amount.toFixed(2)} ${currency} to ${recipient}`);
}

/* ---------- Admin functions ---------- */
function createAccount() {
  if (!currentUser?.isAdmin) { alert('Admin only'); return; }
  const u = document.getElementById('newUser').value.trim();
  const p = document.getElementById('newPass').value.trim();
  if (!u || !p) { alert('Enter username and password'); return; }
  if (accounts[u]) { alert('User already exists'); return; }
  accounts[u] = { password: p, balance: {}, cryptos: {} };
  Object.keys(currencies).forEach(c => accounts[u].balance[c] = 0);
  Object.keys(cryptoPrices).forEach(c => accounts[u].cryptos[c] = 0);
  renderUserTable(); populateGlobalSelects();
  alert(`Created ${u}`);
}

function setRate() {
  if (!currentUser?.isAdmin) { alert('Admin only'); return; }
  const sym = document.getElementById('rateSym').value.trim();
  const val = parseFloat(document.getElementById('rateVal').value);
  if (!sym || isNaN(val)) { alert('Enter valid currency and rate'); return; }
  if (!currencies[sym]) currencies[sym] = { rate: val, wiki: '#' };
  else currencies[sym].rate = val;
  alert(`Set rate: 1 CAD = ${val} ${sym}`);
}

function setBalance() {
  if (!currentUser?.isAdmin) { alert('Admin only'); return; }
  const u = document.getElementById('adjUserBalance').value;
  const cur = document.getElementById('adjCurrencyBalance').value;
  const amt = parseFloat(document.getElementById('adjAmountBalance').value);
  if (!u || !cur || isNaN(amt)) { alert('Enter all fields'); return; }
  if (!accounts[u]) { alert('User not found'); return; }
  accounts[u].balance[cur] = amt;
  if (currentUser.username === u) currentUser.balance[cur] = amt;
  renderBalances(); renderUserTable();
  alert(`Updated ${u} ${cur} = ${amt}`);
}

function setCryptoPrice() {
  if (!currentUser?.isAdmin) { alert('Admin only'); return; }
  const name = document.getElementById('cryptoPriceName').value;
  const price = parseFloat(document.getElementById('cryptoPriceValue').value);
  if (!name || isNaN(price)) { alert('Enter crypto and price'); return; }
  cryptoPrices[name] = price;
  updateTradePriceNote();
  alert(`Set ${name} price to ${price} CAD`);
}

function addCurrency() {
  if (!currentUser?.isAdmin) { alert('Admin only'); return; }
  const name = document.getElementById('newCurrencyName').value.trim();
  const short = document.getElementById('newCurrencyShort').value.trim();
  const rate = parseFloat(document.getElementById('newCurrencyRate').value);
  const wiki = document.getElementById('newCurrencyWiki').value.trim() || '#';
  if (!name || !short || isNaN(rate)) { alert('Enter all fields'); return; }

  currencies[name] = { rate: rate, short: short, wiki: wiki };

  // Update balances for all users
  Object.keys(accounts).forEach(u => {
    if (!accounts[u].balance[name]) accounts[u].balance[name] = 0;
  });

  renderBalances(); renderCurrencies(); populateGlobalSelects();
  alert(`Added currency: ${name} (${short})`);
}

function editCurrency() {
  if (!currentUser?.isAdmin) { alert('Admin only'); return; }
  const name = document.getElementById('editCurrencyName').value.trim();
  const short = document.getElementById('editCurrencyShort').value.trim();
  const rate = parseFloat(document.getElementById('editCurrencyRate').value);
  const wiki = document.getElementById('editCurrencyWiki').value.trim() || '#';
  if (!name || !currencies[name]) { alert('Currency not found'); return; }
  if (!short || isNaN(rate)) { alert('Enter valid short code and rate'); return; }

  currencies[name].short = short;
  currencies[name].rate = rate;
  currencies[name].wiki = wiki;

  renderBalances(); renderCurrencies(); populateGlobalSelects();
  alert(`Updated currency: ${name}`);
}

/* ---------- Admin table ---------- */
function renderUserTable() {
  if (!currentUser?.isAdmin) return;
  const head = document.getElementById('userTableHead');
  const body = document.getElementById('userTableBody');
  head.innerHTML = '';
  body.innerHTML = '';

  const currencySet = new Set();
  Object.values(accounts).forEach(a => Object.keys(a.balance || {}).forEach(c => currencySet.add(c)));
  const currenciesArr = Array.from(currencySet);
  head.innerHTML = '<th>User</th>' + currenciesArr.map(c => `<th>${c}</th>`).join('') + '<th>Cryptos</th>';

  for (const u of Object.keys(accounts)) {
    const rowVals = currenciesArr.map(c => `<td>${(accounts[u].balance[c] ?? 0).toFixed ? (accounts[u].balance[c] ?? 0).toFixed(2) : (accounts[u].balance[c] ?? 0)}</td>`).join('');
    const cryptoSummary = Object.entries(accounts[u].cryptos || {}).map(([k,v]) => `${k}: ${v}`).join(', ') || '-';
    body.innerHTML += `<tr><td>${u}</td>${rowVals}<td style="text-align:left;padding-left:10px">${cryptoSummary}</td></tr>`;
  }
}

/* ---------- Helpers ---------- */
function updateTradePriceNote() {
  const sel = document.getElementById('tradeCryptoName');
  const note = document.getElementById('tradePriceNote');
  const name = sel ? sel.value : null;
  if (!name) { note.innerText = 'Price: (set by admin)'; return; }
  const p = cryptoPrices[name] ?? 100;
  note.innerText = `Price: ${p} CAD each`;
}

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'tradeCryptoName') updateTradePriceNote();
});

populateGlobalSelects();
