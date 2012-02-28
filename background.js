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

var openNewTab = function(url) {
  chrome.windows.getAll({populate: false /* no tabs */}, function(windows) {
    var window = findBestWindow(windows);
    chrome.tabs.create({
      url: url,
      windowId: window.id,
      active: false
    });
  });
};

chrome.extension.onRequest.addListener(function(request) {
  if (request.url !== undefined) {
    openNewTab(request.url);
  }
});
