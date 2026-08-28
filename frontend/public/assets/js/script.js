const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileNavigation = document.getElementById("mobileNavigation");

if (mobileMenuButton && mobileNavigation) {
    mobileMenuButton.addEventListener("click", () => {
        const isOpen = mobileNavigation.classList.toggle("active");

        mobileMenuButton.setAttribute(
            "aria-expanded",
            isOpen.toString()
        );
    });

    mobileNavigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            mobileNavigation.classList.remove("active");
            mobileMenuButton.setAttribute("aria-expanded", "false");
        });
    });
}
