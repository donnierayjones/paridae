$(document).ready(function() {

  var openLink = function(url) {
    chrome.extension.sendRequest({url: url});
  };

  $('body').on('click', 'a[target="_blank"]', function(e) {
    e.preventDefault();
    var $link = $(this);
    openLink($link.attr('href'));
  });

  // disable jquery animations
  document.location = 'javascript:$.fx.off=true;';

  // open links when pressing `o`
  $(document).on('keypress', function(event) {
    if(event.charCode != 111) {
      return;
    }
    var $current_tweet = $('.hovered-stream-item');
    if($current_tweet.length > 0) {
      var $links = $('a[target="_blank"]', $current_tweet);
      if($links.length > 0) {
        $($links[0]).click();
      }
    }
  });
});
