/* ================== PAGE SWITCHER (final patch) ================== */
function showPage(id){
  const pages = [
    'loginPage','registerPage','dashboardPage','forgotPasswordPage',
    'aboutPage','privacyPage','settingsPage','editProfilePage'
  ];
  pages.forEach(p=>{
    const el = document.getElementById(p);
    if(!el) return;

    /* old pages use .hidden */
    if(['loginPage','registerPage','dashboardPage','editProfilePage','forgotPasswordPage'].includes(p)){
      el.classList.toggle('hidden', p !== id);
    }
    /* new static pages use .show */
    else{
      el.classList.toggle('show', p === id);
    }
    el.setAttribute('aria-hidden', p !== id ? 'true' : 'false');
  });
}
showPage('loginPage');

/* ---------- AUTH NAVIGATION ---------- */
document.getElementById('goRegister').addEventListener('click', ()=> showPage('registerPage'));
document.getElementById('goLogin').addEventListener('click', ()=> showPage('loginPage'));
document.getElementById('forgotPassword').addEventListener('click', ()=> showPage('forgotPasswordPage'));
document.getElementById('backToLogin').addEventListener('click', ()=> showPage('loginPage'));

/* ---------- PASSWORD TOGGLES ---------- */
function togglePassword(inputId, toggleId){
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if(!input||!toggle) return;
  toggle.addEventListener('click', ()=> {
    if(input.type === 'password'){ input.type='text'; toggle.textContent='🙈'; }
    else{ input.type='password'; toggle.textContent='👁️‍🗨️'; }
  });
}
togglePassword('loginPass','toggleLoginPass');
togglePassword('registerPass','toggleRegisterPass');
togglePassword('registerConfirm','toggleRegisterConfirm');

/* ================== EMAIL VALIDATION ================== */
function isValidEmail(email) {
  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function hasValidDomain(email) {
  // Check if domain looks valid (has a dot after @)
  const domain = email.split('@')[1];
  if (!domain) return false;
  
  // Common fake domains to reject
  const fakeDomains = ['example.com', 'test.com', 'fake.com', 'demo.com', 'localhost'];
  if (fakeDomains.includes(domain.toLowerCase())) {
    return false;
  }
  
  // Domain should have at least one dot
  return domain.includes('.');
}

function isCommonEmailProvider(email) {
  // List of common email providers
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
    'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com',
    'mail.com', 'yandex.com', 'gmx.com'
  ];
  
  const domain = email.split('@')[1];
  return commonProviders.includes(domain.toLowerCase());
}

function validateEmail(email) {
  const emailLower = email.toLowerCase().trim();
  
  // Check if empty
  if (!emailLower) {
    return { isValid: false, message: 'Email is required' };
  }
  
  // Check basic format
  if (!isValidEmail(emailLower)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  // Check domain
  if (!hasValidDomain(emailLower)) {
    return { isValid: false, message: 'Please use a valid email domain' };
  }
  
  // Check for obvious fake emails
  if (emailLower.includes('test@') || emailLower.includes('fake@') || 
      emailLower.includes('admin@') || emailLower.includes('user@') ||
      emailLower.length < 6) {
    return { 
      isValid: false, 
      message: 'Please use a real email address' 
    };
  }
  
  // Check for common providers (for better UX)
  if (!isCommonEmailProvider(emailLower)) {
    // Still valid, but warn about uncommon providers
    return { 
      isValid: true, 
      message: 'Uncommon email provider detected',
      warning: true 
    };
  }
  
  return { isValid: true, message: 'Valid email' };
}

/* ================== USER DATABASE (LOCAL) ================== */
// Store multiple users locally
function getAllUsers() {
  const usersStr = localStorage.getItem('tasklyUsers');
  return usersStr ? JSON.parse(usersStr) : [];
}

function saveUser(user) {
  const users = getAllUsers();
  users.push(user);
  localStorage.setItem('tasklyUsers', JSON.stringify(users));
  // Also save as current user
  localStorage.setItem('tasklyUser', JSON.stringify(user));
}

function findUserByEmail(email) {
  const users = getAllUsers();
  return users.find(user => user.email === email);
}

function updateUser(email, updatedUser) {
  const users = getAllUsers();
  const index = users.findIndex(user => user.email === email);
  if (index !== -1) {
    users[index] = {...users[index], ...updatedUser};
    localStorage.setItem('tasklyUsers', JSON.stringify(users));
    
    // Update current user if it's the same email
    const currentUser = JSON.parse(localStorage.getItem('tasklyUser') || '{}');
    if (currentUser.email === email) {
      localStorage.setItem('tasklyUser', JSON.stringify(users[index]));
    }
    return true;
  }
  return false;
}

/* ---------- REGISTER ---------- */
document.getElementById('registerBtn').addEventListener('click', ()=> {
  const fName = document.getElementById('registerFirstName').value.trim();
  const lName = document.getElementById('registerLastName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const pass = document.getElementById('registerPass').value.trim();
  const conf = document.getElementById('registerConfirm').value.trim();
  
  // Validate all fields
  if(!fName||!lName||!email||!pass||!conf){ 
    alert('Please fill all fields'); 
    return; 
  }
  
  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    alert(emailValidation.message);
    return;
  }
  
  if(pass !== conf){ 
    alert('Passwords do not match'); 
    return; 
  }
  
  if(pass.length < 6){ 
    alert('Password must be at least 6 characters'); 
    return; 
  }
  
  const emailLower = email.toLowerCase();
  
  // Check if email already exists
  if (findUserByEmail(emailLower)) {
    alert('An account with this email already exists. Please sign in instead.');
    return;
  }
  
  // Show warning for uncommon email providers
  if (emailValidation.warning) {
    const proceed = confirm(`You're using an uncommon email provider (${emailLower.split('@')[1]}).\n\nSome features may work better with common providers like Gmail, Yahoo, or Outlook.\n\nDo you want to continue?`);
    if (!proceed) return;
  }
  
  const user = {
    fName, 
    lName, 
    email: emailLower, 
    pass,
    isGoogleUser: false,
    createdAt: new Date().toISOString(),
    emailVerified: false // Track if email is verified (for real apps)
  };
  
  saveUser(user);
  alert('Registration successful! Please sign in.');
  showPage('loginPage');
});

/* ---------- LOGIN ---------- */
document.getElementById('loginBtn').addEventListener('click', ()=>{
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  
  if(!email || !pass){ 
    alert('Please enter email and password'); 
    return; 
  }
  
  // Validate email format
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    alert(emailValidation.message);
    return;
  }
  
  const emailLower = email.toLowerCase();
  const user = findUserByEmail(emailLower);
  
  if(!user){
    alert('No account found with this email. Please register first.');
    return;
  }
  
  if(user.isGoogleUser){
    // Google user trying to use password login
    const createPass = confirm('This is a Google account. Would you like to create a password for this account?');
    if(createPass){
      const newPass = prompt('Create a password for your account (min 6 characters):');
      if(newPass && newPass.length >= 6){
        user.pass = newPass;
        updateUser(emailLower, user);
        alert('Password created successfully! You can now sign in with email and password.');
      }
    }
    return;
  }
  
  if(user.pass !== pass){
    alert('Incorrect password. Please try again.');
    return;
  }
  
  // Save as current user
  localStorage.setItem('tasklyUser', JSON.stringify(user));
  
  showPage('dashboardPage');
  loadTasks();
  loadProfilePreview();
  startReminderTimers();
});

/* ---------- FORGOT PASSWORD ---------- */
document.getElementById('resetPasswordBtn').addEventListener('click', ()=> {
  const email = document.getElementById('forgotEmail').value.trim();
  
  if(!email){ 
    alert('Please enter your email address'); 
    return; 
  }
  
  // Validate email format
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    alert(emailValidation.message);
    return;
  }
  
  const emailLower = email.toLowerCase();
  const user = findUserByEmail(emailLower);
  
  if(!user){
    alert('No account found with this email. Please check and try again.');
    return;
  }
  
  if(user.isGoogleUser){
    alert('This is a Google account. Please use Google Sign-In to access your account.');
    return;
  }
  
  // In a real app, you would send an email reset link here
  alert(`Password reset instructions have been sent to ${emailLower}\n\n(In a real app, this would send an email with reset link)`);
  
  showPage('loginPage');
});

/* ================== GOOGLE SIGN-IN SIMULATION ================== */
// Simulate Google OAuth flow
function simulateGoogleSignInFlow(isRegister = false) {
  // Create Google auth modal
  const googleModal = document.createElement('div');
  googleModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  const googleContent = document.createElement('div');
  googleContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  `;
  
  const isLoginPage = !document.getElementById('loginPage').classList.contains('hidden');
  
  if (isLoginPage) {
    googleContent.innerHTML = `
      <h3 style="margin-bottom: 20px; color: #333;">Google Sign-In</h3>
      <p style="color: #666; margin-bottom: 20px;">Enter your Google email to sign in</p>
      <input type="email" id="googleEmailInput" placeholder="yourname@gmail.com" 
        style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
      <div id="emailValidationMessage" style="color: #e74c3c; font-size: 14px; margin-bottom: 10px; min-height: 20px;"></div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="googleCancel" style="padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Cancel
        </button>
        <button id="googleContinue" style="padding: 12px 24px; background: #4285F4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Continue
        </button>
      </div>
    `;
  } else {
    googleContent.innerHTML = `
      <h3 style="margin-bottom: 20px; color: #333;">Google Sign-Up</h3>
      <p style="color: #666; margin-bottom: 20px;">Enter your Google email to create account</p>
      <input type="email" id="googleEmailInput" placeholder="yourname@gmail.com" 
        style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
      <div id="emailValidationMessage" style="color: #e74c3c; font-size: 14px; margin-bottom: 10px; min-height: 20px;"></div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="googleCancel" style="padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Cancel
        </button>
        <button id="googleContinue" style="padding: 12px 24px; background: #4285F4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Continue
        </button>
      </div>
    `;
  }
  
  googleModal.appendChild(googleContent);
  document.body.appendChild(googleModal);
  
  // Focus on input
  setTimeout(() => {
    document.getElementById('googleEmailInput').focus();
  }, 100);
  
  // Real-time email validation
  const emailInput = document.getElementById('googleEmailInput');
  const validationMessage = document.getElementById('emailValidationMessage');
  
  emailInput.addEventListener('input', () => {
    const email = emailInput.value.trim();
    if (!email) {
      validationMessage.textContent = '';
      return;
    }
    
    const validation = validateEmail(email);
    if (!validation.isValid) {
      validationMessage.textContent = validation.message;
      validationMessage.style.color = '#e74c3c';
    } else if (validation.warning) {
      validationMessage.textContent = `Note: ${validation.message}`;
      validationMessage.style.color = '#f39c12';
    } else {
      validationMessage.textContent = '✓ Valid email format';
      validationMessage.style.color = '#27ae60';
    }
  });
  
  // Cancel button
  document.getElementById('googleCancel').addEventListener('click', () => {
    document.body.removeChild(googleModal);
  });
  
  // Continue button
  document.getElementById('googleContinue').addEventListener('click', () => {
    const googleEmail = emailInput.value.trim();
    
    if (!googleEmail) {
      alert('Please enter an email address');
      return;
    }
    
    // Validate email
    const emailValidation = validateEmail(googleEmail);
    if (!emailValidation.isValid) {
      alert(emailValidation.message);
      return;
    }
    
    const emailLower = googleEmail.toLowerCase();
    
    // Check if user exists
    const existingUser = findUserByEmail(emailLower);
    
    if (existingUser) {
      // User exists - log them in
      localStorage.setItem('tasklyUser', JSON.stringify(existingUser));
      document.body.removeChild(googleModal);
      showPage('dashboardPage');
      loadTasks();
      loadProfilePreview();
      startReminderTimers();
      
      if (existingUser.isGoogleUser) {
        alert(`Welcome back ${existingUser.fName}! Signed in with Google.`);
      } else {
        alert(`Welcome back ${existingUser.fName}!`);
      }
    } else {
      // New user - ask for password to create account
      document.body.removeChild(googleModal);
      createGoogleAccountWithPassword(emailLower);
    }
  });
  
  // Enter key support
  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('googleContinue').click();
    }
  });
  
  // Close on background click
  googleModal.addEventListener('click', (e) => {
    if (e.target === googleModal) {
      document.body.removeChild(googleModal);
    }
  });
}

// Function to create Google account with password
function createGoogleAccountWithPassword(googleEmail) {
  const passwordModal = document.createElement('div');
  passwordModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  const passwordContent = document.createElement('div');
  passwordContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  `;
  
  // Extract name from email for suggestions
  const emailName = googleEmail.split('@')[0];
  const suggestedFirstName = emailName.split('.')[0] || 'User';
  const suggestedLastName = emailName.split('.')[1] || 'Name';
  
  passwordContent.innerHTML = `
    <h3 style="margin-bottom: 20px; color: #333;">Create Account</h3>
    <p style="color: #666; margin-bottom: 10px;">Email: <strong>${googleEmail}</strong></p>
    <p style="color: #666; margin-bottom: 20px;">Create a password for your account</p>
    
    <div style="margin-bottom: 15px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">First Name</label>
      <input type="text" id="googleFirstName" value="${suggestedFirstName.charAt(0).toUpperCase() + suggestedFirstName.slice(1)}" placeholder="First name" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
    </div>
    
    <div style="margin-bottom: 15px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">Last Name</label>
      <input type="text" id="googleLastName" value="${suggestedLastName.charAt(0).toUpperCase() + suggestedLastName.slice(1)}" placeholder="Last name" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
    </div>
    
    <div style="margin-bottom: 15px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">Password</label>
      <input type="password" id="googlePassword" placeholder="Password (min 6 characters)" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
      <div id="passwordStrength" style="font-size: 12px; margin-top: 5px;"></div>
    </div>
    
    <div style="margin-bottom: 20px; text-align: left;">
      <label style="display: block; margin-bottom: 5px; font-weight: 600;">Confirm Password</label>
      <input type="password" id="googleConfirmPassword" placeholder="Confirm password" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
      <div id="passwordMatch" style="font-size: 12px; margin-top: 5px;"></div>
    </div>
    
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button id="googleCreateCancel" style="padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Cancel
      </button>
      <button id="googleCreateAccount" style="padding: 12px 24px; background: #4285F4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Create Account
      </button>
    </div>
  `;
  
  passwordModal.appendChild(passwordContent);
  document.body.appendChild(passwordModal);
  
  // Focus on first name input
  setTimeout(() => {
    document.getElementById('googleFirstName').focus();
  }, 100);
  
  // Password strength indicator
  const passwordInput = document.getElementById('googlePassword');
  const confirmInput = document.getElementById('googleConfirmPassword');
  const passwordStrength = document.getElementById('passwordStrength');
  const passwordMatch = document.getElementById('passwordMatch');
  
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    let strength = 'Weak';
    let color = '#e74c3c';
    
    if (password.length >= 8) {
      strength = 'Good';
      color = '#f39c12';
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      strength = 'Strong';
      color = '#27ae60';
    }
    
    passwordStrength.textContent = `Strength: ${strength}`;
    passwordStrength.style.color = color;
  });
  
  confirmInput.addEventListener('input', () => {
    if (passwordInput.value && confirmInput.value) {
      if (passwordInput.value === confirmInput.value) {
        passwordMatch.textContent = '✓ Passwords match';
        passwordMatch.style.color = '#27ae60';
      } else {
        passwordMatch.textContent = '✗ Passwords do not match';
        passwordMatch.style.color = '#e74c3c';
      }
    } else {
      passwordMatch.textContent = '';
    }
  });
  
  // Cancel button
  document.getElementById('googleCreateCancel').addEventListener('click', () => {
    document.body.removeChild(passwordModal);
  });
  
  // Create Account button
  document.getElementById('googleCreateAccount').addEventListener('click', () => {
    const fName = document.getElementById('googleFirstName').value.trim();
    const lName = document.getElementById('googleLastName').value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmInput.value.trim();
    
    if (!fName || !lName || !password || !confirmPassword) {
      alert('Please fill all fields');
      return;
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Create the user
    const googleUser = {
      fName,
      lName,
      email: googleEmail,
      pass: password,
      isGoogleUser: true,
      createdAt: new Date().toISOString(),
      emailVerified: true // Google emails are considered verified
    };
    
    saveUser(googleUser);
    document.body.removeChild(passwordModal);
    showPage('dashboardPage');
    loadTasks();
    loadProfilePreview();
    startReminderTimers();
    alert(`Welcome ${fName}! Your account has been created.`);
  });
  
  // Enter key support
  const inputs = ['googleFirstName', 'googleLastName', 'googlePassword', 'googleConfirmPassword'];
  inputs.forEach(inputId => {
    document.getElementById(inputId).addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('googleCreateAccount').click();
      }
    });
  });
  
  // Close on background click
  passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
      document.body.removeChild(passwordModal);
    }
  });
}

// Google Sign-In buttons
document.getElementById('googleSign').addEventListener('click', () => simulateGoogleSignInFlow(false));
document.getElementById('googleRegister').addEventListener('click', () => simulateGoogleSignInFlow(true));

/* ================== SIDEBAR ================== */
const hamburger = document.getElementById('hamburger');
const sidebar   = document.getElementById('sidebar');
let hambOpen = false;

hamburger.addEventListener('click', () => {
  hambOpen = true;
  sidebar.classList.add('show');
  hamburger.classList.toggle('open', true);
  hamburger.querySelector('.line').textContent = '✖';
});
document.getElementById('closeSidebarBtn').addEventListener('click', () => {
  hambOpen = false;
  sidebar.classList.remove('show');
  hamburger.classList.toggle('open', false);
  hamburger.querySelector('.line').textContent = '☰';
});
function closeSidebar(){
  hambOpen = false;
  sidebar.classList.remove('show');
  hamburger.classList.toggle('open', false);
  hamburger.querySelector('.line').textContent = '☰';
}

/* ---------- SIDEBAR NAV ---------- */
document.getElementById('navAbout').addEventListener('click', () => { closeSidebar(); showPage('aboutPage'); });
document.getElementById('navPrivacy').addEventListener('click', () => { closeSidebar(); showPage('privacyPage'); });
document.getElementById('navSettings').addEventListener('click', () => { closeSidebar(); showPage('settingsPage'); });
document.getElementById('navProfile').addEventListener('click', () => { closeSidebar(); showPage('editProfilePage'); });

/* ================== PROFILE PANEL ================== */
const profileIcon = document.getElementById('profileIcon');
const profilePanel = document.getElementById('profilePanel');
function loadProfilePreview(){
  const user = JSON.parse(localStorage.getItem('tasklyUser') || 'null');
  const img = localStorage.getItem('tasklyProfileImg') || '';
  if(user){
    document.getElementById('profileNameText').textContent = `${user.fName||''} ${user.lName||''}`;
    document.getElementById('profileEmailText').textContent = user.email||'';
  } else {
    document.getElementById('profileNameText').textContent = 'Guest';
    document.getElementById('profileEmailText').textContent = '';
  }
}
profileIcon.addEventListener('click', (e)=>{
  e.stopPropagation();
  notifyPanelClose();
  profilePanel.classList.toggle('show') ? loadProfilePreview() : profilePanel.classList.remove('show');
});
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  profilePanel.classList.remove('show');
  showPage('loginPage');
});
document.getElementById('openEditProfileFromPopup').addEventListener('click', ()=>{
  profilePanel.classList.remove('show');
  showPage('editProfilePage');
});

/* ================== FULL PAGE EDIT PROFILE ================== */
const editFirstFull  = document.getElementById('editFirstFull');
const editLastFull   = document.getElementById('editLastFull');
const editEmailFull  = document.getElementById('editEmailFull');
const editProfilePreviewFull = document.getElementById('editProfilePreviewFull');
const editImageInputFull     = document.getElementById('editImageInputFull');
const saveEditFull           = document.getElementById('saveEditFull');

/* pre-fill when page opens */
(function(){
  const user = JSON.parse(localStorage.getItem('tasklyUser') || '{}');
  editFirstFull.value = user.fName||'';
  editLastFull.value  = user.lName||'';
  editEmailFull.value = user.email||'';
  const img = localStorage.getItem('tasklyProfileImg');
  if(img) editProfilePreviewFull.src = img;
})();

/* save */
saveEditFull.addEventListener('click', ()=>{
  const fName = editFirstFull.value.trim();
  const lName = editLastFull.value.trim();
  const email = editEmailFull.value.trim();
  
  if(!fName||!lName||!email){ 
    alert('Fill all fields'); 
    return; 
  }
  
  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    alert(emailValidation.message);
    return;
  }
  
  const emailLower = email.toLowerCase();
  const currentUser = JSON.parse(localStorage.getItem('tasklyUser')||'{}');
  
  // Check if email is being changed to one that already exists
  if (emailLower !== currentUser.email) {
    const existingUser = findUserByEmail(emailLower);
    if (existingUser) {
      alert('This email is already registered. Please use a different email.');
      return;
    }
  }
  
  const updated = {
    ...currentUser,
    fName,
    lName,
    email: emailLower
  };
  
  // Update in users database
  updateUser(currentUser.email, updated);
  
  localStorage.setItem('tasklyProfileImg', editProfilePreviewFull.src);
  alert('Profile updated successfully!');
  showPage('dashboardPage');
});

/* image upload */
editImageInputFull.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=> editProfilePreviewFull.src = r.result;
  r.readAsDataURL(f);
});

/* ================== NOTIFICATIONS ================== */
const notifyIcon = document.getElementById('notifyIcon');
const notifyPanel = document.getElementById('notifyPanel');
function notifyPanelOpen(){
  const list = document.getElementById('notifyList');
  const rems = JSON.parse(localStorage.getItem('tasklyReminders')||'[]');
  list.innerHTML = rems.length ? rems.slice().reverse().map(r=>`
    <div class="pop-item">${r.title} — ${new Date(r.reminderAt).toLocaleString()}</div>
  `).join('') : '<div style="color:#666">No reminders</div>';
  notifyPanel.classList.add('show');
}
function notifyPanelClose(){ notifyPanel.classList.remove('show'); }
notifyIcon.addEventListener('click', (e)=>{
  e.stopPropagation();
  profilePanel.classList.remove('show');
  notifyPanel.classList.contains('show') ? notifyPanelClose() : notifyPanelOpen();
});
document.getElementById('clearNotifications').addEventListener('click', ()=>{
  localStorage.setItem('tasklyReminders', JSON.stringify([]));
  document.getElementById('notifyList').innerHTML = '<div style="color:#666">All reminders cleared</div>';
});

/* close panels on outside click */
document.addEventListener('click', (e)=>{
  if(!e.target.closest('#profilePanel')&&!e.target.closest('#profileIcon')) profilePanel.classList.remove('show');
  if(!e.target.closest('#notifyPanel')&&!e.target.closest('#notifyIcon')) notifyPanelClose();
});

/* ================== SEARCH ================== */
const searchIcon = document.getElementById('searchIcon');
const searchInput = document.getElementById('searchInput');
searchIcon.addEventListener('click', (e)=>{
  e.stopPropagation();
  if(searchInput.classList.contains('show')){ 
    searchInput.classList.remove('show'); 
    searchInput.value=''; 
    loadTasks(); 
  } else { 
    searchInput.classList.add('show'); 
    searchInput.focus(); 
  }
});
searchInput.addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  const tasks = JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  renderTasksList(tasks.filter(t=>(t.title+' '+t.desc).toLowerCase().includes(q)));
});

/* ================== BACKDROP ================== */
const backdrop = document.getElementById('backdrop');
const frame = document.getElementById('frame');
function showBackdrop(){ backdrop.classList.add('show'); frame.classList.add('scaled'); }
function hideBackdrop(){ backdrop.classList.remove('show'); frame.classList.remove('scaled'); }
backdrop.addEventListener('click', ()=>{ hideAddCard(); hideBackdrop(); });

/* ================== TASK CRUD & REMINDERS (with Gmail swipe) ========== */
const tasksContainer = document.getElementById('tasksContainer');
const openAddTaskBtn = document.getElementById('openAddTask');
const addTaskCard = document.getElementById('addTaskCard');
const closeTaskCard = document.getElementById('closeTaskCard');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const taskReminderSelect = document.getElementById('taskReminder');
const taskReminderCustom = document.getElementById('taskReminderCustom');

let editingIndex = null;
let reminderTimers = [];

openAddTaskBtn.addEventListener('click', ()=> openAddCard());
closeTaskCard.addEventListener('click', hideAddCard);
cancelAddBtn.addEventListener('click', hideAddCard);

function openAddCard(editIndex=null, taskObj=null){
  editingIndex = editIndex;
  document.getElementById('addCardTitle').textContent = editIndex===null ? 'Add New Task' : 'Edit Task';
  if(taskObj){
    document.getElementById('taskTitle').value = taskObj.title;
    document.getElementById('taskDescription').value = taskObj.desc;
    document.getElementById('taskDate').value = taskObj.date;
    document.getElementById('taskTime').value = taskObj.time;
    document.getElementById('taskPriority').value = taskObj.priority||'';
    if(taskObj.reminder&&taskObj.reminder.offsetMin!=null){
      const off = taskObj.reminder.offsetMin;
      if([5,10,30].includes(off)){ 
        taskReminderSelect.value=String(off); 
        taskReminderCustom.style.display='none'; 
      } else { 
        taskReminderSelect.value='custom'; 
        taskReminderCustom.style.display='inline-block'; 
        taskReminderCustom.value=off; 
      }
    } else { 
      taskReminderSelect.value='none'; 
      taskReminderCustom.style.display='none'; 
      taskReminderCustom.value=''; 
    }
  } else resetAddForm();
  addTaskCard.classList.add('show');
  addTaskCard.setAttribute('aria-hidden','false');
  showBackdrop();
  addTaskCard.scrollTop = 0;
}

function hideAddCard(){
  addTaskCard.classList.remove('show');
  addTaskCard.setAttribute('aria-hidden','true');
  resetAddForm();
  hideBackdrop();
}

function resetAddForm(){
  ['taskTitle','taskDescription','taskDate','taskTime'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('taskPriority').selectedIndex=0;
  taskReminderSelect.value='none';
  taskReminderCustom.style.display='none'; 
  taskReminderCustom.value='';
  editingIndex=null;
}

taskReminderSelect.addEventListener('change', (e)=>{
  taskReminderCustom.style.display = e.target.value==='custom' ? 'inline-block' : 'none';
});

saveTaskBtn.addEventListener('click', ()=>{
  const title = document.getElementById('taskTitle').value.trim();
  const desc  = document.getElementById('taskDescription').value.trim();
  const date  = document.getElementById('taskDate').value;
  const time  = document.getElementById('taskTime').value;
  const priority = document.getElementById('taskPriority').value;
  const remind = taskReminderSelect.value;
  const customMin = taskReminderCustom.value ? parseInt(taskReminderCustom.value,10) : null;
  
  if(!title||!desc||!date||!time||!priority){ 
    alert('Please fill all fields'); 
    return; 
  }

  let offsetMin = null;
  if(remind==='5') offsetMin=5;
  else if(remind==='10') offsetMin=10;
  else if(remind==='30') offsetMin=30;
  else if(remind==='custom' && customMin && !isNaN(customMin)) offsetMin=customMin;

  const taskDateTime = new Date(date+'T'+time);
  let reminderAt = null;
  if(offsetMin!==null) reminderAt = new Date(taskDateTime.getTime() - offsetMin*60*1000);

  const taskObj = {
    title,
    desc,
    date,
    time,
    priority,
    reminder: reminderAt ? {
      reminderAt: reminderAt.getTime(),
      reminderAtHuman: reminderAt.toLocaleString(),
      offsetMin
    } : null
  };
  
  const tasks = JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  editingIndex===null ? tasks.push(taskObj) : tasks[editingIndex]=taskObj;
  localStorage.setItem('tasklyTasks', JSON.stringify(tasks));
  persistReminders();
  scheduleAllReminders();
  hideAddCard();
  renderTasksList(tasks);
});

/* reminders */
function persistReminders(){
  const tasks = JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  const rems = [];
  tasks.forEach((t,idx)=>{
    if(t.reminder&&t.reminder.reminderAt) rems.push({
      index: idx,
      title: t.title,
      reminderAt: t.reminder.reminderAt
    });
  });
  localStorage.setItem('tasklyReminders', JSON.stringify(rems));
}

function clearAllTimers(){ 
  reminderTimers.forEach(t=>clearTimeout(t.id)); 
  reminderTimers=[]; 
}

function scheduleAllReminders(){
  clearAllTimers();
  const tasks = JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  tasks.forEach((t,idx)=>{
    if(t.reminder&&t.reminder.reminderAt){
      const ms = t.reminder.reminderAt - Date.now();
      if(ms>0){
        const id = setTimeout(()=>{
          alert('Reminder — '+t.title+' at '+new Date(t.reminder.reminderAt).toLocaleString());
          notifyPanelOpen();
          reminderTimers = reminderTimers.filter(x=>x.id!==id);
        },ms);
        reminderTimers.push({id,index:idx});
      }
    }
  });
}

function startReminderTimers(){ scheduleAllReminders(); }

/* ---------- NEW GMAIL-STYLE RENDER ---------- */
function renderTasksList(tasks){
  tasksContainer.innerHTML='';
  if(!tasks||!tasks.length){
    const empty=document.createElement('div');
    empty.style.color='#fff'; 
    empty.style.opacity='0.95';
    empty.textContent='No tasks yet — add your first one!';
    tasksContainer.appendChild(empty); 
    return;
  }
  
  tasks.forEach((t,idx)=>{
    const wrap=document.createElement('div'); 
    wrap.className='swipe-wrap'; 
    wrap.dataset.index=idx;

    /* red delete background */
    const delBg=document.createElement('div'); 
    delBg.className='delete-bg'; 
    delBg.innerHTML='<span>🗑</span>';

    const surface=document.createElement('div'); 
    surface.className='task-surface';
    surface.innerHTML=`
      <div style="position:relative;">
        <div class="priority ${t.priority}">${t.priority}</div>
        <strong>${escapeHtml(t.title)}</strong>
        <p>${escapeHtml(t.desc)}</p>
        <small>${t.date} ${t.time}</small>
      </div>`;
    surface.addEventListener('click',()=>openAddCard(idx,t));

    attachSwipeHandlers(surface,delBg,idx);

    wrap.appendChild(delBg); 
    wrap.appendChild(surface); 
    tasksContainer.appendChild(wrap);
  });
}

function doDeleteTask(index){
  const tasks=JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  tasks.splice(index,1);
  localStorage.setItem('tasklyTasks',JSON.stringify(tasks));
  persistReminders(); 
  scheduleAllReminders(); 
  loadTasks();
}

/* ---------- GMAIL-STYLE SWIPE HANDLER ---------- */
function attachSwipeHandlers(surface, delBg, index) {
  let startX = 0, currentX = 0, touching = false;
  const threshold = 80; // px to trigger delete

  function unify(e) { return e.changedTouches ? e.changedTouches[0] : e; }

  function onStart(e) {
    const ev = unify(e);
    startX = ev.clientX;
    currentX = 0;
    touching = true;
    surface.style.transition = 'none';
    if (e.type === 'mousedown') document.addEventListener('mousedown', onMove);
  }

  function onMove(e) {
    if (!touching) return;
    const ev = unify(e);
    currentX = ev.clientX - startX;

    if (currentX < 0) {
      const tx = Math.max(currentX, -120);
      surface.style.transform = `translateX(${tx}px)`;
      const ratio = Math.min(Math.abs(tx) / threshold, 1);
      delBg.style.opacity = ratio;
      delBg.querySelector('span').style.transform = `scale(${0.8 + 0.2 * ratio})`;
    }
  }

  function onEnd(e) {
    touching = false;
    surface.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

    if (Math.abs(currentX) > threshold) {
      surface.style.transform = 'translateX(-100%)';
      setTimeout(() => doDeleteTask(index), 300);
    } else {
      surface.style.transform = '';
      delBg.style.opacity = 0;
      delBg.querySelector('span').style.transform = 'scale(0.8)';
    }

    if (e.type === 'mouseup') document.removeEventListener('mousedown', onMove);
  }

  surface.addEventListener('touchstart', onStart, { passive: true });
  surface.addEventListener('touchmove', onMove, { passive: true });
  surface.addEventListener('touchend', onEnd, { passive: true });
  surface.addEventListener('mousedown', onStart);
  surface.addEventListener('mouseup', onEnd);
  surface.addEventListener('mouseleave', () => { if (touching) onEnd({ type: 'mouseup' }); });

  /* tap the red background to delete too */
  delBg.addEventListener('click', () => {
    surface.style.transform = 'translateX(-100%)';
    setTimeout(() => doDeleteTask(index), 300);
  });
}

/* ---------- UTIL ---------- */
function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>"]/g, s => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;'
  }[s]));
}

/* ---------- INIT ---------- */
function loadTasks(){ 
  renderTasksList(JSON.parse(localStorage.getItem('tasklyTasks')||'[]')); 
  persistReminders();
}
window.loadTasks=loadTasks;
loadProfilePreview();
startReminderTimers();

/* ---------- KEYBOARD ESC ---------- */
document.addEventListener('keydown',(e)=>{ 
  if(e.key==='Escape'){ 
    hideAddCard(); 
    hideBackdrop(); 
  } 
});

/* ---------- REMEMBER ME ---------- */
const rememberCk=document.getElementById('rememberMe');
const emailInput=document.getElementById('loginEmail');
window.addEventListener('DOMContentLoaded',()=>{
  const saved=localStorage.getItem('rememberedEmail');
  if(saved){ 
    emailInput.value=saved; 
    rememberCk.checked=true; 
  }
});
document.getElementById('loginBtn').addEventListener('click',()=>{
  if(rememberCk.checked) {
    localStorage.setItem('rememberedEmail', emailInput.value.trim());
  } else {
    localStorage.removeItem('rememberedEmail');
  }
});

/* ---------- UNIVERSAL BACK-BUTTON HANDLER ---------- */
document.addEventListener('click', e => {
  if(!e.target.matches('.back-btn')) return;
  e.stopPropagation();
  showPage('dashboardPage');
});

/* ---- PROFILE PHOTO PICKER ---- */
document.querySelector('.edit-photo').addEventListener('click', e => {
  if (e.target.matches('::after') || e.offsetY > 130)
    document.getElementById('editImageInputFull').click();
});

/* ================== INITIAL DATA SETUP ================== */
// Initialize users array if it doesn't exist
if (!localStorage.getItem('tasklyUsers')) {
  localStorage.setItem('tasklyUsers', JSON.stringify([]));
}

// Initialize tasks if it doesn't exist
if (!localStorage.getItem('tasklyTasks')) {
  localStorage.setItem('tasklyTasks', JSON.stringify([]));
}

// Initialize reminders if it doesn't exist
if (!localStorage.getItem('tasklyReminders')) {
  localStorage.setItem('tasklyReminders', JSON.stringify([]));
}