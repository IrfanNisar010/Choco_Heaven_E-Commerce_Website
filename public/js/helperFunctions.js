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
            window.location.reload();
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        console.log("Something went wrong");
    });
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