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

document.addEventListener('DOMContentLoaded', function() {
    const cancelButtons = document.querySelectorAll('.cancel-btn-order');
    const cancelOrderModal = new bootstrap.Modal(document.getElementById('cancelOrderModal'));

    cancelButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const orderId = this.getAttribute('data-order-id');
            document.getElementById('cancelOrderForm').setAttribute('data-order-id', orderId);
            cancelOrderModal.show();
        });
    });

    const otherReasonRadio = document.getElementById('reason5');
    otherReasonRadio.addEventListener('change', function() {
        document.getElementById('otherReasonContainer').style.display = this.checked ? 'block' : 'none';
    });

    document.getElementById('cancelOrderForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const orderId = this.getAttribute('data-order-id');
        const selectedReason = document.querySelector('input[name="reason"]:checked').value;
        const otherReason = document.getElementById('otherReason').value;

        const reason = selectedReason === 'Other' ? otherReason : selectedReason;

        try {
            const response = await fetch(`/cancelOrder?orderId=${orderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            const result = await response.json();

            if (result.success) {
                showSuccessAlert('Order cancelled successfully.');

                // Update the order status in the UI
                const orderStatusElement = document.querySelector(`#status[data-order-id="${orderId}"]`);
                if (orderStatusElement) {
                    orderStatusElement.textContent = `Order ${orderId} - Cancelled`;
                }

                // Optionally, you can update the order element to show the cancellation reason
                const reasonElement = document.querySelector(`#cancelReason[data-order-id="${orderId}"]`);
                if (reasonElement) {
                    reasonElement.textContent = `Cancellation Reason: ${reason}`;
                }
                // Hide the Cancel Order button
                this.style.display = 'none';
                window.location.reload();
            } else {
                showErrorAlert(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            showErrorAlert('An error occurred while cancelling the order.');
        }
    });
});

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
        <div class="msg msg-danger show d-flex align-items-center justify-content-center text-center" role="alert" id="message">
            <div class="d-flex align-items-center justify-content-center">
                <lord-icon
                    src="https://cdn.lordicon.com/nqtddedc.json"
                    trigger="in"
                    delay="100"
                    state="in-cross"
                    colors="primary:#e83a30"
                    style="width:50px;height:50px">
                </lord-icon> 
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
    }, 3000);
}

