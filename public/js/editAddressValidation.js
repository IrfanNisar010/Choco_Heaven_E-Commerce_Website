function showEditError(input, msg) {
    input.value = '';
    input.placeholder = msg;
    input.classList.add('error');
    input.style.borderColor = 'red';
    // Show error message below the input field
    let errorSpan = input.nextElementSibling;
    if (errorSpan && errorSpan.classList.contains('error-message')) {
        errorSpan.textContent = msg;
    }
}

function clearEditError(input) {
    input.style.borderColor = '';
    input.placeholder = '';
    // Clear error message below the input field
    let errorSpan = input.nextElementSibling;
    if (errorSpan && errorSpan.classList.contains('error-message')) {
        errorSpan.textContent = '';
    }
}

function editAddressValidation(i) {
    let Name = document.getElementById(`name${i}`);
    let Email = document.getElementById(`email${i}`);
    let Phone = document.getElementById(`Mobile${i}`);
    let Address = document.getElementById(`address${i}`);
    let Street = document.getElementById(`street${i}`);
    let City = document.getElementById(`city${i}`);
    let State = document.getElementById(`state${i}`);
    let PinCode = document.getElementById(`PIN${i}`);

    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^[1-9]\d{9}$/; // Exactly 10 digits, no leading zeros
    const pinCodeRegex = /^\d{6}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let valid = true;

    if (!Name.value || Name.value.trim().length === 0) {
        showEditError(Name, "Full name is required.");
        valid = false;
    } else if (!nameRegex.test(Name.value)) {
        showEditError(Name, "Enter a valid full name.");
        valid = false;
    } else {
        Name.classList.remove('error');
        clearEditError(Name);
    }

    if (!emailRegex.test(Email.value)) {
        showEditError(Email, "Enter a valid email address.");
        valid = false;
    } else {
        Email.classList.remove('error');
        clearEditError(Email);
    }

    let phoneValue = Phone.value.replace(/\s+/g, ''); // Remove spaces for validation
    if (!phoneRegex.test(phoneValue)) {
        showEditError(Phone, "Enter a valid 10-digit phone number without leading zeros.");
        valid = false;
    } else {
        Phone.classList.remove('error');
        clearEditError(Phone);
    }

    if (!pinCodeRegex.test(PinCode.value)) {
        showEditError(PinCode, "Enter a valid 6-digit PIN code.");
        valid = false;
    } else {
        PinCode.classList.remove('error');
        clearEditError(PinCode);
    }

    if (!Street.value || Street.value.trim().length === 0) {
        showEditError(Street, "Enter a valid area/street.");
        valid = false;
    } else {
        Street.classList.remove('error');
        clearEditError(Street);
    }

    if (!Address.value || Address.value.trim().length === 0) {
        showEditError(Address, "Enter a valid address.");
        valid = false;
    } else {
        Address.classList.remove('error');
        clearEditError(Address);
    }

    if (!City.value || City.value.trim().length === 0) {
        showEditError(City, "Enter a valid city.");
        valid = false;
    } else {
        City.classList.remove('error');
        clearEditError(City);
    }

    if (!State.value || State.value.trim().length === 0) {
        showEditError(State, "Enter a valid state.");
        valid = false;
    } else {
        State.classList.remove('error');
        clearEditError(State);
    }

    return valid;
}

function submitEditForm(event, i) {
    if (!editAddressValidation(i)) {
        event.preventDefault();
    }
}
