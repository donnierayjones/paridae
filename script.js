$(function() {

  var isMacOS = navigator.appVersion.indexOf("Mac") > 0;

  var linkSelector =

    // t.co is used for shortened links and twitter images
    'a[href^="http://t.co"], a[href^="https://t.co"],' +

    // settings link from menu dropdown
    'a[data-nav="settings"],' +

    // edit profile link (there are more than 1)
    'a[href="/settings/profile"],' +

    // help link from menu dropdown
    'a[data-nav="help_center"]';

  var onClickLink = function(url) {
    chrome.extension.sendRequest({
      action: 'openLink',
      url: url
    });
  };

  var onBeforeUnload = function() {
    chrome.extension.sendRequest({
      action: 'saveDimensions',
      dimensions: {

        // it appears that innerWidth/Height is accurate for Mac OS,
        // while outerWidth/Height is accurate for Windows
        width: isMacOS ? window.innerWidth : window.outerWidth,
        height: isMacOS ? window.innerHeight : window.outerHeight,

        top: window.screenTop,
        left: window.screenLeft
      }
    });
  };

  $('body').on('click', linkSelector, function(e) {

    // if large window, just user normal link behavior

    if(document.width > 865) {
      return;
    }

    e.preventDefault();
    var href = $(this).attr('href');
    if(href.substring(0,2) == '//') {
      href = window.location.protocol + href;
    }
    if(href.substring(0,4) != 'http') {
      href = "https://twitter.com/" + href;
    }
    onClickLink(href);
  });

  $(window).on('beforeunload', onBeforeUnload);

  // disable jquery animations
  document.location = 'javascript:$.fx.off=true;';

  // key reference: http://www.k68.org/wp-content/uploads/2010/11/Key_Codes.htm
  var keyHandlers = {
    // o
    '111': function() {
      var $currentTweet = $('.selected-stream-item');
      if($currentTweet.length > 0) {
        var $tweetText = $('.js-tweet-text', $currentTweet);
        var $links = $(linkSelector, $tweetText);
        if($links.length > 0) {
          $($links[0]).click();
        }
      }
    }
  };

  // handle shortcut keys
  $(document).on('keypress', function(event) {
    if ($(event.target).is('input, textarea, .rich-editor')) {
      return;
    }
    var handler = keyHandlers[event.charCode.toString()];
    if(typeof handler == 'function') {
      handler();
    }
  });
});
