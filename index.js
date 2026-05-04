async function init(sourceUrl, startingOrigin, proxyTs) {
  const baseUrl = new URL(window.location);
  baseUrl.hash = "";

  const msg = {
    msg_type: "addColl",
    name: "proxyreplay",
    type: "wacz",
    file: {sourceUrl},
    skipExisting: false,
    extraConfig: {
      "isLive": false,
      "baseUrl": baseUrl.href,
      "baseUrlHashReplay": true,
      "proxyOrigin": new URL(startingOrigin).origin,
      "altProxyOrigins": ["https://blogs.bl.uk"],
      "proxyRewriteRelCanonical": true,
      "proxyTs": proxyTs,
      "proxyBannerUrl": "banner.js",
      "proxyHomePageUrl": "./index.html",
      "excludeUrlPaths": ["https://www.google-analytics.com/"],
    },
  };

  const scope = "/";

  if (!navigator.serviceWorker) {
    showError("Sorry, Service Workers are not supported in this browser (or mode)");
    return;
  }

  const params = new URLSearchParams();
  params.set("root", "proxyreplay");
  params.set("proxyOriginMode", "1");
  params.set("notFoundTemplateUrl", "./notFound.html");
  // allow loading from live web (outside the archive)
  //params.set("allowProxyPaths", "https://www.google-analytics.com/,https://www.googletagmanager.com/");
  // allow proxying without https://wab.ac/proxy/ prefix as a 'passthrough' above URLs
  params.set("allowProxyPassthrough", "1");

  await navigator.serviceWorker.register("/sw.js?" + params.toString(), {scope});

  await new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        resolve();
      });
    } else {
      resolve();
    }
  });

  const p = new Promise((resolve) => {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data.msg_type === "collAdded") {
        resolve();
      }
    });
  });

  navigator.serviceWorker.controller.postMessage(msg);

  await p;

  window.location.reload();
}

function showError(msg) {
  document.querySelector("#msg").innerText = "An Error Occured: " + msg;
}
