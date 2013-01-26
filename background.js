(function() {

  var TWITTER_URL = 'https://twitter.com/';
  var STOR_WIDTH_KEY = 'window_width';
  var STOR_HEIGHT_KEY = 'window_height';
  var STOR_TOP_KEY = 'window_top';
  var STOR_LEFT_KEY = 'window_left';

  var existingTwitterWindow;
  var mostRecentBrowserWindow;

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
        width: '410',
        height: '700',
        top: '0',
        left: '0'
      };
    }
  };

  // note: "best" is currently defined as the most recently focused

  var findBestWindow = function(callback) {
    if(mostRecentBrowserWindow !== undefined) {
      chrome.windows.get(mostRecentBrowserWindow.id, {populate: true}, function(window) {
        callback(window);
      });
    } else {
      chrome.windows.getAll({populate:true}, function(windows) {
        var firstNormalWindow = _.find(windows, function(window) {
          return window.type === "normal";
        });
        mostRecentBrowserWindow = firstNormalWindow;
        callback(firstNormalWindow);
      });
    }
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

  var openNewTabInBestWindow = function(url) {
    findBestWindow(function(window) {
      if(window === undefined) {
        var hasRecentWindow = mostRecentBrowserWindow !== undefined;
        return chrome.windows.create({
          url: url,
          focused: true,
          width: hasRecentWindow ? mostRecentBrowserWindow.width : 1024,
          height: hasRecentWindow ? mostRecentBrowserWindow.height : 600,
          left: hasRecentWindow ? mostRecentBrowserWindow.left : 25,
          top: hasRecentWindow ? mostRecentBrowserWindow.top : 25
        });
      }
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

  chrome.windows.onFocusChanged.addListener(function(windowId) {
    chrome.windows.get(windowId, {populate: true}, function(window) {
      if(window !== undefined && window.type == "normal") {
        mostRecentBrowserWindow = window;
      }
    });
  });

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

  var omniboxKeyboardShortcuts = {
    o: {
      location: '',
      description: 'Open Twitter'
    },
    h: {
      location: '',
      description: 'Go Home'
    },
    c: {
      location: 'i/connect',
      description: 'Go to Connect'
    },
    a: {
      location: 'activity',
      description: 'Go to Activity'
    },
    r: {
      location: 'mentions',
      description: 'Go to Mentions'
    },
    d: {
      location: 'i/discover',
      description: 'Go Discover'
    },
    //p: 'TODO', // Profile
    f: {
      location: 'favorites',
      description: 'Go Favorites'
    },
    //l: 'TODO', // Lists
    m: {
      location: 'messages',
      description: 'Go Messages'
    }
  };

  var omniboxHandlers = {
    keyboardShortcuts: {
      canHandle: function(text) {
        return text.length === 1 && omniboxKeyboardShortcuts.hasOwnProperty(this.l(text));
      },
      getDefaultSuggestion: function(text) {
        return {
          description: omniboxKeyboardShortcuts[this.l(text)].description
        };
      },
      handle: function(text) {
        // if 'o', just open twitter, don't navigate
        if(this.l(text) == 'o') return;
        navigateTo(omniboxKeyboardShortcuts[this.l(text)].location);
      },
      getSuggestions: function(text) {
        return _.map(_.keys(omniboxKeyboardShortcuts), function(key) {
          return {
            content: key,
            description: omniboxKeyboardShortcuts[key].description
          };
        });
      },
      l: function(text) { return text.toLowerCase(); }
    },
    userLookup: {
      canHandle: function(text) {
        return text[0] === '@';
      },
      getDefaultSuggestion: function(text) {
        return {
          description: 'Go to user ' + this.getUserName(text)
        };
      },
      handle: function(text) {
        navigateTo(this.getUserName(text));
      },
      getSuggestions: function(text) {
        return [];
      },
      getUserName: function(text) {
        return text.substr(1);
      }
    },
    search: {
      canHandle: function(text) {
        return true;
      },
      getDefaultSuggestion: function(text) {
        return {
          description: "Search Twitter for '%s'"
        };
      },
      handle: function(text) {
        navigateTo('search/' + escape(text));
      },
      getSuggestions: function(text) {
        return [];
      }
    }
  };

  chrome.extension.onRequest.addListener(function(request) {
    requestHandlers[request.action](request);
  });

  chrome.omnibox.setDefaultSuggestion({
    description: "Search Twitter for '%s'"
  });

  chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
    for(var h in omniboxHandlers) {
      var handler = omniboxHandlers[h];
      if(omniboxHandlers.hasOwnProperty(h) && handler.canHandle(text)) {
        chrome.omnibox.setDefaultSuggestion(
          handler.getDefaultSuggestion(text)
        );
        return suggest(handler.getSuggestions(text));
      }
    }
  });

  chrome.omnibox.onInputEntered.addListener(function(text) {
    openResponsiveTwitterWindow(function() {
      for(var h in omniboxHandlers) {
        var handler = omniboxHandlers[h];
        if(omniboxHandlers.hasOwnProperty(h) && handler.canHandle(text)) {
          return handler.handle(text);
        }
      }
    });
  });

  chrome.browserAction.onClicked.addListener(function(tab) {
    openResponsiveTwitterWindow();
  });
})();
