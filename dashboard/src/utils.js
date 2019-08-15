export function getViewport() {
  var width;
  var height;

  // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
  if (typeof window.innerWidth != "undefined") {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
  else if (
    typeof document.documentElement != "undefined" &&
    typeof document.documentElement.clientWidth != "undefined" &&
    document.documentElement.clientWidth != 0
  ) {
    width = document.documentElement.clientWidth;
    height = document.documentElement.clientHeight;
  }

  // older versions of IE
  else {
    width = document.getElementsByTagName("body")[0].clientWidth;
    height = document.getElementsByTagName("body")[0].clientHeight;
  }
  return { width, height };
}
