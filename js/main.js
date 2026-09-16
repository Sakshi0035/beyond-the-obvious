const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

if (menuToggle && sidebar) {

    menuToggle.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });


    document.querySelectorAll(".sidebar a").forEach(link => {

        link.addEventListener("click", () => {

            sidebar.classList.remove("open");

        });

    });

}
