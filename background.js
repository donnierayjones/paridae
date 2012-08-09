(function() {

  var TWITTER_URL = 'https://twitter.com/';
  var STOR_WIDTH_KEY = 'window_width';
  var STOR_HEIGHT_KEY = 'window_height';
  var STOR_TOP_KEY = 'window_top';
  var STOR_LEFT_KEY = 'window_left';

  var existingTwitterWindow;

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
    } else {
      return {
        width: '320',
        height: '600',
        top: '0',
        left: '0'
      }
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

  // open twitter.com in a (mostly) chrome-less window

  var openResponsiveTwitterWindow = function(callback) {
    getExistingTwitterWindow(function(existingWindow) {
      if(existingWindow !== undefined) {
        chrome.windows.update(existingWindow.id, { focused: true });
        if(callback) {
          callback();
        }
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
        }, function(newWindow) {
          existingTwitterWindow = newWindow;
          if(callback) {
            callback();
          }
        });
      }
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
    if(existingTwitterWindow === undefined) {
      return callback();
    }
    chrome.windows.getAll({populate: false /* no tabs */}, function(windows) {
      callback(_.find(windows, function(w) {
        return w.id == existingTwitterWindow.id;
      }));
    });
  };

  var navigateTo = function(path) {
    getExistingTwitterWindow(function(existingWindow) {
      chrome.windows.get(existingWindow.id, { populate: true }, function(w) {
        chrome.tabs.update(w.tabs[0].id, {
          url: TWITTER_URL + path
        });
      });
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

  chrome.omnibox.onInputEntered.addListener(function(text) {
    openResponsiveTwitterWindow(function() {

      var keysToLocations = {
        o: '', // Open
        h: '', // Home
        c: 'i/connect', // Connect
        a: 'activity', // Activity
        r: 'mentions', // Mentions
        d: 'i/discover', // Discover
        //p: 'TODO', // Profile
        f: 'favorites', // Favorites
        //l: 'TODO', // Lists
        m: 'messages' // Messages
      };

      var loweredCase = text.toLowerCase();

      if(text.length === 1 && keysToLocations.hasOwnProperty(loweredCase)) {
        return navigateTo(keysToLocations[loweredCase]);
      }

      // go to user
      navigateTo(text);
    });
  });

  chrome.browserAction.onClicked.addListener(function(tab) {
    openResponsiveTwitterWindow();
  });
})();
