// Role switch logic
const employeeBtn = document.getElementById('employee-btn');
const adminBtn = document.getElementById('admin-btn');
const roleInput = document.getElementById('role-input');

if (employeeBtn && adminBtn && roleInput) {
    employeeBtn.addEventListener('click', function() {
        employeeBtn.classList.add('selected');
        adminBtn.classList.remove('selected');
        roleInput.value = 'employee';
    });
    adminBtn.addEventListener('click', function() {
        adminBtn.classList.add('selected');
        employeeBtn.classList.remove('selected');
        roleInput.value = 'admin';
    });
}

// Password visibility toggle
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');
if (passwordInput && eyeIcon) {
    eyeIcon.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.add('active');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('active');
        }
    });
}
