const yearElement = document.querySelector("#year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

const currentPage = document.body.dataset.page;
const navLinks = document.querySelectorAll(".header-nav a");

for (const link of navLinks) {
    const linkPage = link.getAttribute("href").replace(".html", "");

    if (linkPage === currentPage) {
        link.classList.add("is-active");
    }
}
