// =================hamburger menu============================
const hamburgerBtn = document.getElementById("hamburgerBtn");
  const hamburger = document.getElementById("hamburger");
  const overlay = document.getElementById("overlay");

  hamburgerBtn.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    overlay.classList.toggle("active");
    
    // Mencegah scrolling ketika menu terbuka
    if (overlay.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  });
  
  // Menutup menu ketika mengklik link di overlay
  const overlayLinks = document.querySelectorAll(".overlay nav ul li a");
  overlayLinks.forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      overlay.classList.remove("active");
      document.body.style.overflow = "auto";
    });
  });
  
  
  //=======================herro section=============================
  
  const words = ["Terbesar", "Terverifikasi", "Terdaftar"];
    const colors = ["blue", "#f59e0b", "#10b981"];
    const ticker = document.getElementById('ticker');
    const tickerWrap = document.getElementById('tickerWrap');
    let current = 0;
    const speed = 2000;

    function buildTicker(){
      ticker.innerHTML = '';
      words.forEach((txt, i) => {
        const el = document.createElement('div');
        el.className = 'item';
        el.textContent = txt;
        el.style.color = colors[i % colors.length];
        ticker.appendChild(el);
      });
    }

    function next(){
      const itemHeight = ticker.querySelector('.item').getBoundingClientRect().height;
      current = (current + 1) % words.length;
      ticker.style.transform = `translateY(${-current * itemHeight}px)`;
    }

    buildTicker();
    setInterval(next, speed);

    window.addEventListener('resize', ()=>{
      const item = ticker.querySelector('.item');
      if(item){
        tickerWrap.style.setProperty('--h', item.getBoundingClientRect().height + 'px');
      }
    });


  
  // ========================Variabel global untuk menyimpan data cryptocurrency=============================
  let cryptoData = [];
  let priceChart = null;
  let currentCoinId = null;
  let updateInterval = null;

  // Fungsi untuk memuat data cryptocurrency
  function loadCryptoData() {
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1";

    fetch(url)
    .then(response => response.json())
    .then(data => {
      cryptoData = data;
      updateCryptoTable(data);
    })
    .catch(err => console.error('Error loading crypto data:', err));
  }

  // ================Fungsi untuk memperbarui tabel cryptocurrency==========================
  function updateCryptoTable(data) {
    const tbody = document.querySelector("#crypto-table2 tbody");
    tbody.innerHTML = '';
    
    data.forEach(coin => {
      const row = document.createElement("tr");
      const priceChangeClass = coin.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down';
      
      row.innerHTML = `
        <td><img src="${coin.image}" alt="${coin.name}"> ${coin.name}</td>
        <td>${coin.symbol.toUpperCase()}</td>
        <td class="price-cell">$${coin.current_price.toLocaleString()}</td>
        <td class="${priceChangeClass}">${coin.price_change_percentage_24h.toFixed(2)}%</td>
      `;
      row.setAttribute('data-id', coin.id);
      row.addEventListener("click", () => showDetails(coin));
      tbody.appendChild(row);
    });
  }

  // Fungsi untuk memperbarui harga secara real-time
  function updatePricesRealTime() {
    // Tandai semua baris sebagai sedang diperbarui
    const rows = document.querySelectorAll("#crypto-table2 tbody tr");
    rows.forEach(row => {
      row.classList.add('updating');
    });

    // Ambil data terbaru
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1")
      .then(response => response.json())
      .then(data => {
        data.forEach(coin => {
          const row = document.querySelector(`tr[data-id="${coin.id}"]`);
          if (row) {
            const priceCell = row.querySelector('.price-cell');
            const changeCell = row.querySelector('td:nth-child(4)');
            
            // Periksa apakah harga berubah
            const oldPrice = parseFloat(priceCell.textContent.replace('$', '').replace(',', ''));
            const newPrice = coin.current_price;
            
            if (oldPrice !== newPrice) {
              // Update harga
              priceCell.textContent = `$${newPrice.toLocaleString()}`;
              
              // Update perubahan persentase
              const priceChangeClass = coin.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down';
              changeCell.textContent = `${coin.price_change_percentage_24h.toFixed(2)}%`;
              changeCell.className = priceChangeClass;
              
              // Tandai baris ini sedang diperbarui
              row.classList.add('updating');
              
              // Hapus kelas updating setelah 1 detik
              setTimeout(() => {
                row.classList.remove('updating');
              }, 1000);
            } else {
              // Hapus kelas updating jika harga tidak berubah
              row.classList.remove('updating');
            }
          }
        });
        
        // Perbarui data global
        cryptoData = data;
      })
      .catch(err => console.error('Error updating prices:', err));
  }

  // ================Fungsi untuk menampilkan detail cryptocurrency=============================
  function showDetails(coin) {
    currentCoinId = coin.id;
    
    const details = `
      <div class="modal-header">
        <img src="${coin.image}" alt="${coin.name}" style="width:32px;height:32px;margin-right:6px;">
        ${coin.name} (${coin.symbol.toUpperCase()})
      </div>
      <p><strong>Harga:</strong> $${coin.current_price.toLocaleString()}</p>
      <p><strong>Market Cap:</strong> $${coin.market_cap.toLocaleString()}</p>
      <p><strong>24h Volume:</strong> $${coin.total_volume.toLocaleString()}</p>
      <p><strong>Perubahan 24h:</strong> <span style="color:${coin.price_change_percentage_24h >= 0 ? 'green' : 'red'}">${coin.price_change_percentage_24h.toFixed(2)}%</span></p>
    `;
    document.getElementById("crypto-details").innerHTML = details;
    document.getElementById("crypto-modal").style.display = "flex";


    
    //============= Load chart data untuk 1 hari pertama kali=================
    loadChartData(1);
  }

  // Fungsi untuk memuat data chart
  function loadChartData(days) {
    if (!currentCoinId) return;
    
    // Tampilkan loading state
    const chartCanvas = document.getElementById('price-chart');
    const ctx = chartCanvas.getContext('2d');
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ccc";
    ctx.textAlign = "center";
    ctx.fillText("Memuat data chart...", chartCanvas.width / 2, chartCanvas.height / 2);
    
    // Ambil data historis dari CoinGecko
    fetch(`https://api.coingecko.com/api/v3/coins/${currentCoinId}/market_chart?vs_currency=usd&days=${days}`)
      .then(response => response.json())
      .then(data => {
        const prices = data.prices;
        const labels = [];
        const chartData = [];
        
        // Format data untuk chart
        prices.forEach(price => {
          const date = new Date(price[0]);
          let label;
          
          if (days === 1) {
            // Format jam untuk data 24 jam
            label = date.getHours() + ':00';
          } else if (days <= 30) {
            // Format tanggal untuk data 7-30 hari
            label = date.getDate() + '/' + (date.getMonth() + 1);
          } else {
            // Format bulan/tahun untuk data tahunan
            label = (date.getMonth() + 1) + '/' + date.getFullYear();
          }
          
          labels.push(label);
          chartData.push(price[1]);
        });
        
        // Hancurkan chart sebelumnya jika ada
        if (priceChart) {
          priceChart.destroy();
        }
        
        // Buat chart baru
        const chartColor = chartData[0] <= chartData[chartData.length - 1] ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)';
        
        priceChart = new Chart(chartCanvas, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Harga (USD)',
              data: chartData,
              borderColor: chartColor,
              backgroundColor: chartColor,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              fill: true,
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: false,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  maxTicksLimit: 10
                }
              }
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: function(context) {
                    return '$' + context.parsed.y.toFixed(2);
                  }
                }
              },
              legend: {
                display: false
              }
            }
          }
        });
      })
      .catch(err => {
        console.error('Error loading chart data:', err);
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        ctx.fillText("Gagal memuat data chart", chartCanvas.width / 2, chartCanvas.height / 2);
      });
  }

  // Event listener untuk tabs periode chart
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      // Hapus kelas active dari semua tabs
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      
      // Tambahkan kelas active ke tab yang diklik
      this.classList.add('active');
      
      // Muat data chart sesuai periode yang dipilih
      const days = parseInt(this.getAttribute('data-days'));
      loadChartData(days);
    });
  });

  //====================== Tutup modal========================
  document.querySelector(".close").onclick = () => {
    document.getElementById("crypto-modal").style.display = "none";
    if (priceChart) {
      priceChart.destroy();
      priceChart = null;
    }
  };

  window.onclick = (event) => {
    if (event.target == document.getElementById("crypto-modal")) {
      document.getElementById("crypto-modal").style.display = "none";
      if (priceChart) {
        priceChart.destroy();
        priceChart = null;
      }
    }
  };

  loadCryptoData();
  
  // Mulai pembaruan real-time setiap 10 detik
  updateInterval = setInterval(updatePricesRealTime, 10000);
  
  //=========================animasi hero grid==============================
  const service = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    } else {
      entry.target.classList.remove('show');
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.service-item').forEach(wrapper => {
  service.observe(wrapper);
});

const hero = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    } else {
      entry.target.classList.remove('show');
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.hero-item').forEach(wrapper => {
  hero.observe(wrapper);
});

const galery = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    } else {
      entry.target.classList.remove('show');
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.gallery-item').forEach(wrapper => {
  galery.observe(wrapper);
});


// ================slide========================================
document.addEventListener('DOMContentLoaded', function() {
      const slidesContainer = document.querySelector('.slides');
      const slides = document.querySelectorAll('.slide');
      const prevBtn = document.querySelector('.prev');
      const nextBtn = document.querySelector('.next');
      const dotsContainer = document.querySelector('.dots');
      
      let currentIndex = 0;
      let slidesPerView = getSlidesPerView();
      
      // Setup dots
      function setupDots() {
        dotsContainer.innerHTML = '';
        const dotCount = Math.ceil(slides.length / slidesPerView);
        
        for (let i = 0; i < dotCount; i++) {
          const dot = document.createElement('button');
          if (i === 0) dot.classList.add('active');
          dot.addEventListener('click', () => {
            currentIndex = i;
            updateSlider();
          });
          dotsContainer.appendChild(dot);
        }
      }
      
      // Get slides per view based on window width
      function getSlidesPerView() {
        if (window.innerWidth >= 1024) return 3;
        if (window.innerWidth >= 681) return 2;
        if (window.innerWidth <= 480) return 1;
        return 2; // default untuk mobile
      }
      
      // Update slider position
      function updateSlider() {
        slidesPerView = getSlidesPerView();
        const slideWidth = slides[0].getBoundingClientRect().width + 12; // termasuk gap
        const newPosition = -currentIndex * slideWidth * slidesPerView;
        slidesContainer.style.transform = `translateX(${newPosition}px)`;
        
        // Update active dot
        document.querySelectorAll('.dots button').forEach((dot, index) => {
          dot.classList.toggle('active', index === currentIndex);
        });
      }
      
      // Next slide
      nextBtn.addEventListener('click', () => {
        slidesPerView = getSlidesPerView();
        const maxIndex = Math.ceil(slides.length / slidesPerView) - 1;
        if (currentIndex < maxIndex) {
          currentIndex++;
          updateSlider();
        }
      });
      
      // Previous slide
      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          updateSlider();
        }
      });
      
      // Handle window resize
      window.addEventListener('resize', () => {
        const oldSlidesPerView = slidesPerView;
        slidesPerView = getSlidesPerView();
        
        // Reset index jika perlu
        const maxIndex = Math.ceil(slides.length / slidesPerView) - 1;
        if (currentIndex > maxIndex) {
          currentIndex = maxIndex;
        }
        
        // Setup dots hanya jika slidesPerView berubah
        if (oldSlidesPerView !== slidesPerView) {
          setupDots();
        }
        
        updateSlider();
      });
      
      // Initialize slider
      setupDots();
      updateSlider();
      
      // Touch swipe support
      let startX = 0;
      let isDragging = false;
      
      slidesContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      });
      
      slidesContainer.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const diff = e.changedTouches[0].clientX - startX;
        
        if (diff > 50) {
          // Swipe right - go to previous slide
          if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
          }
        } else if (diff < -50) {
          // Swipe left - go to next slide
          slidesPerView = getSlidesPerView();
          const maxIndex = Math.ceil(slides.length / slidesPerView) - 1;
          if (currentIndex < maxIndex) {
            currentIndex++;
            updateSlider();
          }
        }
      });
    });

// navigadi bottom 
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
      item.addEventListener("mouseenter", () => {
        navItems.forEach(i => i.classList.remove("hovering", "active"));
        item.classList.add("hovering");
      });

      item.addEventListener("mouseleave", () => {
        navItems.forEach(i => i.classList.remove("hovering"));
        document.querySelector(".nav-item.home").classList.add("active");
      });
    });

    // Tambahkan kelas pembeda agar tahu mana home
    document.querySelector(".nav-item").classList.add("home");


// ========== warning sistem ==========
(function(){
  const panel = document.getElementById('myWarning');
  const closeBtn = panel.querySelector('.warning-close');

  function showWarning() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('show'));
  }
  function hideWarning() {
    panel.classList.remove('show');
    panel.addEventListener('transitionend', function h(){
      panel.hidden = true;
      panel.removeEventListener('transitionend', h);
    });
  }

  closeBtn.addEventListener('click', hideWarning);

  // tampil otomatis setelah halaman load
  window.addEventListener('load', showWarning);
})();
