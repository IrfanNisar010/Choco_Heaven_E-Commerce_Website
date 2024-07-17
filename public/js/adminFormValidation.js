function updateLabel(input) {
    var label = input.nextElementSibling;
    var selectedImagesContainer = document.getElementById('selectedImagesContainer');

    if (!selectedImagesContainer) {
        console.error("Selected images container not found.");
        return;
    }

    if (input.files.length > 0) {
        for (var i = 0; i < input.files.length; i++) {
            var imageName = input.files[i].name;
            var imageElement = document.createElement('img');
            imageElement.src = URL.createObjectURL(input.files[i]);
            imageElement.width = 120;
            imageElement.height = 120;

            var imageNameElement = document.createElement('p');
            imageNameElement.textContent = imageName;

            var removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'btn btn-sm btn-danger';
            removeButton.style.marginLeft = '5px'; 
            removeButton.onclick = function() {
                removeImage(imageElement);
            };

            var imageContainer = document.createElement('div');
            imageContainer.style.marginBottom = '5px'; 
            imageContainer.appendChild(imageElement);
            imageContainer.appendChild(imageNameElement);
            imageContainer.appendChild(removeButton);
            selectedImagesContainer.appendChild(imageContainer);
        }
        label.innerText = 'Files selected';
    } else {
        label.innerText = 'Choose files';
    }
}

function removeImage(imageElement) {
    var input = document.getElementById('image');
    var selectedImagesContainer = document.getElementById('selectedImagesContainer');

    for (var i = 0; i < input.files.length; i++) {
        if (URL.createObjectURL(input.files[i]) === imageElement.src) {
            input.files = Array.from(input.files).filter(function(_, index) {
                return index !== i;
            });
            break;
        }
    }

    imageElement.parentNode.remove();

    if (input.files.length === 0) {
        var label = input.nextElementSibling;
        label.innerText = 'Choose files';
    }
}

function calculateDiscount() {
    var OriginalPriceInput = document.getElementById('mrp').value;
    var discountPriceInput = document.getElementById('discountPrice').value;
    
    var discountPrice = parseFloat(discountPriceInput);
    var OriginalPrice = parseFloat(OriginalPriceInput);
    
    if (!isNaN(discountPrice) && !isNaN(OriginalPrice)) {
        var discountPercentage = ((OriginalPrice - discountPrice) / OriginalPrice) * 100;
        document.getElementById('discount').value = parseInt(discountPercentage);
    }
}

function clearForm() {
    var form = document.getElementById("myForm");
    form.reset(); 
}

function updateLabelImg(input) {
    var label = input.nextElementSibling;
    if (input.files.length > 0) {
        label.innerText = input.files[0].name;
    } else {
        label.innerText = "Choose file";
    }
}

function validateForm() {
    var productName = document.getElementById('productName').value.trim();
    var brandsName = document.getElementById('brandsName').value.trim();
    var model = document.getElementById('model').value.trim();
    var inStock = document.getElementById('inStock').value.trim();
    var mrp = document.getElementById('mrp').value.trim();
    var discountPrice = document.getElementById('discountPrice').value.trim();
    const validationMessage = document.getElementById('validationMessages');

    if (!productName) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Please Enter Valid Product Name';
        return false;
    } else if (!/^[a-zA-Z\s]*$/.test(productName)) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Product Name can only contain letters and spaces';
        return false;
    }

    if (!BrandsName) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Please Enter Valid Brand Name';
        return false;
    }

    if (!model) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Please Enter Valid Model';
        return false;
    }

    if (!inStock || parseInt(inStock) < 0) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Enter Quantity of Products';
        return false;
    }

    if (!mrp.match(/^\d+$/)) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Enter Original Price';
        return false;
    }

    if (!discountPrice.match(/^\d+$/)) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Enter Discount Price';
        return false;
    }

    if (parseInt(mrp) < parseInt(discountPrice)) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'MRP cannot be less than Discount Price';
        return false;
    }

    return true;
}

function brandsFormValidation() {
    var BrandsName = document.getElementById('BrandsName').value.trim();
    const validationMessage = document.getElementById('validationMessages');

    if (BrandsName === '') {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Please Enter Valid Brands Name';
        return false;
    } else if (!/^[a-zA-Z\s]*$/.test(BrandsName)) {
        validationMessage.style.display = 'block';
        validationMessage.innerHTML = 'Brand Name can only contain letters and spaces';
        return false;
    }

    return true;
}


function validateCouponForm() {
    var message = document.getElementById('validationMessages');
    var discount = document.getElementById('discount').value.trim();
    var minmPrchsAmt = document.getElementById('minmPrchsAmt').value.trim();
    var maxRedeemableAmount = document.getElementById('maxRedeemableAmount').value.trim();

    let couponCode = document.getElementById('couponCode').value.trim();  
    let codeRegex = /^[A-Za-z0-9]{5,10}$/;

    if (!codeRegex.test(couponCode)) {
        message.style.display = 'block';
        message.textContent = "Coupon code must be 5-10 characters long and contain only letters and numbers.";
        return false;
    }

    if (!discount) {
        message.style.display = 'block';
        message.textContent = "Enter discount";
        return false;
    } else if (!minmPrchsAmt || minmPrchsAmt < 1) {
        message.style.display = 'block';
        message.textContent = "Enter minimum purchase amount";
        return false;
    } else if (!maxRedeemableAmount || maxRedeemableAmount < 100) {
        message.style.display = 'block';
        message.textContent = "Maximum redeemable amount must be greater than 100";
        return false;
    }

    let today = new Date();
    today.setHours(0, 0, 0, 0); 
    let expiredDate = new Date(document.getElementById('expiredDate').value);

    if (!expiredDate || expiredDate <= today) {
        message.style.display = 'block';
        message.textContent = "The expiration date must be a future date.";
        return false;
    }

    return true;
}

function validateBanner() {
    const head = document.getElementById('header').value.trim();
    const subHeader = document.getElementById('subHeader').value.trim();
    const message = document.getElementById('responseMessage');

    if (!head) {
        message.style.display = 'block';
        message.innerText = 'Please Enter Valid Header';
        return false;
    } else if (!subHeader) {
        message.style.display = 'block';
        message.innerText = 'Please Enter Valid SubHeader';
        return false;
    }

    return true;
}
