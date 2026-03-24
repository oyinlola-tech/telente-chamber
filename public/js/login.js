// Toggle password visibility
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        
        togglePassword.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.textContent = 'Hide';
            } else {
                passwordInput.type = 'password';
                this.textContent = 'Show';
            }
        });
        
        // Login form handler
        const loginForm = document.getElementById('login-form');
        const loginSubmit = document.getElementById('login-submit');
        const messageDiv = document.getElementById('login-message');
        
        loginForm.addEventListener('submit', async function(e) {
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
                

                if(response.status === 401){
                    alert('Incorrect credentials. Please try again.');
                }
                
                const result = await response.json();
                
                console.log('Login response:', { status: response.status, result });
                
                if (response.ok) {
                    messageDiv.textContent = 'Login successful! Redirecting...';
                    messageDiv.className = 'message success';
                    
                    // Store token in localStorage
                    if (result.token) {
                        localStorage.setItem('admin_token', result.token);
                        console.log('Token stored in localStorage');
                    }
                    
                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = '/admin/dashboard';
                    }, 1000);
                } else {
                    messageDiv.textContent = result.error || 'Invalid email or password';
                    messageDiv.className = 'message error';
                    console.error('Login failed:', result);
                    loginSubmit.textContent = originalText;
                    loginSubmit.disabled = false;
                }
                
            } catch (error) {
                messageDiv.textContent = 'Network error. Please check your connection and try again.';
                messageDiv.className = 'message error';
                console.error('Network error:', error);
                loginSubmit.textContent = originalText;
                loginSubmit.disabled = false;
            }
        });
        
        // Clear message when user starts typing
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                messageDiv.style.display = 'none';
                messageDiv.textContent = '';
                messageDiv.className = 'message';
            });
        });
