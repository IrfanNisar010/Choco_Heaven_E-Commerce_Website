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

document.getElementById('search-form').addEventListener('submit', function(event) {
  event.preventDefault()
  let queryParams = new URLSearchParams(window.location.search);
  let searchQuery = document.getElementById('search-input').value.trim()
  queryParams.set("search", searchQuery)
  window.location.href = `/loadShop?${queryParams.toString()}`
})


document.getElementById('search-form').addEventListener('submit', function(event) {
  event.preventDefault();
  let queryParams = new URLSearchParams(window.location.search);
  let searchQuery = document.getElementById('search-input').value.trim();
  queryParams.set("search", searchQuery);
  window.location.href = `/loadShop?${queryParams.toString()}`;
});


document.querySelectorAll('input[name="brand-filter"]').forEach(function(checkbox) {
  checkbox.addEventListener('change', function() {
      let form = document.getElementById('filterForm');
      let selectedBrands = Array.from(form.querySelectorAll('input[name="brand-filter"]:checked'))
                          .map(cb => cb.value);
      
      let queryParams = new URLSearchParams(window.location.search);
      queryParams.set("brands", selectedBrands.join(','));
      queryParams.set("page", 1); // Reset to the first page on filter change
      window.location.href = `/loadShop?${queryParams.toString()}`;
  });
});

$("#price-filter-form").on("submit", function (event) {
  event.preventDefault();
  var minPrice = $("#slider-range").slider("values", 0);
  var maxPrice = $("#slider-range").slider("values", 1);

  let queryParams = new URLSearchParams(window.location.search);
  queryParams.set("minPrice", minPrice);
  queryParams.set("maxPrice", maxPrice);
  queryParams.set("page", 1); // Reset to the first page on filter change

  window.location.href = `/loadShop?${queryParams.toString()}`;
});
