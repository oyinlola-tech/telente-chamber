document.addEventListener("DOMContentLoaded", function() {
            const currentYear = new Date().getFullYear();
            const copyrightElements = document.querySelectorAll(".copyright p");
            copyrightElements.forEach(el => {
                if (el.textContent.includes("Legal Spectrum")) {
                    el.innerHTML = el.innerHTML.replace(/\d{4}\s+Legal Spectrum/, `${currentYear} Legal Spectrum`);
                }
            });
        });

        async function loadBlogs() {
            try {
                const response = await fetch("/api/blogs?limit=3");
                const blogs = await response.json();
                const container = document.getElementById("blogs-container");

                if (blogs.length === 0) {
                    container.innerHTML = "<p class=\"no-blogs\">No articles available at the moment.</p>";
                    return;
                }

                container.innerHTML = blogs.map(blog => `
                    <div class="blog-card">
                        ${blog.image ? `
                            <div class="blog-image">
                                <img src="/${blog.image}" alt="${blog.title}" loading="lazy" decoding="async">
                            </div>
                        ` : ""}
                        <div class="blog-content">
                            <h3>${blog.title}</h3>
                            <p>${blog.excerpt || blog.content.substring(0, 120)}...</p>
                            <a href="/blog/${blog.slug}" class="read-more">Read More -></a>
                        </div>
                    </div>
                `).join("");
            } catch (error) {
                console.error("Error loading blogs:", error);
                document.getElementById("blogs-container").innerHTML =
                    "<p class=\"error\">Unable to load articles. Please try again later.</p>";
            }
        }

        async function loadTestimonials() {
            try {
                const response = await fetch("/api/testimonials");
                const testimonials = await response.json();
                const container = document.getElementById("testimonials-container");

                if (testimonials.length === 0) {
                    container.innerHTML = "<p class=\"no-testimonials\">No testimonials yet.</p>";
                    return;
                }

                container.innerHTML = testimonials.slice(0, 3).map(testimonial => {
                    const filled = "&#9733;".repeat(testimonial.rating);
                    const empty = "&#9734;".repeat(5 - testimonial.rating);
                    return `
                        <div class="testimonial-card">
                            <div class="stars">${filled}${empty}</div>
                            <p class="testimonial-text">"${testimonial.message}"</p>
                            <p class="testimonial-author">${testimonial.name}</p>
                        </div>
                    `;
                }).join("");
            } catch (error) {
                console.error("Error loading testimonials:", error);
                document.getElementById("testimonials-container").innerHTML =
                    "<p class=\"error\">Unable to load testimonials.</p>";
            }
        }

        document.addEventListener("DOMContentLoaded", () => {
            loadBlogs();
            loadTestimonials();

            const newsletterForm = document.getElementById("newsletter-form");
            if (newsletterForm) {
                newsletterForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const email = document.getElementById("newsletter-email").value;
                    const messageEl = document.getElementById("newsletter-message");

                    messageEl.textContent = "Subscribing...";
                    messageEl.style.color = "#c9d1d9";

                    try {
                        const response = await fetch("/api/subscribe", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email })
                        });

                        const result = await response.json();

                        if (response.ok) {
                            messageEl.textContent = result.message;
                            messageEl.style.color = "#8ef3a4";
                            document.getElementById("newsletter-email").value = "";
                        } else {
                            messageEl.textContent = result.error || "An error occurred.";
                            messageEl.style.color = "#ffb4b4";
                        }
                    } catch (error) {
                        messageEl.textContent = "Failed to connect to the server.";
                        messageEl.style.color = "#ffb4b4";
                    }
                });
            }
        });
