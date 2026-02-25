/*
Example API Calls:
- Top coins:
https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&price_change_percentage=1h,24h,7d

- Historical:
https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7
*/

const API_BASE = "https://api.coingecko.com/api/v3";
let chart;
let currentPage = 1;
const coinsPerPage = 20;
const messageEl = document.getElementById("message");
const summaryLoading = document.getElementById("summaryLoading");
const summaryContent = document.getElementById("summaryContent");

async function fetchMarketData(page = 1) {
  try {
    showLoader();

    const response = await fetch(
      `${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${coinsPerPage}&page=${page}&sparkline=false&price_change_percentage=1h,24h,7d`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch market data");
    }

    const data = await response.json();
    renderTable(data);
    renderPagination(50); // update pagination here
    currentPage = page;

    hideLoader();
  } catch (error) {
    throwError(error.message);
    hideLoader();
  }
}

function renderPagination(totalPages = 50) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const maxVisible = 5; // how many pages to show around current
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  // Always show first page
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) {
      addEllipsis();
    }
  }

  // Show range around current page
  for (let i = startPage; i <= endPage; i++) {
    addPageButton(i);
  }

  // Always show last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      addEllipsis();
    }
    addPageButton(totalPages);
  }

  function addPageButton(page) {
    const btn = document.createElement("button");
    btn.innerText = page;
    if (page === currentPage) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => {
      fetchMarketData(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    pagination.appendChild(btn);
  }

  function addEllipsis() {
    const span = document.createElement("span");
    span.innerText = "...";
    span.classList.add("ellipsis");
    pagination.appendChild(span);
  }
}

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
async function fetchCoinData(coin) {
  try {
    showLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const [currentRes, histRes] = await Promise.all([
      fetch(
        `${API_BASE}/coins/markets?vs_currency=usd&ids=${coin}&price_change_percentage=24h`,
      ),
      fetch(`${API_BASE}/coins/${coin}/market_chart?vs_currency=usd&days=7`),
    ]);
    if (currentRes.status === 429 || histRes.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment.");
    }

    const current = await currentRes.json();
    const history = await histRes.json();

    if (!current.length) throw new Error("Coin not found.");

    renderSummary(current[0]);
    renderChart(history.prices);
  } catch (err) {
    showMessage(err.message);
  } finally {
    showLoading(false);
  }
}

// Update your Initial Load to be sequential
async function init() {
  await fetchTopCoins();
  // Wait 1 second before fetching the second batch of data
  setTimeout(() => {
    fetchCoinData("bitcoin");
  }, 1000);
}

init();
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

async function handleSearch() {
  const coin = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  if (!coin) return showMessage("Please enter a coin name.");

  try {
    const res = await fetch(`${API_BASE}/search?query=${coin}`);
    const data = await res.json();
    if (!data.coins.length) return showMessage("Coin not found.");

    const coinId = data.coins[0].id; // use the first match
    fetchCoinData(coinId);
  } catch (err) {
    showMessage("Search failed: " + err.message);
  }
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
init();
