/*HOW TO RUN:
1. Save index.html, style.css, script.js in same folder.
2. Use VSCode Live Server OR run: npx live-server
3. Open in browser.

Example API Calls:
- Top coins:
https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&price_change_percentage=1h,24h,7d

- Historical:
https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7
*/

const API_BASE = "https://api.coingecko.com/api/v3";
let chart;

const messageEl = document.getElementById("message");
const summaryLoading = document.getElementById("summaryLoading");
const summaryContent = document.getElementById("summaryContent");

async function fetchTopCoins() {
  try {
    const res = await fetch(
      `${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&price_change_percentage=1h,24h,7d`,
    );
    if (!res.ok) throwError(res.status);
    const data = await res.json();
    renderTable(data);
  } catch (err) {
    showMessage(err.message);
  }
}

async function fetchCoinData(coin) {
  try {
    showLoading(true);
    const [currentRes, histRes] = await Promise.all([
      fetch(
        `${API_BASE}/coins/markets?vs_currency=usd&ids=${coin}&price_change_percentage=24h`,
      ),
      fetch(`${API_BASE}/coins/${coin}/market_chart?vs_currency=usd&days=7`),
    ]);

    if (!currentRes.ok) throwError(currentRes.status);
    if (!histRes.ok) throwError(histRes.status);

    const current = await currentRes.json();
    if (!current.length) throw new Error("Coin not found.");

    const history = await histRes.json();

    renderSummary(current[0]);
    renderChart(history.prices);
  } catch (err) {
    showMessage(err.message);
  } finally {
    showLoading(false);
  }
}

function renderSummary(data) {
  summaryContent.classList.remove("hidden");
  document.getElementById("coinTitle").textContent =
    `${data.name} (${data.symbol.toUpperCase()})`;
  document.getElementById("coinPrice").textContent =
    `$${data.current_price.toLocaleString()}`;
  document.getElementById("marketCap").textContent =
    `$${data.market_cap.toLocaleString()}`;
  document.getElementById("volume").textContent =
    `$${data.total_volume.toLocaleString()}`;

  const change = document.getElementById("change");
  const val = data.price_change_percentage_24h;
  change.textContent = `${val.toFixed(2)}%`;
  change.className = val >= 0 ? "success" : "danger";
}

function renderTable(coins) {
  const tbody = document.querySelector("#coinsTable tbody");
  tbody.innerHTML = "";

  coins.forEach((c) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${c.name} (${c.symbol.toUpperCase()})</td>
      <td>$${c.current_price.toLocaleString()}</td>
      <td class="${c.price_change_percentage_1h_in_currency >= 0 ? "success" : "danger"}">${c.price_change_percentage_1h_in_currency?.toFixed(2) ?? "-"}%</td>
      <td class="${c.price_change_percentage_24h >= 0 ? "success" : "danger"}">${c.price_change_percentage_24h?.toFixed(2) ?? "-"}%</td>
      <td class="${c.price_change_percentage_7d_in_currency >= 0 ? "success" : "danger"}">${c.price_change_percentage_7d_in_currency?.toFixed(2) ?? "-"}%</td>
      <td>$${c.market_cap.toLocaleString()}</td>
      <td>$${c.total_volume.toLocaleString()}</td>
      <td>${c.circulating_supply.toLocaleString()}</td>
    `;

    row.addEventListener("click", () => fetchCoinData(c.id));
    tbody.appendChild(row);
  });
}

function renderChart(prices) {
  const ctx = document.getElementById("priceChart");
  const labels = prices.map((p) => new Date(p[0]).toLocaleDateString());
  const data = prices.map((p) => p[1]);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Price (USD)",
          data,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { tooltip: { mode: "index", intersect: false } },
      scales: {
        x: { display: true },
        y: { display: true },
      },
    },
  });
}

function handleSearch() {
  const coin = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  if (!coin) return showMessage("Please enter a coin name.");
  fetchCoinData(coin);
}

function throwError(status) {
  if (status === 429)
    throw new Error("Too many requests. Please wait and retry.");
  throw new Error("Unable to fetch data. Check connection.");
}

function showMessage(msg) {
  messageEl.textContent = msg;
  messageEl.classList.remove("hidden");
}

function showLoading(state) {
  summaryLoading.classList.toggle("hidden", !state);
  summaryContent.classList.toggle("hidden", state);
}

// Event Listeners

document.getElementById("searchBtn").addEventListener("click", handleSearch);
document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

// Initial Load
fetchTopCoins();
fetchCoinData("bitcoin");

/*
IMPROVEMENTS:
- Add dark mode toggle using CSS variables
- Cache API responses in localStorage to reduce 429 errors
- Add persistent watchlist
- Add ARIA labels for accessibility
*/
