/** Navegação: scroll suave e destaque da seção ativa */
(function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            var targetId = this.getAttribute("href");
            if (targetId === "#") return;

            var targetElement = document.querySelector(targetId);
            if (targetElement) {
                var headerOffset = 100;
                var elementPosition = targetElement.getBoundingClientRect().top;
                var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    var sections = document.querySelectorAll("section[id]");
    var navLinks = document.querySelectorAll("#sidebar-nav .nav-link");
    var mobileNavLinks = document.querySelectorAll("#bottom-nav .nav-link-mobile");

    window.addEventListener("scroll", function () {
        var current = "";
        sections.forEach(function (section) {
            var sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 150) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(function (link) {
            link.classList.remove("nav-active");
            if (link.getAttribute("href").includes(current) && current !== "") {
                link.classList.add("nav-active");
            }
        });

        mobileNavLinks.forEach(function (link) {
            link.classList.remove("nav-active-mobile", "text-primary");
            link.classList.add("text-on-surface-variant");
            var icon = link.querySelector(".material-symbols-outlined");
            if (icon) icon.style.fontVariationSettings = "'FILL' 0";

            if (link.getAttribute("href").includes(current) && current !== "") {
                link.classList.add("nav-active-mobile", "text-primary");
                link.classList.remove("text-on-surface-variant");
                if (icon) icon.style.fontVariationSettings = "'FILL' 1";
            }
        });
    });
})();
