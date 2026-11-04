// 手機版選單開關
const btn = document.querySelector(".nav-toggle");
const menu = document.getElementById("menu");
if (btn && menu) {
  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  menu.addEventListener("click", (e) => { if (e.target.tagName === "A") menu.classList.remove("open"); });
}
