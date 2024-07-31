// Add to Cart Function

function addToCart(event, productId) {
    event.preventDefault(); 

    fetch(`/addToCart?productId=${productId}`)
    .then(response => {
        if (response.ok) {
            return response.json();
        } else if (response.status === 401) {
            return response.json().then(data => {
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                    return;
                }
                throw new Error('Unauthorized, no redirect URL provided.');
            });
        } else {
            throw new Error('Network response was not ok.');
        }
    })
    .then(data => {
        if (data) {
            console.log('Success:', data);
            showSuccessAlert('Item added to cart successfully!');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        showErrorAlert('Something went wrong. Please try again.');
    });
}

function showSuccessAlert(message) {
    const container = document.getElementById('success-message-container');
    const successSound = document.getElementById('success-sound');
    
    // Play success sound
    if (successSound) {
        successSound.play().catch(error => {
            console.error('Audio play failed:', error);
        });
    } else {
        console.error('Success sound element not found.');
    }

    // Create success message
    const successMessage = `
        <div class="msg msg-success show d-flex align-items-center justify-content-center text-center fade-in" role="alert" style="color: black;">
            <div class="d-flex align-items-center justify-content-center">
                <lord-icon src="https://cdn.lordicon.com/oqdmuxru.json" trigger="in" delay="100" state="morph-check-in-1" colors="primary:#34c759" style="width:50px;height:50px"></lord-icon>
            </div>
            ${message}
        </div>
    `;
    
    // Insert success message into the container
    container.innerHTML = successMessage;

    // Remove the message after 4 seconds with fade-out effect
    setTimeout(function() {
        const msgElement = container.querySelector('.msg');
        msgElement.classList.remove('fade-in');
        msgElement.classList.add('fade-out');
        setTimeout(function() {
            container.innerHTML = '';
        }, 1000); // Match this duration with fade-out animation duration
    }, 3000); // Show message for 3 seconds, then start fading out
}

function showErrorAlert(message) {
    const container = document.getElementById('success-message-container');
    const errorSound = document.getElementById('error-sound');

    // Play error sound
    if (errorSound) {
        errorSound.play().catch(error => {
            console.error('Audio play failed:', error);
        });
    } else {
        console.error('Error sound element not found.');
    }

    // Create error message
    const errorMessage = `
        <div class="msg msg-danger show d-flex align-items-center justify-content-center text-center fade-in" role="alert" style="color: black;">
            <div class="d-flex align-items-center justify-content-center">
                <lord-icon src="https://cdn.lordicon.com/nqtddedc.json" trigger="in" delay="100" state="in-cross" colors="primary:#e83a30" style="width:50px;height:50px"></lord-icon>
            </div>
            ${message}
        </div>
    `;
    
    // Insert error message into the container
    container.innerHTML = errorMessage;

    // Remove the message after 4 seconds with fade-out effect
    setTimeout(function() {
        const msgElement = container.querySelector('.msg');
        msgElement.classList.remove('fade-in');
        msgElement.classList.add('fade-out');
        setTimeout(function() {
            container.innerHTML = '';
        }, 1000); // Match this duration with fade-out animation duration
    }, 3000); // Show message for 3 seconds, then start fading out
}


// add to wishlist function

function addToWishlist(event, productId) {
    event.preventDefault(); 

    fetch(`/addToWishlist?productId=${productId}`)
    .then(response => {
        if (response.ok) {
            return response.json();
        } else if (response.status === 401) {
            return response.json().then(data => {
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                    return;
                }
                throw new Error('Unauthorized, no redirect URL provided.');
            });
        } else {
            throw new Error('Network response was not ok.');
        }
    })
    .then(data => {
        if (data) {
            console.log('Success:', data);
            window.location.reload();
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        console.log("Something went wrong");
    });
}