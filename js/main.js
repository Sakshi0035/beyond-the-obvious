/* =========================================
   BEYOND THE OBVIOUS
   AUTOMATIC BLOG POST SYSTEM

   GitHub Pages
   Static posts.json system

   IMPORTANT:
   This file DOES NOT use api.github.com.
========================================= */


/* =========================================
   MOBILE MENU
========================================= */

const menuToggle =
    document.getElementById("menuToggle");

const sidebar =
    document.getElementById("sidebar");


if (menuToggle && sidebar) {

    menuToggle.addEventListener("click", () => {

        const isOpen =
            sidebar.classList.toggle("open");

        menuToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuToggle.setAttribute(
            "aria-label",
            isOpen
                ? "Close menu"
                : "Open menu"
        );

    });


    document
        .querySelectorAll(".sidebar a")
        .forEach(link => {

            link.addEventListener("click", () => {

                sidebar.classList.remove("open");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

                menuToggle.setAttribute(
                    "aria-label",
                    "Open menu"
                );

            });

        });

}


/* =========================================
   HELPERS
========================================= */

function cleanText(value) {

    return String(value || "")
        .replace(/\s+/g, " ")
        .trim();

}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}


/* =========================================
   SAFE ARTICLE URL
========================================= */

function getPostURL(filename) {

    return (
        "posts/" +
        encodeURIComponent(filename)
    );

}


/* =========================================
   IMAGE URL

   Example:

   ../9b787...jpg

   becomes:

   https://sakshi0035.github.io/
   beyond-the-obvious/
   9b787...jpg
========================================= */

function getImageURL(
    imageSource,
    postURL
) {

    if (!imageSource) {
        return "";
    }


    imageSource =
        imageSource.trim();


    if (
        imageSource.startsWith("http://") ||
        imageSource.startsWith("https://") ||
        imageSource.startsWith("data:") ||
        imageSource.startsWith("blob:")
    ) {

        return imageSource;

    }


    try {

        return new URL(
            imageSource,
            new URL(
                postURL,
                window.location.href
            )
        ).href;

    } catch (error) {

        console.error(
            "IMAGE URL ERROR:",
            imageSource,
            error
        );

        return "";

    }

}


/* =========================================
   DATE SORT VALUE
========================================= */

function getDateValue(dateValue) {

    if (!dateValue) {
        return 0;
    }


    const parsed =
        Date.parse(dateValue);


    if (!Number.isNaN(parsed)) {
        return parsed;
    }


    const year =
        String(dateValue)
            .match(/\b20\d{2}\b/);


    if (year) {

        return Date.parse(
            `January 1, ${year[0]}`
        );

    }


    return 0;

}


/* =========================================
   DISPLAY DATE
========================================= */

function formatDisplayDate(dateValue) {

    if (!dateValue) {
        return "";
    }


    const parsed =
        Date.parse(dateValue);


    if (
        !Number.isNaN(parsed)
    ) {

        return new Intl.DateTimeFormat(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        ).format(
            new Date(parsed)
        );

    }


    return cleanText(
        dateValue
    );

}


/* =========================================
   CREATE ONE BLOG CARD
========================================= */

function createPostCard(post) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "blog-card";


    article.dataset.search = (

        post.title +
        " " +
        post.category +
        " " +
        post.excerpt +
        " " +
        post.searchText

    ).toLowerCase();


    /* =====================================
       IMAGE

       IMPORTANT:
       If post.image is empty,
       NO image markup is created.
       
       No banner.
       No placeholder.
       No default image.
    ===================================== */

    const imageHTML =
        post.image
            ? `
                <a
                    href="${escapeHTML(post.url)}"
                    class="blog-card-image-link"
                    aria-label="Read ${escapeHTML(post.title)}"
                >

                    <img
                        src="${escapeHTML(post.image)}"
                        alt="${escapeHTML(post.title)}"
                        class="blog-card-image"
                        loading="lazy"
                    >

                </a>
            `
            : "";


    /* =====================================
       DATE
    ===================================== */

    const dateHTML =
        post.date
            ? `
                <div class="blog-card-meta">
                    - ${escapeHTML(
                        formatDisplayDate(post.date)
                    )}
                </div>
            `
            : "";


    /* =====================================
       CARD
    ===================================== */

    article.innerHTML = `

        <div class="blog-card-header">

            <h2 class="blog-card-title">

                <a
                    href="${escapeHTML(post.url)}"
                >
                    ${escapeHTML(post.title)}
                </a>

            </h2>


            <button
                class="post-share-button"
                type="button"
                aria-label="Share this article"
                title="Share this article"
            >
                ↗
            </button>

        </div>


        ${dateHTML}


        <div
            class="
                blog-card-body
                ${post.image
                    ? ""
                    : "blog-card-body--no-image"}
            "
        >

            ${imageHTML}


            <div class="blog-card-text">

                ${
                    post.category
                        ? `
                            <p class="blog-card-category">
                                ${escapeHTML(
                                    post.category
                                )}
                            </p>
                        `
                        : ""
                }


                ${
                    post.excerpt
                        ? `
                            <p class="blog-card-excerpt">
                                ${escapeHTML(
                                    post.excerpt
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

        </div>


        <div class="blog-card-footer">

            <span class="post-comment-link">
                Article
            </span>


            <a
                href="${escapeHTML(post.url)}"
                class="read-more"
            >
                READ MORE
            </a>

        </div>

    `;


    /* =====================================
       SHARE BUTTON
    ===================================== */

    const shareButton =
        article.querySelector(
            ".post-share-button"
        );


    if (shareButton) {

        shareButton.addEventListener(
            "click",
            async () => {

                const shareURL =
                    new URL(
                        post.url,
                        window.location.href
                    ).href;


                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share({

                            title:
                                post.title,

                            url:
                                shareURL

                        });

                    } else {

                        await navigator.clipboard.writeText(
                            shareURL
                        );


                        shareButton.textContent =
                            "✓";


                        setTimeout(() => {

                            shareButton.textContent =
                                "↗";

                        }, 1500);

                    }

                } catch (error) {

                    /*
                     * User cancelled
                     * the share dialog.
                     */

                }

            }
        );

    }


    return article;

}


/* =========================================
   DISPLAY POSTS
========================================= */

function displayPosts(posts) {

    const container =
        document.getElementById(
            "posts-container"
        );


    const noPostsMessage =
        document.getElementById(
            "no-posts-message"
        );


    if (!container) {

        console.error(
            "ERROR: #posts-container was not found."
        );

        return;

    }


    container.innerHTML = "";


    if (
        !posts ||
        posts.length === 0
    ) {

        if (noPostsMessage) {

            noPostsMessage.hidden =
                false;

        }

        return;

    }


    if (noPostsMessage) {

        noPostsMessage.hidden =
            true;

    }


    posts.forEach(post => {

        container.appendChild(
            createPostCard(post)
        );

    });

}


/* =========================================
   SEARCH
========================================= */

function setupSearch() {

    const searchInput =
        document.getElementById(
            "blogSearch"
        );


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        () => {

            const query =
                cleanText(
                    searchInput.value
                ).toLowerCase();


            if (!query) {

                displayPosts(
                    allPosts
                );

                return;

            }


            const filteredPosts =
                allPosts.filter(
                    post => {

                        const searchableText = (

                            post.title +
                            " " +
                            post.category +
                            " " +
                            post.excerpt +
                            " " +
                            post.searchText

                        ).toLowerCase();


                        return searchableText.includes(
                            query
                        );

                    }
                );


            displayPosts(
                filteredPosts
            );

        }
    );

}


/* =========================================
   POSTS
========================================= */

let allPosts = [];


/* =========================================
   LOAD posts.json
========================================= */

async function loadPosts() {

    const container =
        document.getElementById(
            "posts-container"
        );


    const loading =
        document.getElementById(
            "posts-loading"
        );


    if (!container) {

        console.error(
            "ERROR: posts-container not found."
        );

        return;

    }


    try {

        /*
         * IMPORTANT:
         *
         * We are loading a normal static
         * JSON file from the same GitHub
         * Pages website.
         *
         * There is NO GitHub API here.
         */

        const response =
            await fetch(
                "posts.json",
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `posts.json returned ${response.status}`
            );

        }


        const posts =
            await response.json();


        if (
            !Array.isArray(posts)
        ) {

            throw new Error(
                "posts.json is not a valid post list."
            );

        }


        /* =================================
           NORMALIZE POSTS
        ================================= */

        allPosts =
            posts
                .map(post => {

                    const filename =
                        post.file ||
                        post.filename ||
                        "";


                    const url =
                        post.url ||
                        getPostURL(
                            filename
                        );


                    const image =
                        post.image
                            ? getImageURL(
                                post.image,
                                url
                            )
                            : "";


                    return {

                        file:
                            filename,

                        url:
                            url,

                        title:
                            cleanText(
                                post.title
                            ),

                        category:
                            cleanText(
                                post.category
                            ),

                        date:
                            post.date || "",

                        image:
                            image,

                        excerpt:
                            cleanText(
                                post.excerpt
                            ),

                        searchText:
                            cleanText(
                                post.searchText
                            )

                    };

                })
                .filter(
                    post =>
                        post.title ||
                        post.file
                );


        /* =================================
           NEWEST FIRST
        ================================= */

        allPosts.sort(
            (a, b) => {

                return (
                    getDateValue(b.date) -
                    getDateValue(a.date)
                );

            }
        );


        console.log(
            "Beyond The Obvious posts loaded:",
            allPosts
        );


        /* =================================
           REMOVE LOADING MESSAGE
        ================================= */

        if (loading) {

            loading.remove();

        }


        /* =================================
           DISPLAY
        ================================= */

        displayPosts(
            allPosts
        );


        /* =================================
           SEARCH
        ================================= */

        setupSearch();


    } catch (error) {

        console.error(
            "BLOG LOADING ERROR:",
            error
        );


        if (loading) {

            loading.innerHTML = `

                <div class="posts-error">

                    <h3>
                        Articles could not be loaded.
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    }

}


/* =========================================
   START
========================================= */

loadPosts();
