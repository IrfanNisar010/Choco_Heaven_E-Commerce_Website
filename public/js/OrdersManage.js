
function setActive(link) {
    const links = document.querySelectorAll('.sidebar .nav-link');
    links.forEach(link => link.classList.remove('active'));
    link.classList.add('active');
}

// Optional: Set the initial active link based on current URL or other logic
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.sidebar .nav-link');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});

 // Function to handle cancel order
 function cancelOrder(orderId) {
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Cancel Order",
        cancelButtonText: "No, Keep Order",
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/cancelOrder?orderId=${orderId}`, {
                method: 'GET'
            })
            .then(response => {
                if (response.ok) {
                    Swal.fire({
                        title: "Order Cancelled",
                        text: "The Order has been cancelled.",
                        icon: "success"
                    })
                    .then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        title: "Error",
                        text: "An error occurred while cancelling the order.",
                        icon: "error"
                    });
                }
            })
            .catch(error => {
                console.error("Error:", error);
                Swal.fire({
                    title: "Error",
                    text: "An error occurred while cancelling the order.",
                    icon: "error"
                });
            });
        }
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
        }, 800); // Match this duration with fade-out animation duration
    }, 4000); // Show message for 3 seconds, then start fading out
}
function returnOrder(orderId) {
    Swal.fire({
        title: 'Return Order',
        html: `
            <p class="return-order-message">Please provide a reason for returning your order. This will help us improve our service.</p>
            <textarea id="return-reason" class="swal2-textarea return-order-textarea" placeholder="Type your reason here..."></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel',
        customClass: {
            popup: 'return-order-popup',
            title: 'return-order-title',
            confirmButton: 'return-order-confirm-btn',
            cancelButton: 'return-order-cancel-btn'
        },
        preConfirm: () => {
            const reason = document.getElementById('return-reason').value;
            if (!reason) {
                Swal.showValidationMessage('You need to write something!');
                return false;
            }
            return reason;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/returnOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderId,
                    reason: result.value
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                showSuccessAlert('Your return request has been submitted.');
                setTimeout(() => {
                    window.location.reload(); 
                }, 4000); // Delay the reload to allow the success message to be seen
            })
            .catch(error => {
                console.error('Error returning the order:', error);
                showErrorAlert('Your return request could not be processed.');
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            showErrorAlert('Return order was canceled.');
        }
    });
}
