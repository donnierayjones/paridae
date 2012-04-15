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
    chrome.windows.getAll({populate: false /* no tabs */}, function(windows) {
      var window = findBestWindow(windows);
      chrome.tabs.create({
        url: url,
        windowId: window.id,
        active: false
      }, function(tab) {
        getExistingTwitterWindow(function(twitter_window) {
          if(window.id != twitter_window.id) {
            chrome.tabs.update(tab.id, {
              highlighted: true
            });
          }
        });
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

  var getExistingTwitterTab = function(callback) {
    getExistingTwitterWindow(function(twitter_window) {
      if(twitter_window === undefined) {
        callback(null);
      }

      var twitter_tab = _.find(twitter_window.tabs, function(tab) {
        return tab.url.indexOf('//twitter.com') > 0;
      });
      callback(twitter_tab);
    });
  };

  var requestHandlers = {
    openLink: function(request) {
      openNewTabInBestWindow(request.url);
    },
    saveDimensions: function(request) {
      getExistingTwitterWindow(function(twitter_window) {
        if(twitter_window.tabs.length == 1) {
          saveWindowDimensions(twitter_window);
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
        getExistingTwitterTab(function(twitter_tab) {
          chrome.tabs.update(twitter_tab.id, {
            highlighted: true
          });
        });
      } else {
        var dimensions = getWindowDimensions();
        var window_options = 'toolbar=no,location=no';

        if(dimensions !== undefined) {
          window_options +=
            ',width=' + dimensions.width +
            ',height=' + dimensions.height +
            ',top=' + dimensions.top +
            ',left=' + dimensions.left;
        }

        window.open(TWITTER_URL, 'twitter', window_options);
      }
    });
  });

})();
