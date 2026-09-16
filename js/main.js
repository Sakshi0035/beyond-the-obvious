/* =========================================
   BEYOND THE OBVIOUS BLOG SYSTEM
   GitHub Pages + GitHub API
========================================= */

const REPO_OWNER = "Sakshi0035";
const REPO_NAME = "beyond-the-obvious";
const REPO_BRANCH = "main";

const POSTS_API =
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/posts?ref=${REPO_BRANCH}`;

const REPO_API_BASE =
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

const DEFAULT_POST_IMAGE =
    "9418154f-5bd5-40df-ac7f-bb1df30525b4.png";


/* =========================================
   MOBILE SIDEBAR
========================================= */

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

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

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


function getPostURL(filename) {

    return (
        "posts/" +
        encodeURIComponent(filename)
    );
}


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

        /*
         * IMPORTANT:
         * Images are resolved relative to the post file.
         *
         * src="../image.jpg"
         * -> root image
         *
         * src="image.jpg"
         * -> /posts/image.jpg
         *
         * This supports both without guessing.
         */

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


function cleanText(text) {

    return (text || "")
        .replace(/\s+/g, " ")
        .trim();
}


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
   DATE EXTRACTION
========================================= */

function getDateFromPost(document) {

    /*
     * These are optional ways a post can
     * provide its own published date.
     */

    const selectors = [
        'meta[name="date"]',
        'meta[name="published"]',
        'meta[property="article:published_time"]',
        "time[datetime]",
        "[data-published-date]"
    ];

    for (const selector of selectors) {

        const element =
            document.querySelector(selector);

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
     * Do NOT use a vague "By Sakshi · 2026"
     * value as the actual date.
     * The GitHub commit date will be used instead.
     */

    return "";
}


/* =========================================
   GITHUB POST DATE
========================================= */

const dateCache = new Map();

async function getGitHubPostDate(filename) {

    if (dateCache.has(filename)) {
        return dateCache.get(filename);
    }

    try {

        const path =
            `posts/${filename}`;

        const apiURL =
            `${REPO_API_BASE}/commits?path=${encodeURIComponent(path)}&per_page=1`;

        const response =
            await fetch(apiURL);

        if (!response.ok) {
            return "";
        }

        const commits =
            await response.json();

        if (
            !Array.isArray(commits) ||
            !commits.length
        ) {
            return "";
        }

        const rawDate =
            commits[0]?.commit?.author?.date ||
            commits[0]?.commit?.committer?.date ||
            "";

        const formatted =
            formatDate(rawDate);

        dateCache.set(
            filename,
            formatted
        );

        return formatted;

    } catch (error) {

        console.warn(
            "Could not get GitHub post date:",
            filename,
            error
        );

        return "";
    }
}


/* =========================================
   READ ONE POST
========================================= */

async function readPost(file) {

    try {

        const postURL =
            getPostURL(file.name);

        /*
         * GitHub supplies a safe raw download URL.
         * This is important for filenames containing
         * Unicode characters, ":" or "?".
         */

        const response =
            await fetch(
                file.download_url
            );

        if (!response.ok) {

            console.error(
                "Could not read post:",
                file.name,
                response.status
            );

            return null;
        }

        const html =
            await response.text();

        const parser =
            new DOMParser();

        const postDocument =
            parser.parseFromString(
                html,
                "text/html"
            );


        /* =================================
           TITLE
        ================================= */

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


        /* =================================
           CATEGORY
        ================================= */

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


        /* =================================
           IMAGE
        ================================= */

        const imageElement =
            postDocument.querySelector(
                ".post-featured-image"
            ) ||
            postDocument.querySelector(
                "article img"
            );

        let image = "";

        if (imageElement) {

            image =
                getImageURL(
                    imageElement.getAttribute("src"),
                    postURL
                );
        }

        /*
         * If a post has no featured image,
         * use the blog's default banner.
         *
         * This guarantees every post card
         * still has a visual thumbnail.
         */

        if (!image) {

            image =
                DEFAULT_POST_IMAGE;
        }


        /* =================================
           EXCERPT
        ================================= */

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


        /* =================================
           SEARCH TEXT
        ================================= */

        const searchableContent =
            cleanText(
                postDocument.body?.textContent ||
                ""
            );


        /* =================================
           DATE
        ================================= */

        let date =
            getDateFromPost(
                postDocument
            );

        /*
         * If there is no exact published date
         * in the HTML, use the GitHub commit date.
         */

        if (!date) {

            date =
                await getGitHubPostDate(
                    file.name
                );

        } else {

            /*
             * If it looks like an ISO date,
             * format it nicely.
             */

            if (
                /^\d{4}-\d{2}-\d{2}/.test(date)
            ) {

                date =
                    formatDate(date);
            }
        }


        return {

            file: file.name,

            url: postURL,

            title: title,

            category: category,

            date: date,

            image: image,

            excerpt: excerpt,

            searchText: searchableContent

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
   CREATE POST CARD
========================================= */

function createPostCard(post) {

    const article =
        document.createElement("article");

    article.className =
        "blog-card";

    article.dataset.search =
        (
            post.title +
            " " +
            post.category +
            " " +
            post.excerpt +
            " " +
            post.searchText
        ).toLowerCase();


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


        <div class="blog-card-body">

            <a
                href="${post.url}"
                class="blog-card-image-link"
                aria-label="Read ${escapeHTML(post.title)}"
            >

                <img
                    src="${post.image}"
                    alt="${escapeHTML(post.title)}"
                    class="blog-card-image"
                    loading="lazy"
                >

            </a>


            <div class="blog-card-text">

                ${
                    post.category
                        ? `
                            <p class="blog-card-category">
                                ${escapeHTML(post.category)}
                            </p>
                        `
                        : ""
                }


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


    const shareButton =
        article.querySelector(
            ".post-share-button"
        );

    if (shareButton) {

        shareButton.addEventListener(
            "click",
            async () => {

                const shareData = {

                    title: post.title,

                    url: new URL(
                        post.url,
                        window.location.href
                    ).href

                };

                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share(
                            shareData
                        );

                    } else {

                        await navigator.clipboard.writeText(
                            shareData.url
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
                     * User cancelled sharing.
                     * No visible error is necessary.
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

    postsContainer.innerHTML = "";


    if (!posts.length) {

        if (noPostsMessage) {
            noPostsMessage.hidden = false;
        }

        return;
    }


    if (noPostsMessage) {
        noPostsMessage.hidden = true;
    }


    posts.forEach(post => {

        postsContainer.appendChild(
            createPostCard(post)
        );

    });
}


/* =========================================
   SORT POSTS
========================================= */

function sortPosts(posts) {

    /*
     * Posts with a real date are placed first,
     * newest date first.
     */

    return [...posts].sort(
        (a, b) => {

            const dateA =
                Date.parse(a.date);

            const dateB =
                Date.parse(b.date);

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

                        return post.searchText
                            .toLowerCase()
                            .includes(query) ||
                            post.title
                                .toLowerCase()
                                .includes(query) ||
                            post.category
                                .toLowerCase()
                                .includes(query) ||
                            post.excerpt
                                .toLowerCase()
                                .includes(query);

                    }
                );

            displayPosts(
                filteredPosts
            );

        }
    );
}


/* =========================================
   LOAD ALL POSTS FROM /posts/
========================================= */

let allPosts = [];

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

        const response =
            await fetch(
                POSTS_API,
                {
                    headers: {
                        "Accept":
                            "application/vnd.github+json"
                    }
                }
            );

        if (!response.ok) {

            throw new Error(
                `GitHub API returned ${response.status}`
            );
        }

        const files =
            await response.json();

        /*
         * ONLY HTML files directly inside
         * /posts/ are treated as blog posts.
         */

        const postFiles =
            files.filter(
                file =>
                    file.type === "file" &&
                    /\.html$/i.test(
                        file.name
                    )
            );


        if (!postFiles.length) {

            if (loadingMessage) {
                loadingMessage.remove();
            }

            displayPosts([]);

            return;
        }


        /*
         * Read all posts in parallel.
         */

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


        /*
         * Newest published/commit date first.
         */

        allPosts =
            sortPosts(
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
   AUTO DATE FOR INDIVIDUAL POST PAGES
========================================= */

async function hydrateIndividualPostDate() {

    const dateElement =
        document.querySelector(
            "[data-auto-post-date]"
        );

    if (!dateElement) {
        return;
    }

    const filename =
        document.body.dataset.postFile;

    if (!filename) {
        return;
    }

    const date =
        await getGitHubPostDate(
            filename
        );

    if (date) {

        dateElement.textContent =
            date;
    }
}


/* =========================================
   START
========================================= */

loadPosts();

hydrateIndividualPostDate();
