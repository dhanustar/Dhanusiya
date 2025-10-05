// Default Stocks
const stocks = ["AAPL", "GOOGL", "TSLA", "MSFT", "INFY"];
const stockHistory = {};  // store last 5 prices per stock
const stockCharts = {};   // store Chart.js instances

// API Key & URL
const API_KEY = "3923e106cf37455b8cbbada52d54ec73";  
const BASE_URL = "https://api.twelvedata.com/price?symbol=";

// Loader functions
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}
function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// Fetch Stock Price
async function fetchStockPrice(symbol) {
  try {
    const response = await fetch(`${BASE_URL}${symbol}&apikey=${API_KEY}`);
    const data = await response.json();
    if (!data.price) return "N/A";

    const price = parseFloat(data.price).toFixed(2);
    if (!stockHistory[symbol]) stockHistory[symbol] = [];
    stockHistory[symbol].push(price);
    if (stockHistory[symbol].length > 5) stockHistory[symbol].shift();
    return price;
  } catch (error) {
    console.error("Error fetching stock:", error);
    return "N/A";
  }
}

// Format time
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString();
}

// Update Ticker & Dashboard
async function updateStocks() {
  showLoader();
  const tickerList = document.getElementById("ticker-list");
  tickerList.innerHTML = "";

  for (let symbol of stocks) {
    const price = await fetchStockPrice(symbol);
    const change = (Math.random() * 2 - 1).toFixed(2); // dummy % change
    const trendClass = change >= 0 ? "up" : "down";
    const updatedTime = getCurrentTime();

    // Ticker
    const li = document.createElement("li");
    li.innerHTML = `${symbol}: <span class="${trendClass}">${price} (${change}%)</span>`;
    tickerList.appendChild(li);

    // Dashboard Card
    let card = document.getElementById(`card-${symbol}`);
    if (!card) {
      card = document.createElement("div");
      card.classList.add("stock-card");
      card.id = `card-${symbol}`;
      card.innerHTML = `
        <h3>${symbol} <span class="remove-stock" onclick="removeStock('${symbol}')">❌</span></h3>
        <p id="price-${symbol}" class="${trendClass}">${price} USD</p>
        <p id="change-${symbol}" class="${trendClass}">${change}%</p>
        <canvas id="chart-${symbol}" width="180" height="80"></canvas>
        <p id="updated-${symbol}" class="updated-text">Last Updated: ${updatedTime}</p>
      `;
      document.getElementById("stock-dashboard").appendChild(card);
    } else {
      document.getElementById(`price-${symbol}`).textContent = `${price} USD`;
      document.getElementById(`change-${symbol}`).textContent = `${change}%`;
      document.getElementById(`price-${symbol}`).className = trendClass;
      document.getElementById(`change-${symbol}`).className = trendClass;
      document.getElementById(`updated-${symbol}`).textContent = `Last Updated: ${updatedTime}`;
    }

    // Mini Chart
    const ctx = document.getElementById(`chart-${symbol}`).getContext('2d');
    if (stockCharts[symbol]) {
      stockCharts[symbol].data.labels = stockHistory[symbol].map((_, i) => i + 1);
      stockCharts[symbol].data.datasets[0].data = stockHistory[symbol];
      stockCharts[symbol].data.datasets[0].borderColor = trendClass === "up" ? "green" : "red";
      stockCharts[symbol].update();
    } else {
      stockCharts[symbol] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: stockHistory[symbol].map((_, i) => i + 1),
          datasets: [{
            label: symbol,
            data: stockHistory[symbol],
            borderColor: trendClass === "up" ? "green" : "red",
            borderWidth: 2,
            fill: false,
            tension: 0.3
          }]
        },
        options: {
          responsive: false,
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: true } }
        }
      });
    }
  }
  hideLoader();
}

// Add Stock
function addStock() {
  const input = document.getElementById("stock-input");
  const symbol = input.value.trim().toUpperCase();
  if (symbol && !stocks.includes(symbol)) {
    stocks.push(symbol);
    updateStocks();
  }
  input.value = "";
}

// Remove Stock
function removeStock(symbol) {
  const index = stocks.indexOf(symbol);
  if (index > -1) {
    stocks.splice(index, 1);
    // remove chart and card
    const card = document.getElementById(`card-${symbol}`);
    if (card) card.remove();
    if (stockCharts[symbol]) {
      stockCharts[symbol].destroy();
      delete stockCharts[symbol];
    }
    delete stockHistory[symbol];
  }
}

// Dark Mode Toggle
document.getElementById("dark-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Initial Load & Auto Update
updateStocks();
setInterval(updateStocks, 60000);
