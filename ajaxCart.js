(function(window, $) {
  $.fn.ajaxCart = function(_opt) {
    var _opt = _opt || {};
    
    // Must be run on $("body")
    if (!$(this).is('body')) {
      console.error('$(...).ajaxCart() must be called on $("body")');
      return $(this);
    }
    
    if ($(this).hasClass('quick-view-wrapper')) {
      return $(this); 
    }
    
    // Make sure AC Client API is loaded
    if(typeof AC.init === 'undefined'){
      $.getScript('/store/inc/clientapi/ac-client-api.min.js', function(){
        AC.init({storeDomain : AC.sslDomain});
      });
    } else {
      AC.init({storeDomain : AC.sslDomain});
    }
    
    // Set Options
    var opt = {
      cart: {},
      dropdownCartSelector: _opt.dropdownCartSelector || '.ajax-cart',
      cartCountSelector: _opt.cartCountSelector || '.cart-count',
      cartItemsWrapperSelector: _opt.cartItemsWrapperSelector || '.ShopCartItemsWrapper',
      cartItemLayout: _opt.cartItemLayout || '<div class="SmallCartItem pad-t-15 pad-b-15 pad-l-10 pad-r-10 media" data-row="$$CARTROWID$$"><div class="pull-left m-r-15"><img src="/resize$$IMAGEURL$$?lr=t&bw=50" alt="$$ITEMNAME$$"></div><div class="pull-right m-t-15"><a class="badge clear-item-link" href="#">&times;</a></div><div class="media-body"><div>$$ITEMLINK$$</div><div>$$QUANTITY$$ &times; $$$PRICE$$</div></div></div><hr class="m-l-5 m-r-5 no-m-tb">',
      addToCartSelector: _opt.addToCartSelector || '.ProductDetailsAddToCartButton',
      isProductDetails: $(this).hasClass('ProductDetails')
    }
    
    // Function to merge Item object into cart template
    var mergeCartData = function(template, _item) {
      var item = {};
      for (i in _item) { item[i.toUpperCase()] = _item[i]; }
      return template.replace(/\$\$([^\W\$]+)\$\$/gi, function(m, a) {
        if (a === 'ITEMLINK') {
          return '<a class="SmallCartItemLink" href="/store/productdetails.aspx?itemID=' + item['ITEMID'] + '">' + item['ITEMNAME'] + '</a>';
        } else if (a === 'ITEMURL') {
          return '/store/productdetails.aspx?itemID=' + item['ITEMID'];
        } else if (typeof item[a] === 'string' || typeof item[a] === 'number') {
          if (a === 'IMAGEURL' && item[a] === '') {
            return '/store/images/default-product-image.jpg';
          }
          
          if (a === 'PRICE') {
            return formatMoney(item[a]);
          }
          
          return item[a];
        }
          
          return m;
      });
    };
    
    // Function to update Dropdown cart
    var updateCartDisplay = function(showCart) {
      $.get('/clientapi/cart?cachebust='+Date.now(), function(d) {
        opt.cart = d.data;
        
        $(opt.dropdownCartSelector).each(function() {
          var $cartList = $(opt.cartItemsWrapperSelector);
          $cartList.html('');
          
          $.each(opt.cart.items, function(i, item) {
            $cartList.append(mergeCartData(opt.cartItemLayout, item));
          });
          
          if (showCart) {
            $(this).prev('a').click(); 
          }
        });
        
        $(opt.cartCountSelector).text(opt.cart.totalItemCount);
        $('.LayoutTop [id*=lblSubTotal]').text('Subtotal: $' + formatMoney(opt.cart.subtotal));
        $('.update-qty-link').replaceWith('<div class="pad-t-5"></div>');
        
        if (opt.cart.totalItemCount > 0) {
          $(opt.dropdownCartSelector).find('.no-items').hide();
          if ($.trim($(opt.dropdownCartSelector).find('.some-items').text()) === '') {
            $.ajax({
              url: window.location.pathname,
              type: 'get',
              dataType: 'html',
              success: function(e) {
                $(opt.dropdownCartSelector).html($(e).find(opt.dropdownCartSelector).html());
                updateCartDisplay();
              }
            });
          } else {
            $(opt.dropdownCartSelector).find('.some-items').show();
          }
        } else {
          $(opt.dropdownCartSelector).find('.no-items').show();
          $(opt.dropdownCartSelector).find('.some-items').hide();
        }
      });
    };
    
    // Quick money formatting function
    var formatMoney = function(n) {
      return n.toFixed(2).replace(/./g, function(c, i, a) { return i && c !== '.' && ((a.length - i) % 3 === 0) ? ',' + c : c; });
    };
    
    $(this).on('click', opt.addToCartSelector, function(e) {
      e.preventDefault();
      
      product = {};
      if (opt.isProductDetails) {
        product.id = $('#hfItemID').val();
        product.itemId = product.id;
        product.quantity = $('#txtQuantity').val();
        product.variantIds = [];
        $('.Variant > input, .Variant > select').each(function(){ product.variantIds.push($(this).val()); });
      }
      
      AC.cart.add(product, function(r) {
        if (r.status.toLowerCase() !== 'ok') {
          alert(r.messages.join('\n'));
        }
        
        updateCartDisplay(true);
      });
      return false;
    });
    
    $(this).on('click', '[data-row] .clear-item-link', function(e) {
      e.preventDefault();
      e.stopPropagation();
      AC.cart.remove($(this).closest('[data-row]').attr('data-row'), function(r) {
        updateCartDisplay();
      });
      
      return false;
    });
    
    updateCartDisplay();
    
    return $(this);
  };
})(window, jQuery);

$(function() {
  $('body').ajaxCart();
});
