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


/* =========================================
   AUTOMATIC BLOG POST LOADER
========================================= */

const postsContainer = document.getElementById("posts-container");

async function loadPosts() {

    if (!postsContainer) return;

    try {

        const response = await fetch(
            "https://api.github.com/repos/Sakshi0035/beyond-the-obvious/contents/posts"
        );

        if (!response.ok) {
            throw new Error("Could not load posts folder.");
        }

        const files = await response.json();

        const postFiles = files.filter(file =>
            file.type === "file" &&
            file.name.toLowerCase().endsWith(".html")
        );

        postsContainer.innerHTML = "";

        for (const file of postFiles) {

            try {

                const postResponse = await fetch(file.download_url);

                if (!postResponse.ok) continue;

                const html = await postResponse.text();

                const parser = new DOMParser();

                const doc = parser.parseFromString(
                    html,
                    "text/html"
                );


                /* TITLE */

                const titleElement =
                    doc.querySelector(".post-header h1") ||
                    doc.querySelector(".blog-post h1") ||
                    doc.querySelector("article h1") ||
                    doc.querySelector("h1") ||
                    doc.querySelector("title");


                const title =
                    titleElement?.textContent.trim() ||
                    file.name
                        .replace(".html", "")
                        .replace(/[-_]/g, " ");


                /* DESCRIPTION */

                const descriptionElement =
                    doc.querySelector('meta[name="description"]');

                let description =
                    descriptionElement?.getAttribute("content") || "";


                if (!description) {

                    const firstParagraph =
                        doc.querySelector(".post-content p") ||
                        doc.querySelector(".blog-post p") ||
                        doc.querySelector("article p");

                    description =
                        firstParagraph?.textContent.trim() || "";

                }


                /* CATEGORY */

                const categoryElement =
                    doc.querySelector(".post-category") ||
                    doc.querySelector(".blog-card-category");

                const category =
                    categoryElement?.textContent.trim() || "";


                /* DATE */

                const dateElement =
                    doc.querySelector(".post-meta") ||
                    doc.querySelector(".blog-card-meta");

                const date =
                    dateElement?.textContent.trim() || "";


                /* IMAGE */

                const imageElement =
                    doc.querySelector(".post-featured-image") ||
                    doc.querySelector("article img");

                let image =
                    imageElement?.getAttribute("src") || "";


                if (image) {

                    if (
                        image.startsWith("../")
                    ) {
                        image = image.replace("../", "");
                    }

                    if (
                        !image.startsWith("http") &&
                        !image.startsWith("/")
                    ) {
                        image = "posts/" + image;
                    }

                }


                /* CARD */

                const card =
                    document.createElement("article");

                card.className = "blog-card";


                const link =
                    document.createElement("a");

                link.href =
                    "posts/" +
                    encodeURIComponent(file.name);


                /* IMAGE */

                if (image) {

                    const img =
                        document.createElement("img");

                    img.className =
                        "blog-card-image";

                    img.src = image;

                    img.alt = title;

                    link.appendChild(img);

                }


                /* CONTENT */

                const content =
                    document.createElement("div");

                content.className =
                    "blog-card-content";


                if (category) {

                    const categoryElement =
                        document.createElement("p");

                    categoryElement.className =
                        "blog-card-category";

                    categoryElement.textContent =
                        category;

                    content.appendChild(
                        categoryElement
                    );

                }


                const heading =
                    document.createElement("h2");

                heading.textContent =
                    title;

                content.appendChild(
                    heading
                );


                if (description) {

                    const descriptionElement =
                        document.createElement("p");

                    descriptionElement.textContent =
                        description;

                    content.appendChild(
                        descriptionElement
                    );

                }


                if (date) {

                    const meta =
                        document.createElement("div");

                    meta.className =
                        "blog-card-meta";

                    meta.textContent =
                        date;

                    content.appendChild(
                        meta
                    );

                }


                const readMore =
                    document.createElement("span");

                readMore.className =
                    "read-more";

                readMore.textContent =
                    "READ ARTICLE →";

                content.appendChild(
                    readMore
                );


                link.appendChild(content);

                card.appendChild(link);

                postsContainer.appendChild(card);

            } catch (error) {

                console.error(
                    "Error loading post:",
                    file.name,
                    error
                );

            }

        }


        /* SEARCH */

        setupSearch();

    } catch (error) {

        console.error(
            "Error loading blog posts:",
            error
        );

        postsContainer.innerHTML = `
            <p class="posts-error">
                Unable to load blog posts right now.
            </p>
        `;

    }

}


/* =========================================
   SEARCH
========================================= */

function setupSearch() {

    const searchInput =
        document.getElementById("postSearch");

    if (!searchInput) return;

    const cards =
        document.querySelectorAll(".blog-card");

    searchInput.addEventListener(
        "input",
        () => {

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();

            cards.forEach(card => {

                const text =
                    card.textContent.toLowerCase();

                card.hidden =
                    query !== "" &&
                    !text.includes(query);

            });

        }
    );

}


loadPosts();
