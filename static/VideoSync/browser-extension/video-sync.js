var browser = browser || chrome;
browser.browserAction.onClicked.addListener(() => {
  browser.tabs.executeScript({file: "/content-scripts/sync-script.js"})
  .then(console.log)
  .catch(console.error);
});
