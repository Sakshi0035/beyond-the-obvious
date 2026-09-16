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
   AUTOMATIC BLOG POSTS SYSTEM
========================================= */

const postsContainer = document.getElementById("posts-container");


if (postsContainer) {

    const GITHUB_USERNAME = "Sakshi0035";

    const REPOSITORY_NAME = "beyond-the-obvious";

    const BRANCH = "main";


    const postsAPI =
        `https://api.github.com/repos/${GITHUB_USERNAME}/${REPOSITORY_NAME}/contents/posts?ref=${BRANCH}`;



    async function loadPosts() {

        try {

            const response = await fetch(postsAPI);


            if (!response.ok) {

                throw new Error("Could not load blog posts");

            }


            const files = await response.json();


            const postFiles = files.filter(file => {

                return (
                    file.type === "file" &&
                    file.name.endsWith(".html")
                );

            });


            const posts = await Promise.all(

                postFiles.map(async file => {

                    const postURL =
                        `posts/${file.name}`;


                    const postResponse =
                        await fetch(postURL);


                    if (!postResponse.ok) {

                        return null;

                    }


                    const html =
                        await postResponse.text();


                    const parser =
                        new DOMParser();


                    const documentData =
                        parser.parseFromString(
                            html,
                            "text/html"
                        );


                    const titleElement =
                        documentData.querySelector(
                            ".post-header h1"
                        );


                    const categoryElement =
                        documentData.querySelector(
                            ".post-category"
                        );


                    const dateElement =
                        documentData.querySelector(
                            ".post-meta"
                        );


                    const descriptionElement =
                        documentData.querySelector(
                            'meta[name="description"]'
                        );


                    const imageElement =
                        documentData.querySelector(
                            ".post-featured-image"
                        );


                    const title =
                        titleElement
                            ? titleElement.textContent.trim()
                            : file.name
                                .replace(".html", "")
                                .replace(/-/g, " ");


                    const category =
                        categoryElement
                            ? categoryElement.textContent.trim()
                            : "BEYOND THE OBVIOUS";


                    const date =
                        dateElement
                            ? dateElement.textContent.trim()
                            : "";


                    const excerpt =
                        descriptionElement
                            ? descriptionElement
                                .getAttribute("content")
                            : "";


                    let image = "";


                    if (imageElement) {

                        const imageSource =
                            imageElement.getAttribute("src");


                        if (imageSource) {

                            image =
                                new URL(
                                    imageSource,
                                    new URL(
                                        postURL,
                                        window.location.href
                                    )
                                ).href;

                        }

                    }


                    return {

                        title,
                        category,
                        date,
                        excerpt,
                        image,
                        url: postURL,
                        updated:
                            new Date(
                                file.sha
                            )

                    };

                })

            );


            const validPosts =
                posts.filter(post => post !== null);


            validPosts.reverse();


            postsContainer.innerHTML = "";


            validPosts.forEach(post => {

                const article =
                    document.createElement("article");


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
                                    src="${post.image}"
                                    alt="${escapeHTML(post.title)}"
                                    class="blog-card-image"
                                    onerror="this.parentElement.style.display='none'"
                                >

                            </a>
                        `
                        : "";


                article.innerHTML = `

                    ${imageHTML}


                    <div class="blog-card-content">


                        <p class="blog-category">

                            ${escapeHTML(post.category)}

                        </p>


                        <h2>

                            <a href="${post.url}">

                                ${escapeHTML(post.title)}

                            </a>

                        </h2>


                        <p class="blog-excerpt">

                            ${escapeHTML(post.excerpt)}

                        </p>


                        <div class="blog-card-footer">


                            <span class="blog-date">

                                ${escapeHTML(post.date)}

                            </span>


                            <a
                                href="${post.url}"
                                class="read-more"
                            >

                                READ ARTICLE →

                            </a>


                        </div>


                    </div>

                `;


                postsContainer.appendChild(article);

            });


            loadRelatedPosts(validPosts);


        } catch (error) {

            console.error(
                "Error loading blog posts:",
                error
            );

        }

    }



    function loadRelatedPosts(posts) {

        const relatedContainer =
            document.getElementById(
                "related-posts"
            );


        if (!relatedContainer) {

            return;

        }


        const currentFile =
            window.location.pathname
                .split("/")
                .pop();


        const otherPosts =
            posts.filter(post => {

                return (
                    !post.url.endsWith(
                        currentFile
                    )
                );

            });


        relatedContainer.innerHTML = "";


        otherPosts.forEach(post => {

            const article =
                document.createElement("article");


            article.className =
                "related-post-card";


            article.innerHTML = `

                <a href="${post.url}">

                    ${post.image
                        ? `
                            <img
                                src="${post.image}"
                                alt="${escapeHTML(post.title)}"
                            >
                        `
                        : ""
                    }


                    <div
                        class="related-post-card-content"
                    >

                        <p
                            class="related-post-category"
                        >

                            ${escapeHTML(
                                post.category
                            )}

                        </p>


                        <h3>

                            ${escapeHTML(
                                post.title
                            )}

                        </h3>


                        <p>

                            ${escapeHTML(
                                post.excerpt
                            )}

                        </p>


                        <span>

                            Read Article →

                        </span>


                    </div>


                </a>

            `;


            relatedContainer.appendChild(article);

        });

    }



    function escapeHTML(value) {

        const element =
            document.createElement("div");


        element.textContent =
            value || "";


        return element.innerHTML;

    }



    loadPosts();

}
