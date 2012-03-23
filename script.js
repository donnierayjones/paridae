$(document).ready(function() {
  $('body').on('click', 'a[target="_blank"]', function(e) {
    e.preventDefault();
    var $link = $(this);
    chrome.extension.sendRequest({url: $link.attr('href')});
  });

  // disable jquery animations
  document.location = 'javascript:$.fx.off=true;';
});
