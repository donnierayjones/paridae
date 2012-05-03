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

  // key reference: http://www.k68.org/wp-content/uploads/2010/11/Key_Codes.htm
  var keyHandlers = {
    // o
    '111': function() {
      var $current_tweet = $('.hovered-stream-item, .js-had-hovered-stream-item');
      if($current_tweet.length > 0) {
        var $links = $('a[target="_blank"]', $current_tweet);
        if($links.length > 0) {
          $($links[0]).click();
        }
      }
    }
  }

  // handle shortcut keys
  $(document).on('keypress', function(event) {
    var handler = keyHandlers[event.charCode.toString()];
    if(typeof handler == 'function') {
      handler();
    }
  });
});
