/* =========================================
   BEYOND THE OBVIOUS
   AUTOMATIC BLOG POST SYSTEM
   GitHub Pages + GitHub Contents API
========================================= */

const REPO_OWNER = "Sakshi0035";
const REPO_NAME = "beyond-the-obvious";
const REPO_BRANCH = "main";

const POSTS_API =
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/posts?ref=${REPO_BRANCH}`;

const REPO_API_BASE =
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;


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
   POST URL
   Encodes ? and other special characters
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

function getImageURL(imageSource, postURL) {

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
   DATE FORMAT
========================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return cleanText(dateValue);
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    ).format(date);
}


/* =========================================
   DATE FROM POST HTML
========================================= */

function getDateFromPost(postDocument) {

    const selectors = [

        'meta[name="published-date"]',

        'meta[name="date"]',

        'meta[name="published"]',

        'meta[property="article:published_time"]',

        "time[datetime]",

        "[data-published-date]"
    ];


    for (const selector of selectors) {

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

            return formatDate(
                cleanText(value)
            );
        }
    }


    /* Also look for a visible post date such as:
       By Sakshi Madgundi · 2026
    */

    const metaElement =
        postDocument.querySelector(
            ".post-meta"
        );


    if (metaElement) {

        const text =
            cleanText(
                metaElement.textContent
            );


        const yearMatch =
            text.match(
                /\b(20\d{2})\b/
            );


        if (yearMatch) {

            return `January 1, ${yearMatch[1]}`;
        }
    }


    return "";
}


/* =========================================
   GITHUB COMMIT DATE
   Used only when article has no date
========================================= */

const dateCache =
    new Map();


async function getGitHubPostDate(filename) {

    if (
        dateCache.has(filename)
    ) {

        return dateCache.get(
            filename
        );
    }


    try {

        const path =
            `posts/${filename}`;


        const apiURL =
            `${REPO_API_BASE}/commits?path=${encodeURIComponent(path)}&per_page=1`;


        const response =
            await fetch(
                apiURL,
                {
                    headers: {
                        "Accept":
                            "application/vnd.github+json"
                    }
                }
            );


        if (!response.ok) {
            return "";
        }


        const commits =
            await response.json();


        if (
            !Array.isArray(commits) ||
            commits.length === 0
        ) {
            return "";
        }


        const rawDate =
            commits[0]?.commit?.author?.date ||
            commits[0]?.commit?.committer?.date ||
            "";


        const formatted =
            formatDate(
                rawDate
            );


        dateCache.set(
            filename,
            formatted
        );


        return formatted;

    } catch (error) {

        console.warn(
            "POST DATE ERROR:",
            filename,
            error
        );

        return "";
    }
}


/* =========================================
   DECODE GITHUB BASE64 CONTENT
========================================= */

function decodeGitHubContent(base64Content) {

    try {

        const binaryString =
            atob(
                base64Content.replace(/\s/g, "")
            );


        const bytes =
            Uint8Array.from(
                binaryString,
                character =>
                    character.charCodeAt(0)
            );


        return new TextDecoder(
            "utf-8"
        ).decode(bytes);

    } catch (error) {

        console.error(
            "GITHUB CONTENT DECODE ERROR:",
            error
        );

        return "";
    }
}


/* =========================================
   READ ONE POST
   Uses GitHub API instead of raw URL
   so filenames containing ? work correctly.
========================================= */

async function readPost(file) {

    try {

        const postURL =
            getPostURL(
                file.name
            );


        /*
         * IMPORTANT:
         * Use GitHub's API URL.
         *
         * We do NOT use file.download_url
         * because the Mārtāṇḍa filename contains ?.
         */

        const response =
            await fetch(
                file.url,
                {
                    headers: {
                        "Accept":
                            "application/vnd.github+json"
                    },

                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            console.error(
                "Could not read post:",
                file.name,
                response.status
            );

            return null;
        }


        const fileData =
            await response.json();


        if (!fileData.content) {

            console.error(
                "No content returned for:",
                file.name
            );

            return null;
        }


        const html =
            decodeGitHubContent(
                fileData.content
            );


        if (!html) {

            console.error(
                "Empty HTML for:",
                file.name
            );

            return null;
        }


        const parser =
            new DOMParser();


        const postDocument =
            parser.parseFromString(
                html,
                "text/html"
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
            ) ||
            postDocument.querySelector(
                ".blog-card-category"
            ) ||
            postDocument.querySelector(
                ".blog-category"
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
           No image = NO image.
           No banner fallback.
           No placeholder.
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
                ) ||
                postDocument.querySelector(
                    ".blog-post p"
                ) ||
                postDocument.querySelector(
                    "article p"
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

        let date =
            getDateFromPost(
                postDocument
            );


        if (!date) {

            date =
                await getGitHubPostDate(
                    file.name
                );
        }


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

        console.error(
            "Could not load post:",
            file.name,
            error
        );

        return null;
    }
}


/* =========================================
   CREATE BLOG CARD
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


    /*
     * ONLY create image markup if
     * the article actually contains an image.
     */

    const imageHTML =
        post.image
            ? `
                <a
                    href="${post.url}"
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
                title="Share this article"
            >
                ↗
            </button>

        </div>


        <div class="blog-card-meta">

            ${
                post.date
                    ? `- ${escapeHTML(post.date)}`
                    : "- Published on Beyond The Obvious"
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

                    ${escapeHTML(
                        post.category
                    )}

                </p>


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
                href="${post.url}"
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

                    /* User cancelled sharing. */

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

            const dateA =
                Date.parse(
                    a.date
                );


            const dateB =
                Date.parse(
                    b.date
                );


            if (
                !Number.isNaN(dateA) &&
                !Number.isNaN(dateB)
            ) {

                return dateB - dateA;
            }


            if (
                !Number.isNaN(dateA)
            ) {

                return -1;
            }


            if (
                !Number.isNaN(dateB)
            ) {

                return 1;
            }


            return 0;
        }
    );
}


/* =========================================
   DISPLAY POSTS
========================================= */

function displayPosts(posts) {

    const postsContainer =
        document.getElementById(
            "posts-container"
        );


    const noPostsMessage =
        document.getElementById(
            "no-posts-message"
        );


    if (!postsContainer) {
        return;
    }


    postsContainer.innerHTML =
        "";


    if (!posts.length) {

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

        postsContainer.appendChild(
            createPostCard(
                post
            )
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


            const filteredPosts =
                allPosts.filter(
                    post => {

                        const text = (

                            post.title +
                            " " +
                            post.category +
                            " " +
                            post.excerpt +
                            " " +
                            post.searchText

                        ).toLowerCase();


                        return text.includes(
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
   ALL POSTS
========================================= */

let allPosts = [];


/* =========================================
   LOAD POSTS
========================================= */

async function loadPosts() {

    const postsContainer =
        document.getElementById(
            "posts-container"
        );


    const loadingMessage =
        document.getElementById(
            "posts-loading"
        );


    if (!postsContainer) {
        return;
    }


    try {

        console.log(
            "Loading blog posts..."
        );


        const response =
            await fetch(
                POSTS_API,
                {
                    headers: {
                        "Accept":
                            "application/vnd.github+json"
                    },

                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `GitHub API returned ${response.status}`
            );
        }


        const files =
            await response.json();


        console.log(
            "GitHub posts folder:",
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
            "HTML posts found:",
            postFiles.map(
                file => file.name
            )
        );


        const loadedPosts =
            await Promise.all(
                postFiles.map(
                    readPost
                )
            );


        allPosts =
            loadedPosts.filter(
                Boolean
            );


        allPosts =
            sortPosts(
                allPosts
            );


        console.log(
            "Loaded posts:",
            allPosts
        );


        if (loadingMessage) {

            loadingMessage.remove();
        }


        displayPosts(
            allPosts
        );


        setupSearch();


    } catch (error) {

        console.error(
            "BLOG POST LOADING ERROR:",
            error
        );


        if (loadingMessage) {

            loadingMessage.innerHTML = `

                <div class="posts-error">

                    <h3>
                        Articles could not be loaded.
                    </h3>

                    <p>
                        Please refresh the page and try again.
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
