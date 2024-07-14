// checking email
function validateEmail(email) {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(String(email).toLowerCase());
}

// checking password
function validatePassword(password) {
    const letterRegex = /[a-zA-Z]/;
    const digitRegex = /\d/;
    return password.length >= 6 && letterRegex.test(password) && digitRegex.test(password);
}

function checkPassword(event) {
    event.preventDefault();
  
    let password = document.getElementById("password").value.trim();
    let confirmPassword = document.getElementById("confirmPassword")
    let message = document.getElementById("message");
    let email = document.getElementById("email").value.trim();
    let firstName = document.getElementById("firstName").value.trim();
    let lastName = document.getElementById("lastName").value.trim();
    const nameRegex = /^[a-zA-Z]+$/;
  
    if (firstName.length === 0 || lastName.length === 0 || firstName.slice(-1)==='' ) {
        message.textContent = "Name cannot be empty.";
        message.style.color = "red";
        return;
    }
    
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
        message.textContent = "Please enter a valid Name.";
        message.style.color = "red";
        return;
    }
  
    if (password.length === 0 || password[0] === " ") {
        message.textContent = "Please enter a valid Password";
        message.style.color = "red";
        return;
    }

    if (password != confirm-password.value){
        message.textContent = "Confirm password does not match";
        message.style.color = "red" ;
        return
    }
    // if (!validatePassword(password)) {
    //     message.textContent = "Password must be at least 6 characters long and contain at least one letter and one digit";
    //     message.style.color = "red";
    //     return; 
    // }
  
    if (!validateEmail(email)) {
        message.textContent = "Please enter a valid email address.";
        message.style.color = "red";
        return; 
    }
  
    console.log("Name, password, and email verified! Submitting form..."); 
    document.getElementById("signUpForm").submit();
}
$(document).ready(function() {
    if ($('.msg').length) {
      $('.msg').addClass('show');
      setTimeout(function() {
        $('.msg').removeClass('show');
      }, 4000);
    }
  });

// validation address
// function addressValidation(index) {
//     let Name = document.getElementById("name"+index).value;
//     let Phone = document.getElementById("phone"+index).value;
//     let Pincode = document.getElementById("pincode"+index).value;
//     let locality = document.getElementById("locality"+index).value;
//     let address = document.getElementById("address"+index).value;
//     let city = document.getElementById("city"+index).value;
//     let state = document.getElementById("state"+index).value;
//     let message = document.getElementById('message'+index);

//     const nameRegex = /^[a-zA-Z]+$/;
//     const phoneRegex = /^\d{10}$/; 
//     const pincodeRegex = /^\d{6}$/;

//     if (Name.length === 0 || Name[0]==' ' || !Name) {
//         message.textContent = "Name cannot be empty.";
//         message.style.color = "red";
//         return;
//     }
    
//     if (!nameRegex.test(Name)) {
//         message.textContent = "Please enter a valid Name.";
//         message.style.color = "red";
//         return;
//     }

//     if (!phoneRegex.test(Phone)) {
//         message.textContent = "Please enter a valid Phone Number";
//         message.style.color = "red";
//         return;
//     }

//     if (!pincodeRegex.test(Pincode)) {
//         message.textContent = "Please enter a valid PIN Address";
//         message.style.color = "red";
//         return;
//     }

//     if(!locality || locality[0]==' '){
//         message.textContent = "Please enter a valid Locality";
//         message.style.color = "red";
//         return;
//     }

//     if(!address || address[0]==' '){
//         message.textContent = "Please enter a valid Address";
//         message.style.color = "red";
//         return;
//     }

//     if(!city || city[0]==' '){
//         message.textContent = "Please Add City";
//         message.style.color = "red";
//         return;
//     }

//     if(!state || state[0]==' '){
//         message.textContent = "Please enter a valid state";
//         message.style.color = "red";
//         return;
//     }

//     return true

// }


//  update profile form validation
// function updateProfileValidation() {

//     let message = document.getElementById("message");
//     let firstName = document.getElementById("fName").value 
//     let lastName = document.getElementById("lName").value
//     let phone = document.getElementById("phone").value


//     const nameRegex = /^[a-zA-Z]+$/;
//     const phoneRegex = /^[0-9]{10}$/; 

//     if (firstName[0]== 0 || lastName[0]== 0 || !firstName || !lastName) {
//         message.textContent = "Name cannot be empty.";
//         return false;
//     }
    
//     if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
//         message.textContent = "Please enter a valid name.";
//         return false;
//     }

//     if (!phone) {
//         message.textContent = "Please enter a valid phone number.";
//         return false;
//     }
  
//     if (!phoneRegex.test(phone)) {
//         message.textContent = "Please enter a valid phone number.";
//         return false;
//     }

//     return true
// }

//  update password validation
// function updatePasswordValidation(){
//     let password = document.getElementById("newPassword").value.trim();
//     let confirm-password = document.getElementById("confmPassword")
//     let message = document.getElementById("passwordMsg")

//     if (password.length === 0 || password[0] === " ") {
//         message.style.display = "block" ;
//         message.textContent = "Please enter a valid Password";
//         return false;
//     }

//     if (password != confirm-password.value){
//         message.style.display = "block" ;
//         message.textContent = "Conform password does not match";
//         return false;

//     }
//     if (!validatePassword(password)) {
//         message.style.display = "block" ;
//         message.textContent = "Password must be at least 6 characters long and contain at least one letter and one digit";
//         return false;
//     }
//     return true

// }