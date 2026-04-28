const year = document.querySelector("#year");
const cursorLight = document.querySelector(".cursor-light");
const emailLink = document.querySelector("[data-copy-email]");
const tiltItems = document.querySelectorAll("[data-tilt]");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

window.addEventListener("pointermove", (event) => {
  if (cursorLight) {
    cursorLight.style.setProperty("--x", `${event.clientX}px`);
    cursorLight.style.setProperty("--y", `${event.clientY}px`);
  }
});

tiltItems.forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    item.style.setProperty("--ry", `${x * 9}deg`);
    item.style.setProperty("--rx", `${y * -9}deg`);
  });

  item.addEventListener("pointerleave", () => {
    item.style.setProperty("--rx", "0deg");
    item.style.setProperty("--ry", "0deg");
  });
});

if (emailLink) {
  emailLink.addEventListener("click", async () => {
    const email = "3484768630@qq.com";

    try {
      await navigator.clipboard.writeText(email);
      emailLink.classList.add("is-copied");
      window.setTimeout(() => emailLink.classList.remove("is-copied"), 1200);
    } catch {
      emailLink.classList.remove("is-copied");
    }
  });
}
