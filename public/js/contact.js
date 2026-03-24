// Update year in footer
        document.addEventListener('DOMContentLoaded', function() {
            const currentYear = new Date().getFullYear();
            const copyrightElements = document.querySelectorAll('p');
            copyrightElements.forEach(el => {
                if (el.textContent.includes('Legal Spectrum')) {
                    el.innerHTML = el.innerHTML.replace(/\d{4}\s+Legal Spectrum/, `${currentYear} Legal Spectrum`);
                }
            });
        });

        // Contact form handler
        document.getElementById('contact-form').addEventListener('submit', async (e) => {
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
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                const messageDiv = document.getElementById('contact-status');
                
                if (response.ok) {
                    messageDiv.textContent = 'Message sent successfully! We will get back to you soon.';
                    messageDiv.className = 'message success';
                    document.getElementById('contact-form').reset();
                } else {
                    messageDiv.textContent = result.error || 'Failed to send message. Please try again.';
                    messageDiv.className = 'message error';
                }
                
                // Scroll to message
                messageDiv.scrollIntoView({ behavior: 'smooth' });
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
                
            } catch (error) {
                const messageDiv = document.getElementById('contact-status');
                messageDiv.textContent = 'Network error. Please check your connection and try again.';
                messageDiv.className = 'message error';
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
        
        // Testimonial form handler
        document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('testimonial-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
            
            const rating = document.querySelector('input[name="rating"]:checked');
            if (!rating) {
                const messageDiv = document.getElementById('testimonial-status');
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
                
                const messageDiv = document.getElementById('testimonial-status');
                
                if (response.ok) {
                    messageDiv.textContent = 'Thank you for sharing your experience! Your testimonial will be reviewed.';
                    messageDiv.className = 'message success';
                    document.getElementById('testimonial-form').reset();
                } else {
                    messageDiv.textContent = result.error || 'Failed to submit testimonial. Please try again.';
                    messageDiv.className = 'message error';
                }
                
                // Scroll to message
                messageDiv.scrollIntoView({ behavior: 'smooth' });
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
                
            } catch (error) {
                const messageDiv = document.getElementById('testimonial-status');
                messageDiv.textContent = 'Network error. Please check your connection and try again.';
                messageDiv.className = 'message error';
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
        
        // Rating star interaction
        document.querySelectorAll('.rating input').forEach(input => {
            input.addEventListener('change', (e) => {
                const stars = e.target.closest('.rating').querySelectorAll('label');
                const rating = parseInt(e.target.value);
                
                stars.forEach((star, index) => {
                    if (index < rating) {
                        star.style.color = '#000';
                    } else {
                        star.style.color = '#ddd';
                    }
                });
            });
        });
        
        // Initialize stars
        document.querySelectorAll('.rating label').forEach(star => {
            star.addEventListener('mouseover', (e) => {
                const rating = parseInt(e.target.htmlFor.replace('star', ''));
                const stars = e.target.closest('.rating').querySelectorAll('label');
                
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.style.color = '#000';
                    }
                });
            });
            
            star.addEventListener('mouseout', (e) => {
                const rating = e.target.closest('.rating').querySelector('input:checked');
                const stars = e.target.closest('.rating').querySelectorAll('label');
                
                if (rating) {
                    const ratingValue = parseInt(rating.value);
                    stars.forEach((s, index) => {
                        if (index < ratingValue) {
                            s.style.color = '#000';
                        } else {
                            s.style.color = '#ddd';
                        }
                    });
                } else {
                    stars.forEach(s => {
                        s.style.color = '#ddd';
                    });
                }
            });
        });
