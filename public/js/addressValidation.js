function showError(input, msg) {
    input.value = '';
    input.placeholder = msg;
    input.classList.add('error');
    input.style.borderColor = 'red';
}

function clearError(input) {
    input.style.borderColor = '';
    input.placeholder = '';
}

function addressValidation() {
    let Name = document.getElementById("fullName");
    let Phone = document.getElementById("phone");
    let PinCode = document.getElementById("PIN");
    let locality = document.getElementById("street");
    let address = document.getElementById("address");
    let city = document.getElementById("city");
    let state = document.getElementById("state");

    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^\d{10}$/; 
    const pinCodeRegex = /^\d{6}$/;

    let valid = true;

    if (!Name.value || Name.value.trim().length === 0) {
        showError(Name, "Full name is required.");
        valid = false;
    } else if (!nameRegex.test(Name.value)) {
        showError(Name, "Enter a valid full name.");
        valid = false;
    } else {
        Name.classList.remove('error');
        clearError(Name)
    }

    if (!phoneRegex.test(Phone.value)) {
        showError(Phone, "Enter a valid 10-digit phone number.");
        valid = false;
    } else {
        Phone.classList.remove('error');
        clearError(Phone)
    }

    if (!pinCodeRegex.test(PinCode.value)) {
        showError(PinCode, "Enter a valid 6-digit PIN code.");
        valid = false;
    } else {
        PinCode.classList.remove('error');
        clearError(PinCode)
    }

    if (!locality.value || locality.value.trim().length === 0) {
        showError(locality, "Enter a valid area/street.");
        valid = false;
    } else {
        locality.classList.remove('error');
        clearError(locality)
    }

    if (!address.value || address.value.trim().length === 0) {
        showError(address, "Enter a valid address.");
        valid = false;
    } else {
        address.classList.remove('error');
        clearError(address)
    }

    if (!city.value || city.value.trim().length === 0) {
        showError(city, "Enter a valid city.");
        valid = false;
    } else {
        city.classList.remove('error');
        clearError(city)
    }

    if (!state.value || state.value.trim().length === 0) {
        showError(state, "Enter a valid state.");
        valid = false;
    } else {
        state.classList.remove('error');
        clearError(state)
    }

    return valid;
}

document.getElementById('myForm').addEventListener('submit', function(event) {
    if (!addressValidation()) {
        event.preventDefault();
    }
});
