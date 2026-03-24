// State management
        let currentStep = 1;
        let userEmail = '';
        let otp = '';
        let countdownInterval;
        let resendCountdown = 60;
        let resendInterval;
        
        // DOM Elements
        const steps = document.querySelectorAll('.step');
        const step1Container = document.getElementById('step1-container');
        const step2Container = document.getElementById('step2-container');
        const step3Container = document.getElementById('step3-container');
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
        
        // Update steps
        function updateSteps(step) {
            steps.forEach((s, index) => {
                if (index < step) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
            
            // Hide all containers
            step1Container.classList.add('hidden');
            step2Container.classList.add('hidden');
            step3Container.classList.add('hidden');
            
            // Show current container
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
        }
        
        // OTP Input handling
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                // Allow only numbers
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                
                // Move to next input if current is filled
                if (e.target.value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
                
                updateOTPValue();
            });
            
            input.addEventListener('keydown', (e) => {
                // Handle backspace
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
        
        function focusFirstOTPInput() {
            setTimeout(() => otpInputs[0].focus(), 100);
        }
        
        function updateOTPValue() {
            otp = Array.from(otpInputs).map(input => input.value).join('');
            hiddenOtp.value = otp;
            verifyOtpBtn.disabled = otp.length !== 6;
        }
        
        // OTP Timer
        function startOTPTimer() {
            let timeLeft = 10 * 60; // 10 minutes in seconds
            
            if (countdownInterval) clearInterval(countdownInterval);
            
            countdownInterval = setInterval(() => {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    timerElement.parentElement.classList.add('expired');
                    timerElement.textContent = 'OTP expired';
                    verifyOtpBtn.disabled = true;
                }
            }, 1000);
        }
        
        // Resend timer
        function startResendTimer() {
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
        }
        
        // Password validation
        function validatePassword() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Password strength
            let strength = 0;
            if (password.length >= 8) strength++;
            if (/[a-z]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            let strengthText = '';
            let strengthClass = '';
            switch(strength) {
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
            
            // Password match
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
            
            // Enable button if conditions met
            const isValid = password.length >= 8 && password === confirmPassword;
            resetPasswordBtn.disabled = !isValid;
        }
        
        passwordInput.addEventListener('input', validatePassword);
        confirmPasswordInput.addEventListener('input', validatePassword);
        
        // Clear message
        function clearMessage() {
            messageDiv.className = 'message';
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
        }
        
        // Show message
        function showMessage(text, type) {
            messageDiv.textContent = text;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
        }
        
        // Step 1: Send OTP
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
        
        // Step 2: Verify OTP
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
        
        // Resend OTP
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
                    // Clear OTP inputs
                    otpInputs.forEach(input => input.value = '');
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
        
        // Step 3: Reset Password
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
                    
                    // Redirect to login after 3 seconds
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
        
        // Initialize
        updateSteps(1);
        
        // Clear message when user starts typing
        document.addEventListener('input', () => {
            if (messageDiv.style.display === 'block') {
                clearMessage();
            }
        });
