// Saat halaman dimuat, cek localStorage
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// Fungsi untuk toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
}

// Kalau ada tombol dengan id="toggle-dark", pasang event
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toggle-dark");
  if (btn) {
    btn.addEventListener("click", toggleDarkMode);
  }
});


