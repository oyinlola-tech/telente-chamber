 (() => {
   const onReady = (fn) => {
     if (document.readyState === 'loading') {
       document.addEventListener('DOMContentLoaded', fn);
     } else {
       fn();
     }
   };
 
   const setCurrentYear = () => {
     const year = new Date().getFullYear();
     document.querySelectorAll('[data-year]').forEach((el) => {
       el.textContent = year;
     });
   };
 
   const initNav = () => {
     const hamburger = document.querySelector('.hamburger');
     const nav = document.querySelector('nav');
 
     if (!hamburger || !nav) {
       return;
     }
 
     hamburger.addEventListener('click', () => {
       const expanded = hamburger.getAttribute('aria-expanded') === 'true';
       hamburger.setAttribute('aria-expanded', String(!expanded));
       hamburger.classList.toggle('active');
       nav.classList.toggle('active');
     });
   };
 
  const loadPartials = async () => {
     const placeholders = document.querySelectorAll('[data-include]');
     if (placeholders.length === 0) {
       return;
     }
 
    await Promise.all(
      Array.from(placeholders).map(async (placeholder) => {
        const partialName = placeholder.getAttribute('data-include');
        if (!partialName) return;
         try {
           const response = await fetch(`/partials/${partialName}.html`);
           if (!response.ok) {
             throw new Error(`Failed to load partial: ${partialName}`);
           }
           const html = await response.text();
           placeholder.innerHTML = html;
         } catch (error) {
           console.error(error);
         }
      })
    );
  };

  const injectJsonLd = (data, id) => {
    if (!data) return;
    const scriptId = id || `jsonld-${Date.now()}`;
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = scriptId;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  };

  const getOrgData = () => {
    const { orgName, orgPhone, orgEmail, orgStreet, orgLocality, orgRegion, orgPostal, orgCountry } =
      document.body.dataset;
    if (!orgName) {
      return null;
    }
    return {
      name: orgName,
      phone: orgPhone,
      email: orgEmail,
      street: orgStreet,
      locality: orgLocality,
      region: orgRegion,
      postal: orgPostal,
      country: orgCountry
    };
  };

  const injectLegalServiceSchema = () => {
    const org = getOrgData();
    if (!org) return;

    const data = {
      '@context': 'https://schema.org',
      '@type': 'LegalService',
      name: org.name,
      logo: '/uploads/img/Legal-specturm-logo.png',
      image: '/uploads/img/Legal-specturm-logo.png',
      address: {
        '@type': 'PostalAddress',
        streetAddress: org.street || '',
        addressLocality: org.locality || '',
        addressRegion: org.region || '',
        postalCode: org.postal || '',
        addressCountry: org.country || 'NG'
      },
      telephone: org.phone || '',
      email: org.email || '',
      areaServed: org.country || 'NG',
      serviceType: [
        'Corporate & Commercial',
        'Dispute Resolution',
        'Real Estate & Property',
        'Private Clients'
      ]
    };

    injectJsonLd(data, 'jsonld-legalservice');

    if (org.phone || org.email) {
      const contactPoint = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: org.name,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: org.phone || '',
            email: org.email || '',
            contactType: 'customer service',
            areaServed: org.country || 'NG',
            availableLanguage: ['en']
          }
        ]
      };

      injectJsonLd(contactPoint, 'jsonld-contactpoint');
    }
  };

  const injectBreadcrumbSchema = (items, id) => {
    if (!items || items.length === 0) return;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
    injectJsonLd(data, id);
  };

  const setCanonicalUrl = (overridePath) => {
    const siteUrl = document.body.dataset.siteUrl;
    if (!siteUrl) return;
    const path = overridePath || window.location.pathname;
    const url = `${siteUrl.replace(/\/$/, '')}${path}`;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  };

  const setMetaTag = (selector, attrName, content) => {
    if (!content) return;
    let tag = document.querySelector(selector);
    if (!tag) {
      tag = document.createElement('meta');
      if (selector.includes('property=')) {
        tag.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
      } else if (selector.includes('name=')) {
        tag.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
      }
      document.head.appendChild(tag);
    }
    tag.setAttribute(attrName, content);
  };

  const setMetaContent = (name, content) => {
    setMetaTag(`meta[name="${name}"]`, 'content', content);
  };

  const setOgContent = (property, content) => {
    setMetaTag(`meta[property="${property}"]`, 'content', content);
  };

  const setTwitterContent = (name, content) => {
    setMetaTag(`meta[name="${name}"]`, 'content', content);
  };
 
  const initContactPage = () => {
    const contactForm = document.getElementById('contact-form');
    const testimonialForm = document.getElementById('testimonial-form');
 
     if (!contactForm || !testimonialForm) {
       return;
     }
 
     contactForm.addEventListener('submit', async (e) => {
       e.preventDefault();
 
       const submitBtn = document.getElementById('contact-submit');
       const originalText = submitBtn.textContent;
       submitBtn.textContent = 'Sending...';
       submitBtn.disabled = true;
 
       const formData = {
         name: document.getElementById('contact-name').value,
         email: document.getElementById('contact-email').value,
         phone: document.getElementById('contact-phone').value,
         subject: document.getElementById('contact-subject').value,
         message: document.getElementById('contact-body').value
       };
 
       const messageDiv = document.getElementById('contact-status');
 
       try {
         const response = await fetch('/api/contact', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify(formData)
         });
 
         const result = await response.json();
 
         if (response.ok) {
           messageDiv.textContent = 'Message sent successfully! We will get back to you soon.';
           messageDiv.className = 'message success';
           contactForm.reset();
         } else {
           messageDiv.textContent = result.error || 'Failed to send message. Please try again.';
           messageDiv.className = 'message error';
         }
 
         messageDiv.scrollIntoView({ behavior: 'smooth' });
 
         setTimeout(() => {
           messageDiv.style.display = 'none';
         }, 5000);
       } catch (error) {
         messageDiv.textContent = 'Network error. Please check your connection and try again.';
         messageDiv.className = 'message error';
       } finally {
         submitBtn.textContent = originalText;
         submitBtn.disabled = false;
       }
     });
 
    testimonialForm.addEventListener('submit', async (e) => {
       e.preventDefault();
 
       const submitBtn = document.getElementById('testimonial-submit');
       const originalText = submitBtn.textContent;
       submitBtn.textContent = 'Submitting...';
       submitBtn.disabled = true;
 
       const rating = document.querySelector('input[name="rating"]:checked');
       const messageDiv = document.getElementById('testimonial-status');
 
       if (!rating) {
         messageDiv.textContent = 'Please select a rating.';
         messageDiv.className = 'message error';
         submitBtn.textContent = originalText;
         submitBtn.disabled = false;
         return;
       }
 
       const formData = {
         name: document.getElementById('testimonial-name').value,
         email: document.getElementById('testimonial-email').value,
         rating: rating.value,
         message: document.getElementById('testimonial-body').value
       };
 
       try {
         const response = await fetch('/api/testimonials', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify(formData)
         });
 
         const result = await response.json();
 
         if (response.ok) {
           messageDiv.textContent = 'Thank you for sharing your experience! Your testimonial will be reviewed.';
           messageDiv.className = 'message success';
           testimonialForm.reset();
         } else {
           messageDiv.textContent = result.error || 'Failed to submit testimonial. Please try again.';
           messageDiv.className = 'message error';
         }
 
         messageDiv.scrollIntoView({ behavior: 'smooth' });
 
         setTimeout(() => {
           messageDiv.style.display = 'none';
         }, 5000);
       } catch (error) {
         messageDiv.textContent = 'Network error. Please check your connection and try again.';
         messageDiv.className = 'message error';
       } finally {
         submitBtn.textContent = originalText;
         submitBtn.disabled = false;
       }
    });

    const ratingInputs = document.querySelectorAll('.rating input');
    if (ratingInputs.length > 0) {
      ratingInputs.forEach((input) => {
        input.addEventListener('change', (event) => {
          const stars = event.target.closest('.rating').querySelectorAll('label');
          const rating = parseInt(event.target.value, 10);

          stars.forEach((star, index) => {
            star.style.color = index < rating ? '#0f1b24' : '#ddd';
          });
        });
      });

      const ratingLabels = document.querySelectorAll('.rating label');
      ratingLabels.forEach((star) => {
        star.addEventListener('mouseover', (event) => {
          const rating = parseInt(event.target.htmlFor.replace('star', ''), 10);
          const stars = event.target.closest('.rating').querySelectorAll('label');

          stars.forEach((s, index) => {
            if (index < rating) {
              s.style.color = '#0f1b24';
            }
          });
        });

        star.addEventListener('mouseout', (event) => {
          const rating = event.target
            .closest('.rating')
            .querySelector('input:checked');
          const stars = event.target.closest('.rating').querySelectorAll('label');

          if (rating) {
            const ratingValue = parseInt(rating.value, 10);
            stars.forEach((s, index) => {
              s.style.color = index < ratingValue ? '#0f1b24' : '#ddd';
            });
          } else {
            stars.forEach((s) => {
              s.style.color = '#ddd';
            });
          }
        });
      });
    }
  };
 
  const initBlogPage = () => {
    const blogsGrid = document.getElementById('blogs-grid');
    const pagination = document.getElementById('pagination');

    if (!blogsGrid || !pagination) {
      return;
    }

    const origin = document.body.dataset.siteUrl || window.location.origin;
    injectBreadcrumbSchema(
      [
        { name: 'Home', url: `${origin}/` },
        { name: 'Insights', url: `${origin}/blog` }
      ],
      'jsonld-breadcrumbs'
    );
    setCanonicalUrl('/blog');
 
     let currentPage = 1;
     const blogsPerPage = 6;
     let allBlogs = [];
 
    const displayBlogs = () => {
      const start = (currentPage - 1) * blogsPerPage;
      const end = start + blogsPerPage;
      const paginatedBlogs = allBlogs.slice(start, end);
 
       if (paginatedBlogs.length === 0) {
         blogsGrid.innerHTML = '<p class="no-blogs">No insights yet. Check back soon for new guidance.</p>';
         return;
       }
 
      blogsGrid.innerHTML = paginatedBlogs
        .map((blog) => {
           const date = new Date(blog.created_at).toLocaleDateString('en-US', {
             year: 'numeric',
             month: 'long',
             day: 'numeric'
           });
          return `
             <div class="blog-card">
               ${
                 blog.image
                   ? `
                     <div class="blog-image">
                       <img src="/${blog.image}" alt="${blog.title}" loading="lazy">
                     </div>
                   `
                   : ''
               }
               <div class="blog-content">
                 <div class="blog-meta">${date}</div>
                 <h3>${blog.title}</h3>
                 <p>${blog.excerpt || blog.content.substring(0, 150)}...</p>
                 <a href="/blog/${blog.slug}" class="read-more">Read Insight</a>
               </div>
             </div>
          `;
        })
        .join('');

      const listSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: paginatedBlogs.map((blog, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: blog.title,
          url: `${origin}/blog/${blog.slug}`
        }))
      };
      injectJsonLd(listSchema, 'jsonld-blog-list');

      const org = getOrgData();
      const postingsSchema = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Legal Spectrum Insights',
        blogPost: paginatedBlogs.map((blog) => ({
          '@type': 'BlogPosting',
          headline: blog.title,
          description: blog.excerpt || blog.content.substring(0, 160),
          datePublished: blog.created_at,
          dateModified: blog.updated_at || blog.created_at,
          mainEntityOfPage: `${origin}/blog/${blog.slug}`,
          image: blog.image ? [`${origin}/${blog.image}`] : undefined,
          author: org
            ? {
                '@type': 'Organization',
                name: org.name
              }
            : undefined,
          publisher: org
            ? {
                '@type': 'Organization',
                name: org.name
              }
            : undefined
        }))
      };
      injectJsonLd(postingsSchema, 'jsonld-blog-postings');
    };
 
     const setupPagination = () => {
       const totalPages = Math.ceil(allBlogs.length / blogsPerPage);
       if (totalPages <= 1) {
         pagination.style.display = 'none';
         return;
       }
 
       pagination.style.display = 'block';
       document.getElementById('current-page').textContent = currentPage;
       document.getElementById('prev-btn').disabled = currentPage === 1;
       document.getElementById('next-btn').disabled = currentPage === totalPages;
     };
 
     document.getElementById('prev-btn').addEventListener('click', () => {
       if (currentPage > 1) {
         currentPage--;
         displayBlogs();
         setupPagination();
         window.scrollTo({ top: 0, behavior: 'smooth' });
       }
     });
 
     document.getElementById('next-btn').addEventListener('click', () => {
       const totalPages = Math.ceil(allBlogs.length / blogsPerPage);
       if (currentPage < totalPages) {
         currentPage  ;
         displayBlogs();
         setupPagination();
         window.scrollTo({ top: 0, behavior: 'smooth' });
       }
     });
 
     const loadAllBlogs = async () => {
       try {
         const response = await fetch('/api/blogs');
         allBlogs = await response.json();
         displayBlogs();
         setupPagination();
       } catch (error) {
         console.error('Error loading blogs:', error);
         blogsGrid.innerHTML =
           '<p class="error">Unable to load insights right now. Please try again shortly.</p>';
       }
     };
 
     loadAllBlogs();
   };
 
  const initBlogDetailPage = () => {
    const contentEl = document.getElementById('blog-content');
    if (!contentEl) {
      return;
    }
 
     const loadRelatedArticles = async (currentBlogId) => {
       try {
         const response = await fetch('/api/blogs?limit=3');
         const blogs = await response.json();
 
         const relatedBlogs = blogs.filter((blog) => blog.id !== currentBlogId).slice(0, 2);
         if (relatedBlogs.length > 0) {
           const relatedSection = document.getElementById('related-articles');
           const relatedGrid = document.getElementById('related-grid');
 
           relatedGrid.innerHTML = relatedBlogs
             .map((blog) => {
               return `
                 <div class="related-card">
                   ${
                     blog.image
                       ? `
                         <div class="related-image">
                           <img src="/${blog.image}" alt="${blog.title}">
                         </div>
                       `
                       : ''
                   }
                   <div class="related-content">
                     <h3>${blog.title}</h3>
                     <p>${blog.excerpt || blog.content.substring(0, 120)}...</p>
                     <a href="/blog/${blog.slug}" class="related-link">Read Insight</a>
                   </div>
                 </div>
               `;
             })
             .join('');
 
           relatedSection.style.display = 'block';
         }
       } catch (error) {
         console.error('Error loading related articles:', error);
       }
     };
 
     const loadBlogDetail = async () => {
       try {
         const pathSegments = window.location.pathname.split('/');
         const slug = pathSegments[pathSegments.length - 1];
 
         if (!slug || slug === 'blog-detail.html') {
           contentEl.innerHTML =
             '<p class="not-found">We could not find that insight. Try another article.</p>';
           return;
         }
 
         const response = await fetch(`/api/blogs/${slug}`);
         if (!response.ok) {
           if (response.status === 404) {
             contentEl.innerHTML = '<p class="not-found">Article not found.</p>';
           } else {
             throw new Error('Failed to load article');
           }
           return;
         }
 
        const blog = await response.json();
        document.title = `${blog.title} - Legal Spectrum`;
        setCanonicalUrl(`/blog/${blog.slug}`);

        const excerpt = blog.excerpt || blog.content.substring(0, 160);
        setMetaContent('description', excerpt);
        setOgContent('og:title', blog.title);
        setOgContent('og:description', excerpt);
        setOgContent('og:type', 'article');
        setOgContent('og:url', window.location.href);
        if (blog.image) {
          setOgContent('og:image', `/${blog.image}`);
        }
        setTwitterContent('twitter:title', blog.title);
        setTwitterContent('twitter:description', excerpt);
        if (blog.image) {
          setTwitterContent('twitter:image', `/${blog.image}`);
        }
 
         const formattedDate = new Date(blog.created_at).toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'long',
           day: 'numeric'
         });
 
        contentEl.innerHTML = `
           <div class="blog-header">
             <div class="blog-meta">${formattedDate}</div>
             <h1 class="blog-title">${blog.title}</h1>
           </div>
           ${
             blog.image
               ? `
                 <div class="featured-image">
                   <img src="/${blog.image}" alt="${blog.title}">
                 </div>
               `
               : ''
           }
           <div class="blog-content">
             <p>${blog.content.replace(/\n/g, '</p><p>')}</p>
           </div>
         `;
 
        loadRelatedArticles(blog.id);

        const org = getOrgData();
        const articleSchema = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: blog.title,
          description: excerpt,
          datePublished: blog.created_at,
          dateModified: blog.updated_at || blog.created_at,
          mainEntityOfPage: window.location.href,
          author: org
            ? {
                '@type': 'Organization',
                name: org.name
              }
            : undefined,
          publisher: org
            ? {
                '@type': 'Organization',
                name: org.name
              }
            : undefined,
          image: blog.image ? [`/${blog.image}`] : undefined
        };
        injectJsonLd(articleSchema, 'jsonld-article');

        const origin = document.body.dataset.siteUrl || window.location.origin;
        injectBreadcrumbSchema(
          [
            { name: 'Home', url: `${origin}/` },
            { name: 'Insights', url: `${origin}/blog` },
            { name: blog.title, url: window.location.href }
          ],
          'jsonld-breadcrumbs'
        );
      } catch (error) {
         console.error('Error loading blog:', error);
         contentEl.innerHTML =
           '<p class="error">Unable to load this insight right now. Please try again later.</p>';
       }
     };
 
     loadBlogDetail();
   };
 
   const initHomePage = () => {
     const blogsContainer = document.getElementById('blogs-container');
     const testimonialsContainer = document.getElementById('testimonials-container');
 
     if (!blogsContainer || !testimonialsContainer) {
       return;
     }
 
     const loadBlogs = async () => {
       try {
         const response = await fetch('/api/blogs?limit=3');
         const blogs = await response.json();
 
         if (blogs.length === 0) {
           blogsContainer.innerHTML = '<p class="no-blogs">No articles available at the moment.</p>';
           return;
         }
 
         blogsContainer.innerHTML = blogs
           .map((blog) => {
             return `
               <div class="blog-card">
                 ${
                   blog.image
                     ? `
                       <div class="blog-image">
                         <img src="/${blog.image}" alt="${blog.title}">
                       </div>
                     `
                     : ''
                 }
                 <div class="blog-content">
                   <h3>${blog.title}</h3>
                   <p>${blog.excerpt || blog.content.substring(0, 120)}...</p>
                   <a href="/blog/${blog.slug}" class="read-more">Read More -></a>
                 </div>
               </div>
             `;
           })
           .join('');
       } catch (error) {
         console.error('Error loading blogs:', error);
         blogsContainer.innerHTML = '<p class="error">Unable to load articles. Please try again later.</p>';
       }
     };
 
     const loadTestimonials = async () => {
       try {
         const response = await fetch('/api/testimonials');
         const testimonials = await response.json();
 
         if (testimonials.length === 0) {
           testimonialsContainer.innerHTML = '<p class="no-testimonials">No testimonials yet.</p>';
           return;
         }
 
         testimonialsContainer.innerHTML = testimonials
           .slice(0, 3)
           .map((testimonial) => {
             const filled = '★'.repeat(testimonial.rating);
             const empty = '☆'.repeat(5 - testimonial.rating);
             return `
               <div class="testimonial-card">
                 <div class="stars">${filled}${empty}</div>
                 <p class="testimonial-text">"${testimonial.message}"</p>
                 <p class="testimonial-author">${testimonial.name}</p>
               </div>
             `;
           })
           .join('');
       } catch (error) {
         console.error('Error loading testimonials:', error);
         testimonialsContainer.innerHTML = '<p class="error">Unable to load testimonials.</p>';
       }
     };
 
     loadBlogs();
     loadTestimonials();
 
     const newsletterForm = document.getElementById('newsletter-form');
     if (newsletterForm) {
       newsletterForm.addEventListener('submit', async (e) => {
         e.preventDefault();
         const email = document.getElementById('newsletter-email').value;
         const messageEl = document.getElementById('newsletter-message');
 
         messageEl.textContent = 'Subscribing...';
         messageEl.classList.remove('success', 'error');
         messageEl.classList.add('loading');
 
         try {
           const response = await fetch('/api/subscribe', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email })
           });
 
           const result = await response.json();
           messageEl.classList.remove('loading');
 
           if (response.ok) {
             messageEl.textContent = result.message;
             messageEl.classList.add('success');
             document.getElementById('newsletter-email').value = '';
           } else {
             messageEl.textContent = result.error || 'An error occurred.';
             messageEl.classList.add('error');
           }
         } catch (error) {
           messageEl.textContent = 'Failed to connect to the server.';
           messageEl.classList.remove('loading');
           messageEl.classList.add('error');
         }
       });
     }
   };
 
   const initLoginPage = () => {
     const togglePassword = document.getElementById('toggle-password');
     const passwordInput = document.getElementById('password');
     const loginForm = document.getElementById('login-form');
 
     if (!togglePassword || !passwordInput || !loginForm) {
       return;
     }
 
     togglePassword.addEventListener('click', function () {
       if (passwordInput.type === 'password') {
         passwordInput.type = 'text';
         this.textContent = 'Hide';
       } else {
         passwordInput.type = 'password';
         this.textContent = 'Show';
       }
     });
 
     const loginSubmit = document.getElementById('login-submit');
     const messageDiv = document.getElementById('login-message');
 
     loginForm.addEventListener('submit', async function (e) {
       e.preventDefault();
 
       const originalText = loginSubmit.textContent;
       loginSubmit.textContent = 'Signing in...';
       loginSubmit.disabled = true;
 
       const formData = {
         email: document.getElementById('email').value,
         password: document.getElementById('password').value
       };
 
       try {
         const response = await fetch('/api/admin/login', {
           method: 'POST',
           credentials: 'include',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify(formData)
         });
 
         if (response.status === 401) {
           alert('Incorrect credentials. Please try again.');
         }
 
         const result = await response.json();
 
         if (response.ok) {
           messageDiv.textContent = 'Login successful! Redirecting...';
           messageDiv.className = 'message success';
 
           if (result.token) {
             localStorage.setItem('admin_token', result.token);
           }
 
           setTimeout(() => {
             window.location.href = '/admin/dashboard';
           }, 1000);
         } else {
           messageDiv.textContent = result.error || 'Invalid email or password';
           messageDiv.className = 'message error';
           loginSubmit.textContent = originalText;
           loginSubmit.disabled = false;
         }
       } catch (error) {
         messageDiv.textContent = 'Network error. Please check your connection and try again.';
         messageDiv.className = 'message error';
         loginSubmit.textContent = originalText;
         loginSubmit.disabled = false;
       }
     });
 
     const inputs = loginForm.querySelectorAll('input');
     inputs.forEach((input) => {
       input.addEventListener('input', () => {
         messageDiv.style.display = 'none';
         messageDiv.textContent = '';
         messageDiv.className = 'message';
       });
     });
   };
 
   const initForgotPasswordPage = () => {
     const step1Container = document.getElementById('step1-container');
     const step2Container = document.getElementById('step2-container');
     const step3Container = document.getElementById('step3-container');
 
     if (!step1Container || !step2Container || !step3Container) {
       return;
     }
 
     let currentStep = 1;
     let userEmail = '';
     let otp = '';
     let countdownInterval;
     let resendCountdown = 60;
     let resendInterval;
 
     const steps = document.querySelectorAll('.step');
     const pageTitle = document.getElementById('page-title');
     const pageDescription = document.getElementById('page-description');
     const messageDiv = document.getElementById('message');
     const emailForm = document.getElementById('email-form');
     const otpForm = document.getElementById('otp-form');
     const passwordForm = document.getElementById('password-form');
     const otpInputs = document.querySelectorAll('.otp-input');
     const hiddenOtp = document.getElementById('otp');
     const timerElement = document.getElementById('time');
     const resendLink = document.getElementById('resend-otp-link');
     const resendTimer = document.getElementById('resend-timer');
     const resendTime = document.getElementById('resend-time');
     const verifyOtpBtn = document.getElementById('verify-otp-btn');
     const resetPasswordBtn = document.getElementById('reset-password-btn');
     const passwordInput = document.getElementById('password');
     const confirmPasswordInput = document.getElementById('confirm-password');
     const passwordStrength = document.getElementById('password-strength');
     const passwordMatch = document.getElementById('password-match');
 
     const updateSteps = (step) => {
       steps.forEach((s, index) => {
         if (index < step) {
           s.classList.add('active');
         } else {
           s.classList.remove('active');
         }
       });
 
       step1Container.classList.add('hidden');
       step2Container.classList.add('hidden');
       step3Container.classList.add('hidden');
 
       if (step === 1) {
         step1Container.classList.remove('hidden');
         pageTitle.textContent = 'Reset Your Password';
         pageDescription.textContent = 'Enter your email and we will send a one-time verification code.';
       } else if (step === 2) {
         step2Container.classList.remove('hidden');
         pageTitle.textContent = 'Verify OTP';
         pageDescription.textContent = 'Enter the 6-digit OTP sent to your email';
         startOTPTimer();
         startResendTimer();
         focusFirstOTPInput();
       } else if (step === 3) {
         step3Container.classList.remove('hidden');
         pageTitle.textContent = 'New Password';
         pageDescription.textContent = 'Create a new password for your account';
       }
 
       currentStep = step;
       clearMessage();
     };
 
     otpInputs.forEach((input, index) => {
       input.addEventListener('input', (e) => {
         e.target.value = e.target.value.replace(/[^0-9]/g, '');
 
         if (e.target.value && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
         }
 
         updateOTPValue();
       });
 
       input.addEventListener('keydown', (e) => {
         if (e.key === 'Backspace' && !e.target.value && index > 0) {
           otpInputs[index - 1].focus();
         }
       });
 
       input.addEventListener('paste', (e) => {
         e.preventDefault();
         const pasteData = e.clipboardData.getData('text');
         const numbers = pasteData.replace(/[^0-9]/g, '');
 
         if (numbers.length === 6) {
           numbers.split('').forEach((num, i) => {
             if (otpInputs[i]) {
               otpInputs[i].value = num;
             }
           });
           updateOTPValue();
           verifyOtpBtn.focus();
         }
       });
     });
 
     const focusFirstOTPInput = () => {
       setTimeout(() => otpInputs[0].focus(), 100);
     };
 
     const updateOTPValue = () => {
       otp = Array.from(otpInputs).map((input) => input.value).join('');
       hiddenOtp.value = otp;
       verifyOtpBtn.disabled = otp.length !== 6;
     };
 
     const startOTPTimer = () => {
       let timeLeft = 10 * 60;
 
       if (countdownInterval) clearInterval(countdownInterval);
 
       countdownInterval = setInterval(() => {
         timeLeft--;
         const minutes = Math.floor(timeLeft / 60);
         const seconds = timeLeft % 60;
 
         timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds
           .toString()
           .padStart(2, '0')}`;
 
         if (timeLeft <= 0) {
           clearInterval(countdownInterval);
           timerElement.parentElement.classList.add('expired');
           timerElement.textContent = 'OTP expired';
           verifyOtpBtn.disabled = true;
         }
       }, 1000);
     };
 
     const startResendTimer = () => {
       resendCountdown = 60;
       resendTimer.classList.remove('hidden');
       resendLink.classList.add('disabled');
 
       if (resendInterval) clearInterval(resendInterval);
 
       resendInterval = setInterval(() => {
         resendCountdown--;
         resendTime.textContent = resendCountdown;
 
         if (resendCountdown <= 0) {
           clearInterval(resendInterval);
           resendTimer.classList.add('hidden');
           resendLink.classList.remove('disabled');
         }
       }, 1000);
     };
 
     const validatePassword = () => {
       const password = passwordInput.value;
       const confirmPassword = confirmPasswordInput.value;
 
       let strength = 0;
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
 
       let strengthText = '';
       let strengthClass = '';
       switch (strength) {
         case 0:
         case 1:
           strengthText = 'Weak';
           strengthClass = 'expired';
           break;
         case 2:
         case 3:
           strengthText = 'Medium';
           strengthClass = '';
           break;
         case 4:
         case 5:
           strengthText = 'Strong';
           strengthClass = '';
           break;
       }
 
       passwordStrength.textContent = `Strength: ${strengthText}`;
       passwordStrength.className = `timer ${strengthClass}`;
 
       if (password && confirmPassword) {
         if (password === confirmPassword) {
           passwordMatch.textContent = '✓ Passwords match';
           passwordMatch.className = 'timer';
         } else {
           passwordMatch.textContent = '✗ Passwords do not match';
           passwordMatch.className = 'timer expired';
         }
       } else {
         passwordMatch.textContent = '';
       }
 
       const isValid = password.length >= 8 && password === confirmPassword;
       resetPasswordBtn.disabled = !isValid;
     };
 
     passwordInput.addEventListener('input', validatePassword);
     confirmPasswordInput.addEventListener('input', validatePassword);
 
     const clearMessage = () => {
       messageDiv.className = 'message';
       messageDiv.style.display = 'none';
       messageDiv.textContent = '';
     };
 
     const showMessage = (text, type) => {
       messageDiv.textContent = text;
       messageDiv.className = `message ${type}`;
       messageDiv.style.display = 'block';
     };
 
     emailForm.addEventListener('submit', async (e) => {
       e.preventDefault();
 
       const email = document.getElementById('email').value.trim();
       const button = document.getElementById('send-otp-btn');
       const originalText = button.textContent;
 
       if (!email) {
         showMessage('Please enter your email address', 'error');
         return;
       }
 
       button.textContent = 'Sending...';
       button.disabled = true;
 
       try {
         const response = await fetch('/api/admin/forgot-password', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email })
         });
 
         const result = await response.json();
 
         if (response.ok) {
           userEmail = email;
           showMessage('OTP sent successfully! Check your email.', 'success');
           setTimeout(() => updateSteps(2), 1500);
         } else {
           showMessage(result.error || 'Failed to send OTP', 'error');
         }
       } catch (error) {
         showMessage('Network error. Please try again.', 'error');
       } finally {
         button.textContent = originalText;
         button.disabled = false;
       }
     });
 
     otpForm.addEventListener('submit', async (e) => {
       e.preventDefault();
 
       if (otp.length !== 6) {
         showMessage('Please enter a valid 6-digit OTP', 'error');
         return;
       }
 
       const button = document.getElementById('verify-otp-btn');
       const originalText = button.textContent;
 
       button.textContent = 'Verifying...';
       button.disabled = true;
 
       try {
         const response = await fetch('/api/admin/verify-otp', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email: userEmail, otp })
         });
 
         const result = await response.json();
 
         if (response.ok) {
           showMessage('OTP verified successfully!', 'success');
           setTimeout(() => updateSteps(3), 1500);
         } else {
           showMessage(result.error || 'Invalid OTP', 'error');
         }
       } catch (error) {
         showMessage('Network error. Please try again.', 'error');
       } finally {
         button.textContent = originalText;
         button.disabled = false;
       }
     });
 
     resendLink.addEventListener('click', async (e) => {
       e.preventDefault();
 
       if (resendLink.classList.contains('disabled')) return;
 
       const originalText = resendLink.textContent;
       resendLink.textContent = 'Sending...';
       resendLink.classList.add('disabled');
 
       try {
         const response = await fetch('/api/admin/resend-otp', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email: userEmail })
         });
 
         const result = await response.json();
 
         if (response.ok) {
           showMessage('New OTP sent successfully!', 'success');
           otpInputs.forEach((input) => (input.value = ''));
           updateOTPValue();
           startOTPTimer();
           startResendTimer();
           focusFirstOTPInput();
         } else {
           showMessage(result.error || 'Failed to resend OTP', 'error');
         }
       } catch (error) {
         showMessage('Network error. Please try again.', 'error');
       } finally {
         resendLink.textContent = originalText;
       }
     });
 
     passwordForm.addEventListener('submit', async (e) => {
       e.preventDefault();
 
       const password = passwordInput.value;
       const button = document.getElementById('reset-password-btn');
       const originalText = button.textContent;
 
       button.textContent = 'Resetting...';
       button.disabled = true;
 
       try {
         const response = await fetch('/api/admin/reset-password', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             email: userEmail,
             otp: otp,
             password: password
           })
         });
 
         const result = await response.json();
 
         if (response.ok) {
           showMessage('Password reset successful! Redirecting to login...', 'success');
 
           setTimeout(() => {
             window.location.href = '/admin/login';
           }, 3000);
         } else {
           showMessage(result.error || 'Failed to reset password', 'error');
           button.disabled = false;
         }
       } catch (error) {
         showMessage('Network error. Please try again.', 'error');
         button.textContent = originalText;
         button.disabled = false;
       }
     });
 
     updateSteps(1);
 
     document.addEventListener('input', () => {
       if (messageDiv.style.display === 'block') {
         clearMessage();
       }
     });
   };
 
   const initUnsubscribePage = () => {
     const messageEl = document.getElementById('message');
     if (!messageEl) {
       return;
     }
 
     (async () => {
       const token = new URLSearchParams(window.location.search).get('token');
 
       if (!token) {
         messageEl.textContent = 'Invalid unsubscribe link. Token is missing.';
         messageEl.classList.add('error');
         return;
       }
 
       try {
         const response = await fetch(`/api/unsubscribe?token=${token}`);
         const result = await response.json();
 
         messageEl.textContent = result.message || result.error;
         messageEl.classList.add(response.ok ? 'success' : 'error');
       } catch (error) {
         messageEl.textContent = 'An error occurred. Please try again later.';
         messageEl.classList.add('error');
       }
     })();
   };
 
   const initDashboardPage = () => {
     const dashboardContainer = document.querySelector('.dashboard-container');
     if (!dashboardContainer) {
       return;
     }
 
     let currentUser = null;
    let authToken = localStorage.getItem('admin_token');
    let editingBlogId = null;
    const blogsCache = new Map();

    const resetBlogFormState = () => {
      editingBlogId = null;
      const submitBtn = document.getElementById('blog-submit');
      if (submitBtn) {
        submitBtn.textContent = 'Publish Post';
      }
    };
 
     const sidebar = document.getElementById('dashboard-sidebar');
     const sidebarToggle = document.getElementById('sidebar-toggle');
 
     if (sidebar && sidebarToggle) {
       sidebarToggle.addEventListener('click', () => {
         const isOpen = sidebar.classList.toggle('is-open');
         sidebarToggle.setAttribute('aria-expanded', String(isOpen));
       });
 
       document.addEventListener('click', (event) => {
         if (!sidebar.classList.contains('is-open')) return;
         const isClickInside = sidebar.contains(event.target) || sidebarToggle.contains(event.target);
         if (!isClickInside) {
           sidebar.classList.remove('is-open');
           sidebarToggle.setAttribute('aria-expanded', 'false');
         }
       });
     }
 
     const checkAuth = async () => {
       if (!authToken) {
         window.location.href = '/admin/login';
         return false;
       }
 
       try {
         const response = await fetch('/api/admin/check-auth', {
           headers: {
             Authorization: `Bearer ${authToken}`
           }
         });
 
         if (!response.ok) {
           throw new Error('Not authenticated');
         }
 
         const data = await response.json();
         currentUser = data.user;
         updateLastLogin();
         return true;
       } catch (error) {
         console.error('Auth check failed:', error);
         localStorage.removeItem('admin_token');
         window.location.href = '/admin/login';
         return false;
       }
     };
 
     const updateLastLogin = () => {
       const lastLoginEl = document.getElementById('last-login');
       if (!lastLoginEl) return;
       const now = new Date();
       lastLoginEl.textContent = `Last login: ${now.toLocaleString()}`;
     };
 
     const loadDashboardStats = async () => {
       try {
         const [contactsRes, testimonialsRes, blogsRes] = await Promise.all([
           fetch('/api/contacts', {
             headers: { Authorization: `Bearer ${authToken}` }
           }),
           fetch('/api/testimonials?approved=false', {
             headers: { Authorization: `Bearer ${authToken}` }
           }),
           fetch('/api/blogs', {
             headers: { Authorization: `Bearer ${authToken}` }
           })
         ]);
 
         const contacts = await contactsRes.json();
         const testimonials = await testimonialsRes.json();
         const blogs = await blogsRes.json();
 
         document.getElementById('total-contacts').textContent = contacts.length;
         document.getElementById('total-testimonials').textContent = testimonials.length;
         document.getElementById('total-blogs').textContent = blogs.length;
 
         const unreplied = contacts.filter((c) => !c.replied).length;
         document.getElementById('unreplied-contacts').textContent = unreplied;
 
         const dashboardContent = document.getElementById('dashboard-content');
         const recentContacts = contacts.slice(0, 5);
         const pendingTestimonials = testimonials.filter((t) => !t.approved).slice(0, 5);
 
         dashboardContent.innerHTML = `
           <div class="form-row">
             <div class="summary-card">
               <h3 class="summary-title">Recent Contact Messages</h3>
               ${
                 recentContacts.length > 0
                   ? `
                     <table class="data-table">
                       <thead>
                         <tr>
                           <th>Name</th>
                           <th>Email</th>
                           <th>Subject</th>
                           <th>Date</th>
                         </tr>
                       </thead>
                       <tbody>
                         ${
                           recentContacts
                             .map(
                               (contact) => `
                                 <tr>
                                   <td>${contact.name}</td>
                                   <td>${contact.email}</td>
                                   <td>${contact.subject || 'No subject'}</td>
                                   <td>${new Date(contact.created_at).toLocaleDateString()}</td>
                                 </tr>
                               `
                             )
                             .join('')
                         }
                       </tbody>
                     </table>
                   `
                   : '<p>No recent contact messages.</p>'
               }
             </div>
 
             <div class="summary-card">
               <h3 class="summary-title">Pending Testimonials</h3>
               ${
                 pendingTestimonials.length > 0
                   ? `
                     <table class="data-table">
                       <thead>
                         <tr>
                           <th>Name</th>
                           <th>Rating</th>
                           <th>Date</th>
                         </tr>
                       </thead>
                       <tbody>
                         ${
                           pendingTestimonials
                             .map(
                               (testimonial) => `
                                 <tr>
                                   <td>${testimonial.name}</td>
                                   <td>${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}</td>
                                   <td>${new Date(testimonial.created_at).toLocaleDateString()}</td>
                                 </tr>
                               `
                             )
                             .join('')
                         }
                       </tbody>
                     </table>
                   `
                   : '<p>No pending testimonials.</p>'
               }
             </div>
           </div>
         `;
       } catch (error) {
         console.error('Error loading dashboard stats:', error);
       }
     };
 
     const loadContacts = async () => {
       try {
         const response = await fetch('/api/contacts', {
           headers: { Authorization: `Bearer ${authToken}` }
         });
         const contacts = await response.json();
 
         const contactsContent = document.getElementById('contacts-content');
 
         if (contacts.length === 0) {
           contactsContent.innerHTML = '<p>No contact messages found.</p>';
           return;
         }
 
         contactsContent.innerHTML = `
           <table class="data-table">
             <thead>
               <tr>
                 <th>Date</th>
                 <th>Name</th>
                 <th>Email</th>
                 <th>Phone</th>
                 <th>Subject</th>
                 <th>Message</th>
                 <th>Status</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               ${
                 contacts
                   .map(
                     (contact) => `
                       <tr>
                         <td>${new Date(contact.created_at).toLocaleDateString()}</td>
                         <td>${contact.name}</td>
                         <td>${contact.email}</td>
                         <td>${contact.phone || '-'}</td>
                         <td>${contact.subject || 'No subject'}</td>
                         <td class="truncate">${contact.message}</td>
                         <td>
                           ${
                             contact.replied
                               ? '<span class="status-approved">Replied</span>'
                               : '<span class="status-pending">Pending</span>'
                           }
                         </td>
                         <td class="actions">
                           <button class="btn btn-small" onclick="deleteContact(${contact.id})">Delete</button>
                           <button class="btn btn-small btn-replied" onclick="openEmailModal('contact', ${contact.id}, '${contact.email.replace(/'/g, "\\'")}')">
                             ${contact.replied ? 'Email Again' : 'Reply'}
                           </button>
                         </td>
                       </tr>
                     `
                   )
                   .join('')
               }
             </tbody>
           </table>
         `;
       } catch (error) {
         console.error('Error loading contacts:', error);
         document.getElementById('contacts-content').innerHTML =
           '<p class="error">Failed to load contacts. Please try again.</p>';
       }
     };
 
     const loadTestimonials = async () => {
       try {
         const response = await fetch('/api/testimonials?approved=false', {
           headers: { Authorization: `Bearer ${authToken}` }
         });
         const testimonials = await response.json();
 
         const testimonialsContent = document.getElementById('testimonials-content');
 
         if (testimonials.length === 0) {
           testimonialsContent.innerHTML = '<p>No testimonials found.</p>';
           return;
         }
 
         testimonialsContent.innerHTML = `
           <table class="data-table">
             <thead>
               <tr>
                 <th>Date</th>
                 <th>Name</th>
                 <th>Email</th>
                 <th>Rating</th>
                 <th>Message</th>
                 <th>Status</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               ${
                 testimonials
                   .map(
                     (testimonial) => `
                       <tr>
                         <td>${new Date(testimonial.created_at).toLocaleDateString()}</td>
                         <td>${testimonial.name}</td>
                         <td>${testimonial.email || '-'}</td>
                         <td>${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}</td>
                         <td class="truncate">${testimonial.message}</td>
                         <td>
                           ${
                             testimonial.approved
                               ? '<span class="status-approved">Approved</span>'
                               : '<span class="status-pending">Pending</span>'
                           }
                         </td>
                         <td class="actions">
                           <button class="btn btn-small" onclick="viewTestimonial(${testimonial.id})">View</button>
                           <button class="btn btn-small btn-approve" onclick="toggleApproval(${testimonial.id}, ${!testimonial.approved})">
                             ${testimonial.approved ? 'Unapprove' : 'Approve'}
                           </button>
                           ${
                             testimonial.email
                               ? `
                                 <button class="btn btn-small btn-replied" onclick="openEmailModal('testimonial', ${testimonial.id}, '${testimonial.email.replace(/'/g, "\\'")}')">
                                   ${testimonial.replied ? 'Email Again' : 'Reply'}
                                 </button>
                               `
                               : ''
                           }
                         </td>
                       </tr>
                     `
                   )
                   .join('')
               }
             </tbody>
           </table>
         `;
       } catch (error) {
         console.error('Error loading testimonials:', error);
         document.getElementById('testimonials-content').innerHTML =
           '<p class="error">Failed to load testimonials. Please try again.</p>';
       }
     };
 
     const loadBlogs = async () => {
       try {
        const response = await fetch('/api/blogs', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to load blogs');
        }

        const blogs = await response.json();

        if (!Array.isArray(blogs)) {
          throw new Error('Unexpected response format');
        }

        blogsCache.clear();
        blogs.forEach((blog) => {
          if (blog && blog.id) {
            blogsCache.set(String(blog.id), blog);
          }
          if (blog && blog.slug) {
            blogsCache.set(`slug:${blog.slug}`, blog);
          }
        });
 
         const blogsContent = document.getElementById('blogs-content');
 
         if (blogs.length === 0) {
           blogsContent.innerHTML = '<p>No blog posts found.</p>';
           return;
         }
 
         blogsContent.innerHTML = `
           <table class="data-table">
             <thead>
               <tr>
                 <th>Date</th>
                 <th>Title</th>
                 <th>Status</th>
                 <th>Excerpt</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               ${
                 blogs
                   .map(
                     (blog) => `
                       <tr>
                         <td>${new Date(blog.created_at).toLocaleDateString()}</td>
                         <td>${blog.title}</td>
                         <td>
                           <span class="${blog.status === 'published' ? 'status-published' : 'status-draft'}">
                            ${blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                           </span>
                         </td>
                         <td class="truncate">${blog.excerpt || blog.content.substring(0, 100)}...</td>
                        <td class="actions">
                          <button class="btn btn-small" onclick="editBlog(${blog.id}, '${(blog.slug || '').replace(/'/g, "\\'")}')">Edit</button>
                          <button class="btn btn-small" onclick="deleteBlog(${blog.id})">Delete</button>
                        </td>
                       </tr>
                     `
                   )
                   .join('')
               }
             </tbody>
           </table>
         `;
      } catch (error) {
        console.error('Error loading blogs:', error);
        document.getElementById('blogs-content').innerHTML =
          `<p class="error">${error.message || 'Failed to load blog posts. Please try again.'}</p>`;
      }
    };
 
     const setupTabs = () => {
       const tabBtns = document.querySelectorAll('.tab-btn');
       const navLinks = document.querySelectorAll('.nav-links a');
 
       tabBtns.forEach((btn) => {
         btn.addEventListener('click', () => {
           const tabId = btn.getAttribute('data-tab');
 
           tabBtns.forEach((b) => b.classList.remove('active'));
           btn.classList.add('active');
 
           navLinks.forEach((link) => {
             if (link.getAttribute('data-tab') === tabId) {
               link.classList.add('active');
             } else {
               link.classList.remove('active');
             }
           });
 
          document.getElementById('page-title').textContent =
            btn.textContent + (tabId === 'dashboard' ? ' Overview' : '');
 
           document.querySelectorAll('.tab-content').forEach((content) => {
             content.classList.remove('active');
           });
           document.getElementById(`${tabId}-tab`).classList.add('active');
 
           switch (tabId) {
             case 'contacts':
               loadContacts();
               break;
             case 'testimonials':
               loadTestimonials();
               break;
             case 'blogs':
               loadBlogs();
               break;
             case 'dashboard':
               loadDashboardStats();
               break;
           }
         });
       });
 
       navLinks.forEach((link) => {
         link.addEventListener('click', (e) => {
           e.preventDefault();
           const tabId = link.getAttribute('data-tab');
           const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
           if (tabBtn) {
             tabBtn.click();
           }
         });
       });
     };
 
     document.getElementById('blog-form').addEventListener('submit', async (e) => {
       e.preventDefault();
 
       const submitBtn = document.getElementById('blog-submit');
       const originalText = submitBtn.textContent;
      submitBtn.textContent = editingBlogId ? 'Updating...' : 'Publishing...';
       submitBtn.disabled = true;
 
       const formData = new FormData();
       formData.append('title', document.getElementById('blog-title').value);
       formData.append('content', document.getElementById('blog-content').value);
       formData.append('excerpt', document.getElementById('blog-excerpt').value);
       formData.append('status', document.getElementById('blog-status').value);
 
       const imageFile = document.getElementById('blog-image').files[0];
       if (imageFile) {
         formData.append('image', imageFile);
       }
 
       try {
      const response = await fetch(editingBlogId ? `/api/blogs/${editingBlogId}` : '/api/blogs', {
        method: editingBlogId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: formData
      });
 
         const result = await response.json();
 
         const messageDiv = document.getElementById('blog-message');
 
      if (response.ok) {
        messageDiv.textContent = editingBlogId ? 'Blog post updated successfully!' : 'Blog post published successfully!';
        messageDiv.className = 'message success';

        document.getElementById('blog-form').reset();
        document.getElementById('image-preview').innerHTML = '';
        resetBlogFormState();

        loadBlogs();
         } else {
           messageDiv.textContent = result.error || 'Failed to publish blog post.';
           messageDiv.className = 'message error';
         }
       } catch (error) {
         const messageDiv = document.getElementById('blog-message');
         messageDiv.textContent = 'Network error. Please try again.';
         messageDiv.className = 'message error';
       } finally {
         submitBtn.textContent = originalText;
         submitBtn.disabled = false;
       }
     });
 
     document.getElementById('file-upload').addEventListener('click', () => {
       document.getElementById('blog-image').click();
     });
 
     document.getElementById('blog-image').addEventListener('change', function (e) {
       const file = e.target.files[0];
       if (file) {
         const reader = new FileReader();
         reader.onload = function (event) {
           const preview = document.getElementById('image-preview');
           preview.innerHTML = `<img src="${event.target.result}" class="preview-image" alt="Preview">`;
         };
         reader.readAsDataURL(file);
       }
     });
 
     window.openEmailModal = function (type, recordId, email) {
       document.getElementById('email-to').value = email;
       document.getElementById('email-type').value = type;
       document.getElementById('email-record-id').value = recordId;
 
       let subjectPrefix = '';
       if (type === 'contact') {
         subjectPrefix = 'Re: Your inquiry to Legal Spectrum';
       } else if (type === 'testimonial') {
         subjectPrefix = 'Re: Your testimonial for Legal Spectrum';
       }
 
       document.getElementById('email-subject').value = subjectPrefix;
       document.getElementById('email-modal').style.display = 'flex';
     };
 
     document.getElementById('close-email-modal').addEventListener('click', () => {
       document.getElementById('email-modal').style.display = 'none';
     });
 
     document.getElementById('email-form').addEventListener('submit', async (e) => {
       e.preventDefault();
 
       const submitBtn = document.getElementById('email-submit');
       const originalText = submitBtn.textContent;
       submitBtn.textContent = 'Sending...';
       submitBtn.disabled = true;
 
       const formData = {
         to: document.getElementById('email-to').value,
         subject: document.getElementById('email-subject').value,
         message: document.getElementById('email-body').value,
         type: document.getElementById('email-type').value,
         recordId: document.getElementById('email-record-id').value
       };
 
       try {
         const response = await fetch('/api/send-email', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${authToken}`
           },
           body: JSON.stringify(formData)
         });
 
         const result = await response.json();
 
         const messageDiv = document.getElementById('email-status');
 
         if (response.ok) {
           messageDiv.textContent = 'Email sent successfully!';
           messageDiv.className = 'message success';
 
           setTimeout(() => {
             document.getElementById('email-modal').style.display = 'none';
             document.getElementById('email-form').reset();
             messageDiv.className = 'message';
 
             if (formData.type === 'contact') {
               loadContacts();
             } else if (formData.type === 'testimonial') {
               loadTestimonials();
             }
           }, 2000);
         } else {
           messageDiv.textContent = result.error || 'Failed to send email.';
           messageDiv.className = 'message error';
         }
       } catch (error) {
         const messageDiv = document.getElementById('email-status');
         messageDiv.textContent = 'Network error. Please try again.';
         messageDiv.className = 'message error';
       } finally {
         submitBtn.textContent = originalText;
         submitBtn.disabled = false;
       }
     });
 
     document.getElementById('logout-btn').addEventListener('click', async () => {
       try {
         await fetch('/api/admin/logout', {
           method: 'POST',
           headers: {
             Authorization: `Bearer ${authToken}`
           }
         });
       } catch (error) {
         // Ignore errors on logout
       }
 
       localStorage.removeItem('admin_token');
       window.location.href = '/admin/login';
     });
 
     window.deleteContact = async function (id) {
       if (confirm('Are you sure you want to delete this contact message?')) {
         try {
           const response = await fetch(`/api/contacts/${id}`, {
             method: 'DELETE',
             headers: {
               Authorization: `Bearer ${authToken}`,
               'Content-Type': 'application/json'
             }
           });
 
           const result = await response.json();
 
           if (response.ok) {
             alert('Contact message deleted successfully!');
             loadContacts();
             loadDashboardStats();
           } else {
             alert(result.error || 'Failed to delete contact message.');
           }
         } catch (error) {
           alert('Error deleting contact message. Please check the console for details.');
         }
       }
     };
 
      window.viewTestimonial = function (id) {
        alert('View testimonial details for ID: ' + id);
      };
 
     window.toggleApproval = async function (id, approve) {
       try {
         const response = await fetch(`/api/testimonials/${id}/approve`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${authToken}`
           },
           body: JSON.stringify({ approved: approve })
         });
 
         if (response.ok) {
           loadTestimonials();
           loadDashboardStats();
         }
       } catch (error) {
         console.error('Error updating approval:', error);
       }
     };
 
     window.editBlog = async function (id, slug) {
        try {
          let blog = blogsCache.get(String(id)) || (slug ? blogsCache.get(`slug:${slug}`) : null);

          if (!blog) {
            let response = await fetch(`/api/blogs/${id}`, {
              headers: { Authorization: `Bearer ${authToken}` }
            });

            if (!response.ok && slug) {
              response = await fetch(`/api/blogs/${slug}`);
            }

            if (!response.ok) {
              const error = await response.json().catch(() => ({}));
              throw new Error(error.error || 'Failed to load blog post');
            }

            blog = await response.json();
          }

          const tabBtn = document.querySelector('.tab-btn[data-tab="new-blog"]');
          if (tabBtn) tabBtn.click();

          document.getElementById('blog-title').value = blog.title || '';
          document.getElementById('blog-status').value = blog.status || 'published';
          document.getElementById('blog-excerpt').value = blog.excerpt || '';
          document.getElementById('blog-content').value = blog.content || '';
          document.getElementById('image-preview').innerHTML = blog.image
            ? `<img src="/${blog.image}" class="preview-image" alt="Current image">`
            : '';

          editingBlogId = id;
          const submitBtn = document.getElementById('blog-submit');
          submitBtn.textContent = 'Update Post';
        } catch (error) {
          console.error('Error loading blog post:', error);
          alert('Unable to load blog post for editing.');
        }
      };
 
     window.deleteBlog = async function (id) {
       if (confirm('Are you sure you want to delete this blog post?')) {
         try {
           const response = await fetch(`/api/blogs/${id}`, {
             method: 'DELETE',
             headers: { Authorization: `Bearer ${authToken}` }
           });
 
           if (response.ok) {
             loadBlogs();
           }
           alert('Blog is deleted successfully!');
         } catch (error) {
           console.error('Error deleting blog:', error);
         }
       }
     };
 
    (async () => {
      setupTabs();
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        loadDashboardStats();
 
        const fileUpload = document.getElementById('file-upload');
        if (fileUpload) {
          fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('is-dragging');
          });

          fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('is-dragging');
          });

          fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('is-dragging');
 
             const file = e.dataTransfer.files[0];
             if (file && file.type.startsWith('image/')) {
               const input = document.getElementById('blog-image');
               if (typeof DataTransfer !== 'undefined') {
                 const dt = new DataTransfer();
                 dt.items.add(file);
                 input.files = dt.files;
               } else {
                 input.files = e.dataTransfer.files;
               }
 
               const reader = new FileReader();
               reader.onload = function (event) {
                 const preview = document.getElementById('image-preview');
                 preview.innerHTML = `<img src="${event.target.result}" class="preview-image" alt="Preview">`;
               };
              reader.readAsDataURL(file);
            }
          });
        }
      }
    })();
   };
 
  onReady(async () => {
    await loadPartials();
    initNav();
    setCurrentYear();
    injectLegalServiceSchema();
    setCanonicalUrl();

    const page = document.body.getAttribute('data-page');
     switch (page) {
       case 'contact':
         initContactPage();
         break;
       case 'blog':
         initBlogPage();
         break;
       case 'blog-detail':
         initBlogDetailPage();
         break;
       case 'home':
         initHomePage();
         break;
       case 'login':
         initLoginPage();
         break;
       case 'forgot-password':
         initForgotPasswordPage();
         break;
       case 'unsubscribe':
         initUnsubscribePage();
         break;
       case 'dashboard':
         initDashboardPage();
         break;
       default:
         break;
     }
   });
 })();
