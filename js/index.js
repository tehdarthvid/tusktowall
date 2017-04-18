/* by @darthvid@niu.moe, (c) 2017 */

var grid = document.querySelector('.grid');
// TODO: Convert to Isotope for NSFW filtering, but still use Packery bin packing algo.
var layout = new Packery(grid, {
	itemSelector: '.grid-item',
	gutter: 5,
	});
var urlMastoInstance = "";
var boolLocalTimeline = true;

window.onload = function() {
	initThisThang();
	addImagesFromToots();
	runLoop();
}


function initThisThang() {
	setParamsFromURL();
	console.log("https://" + urlMastoInstance + "/api/v1/timelines/public"
		+ (boolLocalTimeline ? "?local=true" : ""));
}

function setParamsFromURL() {
	urlMastoInstance = getParameterByName("instance");
	if (!urlMastoInstance) {
		urlMastoInstance = "mastodon.social";
		window.location.href = window.location.href + "?instance=mastodon.social";
	}
	console.log("instance: " + urlMastoInstance);
	if ("false" == getParameterByName("local")) {
		boolLocalTimeline = false;
	}
	console.log("local timeline: " + boolLocalTimeline);
}

function prependContent(content) {
	var fragment = document.createDocumentFragment();
	fragment.appendChild(content);
	grid.insertBefore(fragment, grid.firstChild);
	layout.prepended(content);
}

function addResizedImages(img, div, toot) {
	img.onload = function() {
//		console.log(imgTemp.src);
		var newWidth = img.width / 3;
		img.width = newWidth;
		var link = document.createElement('a');
		link.setAttribute("href", toot.url);
		link.setAttribute("target", "_blank");
		link.appendChild(img);
		div.appendChild(link);
		prependContent(div);
	}
}

function addImagesFromToots() {
	$.getJSON("https://" + urlMastoInstance + "/api/v1/timelines/public"
		+ (boolLocalTimeline ? "?local=true" : ""),
    function (json) {
    	var numImagesThisRound = 0;
    	var content = document.getElementById("grid");
        for (var i = 0; i < json.length; i++) {
        	for (var j = 0; j < json[i].media_attachments.length; j++) {
        		var urlPreview = json[i].media_attachments[j].preview_url;
				if (null == document.getElementById(urlPreview)) {					
					// TODO: Add reduction code here when the height can be computed.
					//console.log(window.innerHeight);
					// TODO: Add metadata to the div future filtering.
					//console.log(json[i].sensitive);
					var div = document.createElement("div");
					div.className = "grid-item";
					div.id = urlPreview;
									
					var imgTemp = new Image();
					imgTemp.src = urlPreview;
					
					addResizedImages(imgTemp, div, json[i]);
					numImagesThisRound++;
				}
        	}
        }
        console.log("images added this round: " + numImagesThisRound);
    });
}



// note: Taken from StackOverflow. ^^
function getParameterByName(name, url) {
	if (!url) {
		url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// for controlled development / debugging without getting actual images
function generateRandomContent() {
	var div = document.createElement("div");
	div.className = "grid-item";
	var w = Math.floor((Math.random() * 150) + 45);
	var h = Math.floor((Math.random() * 150) + 45);
	div.style.width = w + "px";
	div.style.height = h + "px";
	
	return div;
}

function runLoop() {
	setInterval(function() {
//		prependContent(generateRandomContent());
		addImagesFromToots();
	}, 6000);
}
