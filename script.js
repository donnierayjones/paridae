$(document).ready(function() {
  $('.stream-container').on('click', '.tweet a[target="_blank"]', function(e) {
    e.preventDefault();
    var $link = $(this);
    chrome.extension.sendRequest({url: $link.attr('href')});
  });
});
