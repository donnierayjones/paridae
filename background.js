(function() {

  var TWITTER_URL = 'https://twitter.com/';
  var STOR_WIDTH_KEY = 'window_width';
  var STOR_HEIGHT_KEY = 'window_height';
  var STOR_TOP_KEY = 'window_top';
  var STOR_LEFT_KEY = 'window_left';

  var existing_twitter_window;

  var saveWindowDimensions = function(w) {
    localStorage[STOR_WIDTH_KEY] = w.width.toString(10);
    localStorage[STOR_HEIGHT_KEY] = w.height.toString(10);
    localStorage[STOR_TOP_KEY] = w.top.toString(10);
    localStorage[STOR_LEFT_KEY] = w.left.toString(10);
  };

  var getWindowDimensions = function() {
    if(localStorage[STOR_WIDTH_KEY] !== undefined) {
      return {
        width: localStorage[STOR_WIDTH_KEY],
        height: localStorage[STOR_HEIGHT_KEY],
        top: localStorage[STOR_TOP_KEY],
        left: localStorage[STOR_LEFT_KEY]
      };
    }
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

  // open a url in a new tab, highlight (or focus it), but keep primary focus
  // on twitter window.
  // if twitter is open in the same window as the "best" window, then we don't
  // focus the tab, as that would steal focus from twitter.

  var openNewTabInBestWindow = function(url) {
    chrome.windows.getAll({populate: true /* get tabs */}, function(windows) {
      var window = findBestWindow(windows);
      chrome.tabs.create({
        url: url,
        windowId: window.id,
        active: false
      }, function(tab) {
        chrome.tabs.highlight({
          windowId: window.id,
          tabs: window.tabs.length
        }, function() {});
      });
    });
  };

  var getExistingTwitterWindow = function(callback) {
    if(existing_twitter_window === undefined) {
      return callback();
    }
    chrome.windows.getAll({populate: false /* no tabs */}, function(windows) {
      callback(_.find(windows, function(w) {
        return w.id == existing_twitter_window.id;
      }));
    });
  };

  var requestHandlers = {
    openLink: function(request) {
      openNewTabInBestWindow(request.url);
    },
    saveDimensions: function(request) {
      // only save if we have the twitter window open
      // i.e. don't save for a tab in main browser
      getExistingTwitterWindow(function(w) {
        if(w !== undefined) {
          saveWindowDimensions(request.dimensions);
        }
      });
    }
  };

  chrome.extension.onRequest.addListener(function(request) {
    requestHandlers[request.action](request);
  });

  // open twitter.com in a (mostly) chrome-less window

  chrome.browserAction.onClicked.addListener(function(tab) {
    getExistingTwitterWindow(function(existing_window) {
      if(existing_window !== undefined) {
        chrome.windows.update(existing_window.id, { focused: true });
      } else {
        var dimensions = getWindowDimensions();
        chrome.windows.create({
          url: TWITTER_URL,
          focused: true,
          width: parseInt(dimensions.width, 10),
          height: parseInt(dimensions.height, 10),
          top: parseInt(dimensions.top, 10),
          left: parseInt(dimensions.left, 10),
          type: 'popup'
        }, function(new_window) {
          existing_twitter_window = new_window;
        });
      }
    });
  });
})();
