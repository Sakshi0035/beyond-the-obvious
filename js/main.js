/* =========================================
   MOBILE SIDEBAR
========================================= */

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

const postsContainer =
    document.getElementById("posts-container");

const searchInput =
    document.getElementById("blogSearch");

const loadingMessage =
    document.getElementById("posts-loading");

const noPostsMessage =
    document.getElementById("no-posts-message");


const POSTS_API =
    "https://api.github.com/repos/Sakshi0035/beyond-the-obvious/contents/posts?ref=main";


let allPosts = [];



/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}



/* =========================================
   CREATE POST URL
========================================= */

function getPostURL(filename) {

    return (
        "posts/" +
        encodeURIComponent(filename)
    );

}



/* =========================================
   CREATE IMAGE URL
========================================= */

function getImageURL(imageSource, postURL) {

    if (!imageSource) {

        return "";

    }


    imageSource =
        imageSource.trim();


    /* Absolute image URL */

    if (
        imageSource.startsWith("http://") ||
        imageSource.startsWith("https://") ||
        imageSource.startsWith("data:")
    ) {

        return imageSource;

    }


    /*
     * Resolve the image relative to the
     * actual blog post.
     *
     * Example:
     *
     * posts/post.html
     * posts/image.jpg
     *
     * src="image.jpg"
     *
     * becomes:
     *
     * /beyond-the-obvious/posts/image.jpg
     */

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
   READ ONE BLOG POST
========================================= */

async function readPost(file) {

    try {

        /*
         * Browser URL for the article
         */

        const postURL =
            getPostURL(file.name);


        /*
         * GitHub's raw download URL.
         *
         * This safely handles filenames containing:
         *
         * :
         * ?
         * ā
         * ḍ
         * etc.
         */

        const response =
            await fetch(
                file.download_url
            );


        if (!response.ok) {

            console.error(
                "Could not read:",
                file.name
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
                ? titleElement.textContent.trim()
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
                ? categoryElement.textContent.trim()
                : "BEYOND THE OBVIOUS";



        /* =================================
           DATE
        ================================= */

        const dateElement =
            postDocument.querySelector(
                ".post-meta"
            ) ||
            postDocument.querySelector(
                ".blog-card-meta"
            ) ||
            postDocument.querySelector(
                ".blog-date"
            );


        const date =
            dateElement
                ? dateElement.textContent.trim()
                : "";



        /* =================================
           FEATURED IMAGE
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

            const imageSource =
                imageElement.getAttribute(
                    "src"
                );


            image =
                getImageURL(
                    imageSource,
                    postURL
                );

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
                ? (
                    descriptionElement.getAttribute(
                        "content"
                    ) || ""
                ).trim()
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
                    firstParagraph.textContent.trim();

            }

        }



        return {

            file: file.name,

            url: postURL,

            title: title,

            category: category,

            date: date,

            image: image,

            excerpt: excerpt

        };



    } catch (error) {

        console.error(
            "POST LOADING ERROR:",
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
        document.createElement("article");


    article.className =
        "blog-card";


    article.dataset.search = (

        post.title +
        " " +
        post.category +
        " " +
        post.excerpt

    ).toLowerCase();



    article.innerHTML = `


        ${
            post.image
                ? `
                    <a
                        href="${post.url}"
                        class="blog-card-image-link"
                    >

                        <img
                            src="${post.image}"
                            alt="${escapeHTML(post.title)}"
                            class="blog-card-image"
                        >

                    </a>
                `
                : ""
        }


        <div class="blog-card-content">


            <p class="blog-category">

                ${escapeHTML(post.category)}

            </p>


            <h2>

                <a href="${post.url}">

                    ${escapeHTML(post.title)}

                </a>

            </h2>


            ${
                post.excerpt
                    ? `
                        <p class="blog-excerpt">

                            ${escapeHTML(post.excerpt)}

                        </p>
                    `
                    : ""
            }


            <div class="blog-card-footer">


                ${
                    post.date
                        ? `
                            <span class="blog-date">

                                ${escapeHTML(post.date)}

                            </span>
                        `
                        : ""
                }


                <a
                    href="${post.url}"
                    class="read-more"
                >

                    READ ARTICLE →

                </a>


            </div>


        </div>

    `;


    return article;

}



/* =========================================
   DISPLAY POSTS
========================================= */

function displayPosts(posts) {

    if (!postsContainer) {

        return;

    }


    postsContainer.innerHTML = "";


    if (!posts.length) {

        if (noPostsMessage) {

            noPostsMessage.style.display =
                "block";

        }

        return;

    }


    if (noPostsMessage) {

        noPostsMessage.style.display =
            "none";

    }


    posts.forEach(post => {

        postsContainer.appendChild(
            createPostCard(post)
        );

    });

}



/* =========================================
   LOAD ALL POSTS
========================================= */

async function loadPosts() {

    if (!postsContainer) {

        return;

    }


    try {

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


        /*
         * Only .html files from /posts/
         */

        const postFiles =
            files.filter(file => {

                return (

                    file.type === "file" &&

                    /\.html$/i.test(
                        file.name
                    )

                );

            });


        /*
         * Read every post
         */

        const loadedPosts =
            await Promise.all(

                postFiles.map(
                    readPost
                )

            );


        allPosts =
            loadedPosts.filter(
                post => post !== null
            );


        /*
         * Remove loading message
         */

        if (loadingMessage) {

            loadingMessage.remove();

        }


        /*
         * Show posts
         */

        displayPosts(
            allPosts
        );


    } catch (error) {

        console.error(
            "BLOG POST LOADING ERROR:",
            error
        );


        if (loadingMessage) {

            loadingMessage.innerHTML = `

                <div
                    style="
                        text-align:center;
                        padding:40px 20px;
                        color:#777;
                    "
                >

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
   BLOG SEARCH
========================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const searchTerm =
                this.value
                    .trim()
                    .toLowerCase();


            /*
             * Empty search
             */

            if (!searchTerm) {

                displayPosts(
                    allPosts
                );

                return;

            }


            /*
             * Search title,
             * category and excerpt
             */

            const filteredPosts =
                allPosts.filter(post => {

                    const searchableText = (

                        post.title +
                        " " +
                        post.category +
                        " " +
                        post.excerpt

                    ).toLowerCase();


                    return searchableText.includes(
                        searchTerm
                    );

                });


            displayPosts(
                filteredPosts
            );

        }
    );

}



/* =========================================
   START BLOG SYSTEM
========================================= */

loadPosts();
