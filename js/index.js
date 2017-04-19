/* by @darthvid@niu.moe, (c) 2017 */

// lib convenience vars
var grid = document.querySelector('.grid');
var layout = new Isotope(grid, {
		itemSelector: '.grid-item',
		layoutMode: 'packery',
		packery: {
			gutter: 5
		}
	});

// "constants" (but may change :P)
var msReload = 6000;
var listBlockTags = ['NSFW', 'EROE', 'EROGE', 'おっぱい'];

// QueryParams
var urlMastoInstance = "";
var isLocalTimeline = true;
var isVisibleNSFW = false;
var percentImgSize = 0.33;


window.onload = function() {
	initThisThang();
	addImagesFromToots();
	runLoop();
}


function initThisThang() {
	setParamsFromURL();
	console.log("https://" + urlMastoInstance + "/api/v1/timelines/public"
		+ (isLocalTimeline ? "?local=true" : ""));
	setVisibilityNSFW(isVisibleNSFW);
	regEventHandlers();
}

function regEventHandlers() {
	document.getElementById("btnNSFW").addEventListener("click", toggleNSFW);
}


function prependContent(content) {
	var fragment = document.createDocumentFragment();
	fragment.appendChild(content);
	grid.insertBefore(fragment, grid.firstChild);
	layout.prepended(content);
}

function isNSFW(toot) {
	var boolNSFW = toot.sensitive;
	if (!boolNSFW) {
		toot.tags.forEach(function(tag) {
			if (-1 < listBlockTags.indexOf(tag.name.toUpperCase())) {
				boolNSFW = true;
				console.log("It's " + tag.name.toUpperCase() + "!");
			}
			console.log(tag.name.toUpperCase());
		});
	}
	return boolNSFW;
}

function addResizedImages(img, div, toot) {
	img.onload = function() {
		var strTagNSFW = "SFW";
//		console.log(img.src);
		var newWidth = img.width * percentImgSize;
		img.width = newWidth;
		var link = document.createElement("a");
		link.setAttribute("href", toot.url);
		link.setAttribute("target", "_blank");
		
		if (isNSFW(toot)) {
			strTagNSFW = "NSFW";
//	TODO: I want to remove these, but it's the only thing making the border exact (without gutter).
			div.style.width = newWidth + "px";
			div.style.height = (img.height * percentImgSize) + "px";
			div.style.border = "thick solid #009999";
			if (!isVisibleNSFW) {
				img.style.visibility = "hidden";
			}
		} 
		
		img.className = "img" + strTagNSFW;
		
		link.appendChild(img);
		div.className = "grid-item";
		div.appendChild(link);
		prependContent(div);
	}
}


function toggleNSFW() {
	isVisibleNSFW = !isVisibleNSFW;
	setVisibilityNSFW(isVisibleNSFW);
}

function setVisibilityNSFW(isVisible) {
	if (isVisible) {
		$(".imgNSFW").css("visibility", "visible");
		$("#btnNSFW").html("switch to supposedly #SFW");
		$("#btnNSFW").css("color", "red");
	} else {
		$(".imgNSFW").css("visibility", "hidden");
		$("#btnNSFW").html('reveal #nsfw');
		$("#btnNSFW").css("color", "black");
	}
}

function addImagesFromToots() {
	$.getJSON("https://" + urlMastoInstance + "/api/v1/timelines/public"
		+ (isLocalTimeline ? "?local=true" : ""),
    function (json) {
    	var numImagesThisRound = 0;
    	var content = document.getElementById("grid");
        for (var i = 0; i < json.length; i++) {
        	for (var j = 0; j < json[i].media_attachments.length; j++) {
        		if ("image" == json[i].media_attachments[j].type) {
					var urlPreview = json[i].media_attachments[j].preview_url;
					if (null == document.getElementById(urlPreview)) {					
						// TODO: Add reduction code here when the height can be computed.
						//console.log(window.innerHeight);
						var div = document.createElement("div");
						div.id = urlPreview;
									
						var imgTemp = new Image();
						imgTemp.src = urlPreview;
					
						addResizedImages(imgTemp, div, json[i]);
						numImagesThisRound++;
					}
				}
        	}
        }
        console.log("images added this round: " + numImagesThisRound);
    });
}

function setParamsFromURL() {
	urlMastoInstance = getParameterByName("instance");
	if (!urlMastoInstance) {
		urlMastoInstance = "mastodon.social";
//		window.location.href = window.location.href + "?instance=mastodon.social";
	}
	console.log("instance: " + urlMastoInstance);
	if ("false" == getParameterByName("local")) {
		isLocalTimeline = false;
	}
	console.log("local timeline: " + isLocalTimeline);
	if ("true" == getParameterByName("nsfwvisible")) {
		isVisibleNSFW = true;
	}
	console.log("isVisibleNSFW: " + isVisibleNSFW);
	var paramImgSize = getParameterByName("imgsize");
	if (20 < paramImgSize) {
		percentImgSize = paramImgSize / 100;
	}
	console.log("percentImgSize: " + percentImgSize);

	$('#ebInstance').val(urlMastoInstance);
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
	}, msReload);
}
