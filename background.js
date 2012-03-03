(function() {

  var TWITTER_URL = 'https://twitter.com/';
  var STOR_WIDTH_KEY = 'window_width';
  var STOR_HEIGHT_KEY = 'window_height';
  var STOR_TOP_KEY = 'window_top';
  var STOR_LEFT_KEY = 'window_left';

  var saveWindowDimensions = function(w) {
    localStorage[STOR_WIDTH_KEY] = w.width.toString(10);
    localStorage[STOR_HEIGHT_KEY] = w.height.toString(10);
    localStorage[STOR_TOP_KEY] = w.top.toString(10);
    localStorage[STOR_LEFT_KEY] = w.left.toString(10);
  };

  var getWindowDimensions = function() {
    return {
      width: localStorage[STOR_WIDTH_KEY],
      height: localStorage[STOR_HEIGHT_KEY],
      top: localStorage[STOR_TOP_KEY],
      left: localStorage[STOR_LEFT_KEY]
    };
  };

  // note: "best" is currently defined as the one with the largest width

  var findBestWindow = function(windows) {
    var max = 0;
    _.each(windows, function(window) {
      if(window.width > max) {
        max = window.width;
      }
    });
    return _.find(windows, function(window) {
      return window.width === max;
    });
  };

  var openNewTabInBestWindow = function(url) {
    chrome.windows.getAll({populate: false /* no tabs */}, function(windows) {
      var window = findBestWindow(windows);
      chrome.tabs.create({
        url: url,
        windowId: window.id,
        active: false
      });
    });
  };

  var getExistingTwitterWindow = function(callback) {
    chrome.windows.getAll({populate: true}, function(windows) {
      callback(_.find(windows, function(w) {
        return _.any(w.tabs, function(t) {
          return t.url.indexOf('//twitter.com') > 0;
        });
      }));
    });
  };

  // handle requests from content script to open links

  chrome.extension.onRequest.addListener(function(request) {
    if (request.url !== undefined) {
      openNewTabInBestWindow(request.url);
    }
  });

  // open twitter.com in a (mostly) chrome-less window

  // default dimensions
  saveWindowDimensions({ width: 430, height: 620, top: 0, left: 0 });

  chrome.browserAction.onClicked.addListener(function(tab) {
    getExistingTwitterWindow(function(existingWindow) {
      if(existingWindow !== undefined) {
        chrome.windows.update(existingWindow.id, { focused: true });
      } else {
        var dimensions = getWindowDimensions();
        window.open(
          TWITTER_URL,
          'winname',
          'toolbar=no,location=no,width=' + dimensions.width + ',height=' + dimensions.height + ',top=' + dimensions.top + ',left=' + dimensions.left
        );

        // TODO: Monitor the window for resize and save it to localStorage
        // i.e. window.onresize = saveWindowDimensions();
      }
    });
  });

})();
