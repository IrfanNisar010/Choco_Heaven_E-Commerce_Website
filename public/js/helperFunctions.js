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
            return response.json().then(data => {
                if (data.warning) {
                    showWarningAlert(data.message);
                } else {
                    showErrorAlert(data.message);
                }
                throw new Error('Error occurred: ' + data.message);
            });
        }
    })
    .then(data => {
        if (data) {
            console.log('Success:', data);
            showSuccessAlert('Item added to cart');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
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


function showWarningAlert(message) {
    const container = document.getElementById('success-message-container');

    // Create warning message
    const warningMessage = `
        <div class="msg msg-warning show d-flex align-items-center justify-content-center text-center" role="alert" style="color: black;">
            <div class="d-flex align-items-center justify-content-center">
                <lord-icon
                    src="https://cdn.lordicon.com/ygvjgdmk.json"
                    trigger="in"
                    delay="100"
                    colors="primary:#e88c30"
                    style="width:50px;height:50px;">
                </lord-icon>
            </div>
            ${message}
        </div>
    `;
    
    // Insert warning message into the container
    container.innerHTML = warningMessage;

    // Remove the message after 4 seconds with fade-out effect
    setTimeout(function() {
        const msgElement = container.querySelector('.msg');
        msgElement.classList.remove('fade-in');
        msgElement.classList.add('fade-out');
        setTimeout(function() {
            container.innerHTML = '';
        }, 1000); // Match this duration with fade-out animation duration
    }, 4000); 
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
            showWishlistSuccessAlert('Item added to wishlist');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        showErrorAlert('Something went wrong. Please try again.');
    });
}

function showWishlistSuccessAlert(message) {
    const container = document.getElementById('success-message-container');
    const wishlistSuccessSound = document.getElementById('wishlist-success-sound');
    
    // Play success sound
    if (wishlistSuccessSound) {
        wishlistSuccessSound.play().catch(error => {
            console.error('Audio play failed:', error);
        });
    } else {
        console.error('Wishlist success sound element not found.');
    }

    // Create success message
    const successMessage = `
        <div class="msg msg-success show d-flex align-items-center justify-content-center text-center fade-in" role="alert" style="color: black; border-color:#ee7c9b ">
            <div class="d-flex align-items-center justify-content-center">
                <lord-icon
                src="https://cdn.lordicon.com/etgnxeer.json"
                trigger="in"
                delay="100"
                stroke="bold"
                colors="primary:#f49cc8,secondary:#c69cf4"
                style="width:45px;height:45px">
            </lord-icon>
            </div style="color: black">
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


    async function confirmRemoveFromWishlist(event) {
        event.preventDefault(); // Prevent the default action

        const productId = event.currentTarget.dataset.productId;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FF3B30',
            cancelButtonColor: '#007AFF',
            confirmButtonText: 'Yes, remove',
            cancelButtonText: 'No, keep',
            customClass: {
                popup: 'swal2-custom-popup',
                title: 'swal2-custom-title',
                content: 'swal2-custom-content',
                confirmButton: 'swal2-custom-confirm-button',
                cancelButton: 'swal2-custom-cancel-button'
            }
        });

        if (result.isConfirmed) {
            removeFromWishlist(productId);
        }
    }

    async function removeFromWishlist(productId) {
        try {
            const response = await fetch(`/removeFromWishlist?productId=${productId}`, {
                method: 'GET'
            });

            if (response.ok) {
                Swal.fire(
                    'Removed!',
                    'The product has been removed from your wishlist.',
                    'success'
                ).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire(
                    'Error!',
                    'There was an error removing the product from your wishlist.',
                    'error'
                );
            }
        } catch (error) {
            Swal.fire(
                'Error!',
                'There was an error removing the product from your wishlist.',
                'error'
            );
        }
    }


// Function to confirm user logout
async function confirmLogout(event) {
    event.preventDefault(); // Prevent the default action

    const result = await Swal.fire({
        title: 'Are you sure you want to log out?',
        text: "You will need to log in again to access your account.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'black',
        cancelButtonColor: 'lightgrey',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        customClass: {
            popup: 'swal2-custom-popup',
            title: 'swal2-custom-title',
            content: 'swal2-custom-content',
            confirmButton: 'swal2-custom-confirm-button',
            cancelButton: 'swal2-custom-cancel-button'
        }
    });

    if (result.isConfirmed) {
        window.location.href = '/logout';
    }
}

// Attach the confirmLogout function to the logout button/link
document.getElementById('logoutButton').addEventListener('click', confirmLogout);





