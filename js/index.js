/* by @darthvid@niu.moe, (c) 2017 */

// lib convenience vars
//var grid = document.querySelector('.grid');
var grid = document.getElementById('content');

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
var maxNumImages = 100;
var isDebugMode = false;
var isPolling = true;


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
	setLocalTimeline(isLocalTimeline);
	regEventHandlers();
	if (isDebugMode) {
		initDebug();
	}
}

function initDebug() {
	var btnIsPolling = document.createElement("button");
	btnIsPolling.value = "polling";
	btnIsPolling.name = "polling";
	btnIsPolling.id = "btnIsPolling";
	btnIsPolling.onclick = togglePolling;
	document.getElementById("divDebug").appendChild(btnIsPolling);
}

function regEventHandlers() {
	document.getElementById("btnNSFW").addEventListener("click", toggleNSFW);
	document.getElementById("btnLocal").addEventListener("click", toggleLocal);
}

function isNSFW(toot) {
	var boolNSFW = toot.sensitive;
	if (!boolNSFW) {
		toot.tags.forEach(function(tag) {
			if (-1 < listBlockTags.indexOf(tag.name.toUpperCase())) {
				boolNSFW = true;
				console.log("It's " + tag.name.toUpperCase() + "!");
			}
//			console.log(tag.name.toUpperCase());
		});
	}
	return boolNSFW;
}

function toggleNSFW() {
	isVisibleNSFW = !isVisibleNSFW;
	setVisibilityNSFW(isVisibleNSFW);
}
function toggleLocal() {
	isLocalTimeline = !isLocalTimeline;
	setLocalTimeline(isLocalTimeline);
	console.log("local timeline: " + isLocalTimeline);
}
function togglePolling() {
	isPolling = !isPolling;
	setPolling(isPolling);
	console.log("polling: " + isPolling);
}


function setVisibilityNSFW(isVisible) {
	if (isVisible) {
		$(".imgNSFW").css("visibility", "visible");
//		$(".grid-NSFW").css("border", "dashed #990000");
		$("#btnNSFW").html("hide #NSFW");
		$("#btnNSFW").css("color", "red");
	} else {
		$(".imgNSFW").css("visibility", "hidden");
//		$(".grid-NSFW").css("border", "dashed #009999");
		$("#btnNSFW").html('show #nsfw');
		$("#btnNSFW").css("color", "black");
	}
}

function setLocalTimeline(isTimelineLocal) {
	if (isTimelineLocal) {
		$("#btnLocal").html('local timeline');
	} else {
		$("#btnLocal").html("federated timeline");
	}
}

function setPolling(isPoll) {
	if (isPoll) {
		$("#btnPolling").html('polling');
	} else {
		$("#btnPolling").html("stopped");
	}
}

function prependContent(content) {
	var fragment = document.createDocumentFragment();
	fragment.appendChild(content);
	grid.insertBefore(fragment, grid.firstChild);
	layout.prepended(content);
}

function controlNumImg(){
	var numChild = grid.childElementCount;
/*
	// TODO:  Think about formula that can effectively select a number of imgs to delete.
	//	Code below doesn't work because it loops faster than height can be computed in realtime.
	//	Maybe: density at warning height to computer num at target height
	while (grid.clientHeight > (screen.height * 0.8)) {
		console.log(grid.clientHeight + " x " + screen.height * 1.5);
		grid.lastChild.remove();
	}
*/
	if (1 == (numChild - maxNumImages)) {
		layout.remove(grid.lastChild);
		console.log("img removed: -1 (" + numChild + ")");
	}
	else if (1 < (numChild - maxNumImages)) {
		var prevChild = grid.lastChild.previousSibling;
		var currChild = grid.lastChild;
		for (var i = 0; i < (numChild - maxNumImages); i++ ) {
			//console.log("deleting " + currChild.id);
			layout.remove(currChild);
			currChild = prevChild;
			prevChild = currChild.previousSibling;
		}
		console.log("img -" + (numChild - maxNumImages) + " (" + numChild + ")");
	}
	layout.layout();
}

function addImagesFromToots() {
//	console.log("https://" + urlMastoInstance + "/api/v1/timelines/public" + (isLocalTimeline ? "?local=true" : ""));
	$.getJSON("https://" + urlMastoInstance + "/api/v1/timelines/public"
		+ (isLocalTimeline ? "?local=true" : ""),
    function (json) {
    	var numImagesThisRound = 0;
    	var numImagesSofar = grid.childElementCount;
//    	var content = document.getElementById("grid");
        for (var i = 0; i < json.length; i++) {
        	for (var j = 0; j < json[i].media_attachments.length; j++) {
        		if ("image" == json[i].media_attachments[j].type) {
					var urlPreview = json[i].media_attachments[j].preview_url;
					if (null == document.getElementById(urlPreview)) {					
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
        console.log("img +" + numImagesThisRound + " (" + numImagesSofar + ")");
    });
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
			div.textContent = "#nsfw";			
			div.style.lineHeight = div.style.height;
			img.style.position = "absolute";
			img.style.left = 0;
			img.style.top = 0;
			if (!isVisibleNSFW) {
				img.style.visibility = "hidden";
			}
			else {
//				div.style.border = "dashed #990000"
			}
			div.className = "grid-NSFW ";
		}
		
		img.className = "img" + strTagNSFW;
		
		link.appendChild(img);
		div.className = div.className + "grid-item";
		div.appendChild(link);
		prependContent(div);
		//controlNumImg();
		
		if (toot.reblog) {
			console.log("rb curr: " + div.id);
			toot.media_attachments.forEach(function(oldMedia) {
				console.log("rb old: "+ oldMedia.preview_url);
			});
		}
	}
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
	console.log("show NSFW: " + isVisibleNSFW);
	var paramImgSize = getParameterByName("imgsize");
	if (20 < paramImgSize) {
		percentImgSize = paramImgSize / 100;
	}
	console.log("image size multiplier: " + percentImgSize);
	var paramMaxImg = getParameterByName("maximg");
	if (1 < paramMaxImg) {
		maxNumImages = paramMaxImg;
	}
	console.log("max number of images: " + maxNumImages);
	if ("true" == getParameterByName("debugmode")) {
		isDebugMode = true;
	}
	console.log("debug mode: " + isDebugMode);

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
		controlNumImg();
		if (isPolling) {
			addImagesFromToots();
		}
	}, msReload);
}
