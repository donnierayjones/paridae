$(document).ready(function() {

  var onClickLink = function(url) {
    chrome.extension.sendRequest({
      action: 'openLink',
      url: url
    });
  };

  var onBeforeUnload = function() {
    chrome.extension.sendRequest({
      action: 'saveDimensions'
    });
  };

  $('body').on('click', 'a[target="_blank"]', function(e) {
    e.preventDefault();
    onClickLink($(this).attr('href'));
  });

  $(window).on('beforeunload', onBeforeUnload);

  // disable jquery animations
  document.location = 'javascript:$.fx.off=true;';

  // open links when pressing `o`
  $(document).on('keypress', function(event) {
    if(event.charCode != 111) {
      return;
    }
    var $current_tweet = $('.hovered-stream-item, .js-had-hovered-stream-item');
    if($current_tweet.length > 0) {
      var $links = $('a[target="_blank"]', $current_tweet);
      if($links.length > 0) {
        $($links[0]).click();
      }
    }
  });
});
