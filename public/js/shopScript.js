function toggleBrands(productId) {
  var extraProducts = document.getElementById("extra-products");
  if (extraProducts.style.display === "none") {
    extraProducts.style.display = "block";
  } else {
    extraProducts.style.display = "none";
  }
  var icon = document.querySelector(
    `[data-target="#collapse-${productId}"] .fas`
  );
  icon.classList.toggle("fa-angle-right");
  icon.classList.toggle("fa-angle-down");
}

$(function () {
  $("#slider-range").slider({
    range: true,
    min: 0,
    max: 5000,
    values: [75, 5000],
    slide: function (event, ui) {
      $("#amount").val("₹" + ui.values[0] + " - ₹" + ui.values[1]);
    },
  });
  $("#amount").val(
    "₹" +
      $("#slider-range").slider("values", 0) +
      " - ₹" +
      $("#slider-range").slider("values", 1)
  );
});

$("#price-filter-form").on("submit", function (event) {
  event.preventDefault();
  var minPrice = $("#slider-range").slider("values", 0);
  var maxPrice = $("#slider-range").slider("values", 1);

  filterProductsByPrice(minPrice, maxPrice);
});

function filterProductsByPrice(minPrice, maxPrice) {
  $(".product-box").each(function () {
    var price = parseFloat($(this).find(".price").text().replace("₹", ""));
    if (price >= minPrice && price <= maxPrice) {
      $(this).parent().show();
    } else {
      $(this).parent().hide();
    }
  });
}

document
  .getElementById("shop-sort")
  .addEventListener("change", function (event) {
    let queryParams = new URLSearchParams(window.location.search);
    queryParams.set("sort", event.target.value);

    window.location.href = `/loadShop?${queryParams.toString()}`;
  });

document
  .getElementById("pagination")
  .addEventListener("click", function (event) {
    if (event.target.classList.contains("page-link")) {
      event.preventDefault();
      let queryParams = new URLSearchParams(window.location.search);
      queryParams.set("page", event.target.innerText);

      window.location.href = `/loadShop?${queryParams.toString()}`;
    }
  });

  function openSearchModal() {
    document.getElementById("search-modal").style.display = "block";
}

function closeSearchModal() {
    document.getElementById("search-modal").style.display = "none";
}

// Close the modal when the user clicks anywhere outside of the modal
window.onclick = function(event) {
    const modal = document.getElementById("search-modal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Search Logic
document.getElementById('search-form').addEventListener('submit', function(event) {
  event.preventDefault();
  let queryParams = new URLSearchParams(window.location.search);
  let searchQuery = document.getElementById('search-input').value.trim();
  queryParams.set("search", searchQuery);
  window.location.href = `/loadShop?${queryParams.toString()}`;
});

// Get current URL params and retain selected brands after page load
document.addEventListener('DOMContentLoaded', function () {
  let queryParams = new URLSearchParams(window.location.search);
  let selectedBrands = queryParams.get('brands') ? queryParams.get('brands').split(',') : [];

  // Re-check checkboxes based on selected brands in URL
  selectedBrands.forEach(function(brandId) {
      let checkbox = document.querySelector(`input[name="brand-filter"][value="${encodeURIComponent(brandId)}"]`);
      if (checkbox) {
          checkbox.checked = true; // Keep previously selected brands checked
      }
  });
});

// Handle brand filter change event
document.querySelectorAll('input[name="brand-filter"]').forEach(function (checkbox) {
  checkbox.addEventListener('change', function () {
      let form = document.getElementById('filterForm');
      let selectedBrands = Array.from(form.querySelectorAll('input[name="brand-filter"]:checked'))
          .map(cb => encodeURIComponent(cb.value));  // Collect selected brands

      let queryParams = new URLSearchParams(window.location.search);
      queryParams.set("brands", selectedBrands.join(',')); // Update URL with selected brands
      queryParams.set("page", 1);  // Reset to page 1 on filter change

      // Redirect with updated query parameters
      window.location.href = `/loadShop?${queryParams.toString()}`;
  });
});

$(document).ready(function () {
  // Extract minPrice and maxPrice from server-rendered values
  let minPrice = parseInt($('#minPrice').val()); // Get the minPrice from a hidden field or backend-rendered value
  let maxPrice = parseInt($('#maxPrice').val()); // Same for maxPrice

  // Initialize the slider with the current min and max prices
  $("#slider-range-2").slider({
    range: true,
    min: 0,
    max: 5000,
    values: [minPrice, maxPrice],  // Initialize with current min and max
    slide: function (event, ui) {
      $("#amount-2").val(`₹${ui.values[0]} - ₹${ui.values[1]}`);
    }
  });

  // Set the initial display of the price range
  $("#amount-2").val(`₹${minPrice} - ₹${maxPrice}`);

  // On form submit, update the URL with the selected price range and refresh
  $("#price-filter-form").on("submit", function (event) {
    event.preventDefault();
    const minPrice = $("#slider-range-2").slider("values", 0);
    const maxPrice = $("#slider-range-2").slider("values", 1);

    let queryParams = new URLSearchParams(window.location.search);
    queryParams.set("minPrice", minPrice);
    queryParams.set("maxPrice", maxPrice);
    queryParams.set("page", 1); // Reset to the first page on filter change

  });
});

document.addEventListener('DOMContentLoaded', function() {
  // Get the form and clear button
  const filterForm = document.getElementById('filterForm');
  const clearFilterButton = document.getElementById('clearFilterButton');

  // Get all the checkboxes inside the form
  const checkboxes = filterForm.querySelectorAll('input[name="brand-filter"]');

  // Function to check if any brand is selected
  function updateClearButtonVisibility() {
      const anySelected = Array.from(checkboxes).some(checkbox => checkbox.checked);
      clearFilterButton.style.display = anySelected ? 'inline-block' : 'none'; // Show if selected
  }

  // Event listener for checkbox change
  checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateClearButtonVisibility);
  });

  // Initial check to show/hide the button based on current selections
  updateClearButtonVisibility();

  // Clear filters when the button is clicked
  clearFilterButton.addEventListener('click', function() {
      checkboxes.forEach(checkbox => checkbox.checked = false); // Uncheck all brands
      const queryParams = new URLSearchParams(window.location.search);
      queryParams.delete('brands'); // Remove 'brands' from query params
      window.location.href = `/loadShop?${queryParams.toString()}`; // Reload page without brands
  });
});