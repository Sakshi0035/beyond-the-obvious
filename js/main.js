/* =========================================
   BEYOND THE OBVIOUS
   AUTOMATIC BLOG POST LOADER
========================================= */

const REPO_OWNER = "Sakshi0035";
const REPO_NAME = "beyond-the-obvious";
const REPO_BRANCH = "main";

const POSTS_API =
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/posts?ref=${REPO_BRANCH}`;

let allPosts = [];


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
            isOpen ? "Close menu" : "Open menu"
        );

    });

    document.querySelectorAll(".sidebar a").forEach(link => {

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
            "Image URL error:",
            error
        );

        return "";

    }

}


/* =========================================
   DATE
========================================= */

function getPostDate(postDocument) {

    const metaSelectors = [

        'meta[name="published-date"]',
        'meta[name="date"]',
        'meta[name="published"]',
        'meta[property="article:published_time"]',
        "time[datetime]",
        "[data-published-date]"

    ];


    for (
        const selector of metaSelectors
    ) {

        const element =
            postDocument.querySelector(
                selector
            );

        if (!element) {
            continue;
        }


        const value =
            element.getAttribute("content") ||
            element.getAttribute("datetime") ||
            element.getAttribute("data-published-date") ||
            element.textContent;


        if (cleanText(value)) {

            return cleanText(value);

        }

    }


    /*
     * Your current posts use:
     *
     * By Sakshi Madgundi · 2026
     *
     * So extract the year from .post-meta.
     */

    const postMeta =
        postDocument.querySelector(
            ".post-meta"
        );


    if (postMeta) {

        const text =
            cleanText(
                postMeta.textContent
            );


        const year =
            text.match(
                /\b20\d{2}\b/
            );


        if (year) {

            return year[0];

        }

    }


    return "";

}


/* =========================================
   READ ONE POST
   USING GITHUB CONTENTS API
========================================= */

async function readPost(file) {

    try {

        /*
         * IMPORTANT:
         *
         * We use file.url.
         *
         * NOT file.download_url.
         * NOT raw.githubusercontent.com.
         *
         * This safely handles:
         *
         * Mārtāṇḍa?.html
         */

        const response =
            await fetch(
                file.url,
                {
                    headers: {
                        "Accept":
                            "application/vnd.github+json"
                    }
                }
            );


        if (!response.ok) {

            console.error(
                "Could not fetch:",
                file.name,
                response.status
            );

            return null;

        }


        const data =
            await response.json();


        if (!data.content) {

            console.error(
                "GitHub returned no content:",
                file.name
            );

            return null;

        }


        /*
         * GitHub Contents API returns
         * the file as base64.
         */

        const binary =
            atob(
                data.content.replace(/\s/g, "")
            );


        const bytes =
            Uint8Array.from(
                binary,
                character =>
                    character.charCodeAt(0)
            );


        const html =
            new TextDecoder(
                "utf-8"
            ).decode(bytes);


        if (!html) {

            return null;

        }


        const parser =
            new DOMParser();


        const postDocument =
            parser.parseFromString(
                html,
                "text/html"
            );


        const postURL =
            getPostURL(
                file.name
            );


        /* =====================================
           TITLE
        ===================================== */

        const titleElement =
            postDocument.querySelector(
                ".post-header h1"
            ) ||
            postDocument.querySelector(
                ".blog-post h1"
            ) ||
            postDocument.querySelector(
                "article h1"
            ) ||
            postDocument.querySelector(
                "h1"
            ) ||
            postDocument.querySelector(
                "title"
            );


        let title =
            titleElement
                ? cleanText(
                    titleElement.textContent
                )
                : "";


        if (!title) {

            title =
                file.name
                    .replace(
                        /\.html$/i,
                        ""
                    )
                    .replace(
                        /[-_]/g,
                        " "
                    );

        }


        /* =====================================
           CATEGORY
        ===================================== */

        const categoryElement =
            postDocument.querySelector(
                ".post-category"
            );


        const category =
            categoryElement
                ? cleanText(
                    categoryElement.textContent
                )
                : "BEYOND THE OBVIOUS";


        /* =====================================
           FEATURED IMAGE
           
           IMPORTANT:
           Find IMG INSIDE figure.
        ===================================== */

        const imageElement =
            postDocument.querySelector(
                ".post-featured-image img"
            ) ||
            postDocument.querySelector(
                "img.post-featured-image"
            );


        let image = "";


        if (imageElement) {

            const imageSource =
                imageElement.getAttribute(
                    "src"
                );


            if (imageSource) {

                image =
                    getImageURL(
                        imageSource,
                        postURL
                    );

            }

        }


        /* =====================================
           EXCERPT
        ===================================== */

        const descriptionElement =
            postDocument.querySelector(
                'meta[name="description"]'
            );


        let excerpt =
            descriptionElement
                ? cleanText(
                    descriptionElement.getAttribute(
                        "content"
                    )
                )
                : "";


        if (!excerpt) {

            const firstParagraph =
                postDocument.querySelector(
                    ".post-content p"
                );


            if (firstParagraph) {

                excerpt =
                    cleanText(
                        firstParagraph.textContent
                    );

            }

        }


        /* =====================================
           SEARCH TEXT
        ===================================== */

        const searchText =
            cleanText(
                postDocument.body?.textContent ||
                ""
            );


        /* =====================================
           DATE
        ===================================== */

        const date =
            getPostDate(
                postDocument
            );


        return {

            file:
                file.name,

            url:
                postURL,

            title:
                title,

            category:
                category,

            date:
                date,

            image:
                image,

            excerpt:
                excerpt,

            searchText:
                searchText

        };


    } catch (error) {

        /*
         * IMPORTANT:
         * One broken post must NOT stop
         * the other posts from loading.
         */

        console.error(
            "POST ERROR:",
            file.name,
            error
        );

        return null;

    }

}


/* =========================================
   CREATE CARD
========================================= */

function createPostCard(post) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "blog-card";


    const imageHTML =
        post.image
            ? `
                <a
                    href="${post.url}"
                    class="blog-card-image-link"
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


    article.innerHTML = `

        <div class="blog-card-header">

            <h2 class="blog-card-title">

                <a href="${post.url}">
                    ${escapeHTML(post.title)}
                </a>

            </h2>


            <button
                class="post-share-button"
                type="button"
                aria-label="Share this article"
            >
                ↗
            </button>

        </div>


        <div class="blog-card-meta">

            ${
                post.date
                    ? `- ${escapeHTML(post.date)}`
                    : ""
            }

        </div>


        <div
            class="
                blog-card-body
                ${post.image ? "" : "blog-card-body--no-image"}
            "
        >

            ${imageHTML}


            <div class="blog-card-text">

                <p class="blog-card-category">
                    ${escapeHTML(post.category)}
                </p>


                ${
                    post.excerpt
                        ? `
                            <p class="blog-card-excerpt">
                                ${escapeHTML(post.excerpt)}
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
                href="${post.url}"
                class="read-more"
            >
                READ MORE
            </a>

        </div>

    `;


    /* =====================================
       SHARE
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

                    /* User cancelled share. */

                }

            }
        );

    }


    return article;

}


/* =========================================
   SORT POSTS
========================================= */

function sortPosts(posts) {

    return [...posts].sort(
        (a, b) => {

            const yearA =
                parseInt(
                    a.date,
                    10
                ) || 0;


            const yearB =
                parseInt(
                    b.date,
                    10
                ) || 0;


            return yearB - yearA;

        }
    );

}


/* =========================================
   DISPLAY
========================================= */

function displayPosts(posts) {

    const container =
        document.getElementById(
            "posts-container"
        );


    const noPosts =
        document.getElementById(
            "no-posts-message"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!posts.length) {

        if (noPosts) {
            noPosts.hidden = false;
        }

        return;

    }


    if (noPosts) {
        noPosts.hidden = true;
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
                searchInput.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                displayPosts(
                    allPosts
                );

                return;

            }


            const filtered =
                allPosts.filter(
                    post => {

                        const searchable =
                            (
                                post.title +
                                " " +
                                post.category +
                                " " +
                                post.excerpt +
                                " " +
                                post.searchText
                            ).toLowerCase();


                        return searchable.includes(
                            query
                        );

                    }
                );


            displayPosts(
                filtered
            );

        }
    );

}


/* =========================================
   LOAD ALL POSTS
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
            "posts-container not found"
        );

        return;

    }


    try {

        console.log(
            "Beyond The Obvious: loading posts..."
        );


        const response =
            await fetch(
                POSTS_API
            );


        if (!response.ok) {

            throw new Error(
                "GitHub API error: " +
                response.status
            );

        }


        const files =
            await response.json();


        console.log(
            "Files found:",
            files
        );


        const postFiles =
            files.filter(
                file =>
                    file.type === "file" &&
                    /\.html$/i.test(
                        file.name
                    )
            );


        console.log(
            "HTML posts:",
            postFiles.map(
                file => file.name
            )
        );


        /*
         * Each post is handled independently.
         */

        const results =
            await Promise.allSettled(
                postFiles.map(
                    readPost
                )
            );


        allPosts =
            results
                .filter(
                    result =>
                        result.status ===
                        "fulfilled"
                )
                .map(
                    result =>
                        result.value
                )
                .filter(
                    Boolean
                );


        allPosts =
            sortPosts(
                allPosts
            );


        console.log(
            "Successfully loaded posts:",
            allPosts
        );


        if (loading) {
            loading.remove();
        }


        displayPosts(
            allPosts
        );


        setupSearch();


    } catch (error) {

        console.error(
            "BLOG LOADING FAILED:",
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
                            error.message ||
                            "Unknown error"
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
